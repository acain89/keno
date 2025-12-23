import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  // ENGINE (UNCHANGED)
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

  /* ================= MENU ================= */
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState("profile");

  /* ================= USER PROFILE ================= */
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  /* ================= RUN LOCK ================= */
  const [runLocked, setRunLocked] = useState(false);

  // Panels:
  // 1) Intro OK (shown once per page load)
  // 2) Confirm (Lock In / Repick) shown after "ready" (10 tiles + bet) with delay
  // 3) Run Started summary OK
  // 4) Game Over summary OK
  const [introOpen, setIntroOpen] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [runStartedOpen, setRunStartedOpen] = useState(false);
  const [runEndOpen, setRunEndOpen] = useState(false);

  /* ================= RUN STATS ================= */
  const spinCountRef = useRef(0);
  const peakCreditsRef = useRef(Number(credits) || 0);
  const biggestHitMultRef = useRef(0);

  /* ================= WIPE BOARD AFTER GAME OVER (DISPLAY ONLY) ================= */
  const [wipeBoard, setWipeBoard] = useState(false);

  /* ================= WIDTH SYNC: PANELS MATCH SHELL ================= */
  const shellRef = useRef(null);
  const [panelW, setPanelW] = useState(null);

  useLayoutEffect(() => {
    if (!shellRef.current) return;
    const el = shellRef.current;

    const update = () => {
      // match exact console width and shrink by 15px total
      const w = Math.floor(el.offsetWidth || el.getBoundingClientRect().width || 0);
      if (w > 0) setPanelW(w - 15); // ⬅ shrink total width by 15px
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const panelStyle = panelW
    ? { width: `${panelW}px`, maxWidth: "none" }
    : { width: "92vw", maxWidth: 420 };

  /* ================= PROFILE SNAPSHOT ================= */
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

  /* ================= READY GATE (NO DOUBLE POPUP) ================= */
  const isReady =
    selected.size === 10 &&
    Number(bet) > 0 &&
    !runLocked &&
    !introOpen &&
    !runEndOpen;

  // This prevents confirm from reopening instantly.
  // It re-arms only after user becomes NOT-ready again.
  const readyArmedRef = useRef(true);
  const readyDelayTimerRef = useRef(null);

  useEffect(() => {
    if (runLocked || introOpen || runEndOpen) return;

    // If NOT ready: re-arm and clear any pending timer
    if (!isReady) {
      readyArmedRef.current = true;
      if (readyDelayTimerRef.current) {
        clearTimeout(readyDelayTimerRef.current);
        readyDelayTimerRef.current = null;
      }
      return;
    }

    // If ready + armed: schedule confirm once
    if (isReady && readyArmedRef.current && !confirmOpen) {
      readyArmedRef.current = false;

      if (readyDelayTimerRef.current) {
        clearTimeout(readyDelayTimerRef.current);
        readyDelayTimerRef.current = null;
      }

      readyDelayTimerRef.current = setTimeout(() => {
        setConfirmOpen(true);
        readyDelayTimerRef.current = null;
      }, 350);
    }
  }, [isReady, runLocked, introOpen, runEndOpen, confirmOpen]);

  useEffect(() => {
    return () => {
      if (readyDelayTimerRef.current) clearTimeout(readyDelayTimerRef.current);
    };
  }, []);

  /* ================= SPIN COUNT + BIGGEST HIT (ACCURATE) ================= */
  const prevPhaseRef = useRef(phase);
  const lastWinRef = useRef(Number(lastWin) || 0);

  useEffect(() => {
    lastWinRef.current = Number(lastWin) || 0;
  }, [lastWin]);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    const cur = phase;

    // Count spins ONLY when spin completes (RESOLVE -> IDLE)
    if (runLocked && prev === "RESOLVE" && cur === "IDLE") {
      spinCountRef.current += 1;

      const base = Number(bet) || 0;
      const winNow = Number(lastWinRef.current) || 0;

      // Biggest hit as multiplier (based on base bet; base bet is locked during run)
      const mult = base > 0 ? winNow / base : 0;
      if (mult > biggestHitMultRef.current) biggestHitMultRef.current = mult;
    }

    prevPhaseRef.current = cur;
  }, [phase, runLocked, bet]);

  /* ================= PEAK BALANCE ================= */
  useEffect(() => {
    if (!runLocked) return;
    const c = Number(credits) || 0;
    if (c > peakCreditsRef.current) peakCreditsRef.current = c;
  }, [credits, runLocked]);

  /* ================= GAME OVER (ONLY TRUE END) ================= */
  useEffect(() => {
    // only end once engine returns to IDLE (prevents halftime/transition)
    if (runLocked && Number(credits) <= 0 && phase === "IDLE") {
      setRunLocked(false);
      setRunEndOpen(true);
      setWipeBoard(true);

      // close other panels
      setConfirmOpen(false);
      setRunStartedOpen(false);
    }
  }, [credits, phase, runLocked]);

  /* ================= CONFIRM ACTIONS ================= */
  const confirmLockIn = () => {
    if (selected.size !== 10 || !(Number(bet) > 0)) return;

    // reset stats at lock moment
    spinCountRef.current = 0;
    peakCreditsRef.current = Number(credits) || 0;
    biggestHitMultRef.current = 0;

    setWipeBoard(false);
    setRunLocked(true);
    setConfirmOpen(false);
    setRunStartedOpen(true);
  };

  const repick = () => {
    // Close confirm. Do NOT show intro again.
    setConfirmOpen(false);

    // Prevent immediate reopen until user becomes NOT-ready again
    // (i.e., they remove/add a tile or adjust bet)
    readyArmedRef.current = false;
  };

  /* ================= RAISE FLOAT ================= */
  const [showRaiseFloat, setShowRaiseFloat] = useState(false);

  const onRaise = async () => {
    if (!runLocked) return;

    setShowRaiseFloat(true);
    window.setTimeout(() => setShowRaiseFloat(false), 900);

    await raise();
  };

  /* ================= DISPLAY (wipe after run) ================= */
  const displaySelected = wipeBoard ? new Set() : selected;
  const displayHits = wipeBoard ? new Set() : hits;
  const displayBalls = wipeBoard ? [] : balls;
  const displayLastWin = wipeBoard ? "0.00" : lastWin;

  // Button style safety: prevents invisible buttons if CSS accidentally sets black-on-black.
  const safeBtnStyle = { color: "#000", background: "#000" }; // matches your neon panel theme

  /* ================= UI ================= */
  return (
    <div className="shell" ref={shellRef}>
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

      {/* PLAY AREA WRAP (so overlays can be centered over the grid area) */}
      <div className="play-area-wrap">
        {/* INTRO (ONCE PER LOAD) */}
        {introOpen && (
          <div className="run-overlay run-overlay-play">
            <div className="run-panel" style={panelStyle}>
              <div className="run-title">Lock in your run</div>
              <div className="run-sub">Pick 10 tiles and a bet size</div>
              <div className="run-btn-row">
                <button
                  className="run-btn"
                  style={safeBtnStyle}
                  onClick={() => setIntroOpen(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRM (Lock In / Repick) */}
        {!introOpen && !runLocked && confirmOpen && !runEndOpen && (
          <div className="run-overlay run-overlay-play">
            <div className="run-panel" style={panelStyle}>
              <div className="run-title">Lock in your run</div>
              <div className="run-sub">Pick 10 tiles and a bet size</div>

              <div className="run-btn-row">
                <button
                  className="run-btn"
                  style={safeBtnStyle}
                  onClick={confirmLockIn}
                >
                  Lock In
                </button>
                <button
                  className="run-btn"
                  style={safeBtnStyle}
                  onClick={repick}
                >
                  Repick
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RUN STARTED SUMMARY */}
        {runStartedOpen && (
          <div className="run-overlay run-overlay-play">
            <div className="run-panel" style={panelStyle}>
              <div className="run-title">Run Started</div>
              <div className="run-btn-row">
                <button
                  className="run-btn"
                  style={safeBtnStyle}
                  onClick={() => setRunStartedOpen(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}


        {/* PLAY AREA */}
        <PlayArea
          selected={displaySelected}
          hits={displayHits}
          balls={displayBalls}
          paused={false} // ✅ prevents grid darkening during spin
          onToggle={phase === "IDLE" && !runLocked ? toggleCell : undefined}
          locked={runLocked}
        />
      </div>

      {/* FOOTER */}
      <Footer
        bet={bet}
        lastWin={displayLastWin}
        inBonus={false}
        bonusSpinsLeft={0}
        bonusWinnings={0}
        canSpin={canSpin}
        canDecision={canDecision}
        canRaise={canRaise}
        canBetChange={canBetChange}
        onSpin={runLocked ? spin : undefined}
        onResume={resume}
        onRaise={runLocked ? onRaise : undefined}
        onIncBet={!runLocked ? incBet : undefined}
        onDecBet={!runLocked ? decBet : undefined}
        locked={runLocked}
      />

      {/* GAME OVER SUMMARY */}
      {runEndOpen && (
        <div className="run-overlay run-overlay-play">
          <div className="run-panel" style={panelStyle}>
            <div className="run-title">Game Over</div>
            <div className="run-sub">Spins Played: {spinCountRef.current}</div>
            <div className="run-sub">
              Highest Balance: ${Number(peakCreditsRef.current).toFixed(2)}
            </div>
            <div className="run-sub">
              Biggest Hit: {Number(biggestHitMultRef.current).toFixed(2)}×
            </div>
            <div className="run-unlock">🔓</div>

            <div className="run-btn-row">
              <button
                className="run-btn"
                style={safeBtnStyle}
                onClick={() => {
                  setRunEndOpen(false);
                  setWipeBoard(false);

                  // allow confirm to open again when they become ready
                  readyArmedRef.current = true;
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
