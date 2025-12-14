export const CONFIG = {
  RNG_SEED: 13371337,

  TIERS: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],

  PAYTABLE: {
    "1": [{ hits: 1, mult: 1 }],
    "2": [{ hits: 1, mult: 1 }, { hits: 2, mult: 3 }],
    "3": [{ hits: 2, mult: 1 }, { hits: 3, mult: 3 }],
    "4": [
      { hits: 2, mult: 1 },
      { hits: 3, mult: 3 },
      { hits: 4, mult: 7 }
    ],
    "5": [
      { hits: 2, mult: 1 },
      { hits: 3, mult: 3 },
      { hits: 4, mult: 7 },
      { hits: 5, mult: 16 }
    ],
    "6": [
      { hits: 3, mult: 1 },
      { hits: 4, mult: 3 },
      { hits: 5, mult: 7 },
      { hits: 6, mult: 16 }
    ],
    "7": [
      { hits: 3, mult: 1 },
      { hits: 4, mult: 3 },
      { hits: 5, mult: 7 },
      { hits: 6, mult: 16 },
      { hits: 7, mult: 40 }
    ],
    "8": [
      { hits: 3, mult: 1 },
      { hits: 4, mult: 3 },
      { hits: 5, mult: 7 },
      { hits: 6, mult: 16 },
      { minHits: 7, mult: 40 }
    ],
    "9": [
      { hits: 4, mult: 1 },
      { hits: 5, mult: 3 },
      { hits: 6, mult: 7 },
      { hits: 7, mult: 16 },
      { minHits: 8, mult: 40 }
    ],
    "10": [
      { hits: 4, mult: 1 },
      { hits: 5, mult: 3 },
      { hits: 6, mult: 7 },
      { hits: 7, mult: 16 },
      { minHits: 8, mult: 40 }
    ]
  },

  BONUS_WEIGHTS: [
    { value: 5, weight: 35 },
    { value: 8, weight: 25 },
    { value: 12, weight: 18 },
    { value: 18, weight: 10 },
    { value: 25, weight: 7 },
    { value: 40, weight: 5 }
  ]
};

export const SEEDS = {
  "0.25": { baseBankSeed: 8.15, bonusBankSeed: 0 },
  "0.50": { baseBankSeed: 16.3, bonusBankSeed: 0 },
  "0.75": { baseBankSeed: 24.45, bonusBankSeed: 0 },
  "1.00": { baseBankSeed: 32.6, bonusBankSeed: 0 },
  "1.25": { baseBankSeed: 40.75, bonusBankSeed: 0 },
  "1.50": { baseBankSeed: 48.9, bonusBankSeed: 0 },
  "1.75": { baseBankSeed: 57.05, bonusBankSeed: 0 },
  "2.00": { baseBankSeed: 65.2, bonusBankSeed: 0 }
};
