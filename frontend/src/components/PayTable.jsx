import React, { useEffect, useState } from "react";
import "./payTable.css";

const PAY_TABLE = {
  1: [[1, 2]],
  2: [[1, 1], [2, 3]],
  3: [[2, 1], [3, 3]],
  4: [[2, 1], [3, 3], [4, 7]],
  5: [[2, 1], [3, 3], [4, 7], [5, 16]],
  6: [[3, 1], [4, 3], [5, 7], [6, 16]],
  7: [[3, 3], [4, 6], [5, 14], [6, 28], [7, 40]],
  8: [[3, 2], [4, 5], [5, 11], [6, 22], [7, 35], [8, 60]],
  9: [[4, 4], [5, 8], [6, 16], [7, 30], [8, 55], [9, 90]],
  10: [[4, 3], [5, 6], [6, 14], [7, 28], [8, 55], [9, 110], [10, 220]],
};

export default function PayTable({
  selectedCount = 7,
  spinning = false,
}) {
  const [manual, setManual] = useState(false);
  const [selected, setSelected] = useState(selectedCount);

  useEffect(() => {
    if (!manual) {
      setSelected(Math.min(10, Math.max(1, selectedCount)));
    }
  }, [selectedCount, manual]);

  const rows = PAY_TABLE[selected];

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
            <option key={n} value={n}>
              {n}
            </option>
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
