import React from "react";

/**
 * AdminDebugPanel (Joe-free)
 *
 * Read-only diagnostics for the Balance Ladder Engine.
 * No outcome forcing.
 * No trajectory control.
 */

export default function AdminDebugPanel({
  visible,

  // game state (read-only)
  phase,
  inBonus,
  bonusSpinsLeft,
  bonusWinnings,
  bet,
  credits,
  selectedCount,

  // ladder debug
  path,
  runState,
  zone,
  maxPayout,
}) {
  if (!visible) return null;

  return (
    <div className="admin-debug">
      <div className="admin-debug-row">
        <strong>PATH:</strong> {path ?? "—"}
      </div>

      <div className="admin-debug-row">
        <strong>RUN STATE:</strong> {runState ?? "—"}
      </div>

      <div className="admin-debug-row">
        <strong>ZONE:</strong> {zone ?? "—"}
      </div>

      <div className="admin-debug-row">
        <strong>MAX PAYOUT:</strong>{" "}
        ${Number(maxPayout ?? 0).toFixed(2)}
      </div>

      <hr />

      <div className="admin-debug-row">
        <strong>PHASE:</strong> {phase ?? "—"}
      </div>

      <div className="admin-debug-row">
        <strong>IN BONUS:</strong> {inBonus ? "YES" : "NO"}
      </div>

      {inBonus && (
        <>
          <div className="admin-debug-row">
            <strong>BONUS SPINS:</strong> {bonusSpinsLeft ?? 0}
          </div>
          <div className="admin-debug-row">
            <strong>BONUS WIN:</strong>{" "}
            ${Number(bonusWinnings || 0).toFixed(2)}
          </div>
        </>
      )}

      <div className="admin-debug-row">
        <strong>BET:</strong> ${Number(bet || 0).toFixed(2)}
      </div>

      <div className="admin-debug-row">
        <strong>CREDITS:</strong>{" "}
        ${Number(credits || 0).toFixed(2)}
      </div>

      <div className="admin-debug-row">
        <strong>SELECTED:</strong> {selectedCount ?? 0}
      </div>
    </div>
  );
}
