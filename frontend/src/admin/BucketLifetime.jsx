import React from "react";
import { kenoLifetime } from "../game/kenoLifetime";

/**
 * BucketLifetime
 *
 * Lifetime bucket aggregation by tier.
 * READ-ONLY.
 * HARD-GUARDED — must never crash.
 */

export default function BucketLifetime() {
  // 🔒 HARD GUARD
  if (!kenoLifetime || !kenoLifetime.byTier) {
    return (
      <div className="admin-section">
        <h3>Bucket Lifetime Summary</h3>
        <div style={{ opacity: 0.6 }}>
          Lifetime bucket data not initialized.
        </div>
      </div>
    );
  }

  const tiers = kenoLifetime.byTier;
  const entries = Object.entries(tiers);

  if (!entries.length) {
    return (
      <div className="admin-section">
        <h3>Bucket Lifetime Summary</h3>
        <div style={{ opacity: 0.6 }}>
          No lifetime data available.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <h3>Bucket Lifetime Summary</h3>

      {entries.map(([tier, l]) => {
        if (!l) return null;

        const spins = Number(l.spins || 0);
        const wagered = Number(l.wagered || 0);
        const paid = Number(l.paid || 0);

        const bootstrapInitial = Number(l.bootstrapInitial || 0);
        const bootstrapUsed = Number(l.bootstrapUsed || 0);

        const driftIn = Number(l.driftIn || 0);
        const driftBurned = Number(l.driftBurned || 0);

        const maxBucket = Number(l.maxBucket || 0);
        const maxPayout = Number(l.maxPayout || 0);

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

            <div>Total Spins: {spins}</div>
            <div>Total Wagered: ${wagered.toFixed(2)}</div>
            <div>Total Paid Out: ${paid.toFixed(2)}</div>

            <div style={{ marginTop: 6, color: "#ffb86b" }}>
              Bootstrap Initial: ${bootstrapInitial.toFixed(2)}
            </div>
            <div style={{ color: "#ff6b6b" }}>
              Bootstrap Used: ${bootstrapUsed.toFixed(2)}
            </div>

            <div style={{ marginTop: 6 }}>
              Drift In: ${driftIn.toFixed(2)}
            </div>
            <div>Drift Burned: ${driftBurned.toFixed(2)}</div>

            <div style={{ opacity: 0.7 }}>
              Max Bucket Ever: ${maxBucket.toFixed(2)}
            </div>
            <div style={{ opacity: 0.7 }}>
              Max Single Payout: ${maxPayout.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
