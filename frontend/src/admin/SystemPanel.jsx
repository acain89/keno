import React from "react";
import { kenoBuckets } from "../game/kenoBuckets";

/**
 * SystemPanel
 *
 * High-level engine + system diagnostics.
 * READ-ONLY.
 * MUST NEVER CRASH.
 */

export default function SystemPanel() {
  // 🔒 HARD GUARD
  if (!kenoBuckets) {
    return (
      <div className="admin-section">
        <h3>System</h3>
        <div style={{ opacity: 0.6 }}>
          Engine not initialized.
        </div>
      </div>
    );
  }

  // Safe reads with fallbacks
  const byTier = kenoBuckets.byTier || {};
  const lifetime = kenoBuckets.lifetimeByTier || {};

  const tierCount = Object.keys(byTier).length;
  const lifetimeTierCount = Object.keys(lifetime).length;

  let totalLive = 0;
  let totalDrift = 0;
  let totalCap = 0;

  Object.values(byTier).forEach((b) => {
    if (!b) return;
    totalLive += Number(b.B || 0);
    totalDrift += Number(b.D || 0);
    totalCap += Number(b.C || 0);
  });

  return (
    <div className="admin-section">
      <h3>System</h3>

      <div>Active Live Tiers: {tierCount}</div>
      <div>Lifetime Tracked Tiers: {lifetimeTierCount}</div>

      <hr style={{ opacity: 0.25 }} />

      <div>
        Total Live Balance: ${totalLive.toFixed(2)}
      </div>

      <div style={{ color: "#7CFF6B" }}>
        Total Drift Balance: ${totalDrift.toFixed(2)}
      </div>

      <div style={{ opacity: 0.7 }}>
        Total Cap Allocation: ${totalCap.toFixed(2)}
      </div>
    </div>
  );
}
