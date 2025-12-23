// src/game/billDirector.js
// BILL Director - SINGLE AUTHORITY for demo outcome planning
// Deterministic, bounded, slot-style variance with REGIMES + B2 soft gravity
//
// Updates (per request):
// - After BIG win (that puts player >100): CRASH dist = 75% loss / 15% small / 5% med
// - Wins made more sporadic via spacing, jitter, and tension gating
// - Breaks calculated hit feel by varying SMALL/MED hit counts
// - Optional forced hit selection output for draw randomization
//
// NOTE:
// To fix front-5 / back-5 hit patterns, the draw builder must honor
// forcedHits and forcedMisses when constructing the final draw.

export const DIRECTOR_PATHS = {
  LOSER: "LOSER",
  WINNER: "WINNER",
  NORMAL: "NORMAL",
};

/* =====================================================================
   BILL MULTIPLIERS (AUTHORITATIVE MIRROR)
===================================================================== */

const BILL_MULTIPLIERS = {
  1: { 1: 2 },
  2: { 1: 1, 2: 2 },
  3: { 1: 1, 2: 2, 3: 4 },
  4: { 1: 0, 2: 2, 3: 3, 4: 7 },
  5: { 1: 0, 2: 0, 3: 2, 4: 6, 5: 8 },
  6: { 1: 0, 2: 0, 3: 1, 4: 3, 5: 7, 6: 10 },
  7: { 1: 0, 2: 0, 3: 1, 4: 3, 5: 6, 6: 9, 7: 12 },
  // ✅ FIX: must match useKenoGame.jsx (8/8 is 20x)
  8: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 3, 6: 4, 7: 8, 8: 20 },
  9: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 3, 6: 5, 7: 8, 8: 20 },
  10: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 3, 6: 5, 7: 8, 8: 20 },
};

function billMultiplier(sel, hits) {
  if (!hits) return 0;
  return BILL_MULTIPLIERS[sel]?.[hits] ?? 0;
}

function minPaidHit(sel) {
  const row = BILL_MULTIPLIERS[sel];
  if (!row) return 0;
  for (const h of Object.keys(row).map(Number).sort((a, b) => a - b)) {
    if (row[h] > 0) return h;
  }
  return 0;
}

function maxHitsAtOrBelowMult(selectedCount, maxMult) {
  const row = BILL_MULTIPLIERS[selectedCount];
  if (!row) return 0;
  let best = 0;
  for (const [hStr, mult] of Object.entries(row)) {
    const h = Number(hStr);
    if (mult > 0 && mult <= maxMult) best = Math.max(best, h);
  }
  return best;
}

/* =====================================================================
   SEEDED RNG
===================================================================== */

function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* =====================================================================
   REGIMES (slot feel)
===================================================================== */

const REGIMES = {
  BLEED: "BLEED",
  PAY_EVENT: "PAY_EVENT",
  CRASH: "CRASH",
};

/* =====================================================================
   HELPERS
===================================================================== */

function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function chooseWeighted(rng, items) {
  let total = 0;
  for (const it of items) total += Math.max(0, it.w);
  if (total <= 0) return items[0]?.key ?? null;
  let r = rng() * total;
  for (const it of items) {
    r -= Math.max(0, it.w);
    if (r <= 0) return it.key;
  }
  return items[items.length - 1]?.key ?? null;
}

function payingHitCounts(selectedCount) {
  const row = BILL_MULTIPLIERS[selectedCount] || {};
  return Object.keys(row)
    .map(Number)
    .filter((h) => (row[h] ?? 0) > 0)
    .sort((a, b) => a - b);
}

function payingHitsByMultRange(selectedCount, minMult, maxMult) {
  const row = BILL_MULTIPLIERS[selectedCount] || {};
  return Object.keys(row)
    .map(Number)
    .filter((h) => {
      const m = row[h] ?? 0;
      return m > 0 && m >= minMult && m <= maxMult;
    })
    .sort((a, b) => a - b);
}

/* =====================================================================
   DIRECTOR
===================================================================== */

