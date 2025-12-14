export const kenoLifetime = {
  byTier: {},
};

export function ensureLifetimeTier(tierKey) {
  if (!kenoLifetime.byTier[tierKey]) {
    kenoLifetime.byTier[tierKey] = {
      spins: 0,
      wagered: 0,
      paid: 0,
      host: 0,
      driftIn: 0,
      driftBurned: 0,
      maxBucket: 0,
      maxPayout: 0,
    };
  }
  return kenoLifetime.byTier[tierKey];
}
