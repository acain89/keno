import React from "react";
import Header from "./components/Header";
import PlayArea from "./components/PlayArea";
import Footer from "./components/Footer";
import useKenoGame from "./game/useKenoGame";
import "./keno.css";

export default function KenoGame() {
  const {
    selected,
    hits,
    balls,
    paused,
    lastWin,
    bet,
    toggleCell,
    incBet,
    decBet,
    spin,
    resume,
  } = useKenoGame();

  return (
    <div className="keno-root">
      <div className="shell">
        <Header />

        <PlayArea
          selected={selected}
          hits={hits}
          balls={balls}
          onToggle={toggleCell}
          paused={paused}
        />

        <Footer
          bet={bet}
          lastWin={lastWin}
          paused={paused}
          onSpin={spin}
          onResume={resume}
          onIncBet={incBet}
          onDecBet={decBet}
        />
      </div>
    </div>
  );
}
