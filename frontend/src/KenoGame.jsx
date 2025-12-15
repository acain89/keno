import React, { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import PlayArea from "./components/PlayArea";
import Footer from "./components/Footer";
import MenuOverlay from "./components/MenuOverlay";
import useKenoGame from "./game/useKenoGame";
import "./keno.css";

export default function KenoGame() {
  const {
    // auth
    authReady,
    isLoggedIn,
    loginRequired,
    loginPromptTick,

    // state
    selected,
    hits,
    balls,
    paused,
    lastWin,
    bet,
    credits,
    raiseActive,

    // actions
    toggleCell,
    incBet,
    decBet,
    spin,
    resume,
    onRaise,
  } = useKenoGame();

  // Menu overlay (acts as login panel too)
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState("login");

  // If any blocked action happens (tile/spin/raise/bet), open Login panel
  useEffect(() => {
    if (!authReady) return;
    if (loginPromptTick <= 0) return;
    setMenuTab("login");
    setMenuOpen(true);
  }, [authReady, loginPromptTick]);

  const handleMenu = () => {
    // Always allow MENU to open.
    // If logged out, force login tab.
    if (!isLoggedIn) {
      setMenuTab("login");
      setMenuOpen(true);
      return;
    }
    setMenuOpen(true);
  };

  return (
    <div className="shell">
      <Header
        isLoggedIn={isLoggedIn}
        username={isLoggedIn ? "Player" : undefined}
        credits={credits}
        onMenu={handleMenu}
      />

      <PlayArea
        selected={selected}
        hits={hits}
        balls={balls}
        onToggle={toggleCell}
        paused={paused}
        disabled={false}
      />

      <Footer
        bet={bet}
        lastWin={lastWin}
        paused={paused}
        raiseActive={raiseActive}
        onSpin={spin}
        onResume={resume}
        onRaise={onRaise}
        onIncBet={incBet}
        onDecBet={decBet}
      />

      <MenuOverlay
        open={menuOpen}
        tab={menuTab}
        setTab={setMenuTab}
        onClose={() => setMenuOpen(false)}
        isLoggedIn={isLoggedIn}
        credits={credits}
        onLoginSuccess={() => {
          // After successful login, close panel
          setMenuOpen(false);
        }}
        onLogout={() => {
          // If you wire logout later, keep them on login tab
          setMenuTab("login");
        }}
      />

      {/* Optional: first-load state if auth is still resolving */}
      {!authReady && (
        <div className="login-required-overlay">
          <div className="login-card">
            <div style={{ fontSize: 20, fontWeight: 700, textAlign: "center" }}>
              Loading…
            </div>
          </div>
        </div>
      )}

      {/* Optional: passive hint (doesn't block clicks; clicks will open login panel) */}
      {authReady && loginRequired && (
        <div className="login-required-hint">
          Login Required
        </div>
      )}
    </div>
  );
}
