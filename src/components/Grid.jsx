import React from "react";
import Cell from "./Cell";

export default function Grid({
  selected,
  hits,
  onToggle,
}) {
  return (
    <div className="grid-wrap">
      <div className="grid">
        {Array.from({ length: 40 }, (_, i) => {
          const n = i + 1;
          return (
            <Cell
              key={n}
              number={n}
              isSelected={selected.has(n)}
              isHit={hits.has(n)}
              showHeart={selected.has(n) && [...selected].indexOf(n) < 4}
              onToggle={onToggle}
            />
          );
        })}
      </div>
    </div>
  );
}