export function createBillDirector({ path = DIRECTOR_PATHS.WINNER, seed = "DEV" } = {}) {
  const ceiling =
    path === DIRECTOR_PATHS.WINNER
      ? 110
      : path === DIRECTOR_PATHS.LOSER
      ? 80
      : null;

  const rng = mulberry32(hash32(`${path}|${seed}`));

  const state = {
    spinIndex: 0,
    exitedPath: false,
    regime: REGIMES.BLEED,
    payEventArmed: false,
    payEventUsed: false,
    postBig: false,
    drought: 0,
    heat: 0,
    cooldown: 0,
    nextWinAllowedAt: 0,
  };

  function randInt(min, maxInclusive) {
    return min + Math.floor(rng() * (maxInclusive - min + 1));
  }

  function pickRegime(creditsNow) {
    if (path === DIRECTOR_PATHS.WINNER) {
      if (!state.payEventUsed && creditsNow <= 15) state.payEventArmed = true;
      if (state.regime === REGIMES.BLEED && state.payEventArmed) {
        state.regime = REGIMES.PAY_EVENT;
      }
      if (state.regime === REGIMES.CRASH && creditsNow < 70) {
        state.regime = REGIMES.BLEED;
        state.postBig = false;
        if (creditsNow <= 15) {
          state.payEventUsed = false;
          state.payEventArmed = true;
        }
      }
    } else {
      state.regime = REGIMES.BLEED;
      state.payEventArmed = false;
      state.payEventUsed = true;
      state.postBig = false;
    }
  }

  function forceLossDueToSpacing() {
    if (state.cooldown > 0) return true;
    if (state.spinIndex < state.nextWinAllowedAt) return true;
    return false;
  }

  // ✅ FIX: return both bucket + correct isBigEvent flag
  function pickOutcomeBucket(creditsNow) {
    pickRegime(creditsNow);

    if (forceLossDueToSpacing()) {
      return { bucket: "LOSS", isBigEvent: false };
    }

    if (path === DIRECTOR_PATHS.WINNER && state.regime === REGIMES.PAY_EVENT) {
      // This spin IS the pay event
      state.payEventArmed = false;
      state.payEventUsed = true;
      state.regime = REGIMES.CRASH;
      state.postBig = true;
      return { bucket: "BIG", isBigEvent: true };
    }

    if (state.regime === REGIMES.BLEED) {
      const r = rng();
      if (r < 0.70) return { bucket: "LOSS", isBigEvent: false };
      if (r < 0.92) {
        if (state.heat >= 2 && rng() < 0.20) return { bucket: "LOSS", isBigEvent: false };
        return { bucket: "SMALL", isBigEvent: false };
      }
      if (state.drought >= 3) return { bucket: "MEDIUM", isBigEvent: false };
      return { bucket: "LOSS", isBigEvent: false };
    }

    if (state.regime === REGIMES.CRASH) {
      const r = rng();
      if (state.postBig) {
        if (r < 0.75) return { bucket: "LOSS", isBigEvent: false };
        if (r < 0.90) return { bucket: "SMALL", isBigEvent: false };
        if (r < 0.95 && state.drought >= 3) return { bucket: "MEDIUM", isBigEvent: false };
        return { bucket: "LOSS", isBigEvent: false };
      }
      if (r < 0.70) return { bucket: "LOSS", isBigEvent: false };
      if (r < 0.90) return { bucket: "SMALL", isBigEvent: false };
      if (state.drought >= 2) return { bucket: "MEDIUM", isBigEvent: false };
      return { bucket: "LOSS", isBigEvent: false };
    }

    return { bucket: "LOSS", isBigEvent: false };
  }

  // ✅ FIX: accept bucket instead of re-picking it internally
  function pickDesiredHits({ bucket, selectedCount, creditsNow, stake }) {
    const loserMaxHits = maxHitsAtOrBelowMult(selectedCount, 10);
    const loserBigHits = Math.max(loserMaxHits, minPaidHit(selectedCount) || 0);

    if (bucket === "LOSS") return 0;

    const payHits = payingHitCounts(selectedCount);
    const minHit = minPaidHit(selectedCount);

    if (bucket === "SMALL") {
      if (!payHits.length) return 0;
      const iMin = Math.max(0, payHits.indexOf(minHit));
      const candidates = payHits.slice(iMin, Math.min(payHits.length, iMin + 3));
      const choice = chooseWeighted(
        rng,
        candidates.map((h, idx) => ({ key: h, w: idx === 0 ? 6 : 2 }))
      );
      return Math.min(selectedCount, choice ?? minHit);
    }

    if (bucket === "MEDIUM") {
      let mids = payingHitsByMultRange(selectedCount, 2, 7);
      if (!mids.length) mids = payHits.filter((h) => h >= Math.min(selectedCount, minHit + 1));
      if (!mids.length) return Math.min(selectedCount, 3 + randInt(0, 1));
      const choice = chooseWeighted(
        rng,
        mids.map((h, idx) => ({ key: h, w: Math.max(1, 6 - idx) }))
      );
      return Math.min(selectedCount, choice ?? mids[0]);
    }

    if (path === DIRECTOR_PATHS.LOSER) {
      if (rng() < 0.07) return Math.min(selectedCount, loserBigHits);
      return minPaidHit(selectedCount);
    }

    // bucket === BIG (winner pay event)
    const targetLo = 101;
    const targetHi = ceiling != null ? Math.min(ceiling, 110) : 120;
    const row = BILL_MULTIPLIERS[selectedCount] || {};
    const candidates = Object.keys(row).map(Number).sort((a, b) => a - b);

    let chosen = 0;
    for (const h of candidates) {
      const mult = row[h] ?? 0;
      if (mult <= 0) continue;
      const after = creditsNow + stake * mult;
      if (after >= targetLo && after <= targetHi) {
        chosen = h;
        break;
      }
    }

    if (!chosen) {
      let bestH = 0;
      let bestAfter = -Infinity;
      for (const h of candidates) {
        const mult = row[h] ?? 0;
        if (mult <= 0) continue;
        const after = creditsNow + stake * mult;
        if (after <= targetHi && after > bestAfter) {
          bestAfter = after;
          bestH = h;
        }
      }
      chosen = bestH || minPaidHit(selectedCount) || 0;
    }

    return Math.min(selectedCount, chosen);
  }

  function enforceCeiling({ selectedCount, stake, creditsNow, desiredHits }) {
    if (state.exitedPath || ceiling == null) return desiredHits;
    let h = Math.min(desiredHits, selectedCount);
    while (h > 0) {
      const payout = stake * billMultiplier(selectedCount, h);
      if (creditsNow + payout <= ceiling) return h;
      h -= 1;
    }
    return 0;
  }

  function computeForcedHitSets({ selectedSet, desiredHits }) {
    const sel = Array.from(selectedSet || []);
    shuffleInPlace(sel, rng);
    const forcedHits = desiredHits > 0 ? sel.slice(0, desiredHits) : [];
    const forcedMisses = desiredHits >= 0 ? sel.slice(desiredHits) : sel;
    shuffleInPlace(forcedHits, rng);
    shuffleInPlace(forcedMisses, rng);
    return { forcedHits, forcedMisses };
  }

  function scheduleNextWinWindow(payout) {
    if (payout > 0) {
      state.cooldown = randInt(3, 7);
      const extra = rng() < 0.30 ? randInt(4, 10) : randInt(0, 6);
      state.nextWinAllowedAt = state.spinIndex + state.cooldown + extra;
    } else {
      state.cooldown = Math.max(0, state.cooldown - 1);
      if (state.heat === 0 && rng() < 0.18) {
        state.nextWinAllowedAt = Math.max(
          state.nextWinAllowedAt,
          state.spinIndex + randInt(1, 4)
        );
      }
    }
  }

  return {
    next({ creditsNow, selectedCount, stake, selectedSet }) {
      state.spinIndex += 1;

      if (!state.exitedPath && ceiling != null && creditsNow >= ceiling) {
        state.exitedPath = true;
        if (path === DIRECTOR_PATHS.WINNER) {
          state.regime = REGIMES.CRASH;
          state.payEventArmed = false;
          state.postBig = true;
        }
        console.log(`Bill exited ${path} mode at $${ceiling}`);
      }

      // ✅ FIX: decide bucket FIRST, capture isBigEvent from the actual BIG selection
      const outcome = pickOutcomeBucket(creditsNow);
      const bucket = outcome.bucket;
      const isBigEvent = outcome.isBigEvent === true;

      let desiredHits = pickDesiredHits({
        bucket,
        selectedCount,
        creditsNow,
        stake,
      });

      // 🔒 HARD CAP: engine never awards more than 8 hits
      const MAX_AWARDED_HITS = 8;
      if (desiredHits > MAX_AWARDED_HITS) {
        desiredHits = MAX_AWARDED_HITS;
      }

      // 🔒 SAFETY: never return an unpaid hit count
      if (desiredHits > 0 && billMultiplier(selectedCount, desiredHits) <= 0) {
        desiredHits = minPaidHit(selectedCount) || 0;
      }

      desiredHits = enforceCeiling({
        selectedCount,
        stake,
        creditsNow,
        desiredHits,
      });

      const payout = stake * billMultiplier(selectedCount, desiredHits);

      if (payout > 0) {
        state.drought = 0;
        state.heat += 1;
      } else {
        state.drought += 1;
        state.heat = Math.max(0, state.heat - 1);
      }

      scheduleNextWinWindow(payout);

      const { forcedHits, forcedMisses } = computeForcedHitSets({
        selectedSet,
        desiredHits,
      });

      return {
        desiredHitCount: desiredHits,
        bonusSpins: null,
        projectedPayout: payout,
        isBigEvent, // ✅ FIX: now true exactly on the Pay Event spin
        forcedHits,
        forcedMisses,
        _debug: {
          regime: state.regime,
          postBig: state.postBig,
          exitedPath: state.exitedPath,
          drought: state.drought,
          heat: state.heat,
          cooldown: state.cooldown,
          nextWinAllowedAt: state.nextWinAllowedAt,
          ceiling,
          bucket,
        },
      };
    },
  };
}
