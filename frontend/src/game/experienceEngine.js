// src/game/experienceEngine.js
// SIMPLE EXPERIENCE ENGINE (prototype)
// - No RNG-decided outcomes; only interval scheduler + small jitter
// - Two paths: LOSER ($85 cap) / WINNER ($130 cap)
// - Frequent wins early; slows near soft cap; hard-stops at hard cap
// - Tiles "justify" payouts via min-hit rules (illusion)

export const XP_PATHS = {
  LOSER: "LOSER",
  WINNER: "WINNER",
};

// ---------- deterministic jitter RNG ----------
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
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng, min, max) {
  const a = Math.min(min, max);
  const b = Math.max(min, max);
  return a + Math.floor(rng() * (b - a + 1));
}

// ---------- hit justification ----------
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function minHitsFor(selectedCount, mult) {
  const s = Math.max(0, Math.min(10, Number(selectedCount || 0)));
  if (s <= 0) return 0;

  // illusion rules (tweakable)
  if (mult === 1) return clamp(Math.ceil(s * 0.25), 1, s);
  if (mult === 2) return clamp(Math.ceil(s * 0.4), 1, s);
  if (mult === 3) return clamp(Math.ceil(s * 0.55), 1, s);
  return 0;
}

// ---------- intervals ----------
function baseIntervalsForPath(path) {
  // [min, max] for each payout tier
  if (path === XP_PATHS.WINNER) {
    return {
      one: [3, 4],
      two: [5, 6],
      three: [9, 11],
    };
  }
  return {
    one: [4, 5],
    two: [7, 9],
    three: [14, 18],
  };
}

// ---------- decay near cap ----------
function decayFactor({ creditsNow, softCap, hardCap, path }) {
  // 1.0 before soft cap, grows toward ~2.2 (winner) / ~2.8 (loser) near hard cap
  const c = Number(creditsNow || 0);
  const soft = Number(softCap || 0);
  const hard = Math.max(soft + 1, Number(hardCap || 1));

  if (c <= soft) return 1;

  const t = clamp((c - soft) / (hard - soft), 0, 1); // 0..1
  const max = path === XP_PATHS.WINNER ? 2.2 : 2.8;
  return 1 + t * (max - 1);
}

function scaledInterval(rng, baseMin, baseMax, factor) {
  const scaledMin = Math.ceil(baseMin * factor);
  const scaledMax = Math.ceil(baseMax * factor);

  // small jitter even after scaling
  const minJ = Math.max(1, scaledMin - 1);
  const maxJ = Math.max(minJ, scaledMax + 1);

  return randInt(rng, minJ, maxJ);
}

// ---------- engine ----------
export function createExperienceEngine({
  path = XP_PATHS.LOSER,
  hardCap = path === XP_PATHS.WINNER ? 130 : 85,
  softCap = path === XP_PATHS.WINNER ? 110 : 70,
  seed = "DEV",
} = {}) {
  const seed32 = hash32(`${path}|${hardCap}|${softCap}|${seed}`);
  const rng = mulberry32(seed32);

  const base = baseIntervalsForPath(path);

  const state = {
    path,
    hardCap,
    softCap,
    spinIndex: 0,

    // next scheduled wins (spinIndex at which it fires)
    next1: 0,
    next2: 0,
    next3: 0,
  };

  function scheduleInitial(creditsNow) {
    const f = decayFactor({
      creditsNow,
      softCap: state.softCap,
      hardCap: state.hardCap,
      path: state.path,
    });

    if (!state.next1) state.next1 = 1 + scaledInterval(rng, base.one[0], base.one[1], f);
    if (!state.next2) state.next2 = 1 + scaledInterval(rng, base.two[0], base.two[1], f);
    if (!state.next3) state.next3 = 1 + scaledInterval(rng, base.three[0], base.three[1], f);
  }

  function reschedule(kind, creditsNow) {
    const f = decayFactor({
      creditsNow,
      softCap: state.softCap,
      hardCap: state.hardCap,
      path: state.path,
    });

    if (kind === 1) {
      state.next1 = state.spinIndex + scaledInterval(rng, base.one[0], base.one[1], f);
    } else if (kind === 2) {
      state.next2 = state.spinIndex + scaledInterval(rng, base.two[0], base.two[1], f);
    } else if (kind === 3) {
      state.next3 = state.spinIndex + scaledInterval(rng, base.three[0], base.three[1], f);
    }
  }

  function chooseOutcomeMultiplier(creditsNow) {
    // hard stop
    if (Number(creditsNow || 0) >= state.hardCap) return 0;

    // disable big wins near cap
    const c = Number(creditsNow || 0);
    const near = state.path === XP_PATHS.WINNER ? state.hardCap - 8 : state.hardCap - 6;

    const can3 = c < near; // 3x disappears first
    const can2 = c < state.hardCap - 3;

    const due3 = can3 && state.spinIndex >= state.next3;
    const due2 = can2 && state.spinIndex >= state.next2;
    const due1 = state.spinIndex >= state.next1;

    // priority: biggest due first
    if (due3) return 3;
    if (due2) return 2;
    if (due1) return 1;

    return 0;
  }

  function capSafeMultiplier({ mult, bet, selectedCount, creditsNow }) {
    // If paying this would exceed hard cap, downgrade until it fits.
    // NOTE: payout = bet * mult (simple prototype rule)
    let m = Number(mult || 0);
    const b = Number(bet || 0);
    const c = Number(creditsNow || 0);

    while (m > 0) {
      const payout = b * m;
      if (c + payout <= state.hardCap) return m;
      m -= 1;
    }
    return 0;
  }

  return {
    snapshot() {
      return { ...state };
    },

    /**
     * next()
     * Inputs:
     * - creditsNow: credits AFTER any deductions for the spin
     * - bet: total stake for the spin (bet or bet+raise)
     * - selectedCount: number of selected tiles (1..10)
     *
     * Output:
     * - payoutMult: 0|1|2|3
     * - desiredHitCount: number of hits to render (illusion)
     * - payoutAmount: bet * payoutMult
     */
    next({ creditsNow, bet, selectedCount }) {
      state.spinIndex += 1;

      scheduleInitial(creditsNow);

      let mult = chooseOutcomeMultiplier(creditsNow);
      mult = capSafeMultiplier({
        mult,
        bet,
        selectedCount,
        creditsNow,
      });

      // reschedule the trigger we used (or keep schedule if not fired)
      if (mult === 3) reschedule(3, creditsNow);
      else if (mult === 2) reschedule(2, creditsNow);
      else if (mult === 1) reschedule(1, creditsNow);

      // losses still show a couple hits sometimes (illusion)
      const s = Math.max(0, Math.min(10, Number(selectedCount || 0)));

      let desiredHitCount = 0;
      if (mult > 0) {
        desiredHitCount = minHitsFor(s, mult);
      } else if (s > 0) {
        // ~35% of losses show 1–2 hits (no payout)
        if (rng() < 0.35) desiredHitCount = clamp(randInt(rng, 1, 2), 0, s);
      }

      const payoutAmount = Number(bet || 0) * mult;

      return {
        payoutMult: mult, // 0|1|2|3
        desiredHitCount,
        payoutAmount,
      };
    },
  };
}
