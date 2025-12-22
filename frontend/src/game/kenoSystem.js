// kenoSystem.js
// Global runtime flags for Keno behavior control (ADMIN / DEBUG SAFE)

/**
 * This object is INTENTIONALLY simple.
 * - No React
 * - No side effects
 * - No persistence
 *
 * Used to:
 * - Temporarily disable features
 * - Freeze systems during testing
 * - Safely inspect state without mutation
 */

export const kenoSystem = {
  flags: {
    disableRaise: false,   // Prevent RAISE button from functioning
    disableBonus: false,   // Prevent bonus from triggering
    freezeBuckets: false,  // Lock bucket balances (read-only math)
    readOnlyMode: false,   // Full gameplay lock (no credits change)
  },

  /* ---------- SAFE SETTERS ---------- */

  setFlag(name, value) {
    if (!(name in this.flags)) return;
    this.flags[name] = !!value;
  },

  enable(name) {
    this.setFlag(name, true);
  },

  disable(name) {
    this.setFlag(name, false);
  },

  /* ---------- SNAPSHOT (ADMIN / DEBUG) ---------- */

  snapshot() {
    return { ...this.flags };
  },
};
