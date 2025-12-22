import React from "react";

export default function Footer({
  bet,
  lastWin,

  // bonus
  inBonus,
  bonusSpinsLeft,
  bonusWinnings,

  // engine flags (AUTHORITATIVE)
  canSpin,
  canDecision,
  canRaise,
  canBetChange,

  // actions
  onSpin,
  onResume,
  onRaise,
  onIncBet,
  onDecBet,
}) {
  /**
   * CANONICAL LOCK RULES
   * - Bonus locks EVERYTHING
   * - Only engine flags can enable actions
   * - Disabled buttons are also functionally inert
   */

  const lockAll = inBonus;

  return (
    <div className={`footer ${inBonus ? "footer-bonus" : ""}`}>
      <div className="lastwin">Last Win: {lastWin}</div>

      {inBonus && (
        <div className="bonus-hud">
          <div className="bonus-counter">FREE SPINS: {bonusSpinsLeft}</div>
          <div className="bonus-bank">
            BONUS WIN: ${Number(bonusWinnings || 0).toFixed(2)}
          </div>
          <div className="bonus-mult">BONUS MULT: ×2</div>
        </div>
      )}

      <div className="footer-row">
        {/* BET */}
        <div className="bet-col">
          <button
            type="button"
            className={`btn ${canBetChange && !lockAll ? "pulse" : "disabled"}`}
            disabled={!canBetChange || lockAll}
            onClick={onIncBet}
          >
            +
          </button>

          <div className="bet-digital">${bet}</div>

          <button
            type="button"
            className={`btn ${canBetChange && !lockAll ? "pulse" : "disabled"}`}
            disabled={!canBetChange || lockAll}
            onClick={onDecBet}
          >
            −
          </button>
        </div>

        {/* SPIN */}
        <button
          type="button"
          className={`btn spin ${
            canSpin && !lockAll ? "spin-active pulse" : "spin-disabled"
          }`}
          disabled={!canSpin || lockAll}
          onClick={onSpin}
        >
          SPIN
        </button>

        {/* DECISION */}
        <div className="decision-col">
          <button
            type="button"
            className={`btn keep ${
              canDecision && !lockAll ? "pulse" : "disabled"
            }`}
            disabled={!canDecision || lockAll}
            onClick={onResume}
          >
            KEEP
          </button>

          <button
            type="button"
            className={`btn raise ${
              canRaise && !lockAll ? "pulse" : "disabled"
            }`}
            disabled={!canRaise || lockAll}
            onClick={onRaise}
          >
            RAISE
          </button>
        </div>
      </div>
    </div>
  );
}
