import React from "react";
import Grid from "./Grid";
import Chute from "./Chute";

/**
 * PlayArea
 *
 * - Owns layout only
 * - Bonus banner must NOT block footer clicks
 */

export default function PlayArea({
  selected,
  hits,
  balls,
  onToggle,
  paused,
  inBonus,
  bonusBannerText,
}) {
  const lockInput = paused || inBonus;
  const drawnSet = new Set(balls);

  return (
    <div
      className={`play ${inBonus ? "play-bonus" : ""}`}
      style={{ position: "relative" }}   // ✅ CRITICAL FIX
    >
      {/* BONUS BANNER — NOW PROPERLY SCOPED */}
      {bonusBannerText && (
        <div className="bonus-banner-overlay">
          {bonusBannerText}
        </div>
      )}

      <Grid
        selected={selected}
        hits={hits}
        drawn={drawnSet}
        onToggle={lockInput ? undefined : onToggle}
        paused={lockInput}
      />

      <Chute balls={balls} />
    </div>
  );
}
