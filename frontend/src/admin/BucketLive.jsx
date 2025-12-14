import React from "react";
import { kenoBuckets } from "../game/kenoBuckets";

export default function BucketLive() {
  const tiers = kenoBuckets.byTier || {};

  return (
    <div className="admin-section">
      <h3>Live Buckets</h3>

      {Object.entries(tiers).map(([tier, b]) => {
        const bootstrapInitial = b.bootstrapInitial || 0;
        const bootstrapRemaining = b.bootstrapRemaining || 0;
        const realBalance = Math.max(0, b.B - bootstrapRemaining);

        const bootstrapPct =
          b.B > 0 ? (bootstrapRemaining / b.B) * 100 : 0;

        return (
          <div
            key={tier}
            style={{
              border: "1px solid rgba(120,190,255,0.25)",
              padding: 12,
              marginBottom: 12,
              borderRadius: 6,
            }}
          >
            <strong>Bet Tier: ${tier}</strong>

            <div>Bucket (Total): ${b.B.toFixed(2)}</div>
            <div>Real Funds: ${realBalance.toFixed(2)}</div>

            <div style={{ color: "#ffb86b" }}>
              Bootstrap Remaining: ${bootstrapRemaining.toFixed(2)} (
              {bootstrapPct.toFixed(1)}%)
            </div>

            <div style={{ color: "#7CFF6B" }}>
              Drift Balance: ${b.D.toFixed(2)}
            </div>

            <div style={{ opacity: 0.7 }}>
              Cap: ${b.C.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
