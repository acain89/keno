export const kenoLifetime = {
  byTier: {
    "0.25": initTier(),
    "0.50": initTier(),
    "1.00": initTier(),
    "2.00": initTier(),
  },
};

function initTier() {
  return {
    spins: 0,
    wagered: 0,
    paid: 0,
    driftIn: 0,
    driftBurned: 0,
    host: 0,
    maxBucket: 0,
    maxPayout: 0,
  };
}
