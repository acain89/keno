import React, { useState } from "react";
import Header from "./Header";
import PlayArea from "./PlayArea";
import Footer from "./Footer";
import MenuOverlay from "./MenuOverlay";
import useKenoGame from "../game/useKenoGame";
import AdminOverlay from "../admin/AdminOverlay";
import "../keno.css";

export default function KenoGame({ showAdmin, onCloseAdmin }) {
  // ENGINE
  const game = useKenoGame();

  const {
    selected,
    hits,
    balls,
    lastWin,
    bet,
    credits,
    phase,

    canSpin,
    canDecision,
    canRaise,
    canBetChange,

    toggleCell,
    spin,
    resume,
    raise,
    incBet,
    decBet,
  } = game;

  /* ================= MENU STATE ================= */
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState("login");

  const paused = phase !== "IDLE";

  return (
    <div className="shell">
      {/* ADMIN */}
      {showAdmin && (
        <AdminOverlay
          onClose={onCloseAdmin}
          hotkey="Ctrl + Alt + K"
          onResetSession={() => window.location.reload()}
        />
      )}

      {/* MENU */}
      <MenuOverlay
        open={menuOpen}
        tab={menuTab}
        setTab={setMenuTab}
        onClose={() => setMenuOpen(false)}
        isLoggedIn={true}
        credits={credits}
      />

      {/* HEADER */}
      <Header
        isLoggedIn
        username="keno-07"
        credits={credits}
        onMenu={() => setMenuOpen(true)}
      />

      {/* PLAY AREA */}
      <PlayArea
        selected={selected}
        hits={hits}
        balls={balls}
        paused={paused}
        onToggle={paused ? undefined : toggleCell}
      />

      {/* FOOTER */}
      <Footer
        bet={bet}
        lastWin={lastWin}
        inBonus={false}
        bonusSpinsLeft={0}
        bonusWinnings={0}
        canSpin={canSpin}
        canDecision={canDecision}
        canRaise={canRaise}
        canBetChange={canBetChange}
        onSpin={spin}
        onResume={resume}
        onRaise={raise}
        onIncBet={incBet}
        onDecBet={decBet}
      />
    </div>
  );
}
