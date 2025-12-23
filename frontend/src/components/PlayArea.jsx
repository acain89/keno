import React from "react";
import Grid from "./Grid";
import Chute from "./Chute";

export default function PlayArea({
  selected,
  hits,
  balls,
  onToggle,
  paused,
  inBonus,
  bonusBannerText,
  locked, // 🔒 visual only
}) {
  // Do NOT treat locked as a pause visual state
  const lockClicks = paused || inBonus; // ⬅ removed locked from this line

  const visualPaused = paused || inBonus;
  const drawnSet = new Set(balls);

  return (
    <div
      className={`play-area-wrap keno-grid ${locked ? "run-locked" : ""}`} // ⬅ ensures CSS lock only when active
      style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}
    >
      {bonusBannerText && (
        <div className="bonus-banner-overlay">{bonusBannerText}</div>
      )}

      <Grid
        selected={selected}
        hits={hits}
        drawn={drawnSet}
        onToggle={lockClicks ? undefined : onToggle} // toggle restored when locked=false
        paused={visualPaused}
        locked={locked}
      />

      <Chute balls={balls} />
    </div>
  );
}
