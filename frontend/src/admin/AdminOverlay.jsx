// frontend/src/admin/AdminOverlay.jsx

import { useState } from "react";
import { createPortal } from "react-dom";
import { doc, updateDoc, increment } from "firebase/firestore";

import { db } from "../services/firebase";
import PlayerSearch from "./PlayerSearch";
import "./admin.css";

export default function AdminOverlay({ onClose, hotkey }) {
  /* ================= PLAYER ================= */
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  /* ================= CREDIT ADJUST ================= */
  const [creditDelta, setCreditDelta] = useState("");
  const [adjustMode, setAdjustMode] = useState("ADD"); // ADD | SUB

  const adjustCredits = async (amount) => {
    if (!selectedPlayer || !amount) return;

    const ref = doc(db, "users", selectedPlayer.uid);

    await updateDoc(ref, {
      credits: increment(amount),
    });

    // optimistic UI update
    setSelectedPlayer((p) => ({
      ...p,
      credits: (p.credits || 0) + amount,
    }));
  };

  const applyManualAdjustment = async () => {
    const amt = Number(creditDelta);
    if (!Number.isFinite(amt) || amt <= 0) return;

    const signed = adjustMode === "ADD" ? amt : -amt;

    await adjustCredits(signed);
    setCreditDelta("");
  };

  /* ================= RENDER ================= */
  return createPortal(
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <div>
            <h2>Admin Control</h2>
            <div className="admin-subtitle">
              Hotkey: <strong>{hotkey}</strong>
            </div>
          </div>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="admin-body">
          {/* PLAYER SEARCH */}
          <PlayerSearch onSelect={setSelectedPlayer} />

          {selectedPlayer && (
            <>
              {/* PLAYER INFO */}
              <div className="admin-section">
                <h3>Selected Player</h3>
                <div className="admin-kv">
                  <div>
                    <strong>Username:</strong>{" "}
                    {selectedPlayer.username || "—"}
                  </div>
                  <div>
                    <strong>Cash App:</strong>{" "}
                    {selectedPlayer.cashApp || "—"}
                  </div>
                  <div>
                    <strong>Credits:</strong>{" "}
                    ${selectedPlayer.credits ?? 0}
                  </div>
                </div>
              </div>

              {/* CREDIT ADJUST */}
              <div className="admin-section">
                <h3>Adjust Credits</h3>

                <div className="admin-adjust">
                  <button
                    className={`sign-btn ${
                      adjustMode === "ADD" ? "active" : ""
                    }`}
                    onClick={() => setAdjustMode("ADD")}
                  >
                    +
                  </button>

                  <button
                    className={`sign-btn ${
                      adjustMode === "SUB" ? "active" : ""
                    }`}
                    onClick={() => setAdjustMode("SUB")}
                  >
                    –
                  </button>

                  <input
  type="text"
  inputMode="decimal"
  placeholder="Amount"
  value={creditDelta}
  onChange={(e) => {
    const v = e.target.value;

    // allow digits + ONE decimal point
    if (/^\d*\.?\d*$/.test(v)) {
      setCreditDelta(v);
    }
  }}
/>


                  <button onClick={applyManualAdjustment}>Apply</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
