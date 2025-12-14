import React from "react";

export default function Cell({
  number,
  isSelected,
  isHit,
  showHeart,
  onToggle,
}) {
  const className = [
    "cell",
    isSelected && "selected",
    isHit && "hit",
    isSelected && isHit && "hit selected",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} onClick={() => onToggle(number)}>
      <span>{number}</span>
      {showHeart && <div className="heart">❤</div>}
    </div>
  );
}
