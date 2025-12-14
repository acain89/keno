import React from "react";
import Cell from "./Cell";

export default function Grid({
  selected = new Set(),
  hits = new Set(),
  drawn = new Set(),
  onToggle,
  paused,
}) {
  const selectedArr = [...selected];

  return (
    <div className="grid-wrap">
      <div className="grid">
        {Array.from({ length: 40 }, (_, i) => {
          const n = i + 1;

          const isSelected = selected.has(n);
          const isHit = hits.has(n);      // selected ∩ drawn
          const isDrawn = drawn.has(n);   // all drawn numbers

          return (
            <Cell
              key={n}
              number={n}
              isSelected={isSelected}
              isHit={isHit}
              isDrawn={isDrawn}
              showHeart={isSelected && selectedArr.indexOf(n) < 4}
              onToggle={onToggle}
              paused={paused}
            />
          );
        })}
      </div>
    </div>
  );
}
