export const kenoLifetime = {
  byTier: Object.create(null),
};

const DEFAULT_LIFETIME = () => ({
  spins: 0,
  wagered: 0,
  paid: 0,
  host: 0,
  driftIn: 0,
  driftBurned: 0,
  maxBucket: 0,
  maxPayout: 0,
});

export function ensureLifetimeTier(tierKey) {
  if (!tierKey) {
    throw new Error("ensureLifetimeTier called without tierKey");
  }

  const existing = kenoLifetime.byTier[tierKey];

  // If missing OR partially corrupted, rehydrate safely
  if (!existing || typeof existing.spins !== "number") {
    kenoLifetime.byTier[tierKey] = {
      ...DEFAULT_LIFETIME(),
      ...(existing || {}),
    };
  }

  return kenoLifetime.byTier[tierKey];
}
