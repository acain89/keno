import React, { useEffect, useState } from "react";
import Header from "./Header";
import PlayArea from "./PlayArea";
import Footer from "./Footer";
import MenuOverlay from "./MenuOverlay";
import useKenoGame from "../game/useKenoGame";
import AdminOverlay from "../admin/AdminOverlay";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";
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
  const [menuTab, setMenuTab] = useState("profile");

  /* ================= USER PROFILE ================= */
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const paused = phase !== "IDLE";

  /* ================= LOAD USER PROFILE ================= */
  useEffect(() => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const ref = doc(db, "users", uid);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      setUsername(data.username || "");
      setEmail(data.email || "");
    });

    return unsub;
  }, []);

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
        username={username}
        email={email}
      />

      {/* HEADER */}
      <Header
        isLoggedIn={true}
        username={username}
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
