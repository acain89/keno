// balanceLadderEngine.js
// Balance-State Ladder Engine (Bill-compliant, deterministic-guarded)

/* =====================================================================
   ENUMS
===================================================================== */

export const PATHS = {
  LOSER: "LOSER",
  WINNER: "WINNER",
};

export const RUN_STATE = {
  NORMAL: "NORMAL",
  PEAK_REACHED: "PEAK_REACHED",
};

export const TIERS = {
  LOSS: "LOSS",
  SMALL: "SMALL",
  MED: "MED",
  BIG: "BIG",
};

/* =====================================================================
   HARD DESIGN LIMITS (AUTHORITATIVE)
===================================================================== */

const HARD_LIMITS = {
  [PATHS.LOSER]: {
    CEILING: 85,
    MUST_BONUS: 3,
    MAX_BONUS: 4,
    FORCE_DECAY_AT: 75,
  },
  [PATHS.WINNER]: {
    CEILING: 130,
    MUST_CROSS: 100,
    MUST_BONUS: 3,
    MAX_BONUS: 4,
    FORCE_DECAY_AT: 115,
  },
};

/* =====================================================================
   ZONE CALCULATION (PRESSURE ONLY)
===================================================================== */

export function getZone(balance, hardCeiling) {
  const pct = hardCeiling > 0 ? balance / hardCeiling : 0;
  if (pct < 0.45) return "A";
  if (pct < 0.75) return "B";
  if (pct < 0.92) return "C";
  return "D";
}

/* =====================================================================
   BASE WEIGHTS (RNG TEXTURE ONLY)
===================================================================== */

const WEIGHTS = {
  [PATHS.LOSER]: {
    A: { LOSS: 22, SMALL: 44, MED: 26, BIG: 8 },
    B: { LOSS: 34, SMALL: 40, MED: 22, BIG: 4 },
    C: { LOSS: 50, SMALL: 32, MED: 16, BIG: 2 },
    D: { LOSS: 72, SMALL: 22, MED: 6, BIG: 0 },
  },
  [PATHS.WINNER]: {
    A: { LOSS: 18, SMALL: 36, MED: 30, BIG: 16 },
    B: { LOSS: 26, SMALL: 38, MED: 26, BIG: 10 },
    C: { LOSS: 38, SMALL: 34, MED: 22, BIG: 6 },
    D: { LOSS: 60, SMALL: 26, MED: 12, BIG: 2 },
  },
};

/* =====================================================================
   RNG PICK
===================================================================== */

function pickWeighted(map) {
  const entries = Object.entries(map).filter(([, w]) => w > 0);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;

  for (const [k, w] of entries) {
    r -= w;
    if (r <= 0) return k;
  }
  return TIERS.LOSS;
}

/* =====================================================================
   PATH DIRECTOR (DETERMINISTIC GUARDRAILS)
===================================================================== */

function applyPathDirector({
  path,
  tier,
  balance,
  projectedPayout,
}) {
  const rules = HARD_LIMITS[path];
  if (!rules) return tier;

  const after = balance + projectedPayout;

  // LOSER: never exceed ceiling
  if (path === PATHS.LOSER && after > rules.CEILING) {
    if (tier === TIERS.BIG) return TIERS.MED;
    if (tier === TIERS.MED) return TIERS.SMALL;
    return TIERS.LOSS;
  }

  // WINNER: guarantee crossing $100 once
  if (
    path === PATHS.WINNER &&
    balance < rules.MUST_CROSS &&
    after < rules.MUST_CROSS
  ) {
    return TIERS.BIG;
  }

  // Decay phase (both paths)
  if (after >= rules.FORCE_DECAY_AT) {
    if (tier === TIERS.BIG) return TIERS.MED;
    if (tier === TIERS.MED) return TIERS.SMALL;
  }

  return tier;
}

/* =====================================================================
   DECIDE OUTCOME (TIER ONLY, GUARDED)
===================================================================== */

export function decideSpinOutcome({
  path = PATHS.LOSER,
  runState = RUN_STATE.NORMAL,
  balance = 0,
  hardCeiling = 130,
  raised = false,
  projectedPayout = 0, // ← stake × Bill multiplier (passed from game)
}) {
  const zone = getZone(balance, hardCeiling);
  const base = WEIGHTS[path]?.[zone] || WEIGHTS[PATHS.LOSER].B;

  let weights = { ...base };

  // Raise bias (risk illusion)
  if (raised) {
    weights.LOSS = Math.max(0, weights.LOSS - 8);
    weights.SMALL = Math.max(0, weights.SMALL - 6);
    weights.MED += 8;
    weights.BIG += 6;
  }

  let tier = pickWeighted(weights);

  // 🔒 Deterministic guard
  tier = applyPathDirector({
    path,
    tier,
    balance,
    projectedPayout,
  });

  return { tier, zone };
}

/* =====================================================================
   TIER → HIT COUNT (VISUAL ONLY)
===================================================================== */

export function tierToHitCount(tier, selectedSize = 10) {
  const cap = Math.min(8, selectedSize);

  if (tier === TIERS.LOSS) return Math.floor(Math.random() * 2);
  if (tier === TIERS.SMALL) return 3 + Math.floor(Math.random() * 2);
  if (tier === TIERS.MED) return 5 + Math.floor(Math.random() * 2);
  return 7 + Math.floor(Math.random() * 2);
}
