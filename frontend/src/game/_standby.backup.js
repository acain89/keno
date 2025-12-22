// src/game/billDirector.js
// BILL Director — deterministic session planner + RNG renderer support
// - Does NOT change Bill
// - Chooses desiredHitCount per spin so constraints are guaranteed
// - Uses stake (bet + raise), selectedCount, and current credits
// - Produces "lively" wins + 3–4 bonuses + eventual grind-down
// - Enforces hard ceiling by downgrading hitCount until payout fits
// - GUARANTEES: WINNER crosses $100 at least once (when feasible under Bill + stake)
// - GUARANTEES: LOSER never exceeds ceiling (85 default) via ceiling enforcement

export const DIRECTOR_PATHS = {
  LOSER: "LOSER",
  WINNER: "WINNER",
};

/* =====================================================================
   BILL — CANONICAL MULTIPLIERS (mirror of useKenoGame)
===================================================================== */

const BILL_MULTIPLIERS = {
  1: { 1: 2 },
  2: { 1: 1, 2: 2 },
  3: { 1: 1, 2: 2, 3: 4 },
  4: { 1: 0, 2: 2, 3: 3, 4: 7 },
  5: { 1: 0, 2: 0, 3: 2, 4: 6, 5: 8 },
  6: { 1: 0, 2: 0, 3: 1, 4: 3, 5: 7, 6: 10 },
  7: { 1: 0, 2: 0, 3: 1, 4: 3, 5: 6, 6: 9, 7: 12 },
  8: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 3, 6: 4, 7: 8, 8: 15 },
  9: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 3, 6: 5, 7: 8, 8: 20 },
  10: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 3, 6: 5, 7: 8, 8: 20 },
};

function billMultiplier(selectedCount, hitCount) {
  if (!hitCount) return 0;
  return BILL_MULTIPLIERS[selectedCount]?.[hitCount] ?? 0;
}

function minPaidHit(selectedCount) {
  const row = BILL_MULTIPLIERS[selectedCount];
  if (!row) return null;
  const keys = Object.keys(row)
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  for (const h of keys) {
    if ((row[h] ?? 0) > 0) return h;
  }
  return null;
}

/* =====================================================================
   SEEDED RNG (deterministic, lightweight)
===================================================================== */

