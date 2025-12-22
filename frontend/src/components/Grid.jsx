import React from "react";
import Cell from "./Cell";

/**
 * Grid
 *
 * Responsibilities:
 * - Layout only
 * - Pass factual state to Cell
 * - NO visual decisions
 */

export default function Grid({
  selected = new Set(),
  hits = new Set(),
  drawn = new Set(),
  onToggle,
  paused = false,
}) {
  return (
    <div className={`grid-wrap ${paused ? "grid-paused" : ""}`}>
      <div className="grid">
        {Array.from({ length: 40 }, (_, i) => {
          const n = i + 1;

          return (
            <Cell
              key={n}
              number={n}
              selected={selected.has(n)}
              hit={hits.has(n)}
              drawn={drawn.has(n)}
              onToggle={paused ? undefined : onToggle}
              paused={paused}
            />
          );
        })}
      </div>
    </div>
  );
}
