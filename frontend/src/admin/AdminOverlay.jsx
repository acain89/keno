// frontend/src/admin/AdminOverlay.jsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore"; // ⬅ FIXED imports
import { db, auth } from "../services/firebase"; // ⬅ merged into one line
import PlayerSearch from "./PlayerSearch";
import "./admin.css";

export default function AdminOverlay({ onClose, hotkey }) {
  /* ================= PLAYER ================= */
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  /* ================= ONLINE PLAYERS COUNTER ================= */
  const [onlineCount, setOnlineCount] = useState(0); // ⬅ FIXED: inside component

  useEffect(() => {
    const q = query(collection(db, "users"), where("online", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      setOnlineCount(snap.size);
    });
    return () => unsub();
  }, []);

  /* ================= CREDIT ADJUST ================= */
  const [creditDelta, setCreditDelta] = useState("");
  const [adjustMode, setAdjustMode] = useState("ADD"); // ADD | SUB

  const adjustCredits = async (amount) => {
    if (!selectedPlayer || !amount) return;
    const ref = doc(db, "users", selectedPlayer.uid);

    await updateDoc(ref, {
      credits: increment(amount),
    });

    setSelectedPlayer((p) => ({
      ...p,
      credits: (p.credits || 0) + amount,
    }));
  };

  const applyManualAdjustment = async () => {
    if (!selectedPlayer?.uid) return;
    const amt = Number(creditDelta);
    if (!Number.isFinite(amt) || amt <= 0) return;

    const signed = adjustMode === "ADD" ? amt : -amt;
    const ref = doc(db, "users", selectedPlayer.uid);

    await updateDoc(ref, {
      credits: increment(signed),
      adminOverride: {
        role: adjustMode === "ADD" ? "WINNER" : "LOSER",
      },
    });

    setSelectedPlayer((p) => ({
      ...p,
      credits: (p.credits || 0) + signed,
      adminOverride: {
        role: adjustMode === "ADD" ? "WINNER" : "LOSER",
      },
    }));

    setCreditDelta("");
  };

  /* ================= RENDER ================= */
  const panel = (
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
          {/* ONLINE COUNTER (NOW VALID JSX) */}
          <div className="admin-current-player">
            Current Players: {onlineCount}
          </div>

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
                    className={`sign-btn ${adjustMode === "ADD" ? "active" : ""}`}
                    onClick={() => setAdjustMode("ADD")}
                  >
                    +
                  </button>

                  <button
                    className={`sign-btn ${adjustMode === "SUB" ? "active" : ""}`}
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
    </div>
  );

  return createPortal(panel, document.body); // unchanged usage
}
