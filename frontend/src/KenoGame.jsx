import React, { useState } from "react";
import Header from "./components/Header";
import PlayArea from "./components/PlayArea";
import Footer from "./components/Footer";
import MenuOverlay from "./components/MenuOverlay";
import useKenoGame from "./game/useKenoGame";

// 🔐 Admin imports
import useAdminHotkey from "./admin/useAdminHotkey";
import AdminAuthModal from "./admin/AdminAuthModal";
import AdminOverlay from "./admin/AdminOverlay";

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

  const [menuOpen, setMenuOpen] = useState(false);

  // 🔐 Admin state (memory-only)
  const [adminAuthOpen, setAdminAuthOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  // 🔐 Ctrl + Shift + K hotkey
  useAdminHotkey(() => {
    if (!adminUnlocked) {
      setAdminAuthOpen(true);
    }
  });

  return (
    <>
      <div className="shell">
        <Header onMenu={() => setMenuOpen(true)} />

        <PlayArea
          selected={selected}
          hits={hits}
          balls={balls}
          onToggle={toggleCell}
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

        {menuOpen && <MenuOverlay onClose={() => setMenuOpen(false)} />}
      </div>

      {/* 🔐 Admin auth modal */}
      {adminAuthOpen && (
        <AdminAuthModal
          onSuccess={() => {
            setAdminAuthOpen(false);
            setAdminUnlocked(true);
          }}
          onClose={() => setAdminAuthOpen(false)}
        />
      )}

      {/* 🔐 Admin panel */}
      {adminUnlocked && (
        <AdminOverlay onClose={() => setAdminUnlocked(false)} />
      )}
    </>
  );
}
