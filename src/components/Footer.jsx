import React from "react";

export default function Footer({
  bet = "1.00",
  lastWin,
  paused,
  onSpin,
  onResume,
}) {
  return (
    <div className="footer">
      <div className="lastwin">Last Win: {lastWin}</div>

      <div className="col">
        <button className="btn">+</button>
        <div className="bet-digital">${bet}</div>
        <button className="btn">−</button>
      </div>

      <button className="btn spin" onClick={onSpin}>
        SPIN
      </button>

      <div className="col">
        <button
          className={`btn keep ${paused ? "pulse" : ""}`}
          onClick={onResume}
        >
          KEEP
        </button>
        <button
          className={`btn raise ${paused ? "pulse" : ""}`}
          onClick={onResume}
        >
          RAISE
        </button>
      </div>
    </div>
  );
}
