import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";

import { db } from "../services/firebase";
import PlayerSearch from "./PlayerSearch";
import "./admin.css";

export default function AdminOverlay({
  onClose,
  hotkey,
  onResetSession,
}) {
  /* ================= PLAYER ================= */
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /* ================= CREDIT ADJUST UI ================= */
  const [creditDelta, setCreditDelta] = useState("");
  const [adjustMode, setAdjustMode] = useState("ADD"); // ADD | SUB

  /* ================= LOAD HISTORY ================= */
  useEffect(() => {
    if (!selectedPlayer?.uid) {
      setAuditLogs([]);
      return;
    }

    let alive = true;
    setLoadingHistory(true);

    (async () => {
      try {
        const q = query(
          collection(db, "adminLogs"),
          where("targetUid", "==", selectedPlayer.uid),
          orderBy("timestamp", "desc")
        );

        const snap = await getDocs(q);
        if (!alive) return;

        const rows = [];
        snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
        setAuditLogs(rows);
      } catch {
        setAuditLogs([]);
      } finally {
        if (alive) setLoadingHistory(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [selectedPlayer]);

  /* ================= HELPERS ================= */
  const logAdminAction = async (type, delta = null, meta = {}) => {
    if (!selectedPlayer) return;

    await addDoc(collection(db, "adminLogs"), {
      type,
      delta,
      targetUid: selectedPlayer.uid,
      meta,
      timestamp: serverTimestamp(),
    });
  };

  const adjustCredits = async (amount) => {
    if (!selectedPlayer || !amount) return;

    const ref = doc(db, "users", selectedPlayer.uid);

    await updateDoc(ref, {
      credits: increment(amount),
    });

    await logAdminAction("CREDIT_ADJUST", amount);

    // optimistic UI update
    setSelectedPlayer((p) => ({
      ...p,
      credits: (p.credits || 0) + amount,
    }));
  };

  const applyManualAdjustment = async () => {
    const amt = Number(creditDelta);
    if (!amt || amt <= 0) return;

    const signed =
      adjustMode === "ADD" ? amt : -amt;

    await adjustCredits(signed);
    setCreditDelta("");
  };

  const assignRole = async (role) => {
    if (!selectedPlayer) return;

    const ref = doc(db, "users", selectedPlayer.uid);

    await updateDoc(ref, {
      adminOverride: { role },
    });

    await logAdminAction("ROLE_ASSIGN", null, { role });

    alert(`Assigned role: ${role}`);
  };

  const handleResetSession = () => {
    if (typeof onResetSession !== "function") return;

    const ok = window.confirm(
      "Reset demo session?\n\n" +
        "• Resets spin cadence\n" +
        "• Resets bonus cadence\n" +
        "• Clears run state\n\n" +
        "Credits are NOT changed."
    );

    if (!ok) return;
    onResetSession();
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
                  <div><strong>Username:</strong> {selectedPlayer.username}</div>
                  <div><strong>Cash App:</strong> {selectedPlayer.cashApp || "—"}</div>
                  <div><strong>Credits:</strong> ${selectedPlayer.credits ?? 0}</div>
                </div>
              </div>

              {/* CREDIT CONTROLS */}
              <div className="admin-section">
                <h3>Adjust Credits</h3>

                {/* MODE TOGGLE */}
                <div className="adjust-mode">
                  <button
                    className={adjustMode === "ADD" ? "active" : ""}
                    onClick={() => setAdjustMode("ADD")}
                  >
                    + Add
                  </button>
                  <button
                    className={adjustMode === "SUB" ? "active" : ""}
                    onClick={() => setAdjustMode("SUB")}
                  >
                    − Subtract
                  </button>
                </div>

                <div className="admin-adjust">
  <input
    type="number"
    min="0"
    inputMode="numeric"
    placeholder="Amount"
    value={creditDelta}
    onChange={(e) => setCreditDelta(e.target.value)}
  />

  <button onClick={applyManualAdjustment}>
    Apply
  </button>
</div>


                {/* QUICK BUTTONS (UNCHANGED) */}
                <div className="admin-actions">
                  <button onClick={() => adjustCredits(+5)}>+ $5</button>
                  <button onClick={() => adjustCredits(+10)}>+ $10</button>
                  <button onClick={() => adjustCredits(-5)} className="danger">− $5</button>
                  <button onClick={() => adjustCredits(-10)} className="danger">− $10</button>
                </div>
              </div>

              {/* ROLE ASSIGNMENT */}
              <div className="admin-section">
                <h3>Assign Outcome Role</h3>
                <div className="admin-actions">
                  <button onClick={() => assignRole("WINNER")}>Force WINNER</button>
                  <button onClick={() => assignRole("LOSER")} className="danger">
                    Force LOSER
                  </button>
                </div>
              </div>

              {/* SESSION RESET */}
              <div className="admin-section">
                <h3>Session Control</h3>
                <button className="danger" onClick={handleResetSession}>
                  Reset Demo Session
                </button>
                <div className="admin-muted">
                  Session-only reset. Credits unchanged.
                </div>
              </div>

              {/* HISTORY */}
              <div className="admin-section">
                <h3>Admin History</h3>

                {loadingHistory && (
                  <div className="admin-muted">Loading history…</div>
                )}

                {!loadingHistory && auditLogs.length === 0 && (
                  <div className="admin-muted">
                    No admin actions recorded.
                  </div>
                )}

                {!loadingHistory &&
                  auditLogs.map((log) => (
                    <div key={log.id} className="admin-log">
                      <div>
                        <strong>{log.type}</strong>
                        {log.delta != null && (
                          <> · Δ {log.delta > 0 ? "+" : ""}{log.delta}</>
                        )}
                      </div>
                      <div className="admin-muted">
                        {log.timestamp?.toDate?.().toLocaleString() || "—"}
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
