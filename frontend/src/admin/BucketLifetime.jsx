import React from "react";
import { kenoLifetime } from "../game/kenoLifetime";

export default function BucketLifetime() {
  const tiers = kenoLifetime.byTier || {};

  return (
    <div className="admin-section">
      <h3>Bucket Lifetime Summary</h3>

      {Object.entries(tiers).map(([tier, l]) => {
        const bootstrapInitial = l.bootstrapInitial || 0;
        const bootstrapUsed = l.bootstrapUsed || 0;

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

            <div>Total Spins: {l.spins}</div>
            <div>Total Wagered: ${l.wagered.toFixed(2)}</div>
            <div>Total Paid Out: ${l.paid.toFixed(2)}</div>

            <div style={{ marginTop: 6, color: "#ffb86b" }}>
              Bootstrap Initial: ${bootstrapInitial.toFixed(2)}
            </div>
            <div style={{ color: "#ff6b6b" }}>
              Bootstrap Used: ${bootstrapUsed.toFixed(2)}
            </div>

            <div style={{ marginTop: 6 }}>
              Drift In: ${l.driftIn.toFixed(2)}
            </div>
            <div>Drift Burned: ${l.driftBurned.toFixed(2)}</div>

            <div style={{ opacity: 0.7 }}>
              Max Bucket Ever: ${l.maxBucket.toFixed(2)}
            </div>
            <div style={{ opacity: 0.7 }}>
              Max Single Payout: ${l.maxPayout.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
