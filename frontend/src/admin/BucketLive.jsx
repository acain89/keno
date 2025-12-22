import React from "react";
import { kenoBuckets } from "../game/kenoBuckets";

/**
 * BucketLive
 *
 * Displays LIVE bucket balances by tier.
 * READ-ONLY.
 * HARD-GUARDED — must never crash.
 */

export default function BucketLive() {
  // 🔒 HARD GUARD
  if (!kenoBuckets || !kenoBuckets.byTier) {
    return (
      <div className="admin-section">
        <h3>Live Buckets</h3>
        <div style={{ opacity: 0.6 }}>
          Bucket data not initialized.
        </div>
      </div>
    );
  }

  const tiers = kenoBuckets.byTier;
  const entries = Object.entries(tiers);

  if (!entries.length) {
    return (
      <div className="admin-section">
        <h3>Live Buckets</h3>
        <div style={{ opacity: 0.6 }}>
          No active tiers.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <h3>Live Buckets</h3>

      {entries.map(([tier, b]) => {
        if (!b) return null;

        const B = Number(b.B || 0);
        const D = Number(b.D || 0);
        const C = Number(b.C || 0);
        const F = Number(b.F || 0);

        return (
          <div key={tier} className="admin-row">
            <strong>{tier}</strong>
            <div>B: ${B.toFixed(2)}</div>
            <div style={{ color: "#7CFF6B" }}>
              D: ${D.toFixed(2)}
            </div>
            <div style={{ opacity: 0.75 }}>
              C: ${C.toFixed(2)}
            </div>
            <div style={{ opacity: 0.5 }}>
              F: ${F.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
