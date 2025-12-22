import React, { useEffect, useState } from "react";
import "./payTable.css";

/**
 * PAY TABLE — $1 BET (DISPLAY ONLY)
 * Shows ONLY paying hit counts (no 0× rows)
 */

const PAY_TABLE = {
  1: { 1: 2 },
  2: { 1: 1, 2: 2 },
  3: { 1: 1, 2: 2, 3: 4 },
  4: { 2: 2, 3: 3, 4: 7 },
  5: { 3: 2, 4: 6, 5: 8 },
  6: { 3: 1, 4: 3, 5: 7, 6: 10 },
  7: { 3: 1, 4: 3, 5: 6, 6: 9, 7: 12 },

  // TOP TIERS (UPDATED)
  8: { 4: 2, 5: 3, 6: 4, 7: 8, 8: 50 },
  9: { 4: 1, 5: 3, 6: 5, 7: 8, 8: 50, 9: 100 },
  10:{ 4: 1, 5: 3, 6: 5, 7: 8, 8: 50, 9: 100, 10: 300 },
};

function buildRows(selected) {
  const row = PAY_TABLE[selected] || {};
  return Object.entries(row).map(([hits, mult]) => [
    Number(hits),
    mult,
  ]);
}

export default function PayTable({ selectedCount = 7, spinning = false }) {
  const [manual, setManual] = useState(false);
  const [selected, setSelected] = useState(selectedCount);

  useEffect(() => {
    if (!manual) {
      setSelected(Math.min(10, Math.max(1, selectedCount)));
    }
  }, [selectedCount, manual]);

  const rows = buildRows(selected);

  return (
    <div className="paytable-single">
      {/* HEADER */}
      <div className="paytable-header">
        <label># Selected</label>
        <select
          value={selected}
          disabled={spinning}
          onChange={(e) => {
            setManual(true);
            setSelected(Number(e.target.value));
          }}
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {/* TITLE */}
      <div className="paytable-title">
        {selected} Selected
      </div>

      {/* TABLE */}
      <div className="paytable-grid">
        <div className="head">Hits</div>
        <div className="head">Multiplier</div>

        {rows.map(([hits, mult]) => (
          <React.Fragment key={hits}>
            <div className="cell">{hits}</div>
            <div className="cell mult">{mult}×</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
