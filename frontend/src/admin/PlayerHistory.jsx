import React from "react";

export default function PlayerHistory({ player }) {
  if (!player) return null;

  const h = player.history;

  const totalLosses =
    h.totalCreditsPlayed - h.totalPaidOut - h.totalAdminAdjustments;

  return (
    <div className="admin-section">
      <h3>Play History</h3>

      <div><strong>Spins Played:</strong> {h.spinsPlayed}</div>
      <div><strong>Raises Used:</strong> {h.raisesUsed}</div>

      <div><strong>Total Credits Played:</strong> ${h.totalCreditsPlayed.toFixed(2)}</div>
      <div><strong>Total Paid Out:</strong> ${h.totalPaidOut.toFixed(2)}</div>
      <div><strong>Biggest Win:</strong> ${h.biggestWin.toFixed(2)}</div>

      <div><strong>Admin Adjustments:</strong> ${h.totalAdminAdjustments.toFixed(2)}</div>
      <div><strong>Total Losses:</strong> ${totalLosses.toFixed(2)}</div>

      <div style={{ marginTop: 8, opacity: 0.8 }}>
        <div>
          <strong>Last Played:</strong>{" "}
          {h.lastPlayedAt ? new Date(h.lastPlayedAt).toLocaleString() : "—"}
        </div>
        <div>
          <strong>Last Admin Action:</strong>{" "}
          {h.lastAdminActionAt
            ? new Date(h.lastAdminActionAt).toLocaleString()
            : "—"}
        </div>
      </div>
    </div>
  );
}
