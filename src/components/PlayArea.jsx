import React from "react";
import Grid from "./Grid";
import Chute from "./Chute";

export default function PlayArea({ selected, hits, balls, onToggle }) {
  return (
    <div className="play">
      <Grid selected={selected} hits={hits} onToggle={onToggle} />
      <Chute balls={balls} />
    </div>
  );
}
