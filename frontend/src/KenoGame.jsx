import React, { useState } from "react";
import Header from "./components/Header";
import PlayArea from "./components/PlayArea";
import Footer from "./components/Footer";
import MenuOverlay from "./components/MenuOverlay";
import useKenoGame from "./game/useKenoGame";
import "./keno.css";

export default function KenoGame() {
  const {
    authReady,
    isLoggedIn,
    loginRequired,

    selected,
    hits,
    balls,
    paused,
    lastWin,
    bet,
    credits,

    toggleCell,
    incBet,
    decBet,
    spin,
    resume,
  } = useKenoGame();

  const [menuOpen, setMenuOpen] = useState(false);

  // ⏳ Wait for Firebase auth to resolve
  if (!authReady) {
    return (
      <div className="shell">
        <Header isLoggedIn={false} />
        <div className="login-required-overlay">
          <h2>Loading…</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="shell">
        <Header
          isLoggedIn={isLoggedIn}
          username={isLoggedIn ? "Player" : null}
          credits={credits}
          onMenu={() => setMenuOpen(true)}
        />

        <div className={loginRequired ? "blocked" : ""}>
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
        </div>

        {menuOpen && isLoggedIn && (
          <MenuOverlay onClose={() => setMenuOpen(false)} />
        )}

        {loginRequired && (
          <div className="login-required-overlay">
            <div className="login-card">
              <h2>Login Required</h2>
              <p>Please sign in to play.</p>
              <button
                className="btn primary"
                onClick={() => (window.location.href = "/login")}
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
