import React from "react";
import Grid from "./Grid";
import Chute from "./Chute";

export default function PlayArea({
  selected,
  hits,
  drawn,
  balls,
  onToggle,
  paused,
  inBonus,
  disabled,
}) {
  return (
    <div className={`play ${inBonus ? "play-bonus" : ""} ${disabled ? "play-disabled" : ""}`}>
      <Grid
        selected={selected}
        hits={hits}
        drawn={drawn}
        onToggle={onToggle}
        paused={paused}
      />
      <Chute balls={balls} />
    </div>
  );
}
