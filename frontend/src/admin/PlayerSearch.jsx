import React, { useMemo, useState } from "react";
import { kenoPlayers } from "../game/KenoPlayers";
import PlayerHistory from "./PlayerHistory";

export default function PlayerSearch() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [adjust, setAdjust] = useState("");

  const players = Object.values(kenoPlayers.byId);

  // search by username OR CashApp ID
  const results = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return players.filter(
      (p) =>
        p.username?.toLowerCase().includes(q) ||
        p.cashAppId?.toLowerCase().includes(q)
    );
  }, [query, players]);

  // apply admin credit adjustment + track history
  const applyAdjustment = () => {
    if (!selected) return;

    const delta = Number(adjust);
    if (Number.isNaN(delta) || delta === 0) return;

    // apply credit change safely
    selected.setCredits((c) => Math.max(0, c + delta));

    // 🔐 track admin adjustment in player history
    if (selected.history) {
      selected.history.totalAdminAdjustments += delta;
      selected.history.lastAdminActionAt = Date.now();
    }

    setAdjust("");
  };

  return (
    <div className="admin-section">
      <h3>Player Search</h3>

      <input
        placeholder="Search by username or CashApp ID"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: "100%", marginBottom: 8, padding: 6 }}
      />

      {results.map((p) => (
        <div
          key={p.id}
          onClick={() => setSelected(p)}
          style={{
            padding: 8,
            cursor: "pointer",
            background: selected?.id === p.id ? "#1e2444" : "transparent",
          }}
        >
          <strong>{p.username}</strong> — {p.cashAppId}
        </div>
      ))}

      {selected && (
        <div style={{ marginTop: 12 }}>
          <h4>Player Details</h4>

          <div><strong>ID:</strong> {selected.id}</div>
          <div><strong>Username:</strong> {selected.username}</div>
          <div><strong>CashApp:</strong> {selected.cashAppId}</div>
          <div><strong>Credits:</strong> ${selected.credits.toFixed(2)}</div>

          <div style={{ marginTop: 8 }}>
            <input
              type="number"
              placeholder="+ / - amount"
              value={adjust}
              onChange={(e) => setAdjust(e.target.value)}
              style={{ width: "100%", marginBottom: 6 }}
            />
            <button onClick={applyAdjustment} style={{ width: "100%" }}>
              Apply Credit Adjustment
            </button>
          </div>

          {/* 🔎 Play history (read-only) */}
          <PlayerHistory player={selected} />
        </div>
      )}
    </div>
  );
}
