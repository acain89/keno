import React from "react";

export default function Cell({
  number,
  isSelected,
  isHit,
  isDrawn,
  showHeart,
  onToggle,
  paused,
}) {
  const className = [
    "cell",
    isSelected && "selected",
    isDrawn && "drawn",   // ✅ yellow highlight
    isHit && "hit",       // ✅ red hit (overrides drawn)
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = () => {
    if (paused) return;
    onToggle(number);
  };

  return (
    <div className={className} onClick={handleClick}>
      <span>{number}</span>
      {showHeart && <div className="heart">❤</div>}
    </div>
  );
}