function hash32(str) {
  // FNV-1a-ish
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(rng, entries) {
  // entries: [{v, w}]
  let total = 0;
  for (const e of entries) total += Math.max(0, e.w);
  if (!total) return entries[entries.length - 1]?.v ?? 0;

  let r = rng() * total;
  for (const e of entries) {
    r -= Math.max(0, e.w);
    if (r <= 0) return e.v;
  }
  return entries[entries.length - 1].v;
}

/* =====================================================================
   BONUS POLICY (director suggestion)
===================================================================== */

function bonusSuggestionFor(selectedCount, hitCount) {
  // Canonical rule: selected=10 and hits>=7
  if (selectedCount !== 10) return null;
  if (hitCount >= 8) return 20;
  if (hitCount === 7) return 10;
  return null;
}

/* =====================================================================
   HITCOUNT DISTRIBUTIONS (high-level feel)
===================================================================== */

function clampHits(h, selectedCount) {
  const cap = Math.max(0, Math.min(10, Number(selectedCount || 0)));
  return Math.max(0, Math.min(cap, h));
}

function livelyDistribution(selectedCount) {
  // Frequent small/med, occasional dead
  const cap = Math.max(0, Math.min(10, selectedCount));
  const mk = (h, w) => ({ v: clampHits(h, cap), w });

  return [
    mk(0, 6),
    mk(1, 10),
    mk(2, 16),
    mk(3, 16),
    mk(4, 22),
    mk(5, 18),
    mk(6, 10),
    mk(7, 2),
    mk(8, 0), // spikes handled separately/scheduled
  ];
}

function grindDownDistribution(selectedCount) {
  // Heavy 0–3 with occasional 4
  const cap = Math.max(0, Math.min(10, selectedCount));
  const mk = (h, w) => ({ v: clampHits(h, cap), w });

  return [
    mk(0, 18),
    mk(1, 22),
    mk(2, 26),
    mk(3, 22),
    mk(4, 10),
    mk(5, 2),
    mk(6, 0),
    mk(7, 0),
    mk(8, 0),
  ];
}

function buildUpDistribution(selectedCount) {
  // Winner build-up phase: more 4–6, rare 7
  const cap = Math.max(0, Math.min(10, selectedCount));
  const mk = (h, w) => ({ v: clampHits(h, cap), w });

  return [
    mk(0, 2),
    mk(1, 6),
    mk(2, 10),
    mk(3, 14),
    mk(4, 26),
    mk(5, 24),
    mk(6, 14),
    mk(7, 4),
    mk(8, 0),
  ];
}

/* =====================================================================
   DIRECTOR
===================================================================== */

export function createBillDirector({
  path = DIRECTOR_PATHS.LOSER,
  ceiling = path === DIRECTOR_PATHS.WINNER ? 130 : 85,
  mustCross100 = path === DIRECTOR_PATHS.WINNER,
  bonusTargetMin = 3,
  bonusTargetMax = 4,
  seed = "",
  lifespanSpins = path === DIRECTOR_PATHS.WINNER ? 70 : 60,
} = {}) {
  const seed32 = hash32(
    `${path}|${ceiling}|${mustCross100 ? "CROSS" : "NOCROSS"}|${seed}`
  );
  const rng = mulberry32(seed32);

  // Plan bonus count and rough schedule points
  const bonusTarget =
    bonusTargetMin +
    Math.floor(rng() * (bonusTargetMax - bonusTargetMin + 1));

  // create spaced target "bonus windows" (1-based spin counters)
  const bonusWindows = [];
  if (bonusTarget > 0) {
    const start = 6;
    const end = Math.max(start + 10, lifespanSpins - 10);
    for (let i = 0; i < bonusTarget; i++) {
      const base =
        start +
        Math.floor(((end - start) * (i + 1)) / (bonusTarget + 1));
      const jitter = Math.floor((rng() - 0.5) * 6); // +/-3
      bonusWindows.push(Math.max(3, base + jitter));
    }
  }

  // When to force the "cross 100" moment (winner path)
  const crossDeadline = Math.max(10, Math.floor(lifespanSpins * 0.6));

  // ✅ HARD BONUS DROUGHT CAP (prevents insane dead runs)
  // This does NOT guarantee bonus (hearts gating still exists), but guarantees
  // frequent bonus-eligible *attempts* (7 hits) on WINNER + sel=10.
  const BONUS_DROUGHT_SPINS = 28;

  const state = {
    path,
    ceiling,
    mustCross100,
    lifespanSpins,
    bonusTarget,
    bonusWindows, // indices we *try* to fire bonuses
    spinIndex: 0,
    bonusesFired: 0,
    crossed100: false,
    crossDeadline,

    // drought tracking (director suggestions, not actual hearts)
    spinsSinceBonusSuggest: 0,
  };

  function capForSel(sel) {
    return Math.max(0, Math.min(10, Number(sel || 0)));
  }

  function projectedPayout(sel, stake, hits) {
    const mult = billMultiplier(sel, hits);
    return Number(stake || 0) * mult;
  }

  function enforceCeiling({ selectedCount, stake, creditsNow, desiredHits }) {
    // Downgrade hits until projected payout fits under ceiling
    let h = clampHits(desiredHits, selectedCount);

    while (h > 0) {
      const payout = projectedPayout(selectedCount, stake, h);
      if (creditsNow + payout <= state.ceiling) return h;
      h -= 1;
    }
    return 0;
  }

  function findHitsToReachTarget({
    selectedCount,
    stake,
    creditsNow,
    targetCreditsMin,
  }) {
    const cap = capForSel(selectedCount);

    let best = null;
    for (let h = 0; h <= cap; h++) {
      const payout = projectedPayout(selectedCount, stake, h);
      const after = creditsNow + payout;
      if (after < targetCreditsMin) continue;
      if (after > state.ceiling) continue;

      if (!best) {
        best = { hits: h, after, payout };
        continue;
      }

      if (after < best.after) best = { hits: h, after, payout };
      else if (after === best.after && h < best.hits)
        best = { hits: h, after, payout };
    }

    return best ? best.hits : null;
  }

  function shouldEnterGrind(creditsNow) {
    const t = state.spinIndex / Math.max(1, state.lifespanSpins);
    if (t >= 0.7) return true;

    if (
      state.path === DIRECTOR_PATHS.WINNER &&
      state.crossed100 &&
      creditsNow >= state.ceiling - 10
    ) {
      return true;
    }

    if (state.path === DIRECTOR_PATHS.LOSER && creditsNow >= state.ceiling - 8) {
      return true;
    }

    return false;
  }

  function pickBaseHits({ selectedCount, creditsNow }) {
    if (shouldEnterGrind(creditsNow)) {
      return pickWeighted(rng, grindDownDistribution(selectedCount));
    }

    if (
      state.path === DIRECTOR_PATHS.WINNER &&
      state.mustCross100 &&
      !state.crossed100
    ) {
      return pickWeighted(rng, buildUpDistribution(selectedCount));
    }

    return pickWeighted(rng, livelyDistribution(selectedCount));
  }

  function isBonusWindowNow() {
    return state.bonusWindows.includes(state.spinIndex);
  }

  function maybeForceBonus({ selectedCount, stake, creditsNow }) {
    if (selectedCount !== 10) return null;
    if (state.bonusesFired >= state.bonusTarget) return null;
    if (!isBonusWindowNow()) return null;

    const want8 = rng() < 0.35;
    const desired = want8 ? 8 : 7;

    const h = enforceCeiling({
      selectedCount,
      stake,
      creditsNow,
      desiredHits: desired,
    });

    if (h >= 7) return h;
    return null;
  }

  function updateMilestones({ creditsAfter }) {
    if (!state.crossed100 && creditsAfter >= 100) state.crossed100 = true;
  }

  function maybeForceCross100({ selectedCount, stake, creditsNow }) {
    if (state.path !== DIRECTOR_PATHS.WINNER) return null;
    if (!state.mustCross100) return null;
    if (state.crossed100) return null;
    if (state.spinIndex < state.crossDeadline) return null;

    const target = 100;
    const hitToReach = findHitsToReachTarget({
      selectedCount,
      stake,
      creditsNow,
      targetCreditsMin: target,
    });

    if (hitToReach != null) return hitToReach;

    const cap = capForSel(selectedCount);
    let best = 0;
    for (let h = cap; h >= 0; h--) {
      const payout = projectedPayout(selectedCount, stake, h);
      if (creditsNow + payout <= state.ceiling) {
        best = h;
        break;
      }
    }
    return best;
  }

  function ensureBonusEventually({ selectedCount, stake, creditsNow }) {
    if (selectedCount !== 10) return null;
    if (state.bonusesFired >= state.bonusTarget) return null;

    const spinsLeft = Math.max(1, state.lifespanSpins - state.spinIndex);
    const bonusesLeft = state.bonusTarget - state.bonusesFired;
    const urgency = bonusesLeft / spinsLeft;

    if (urgency > 0.12 && rng() < 0.65) {
      const desired = rng() < 0.25 ? 8 : 7;
      const h = enforceCeiling({
        selectedCount,
        stake,
        creditsNow,
        desiredHits: desired,
      });
      if (h >= 7) return h;
    }

    return null;
  }

  function enforceEarlyPaidWins({ selectedCount, stake, creditsNow, desiredHits }) {
    if (state.path !== DIRECTOR_PATHS.WINNER) return desiredHits;

    const sel = Number(selectedCount || 0);
    if (sel <= 0) return desiredHits;

    const early =
      !state.crossed100 &&
      state.spinIndex <= Math.max(18, Math.floor(state.lifespanSpins * 0.35));

    if (!early) return desiredHits;

    const payout = projectedPayout(sel, stake, desiredHits);
    if (payout > 0) return desiredHits;

    const mph = minPaidHit(sel);
    if (mph == null) return desiredHits;

    const bumped = Math.max(desiredHits, mph);
    const fit = enforceCeiling({
      selectedCount: sel,
      stake,
      creditsNow,
      desiredHits: bumped,
    });

    if (projectedPayout(sel, stake, fit) > 0) return fit;
    return desiredHits;
  }

  function maybeForceBonusDroughtCap({ selectedCount, stake, creditsNow }) {
    // Only on WINNER and only when selecting 10 (bonus-eligible format)
    if (state.path !== DIRECTOR_PATHS.WINNER) return null;
    if (selectedCount !== 10) return null;

    if (state.spinsSinceBonusSuggest < BONUS_DROUGHT_SPINS) return null;

    // Force a 7-hit attempt (10 spins) if it fits under ceiling.
    // If 7 can't fit, try 6/5 as fallback, but only return if still paid > 0.
    const tryHits = [7, 6, 5];
    for (const dh of tryHits) {
      const h = enforceCeiling({
        selectedCount,
        stake,
        creditsNow,
        desiredHits: dh,
      });
      if (h <= 0) continue;
      if (projectedPayout(selectedCount, stake, h) <= 0) continue;
      return h;
    }

    return null;
  }

  return {
    snapshot() {
      return { ...state };
    },

    next({ creditsNow, selectedCount, stake }) {
      state.spinIndex += 1;

      const sel = Math.max(0, Math.min(10, Number(selectedCount || 0)));
      const st = Number(stake || 0);
      const cNow = Number(creditsNow || 0);

      // 0) HARD bonus drought cap (winner only)
      let desired = maybeForceBonusDroughtCap({
        selectedCount: sel,
        stake: st,
        creditsNow: cNow,
      });

      // 0.5) Winner guarantee: force a cross-100 event after deadline
      if (desired == null) {
        desired = maybeForceCross100({
          selectedCount: sel,
          stake: st,
          creditsNow: cNow,
        });
      }

      // 1) try scheduled bonus (only if not already forced cross)
      if (desired == null) {
        desired = maybeForceBonus({
          selectedCount: sel,
          stake: st,
          creditsNow: cNow,
        });
      }

      // 2) late-session bonus pressure (if still short)
      if (desired == null) {
        desired = ensureBonusEventually({
          selectedCount: sel,
          stake: st,
          creditsNow: cNow,
        });
      }

      // 3) otherwise pick from phase distribution
      if (desired == null) {
        desired = pickBaseHits({ selectedCount: sel, creditsNow: cNow });

        if (
          state.path === DIRECTOR_PATHS.WINNER &&
          state.mustCross100 &&
          !state.crossed100
        ) {
          const t = state.spinIndex / Math.max(1, state.lifespanSpins);
          if (t > 0.45 && cNow < 70 && rng() < 0.55) desired = Math.max(desired, 6);
          if (t > 0.55 && cNow < 85 && rng() < 0.65) desired = Math.max(desired, 6);
        }

        if (
          state.path === DIRECTOR_PATHS.LOSER &&
          cNow >= state.ceiling - 10 &&
          rng() < 0.7
        ) {
          desired = Math.min(desired, 4);
        }
      }

      // 3.5) WINNER early-phase: prevent long streaks of Bill-$0 results
      desired = enforceEarlyPaidWins({
        selectedCount: sel,
        stake: st,
        creditsNow: cNow,
        desiredHits: desired,
      });

      // 4) enforce ceiling
      const finalHits = enforceCeiling({
        selectedCount: sel,
        stake: st,
        creditsNow: cNow,
        desiredHits: desired,
      });

      // 5) compute implied payout for milestone tracking
      const payout = projectedPayout(sel, st, finalHits);
      const after = cNow + payout;

      // 6) bonus suggestion + accounting (Bill-legal only)
      let bonusSpins = bonusSuggestionFor(sel, finalHits);
      if (bonusSpins && billMultiplier(sel, finalHits) <= 0) bonusSpins = null;

      if (bonusSpins) {
        state.spinsSinceBonusSuggest = 0;
      } else {
        state.spinsSinceBonusSuggest += 1;
      }

      if (bonusSpins && state.bonusesFired < state.bonusTarget) {
        state.bonusesFired += 1;
      }

      updateMilestones({ creditsAfter: after });

      return {
        desiredHitCount: finalHits,
        bonusSpins, // 10 | 20 | null
        projectedPayout: payout,
        projectedCreditsAfter: after,
      };
    },
  };
}
