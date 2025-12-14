import React from "react";

export default function Footer({
  bet,
  lastWin,
  paused,
  raiseActive,
  inBonus,
  bonusSpinsLeft,
  bonusWinnings,
  onSpin,
  onResume,
  onRaise,
  onIncBet,
  onDecBet,
}) {
  const betDisabled = paused || inBonus;

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
        <div className="bet-col">
          <button className="btn" onClick={onIncBet} disabled={betDisabled}>
            +
          </button>

          <div className="bet-digital">
            ${bet}
            {!inBonus && raiseActive && <span className="x2">×2</span>}
            {inBonus && <span className="x2">×2 BONUS</span>}
          </div>

          <button className="btn" onClick={onDecBet} disabled={betDisabled}>
            −
          </button>
        </div>

        <button
          className="btn spin"
          onClick={onSpin}
          disabled={paused || inBonus}
        >
          SPIN
        </button>

        <div className="decision-col">
          <button
            className={`btn keep ${paused && !inBonus ? "pulse" : ""}`}
            disabled={!paused || inBonus}
            onClick={onResume}
          >
            KEEP
          </button>

          <button
            className={`btn raise ${paused && !inBonus ? "pulse" : ""}`}
            disabled={!paused || inBonus}
            onClick={onRaise}
          >
            RAISE
          </button>
        </div>
      </div>
    </div>
  );
}
