import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";

import { db } from "../services/firebase";
import PlayerSearch from "./PlayerSearch";
import "./admin.css";

export default function AdminOverlay({
  onClose,
  hotkey,
  onResetSession,
}) {
  /* ======================================================
     SELECTED PLAYER (TRACKING)
  ====================================================== */
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /* ======================================================
     LOAD ADMIN HISTORY
  ====================================================== */
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

  /* ======================================================
     SESSION RESET (ENGINE-ONLY)
  ====================================================== */
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
          {/* ================= PLAYER SEARCH ================= */}
          <PlayerSearch onSelect={setSelectedPlayer} />

          {/* ================= SELECTED PLAYER ================= */}
          {selectedPlayer && (
            <div className="admin-section">
              <h3>Selected Player</h3>

              <div className="admin-kv">
                <div>
                  <strong>Username:</strong>{" "}
                  {selectedPlayer.username || "—"}
                </div>
                <div>
                  <strong>Password:</strong>{" "}
                  {selectedPlayer.password || "—"}
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

              <div style={{ marginTop: 12 }}>
                <button
                  className="btn danger"
                  onClick={handleResetSession}
                >
                  Reset Demo Session
                </button>

                <div className="admin-muted" style={{ marginTop: 6 }}>
                  Session-only reset. Credits unchanged.
                </div>
              </div>
            </div>
          )}

          {/* ================= ADMIN HISTORY ================= */}
          {selectedPlayer && (
            <div className="admin-section">
              <h3>Admin History</h3>

              {loadingHistory && (
                <div className="admin-muted">
                  Loading history…
                </div>
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
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
