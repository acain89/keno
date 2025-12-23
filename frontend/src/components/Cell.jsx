import React from "react";

/**
 * Cell
 *
 * Amber rule:
 * - Drawn AND not selected
 * Green rule:
 * - Drawn AND selected
 *
 * Locked state is VISUAL ONLY
 */

export default function Cell({
  number,
  selected,
  hit,
  drawn,
  onToggle,
  paused,
  locked = false,   // 🔒 NEW (visual only)
}) {
  const isHitSelected = drawn && selected;
  const isHitOnly = drawn && !selected;

  const className = [
    "cell",
    selected && "cell-selected",
    isHitSelected && "cell-hit-selected",
    isHitOnly && "cell-hit-only",
    paused && "cell-paused",
    locked && "cell-locked",   // 🔒 visual hardening
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      onClick={() => {
        if (!paused && !locked && onToggle) onToggle(number);
      }}
    >
      <span className="cell-number">{number}</span>
    </div>
  );
}
