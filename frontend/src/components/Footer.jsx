// frontend/src/components/Footer.jsx
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function Footer({
  bet,
  lastWin,
  inBonus,
  bonusSpinsLeft,
  bonusWinnings,
  canSpin,
  canDecision,
  canRaise,
  canBetChange,
  locked = false,
  onSpin,
  onResume,
  onRaise, // ⬅ correct prop
  onIncBet,
  onDecBet,
}) {
  const lockAll = inBonus;
  const lockBet = inBonus || locked;

  const [raiseVisible, setRaiseVisible] = useState(false);
  const toastRef = useRef(null); // ⬅ attach to existing DOM element
  const timerRef = useRef(null);

  const handleRaise = async () => {
    if (!locked || typeof onRaise !== "function") return;
    if (!canRaise || lockAll) return;

    setRaiseVisible(true);

    // apply animation safely
    if (toastRef.current) {
  toastRef.current.style.animation = "none"; // reset
  void toastRef.current.offsetWidth; // force reflow
  toastRef.current.style.animation = "bet2xToast 1.5s ease-out forwards";
  toastRef.current.textContent = "Bet 2X!";
}


    // clear previous timeout if still running (prevents flicker)
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setRaiseVisible(false), 1500);

    await onRaise();
  };

  useEffect(() => {
    // create the stable toast element ONCE
    const node = document.createElement("div");
    node.className = "raise-float-overlay-footer-left";
    node.textContent = "Bet 2X!";
    document.body.appendChild(node);
    toastRef.current = node;

    return () => node.remove();
  }, []);

  return (
    <>
      {/* floating toast already exists in DOM via useEffect */}
      <div
        className={`footer ${inBonus ? "footer-bonus" : ""}`}
        style={{ position: "relative" }}
      >
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
          <div className="bet-controls">
            <button
              type="button"
              className={`btn ${
                canBetChange && !lockBet ? "pulse" : "disabled"
              }`}
              disabled={!canBetChange || lockBet}
              onClick={onIncBet}
            >
              +
            </button>

            <div className="bet-digital">
              ${Number(bet).toFixed(2)}
              {locked && <span className="bet-lock">🔒</span>}
            </div>

            <button
              type="button"
              className={`btn ${
                canBetChange && !lockBet ? "pulse" : "disabled"
              }`}
              disabled={!canBetChange || lockBet}
              onClick={onDecBet}
            >
              −
            </button>
          </div>

          <button
            type="button"
            className={`btn spin ${
              canSpin && !lockAll && locked
                ? "spin-active pulse"
                : "spin-disabled"
            }`}
            disabled={!canSpin || lockAll || !locked}
            onClick={onSpin}
          >
            SPIN
          </button>

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
              onClick={handleRaise}
            >
              RAISE
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

