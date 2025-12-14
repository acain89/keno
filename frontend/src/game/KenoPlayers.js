export const kenoPlayers = {
  byId: {},
};

export function createPlayerHistory() {
  return {
    totalCreditsPlayed: 0,
    totalAdminAdjustments: 0,
    totalPaidOut: 0,

    biggestWin: 0,
    spinsPlayed: 0,
    raisesUsed: 0,

    lastPlayedAt: null,
    lastAdminActionAt: null,
  };
}

/* ===========================
   DEV TEST PLAYERS (REMOVE LATER)
=========================== */
if (import.meta.env.DEV) {
  kenoPlayers.byId["test-1"] = {
    id: "test-1",
    username: "AlphaPlayer",
    cashAppId: "$alpha",
    credits: 120.5,
    setCredits(deltaFn) {
      this.credits = typeof deltaFn === "function"
        ? deltaFn(this.credits)
        : deltaFn;
    },
    history: {
      ...createPlayerHistory(),
      totalCreditsPlayed: 340,
      totalPaidOut: 280,
      biggestWin: 75,
      spinsPlayed: 42,
    },
    historyLog: [],
  };

  kenoPlayers.byId["test-2"] = {
    id: "test-2",
    username: "BetaPlayer",
    cashAppId: "$beta",
    credits: 48.25,
    setCredits(deltaFn) {
      this.credits = typeof deltaFn === "function"
        ? deltaFn(this.credits)
        : deltaFn;
    },
    history: {
      ...createPlayerHistory(),
      totalCreditsPlayed: 510,
      totalPaidOut: 430,
      biggestWin: 120,
      spinsPlayed: 61,
    },
    historyLog: [],
  };
}
