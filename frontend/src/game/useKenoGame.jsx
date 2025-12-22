// src/game/useKenoGame.jsx
import { useEffect, useRef, useState } from "react";
import { createBillDirector, DIRECTOR_PATHS } from "./billDirector";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { auth } from "../services/firebase";
import { playSound, setSoundEnabled } from "../core/sound";



/* ============================================================
   CONFIG
============================================================ */

const BETS = [0.25, 0.5, 1.0, 2.0];
const MAX_SELECT = 10;
const DRAW_SIZE = 10;
const PREVIEW_COUNT = 5;
const INITIAL_CREDITS = 40;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/* ============================================================
   PAYTABLE
============================================================ */

const BILL_MULTIPLIERS = {
  1: { 1: 2 },
  2: { 1: 1, 2: 2 },
  3: { 1: 1, 2: 2, 3: 4 },
  4: { 1: 0, 2: 2, 3: 3, 4: 7 },
  5: { 1: 0, 2: 0, 3: 2, 4: 6, 5: 8 },
  6: { 1: 0, 2: 0, 3: 1, 4: 3, 5: 7, 6: 10 },
  7: { 1: 0, 2: 0, 3: 1, 4: 3, 5: 6, 6: 9, 7: 12 },
  8: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 3, 6: 4, 7: 8, 8: 20 },
  9: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 3, 6: 5, 7: 8, 8: 20 },
  10:{ 1: 0, 2: 0, 3: 0, 4: 1, 5: 3, 6: 5, 7: 8, 8: 20 },
};

const BIG_EVENT_MULT_BY_BASE_BET = {
  0.25: 200,
  0.5: 100,
  1.0: 50,
  2.0: 30,
};

const getBaseMultiplier = (sel, hits) =>
  hits === 0 ? 0 : BILL_MULTIPLIERS[sel]?.[hits] ?? 0;

/* ============================================================
   HELPERS
============================================================ */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildImmutableDraw({ selectedSet, desiredHitCount, forcedHits = [] }) {
  const hits = forcedHits.length
    ? forcedHits.slice(0, desiredHitCount)
    : shuffle([...selectedSet]).slice(0, desiredHitCount);

  const hitSet = new Set(hits);
  const misses = [];

  for (let i = 1; i <= 40; i++) {
    if (!hitSet.has(i)) misses.push(i);
  }

  return shuffle([
    ...hits,
    ...shuffle(misses).slice(0, DRAW_SIZE - hits.length),
  ]).slice(0, DRAW_SIZE);
}



/* ============================================================
   HOOK
============================================================ */

export default function useKenoGame() {
  const [livePath, setLivePath] = useState(DIRECTOR_PATHS.LOSER);
  const lockedPathRef = useRef(null);        // 🔒 PATH LOCK
  const sessionStartedRef = useRef(false);   // 🔒 PATH LOCK

  /* ---------- AUTHORITATIVE PATH LISTENER ---------- */
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const ref = doc(db, "users", uid);
    const unsub = onSnapshot(ref, (snap) => {
      const p =
        snap.data()?.path === DIRECTOR_PATHS.WINNER
          ? DIRECTOR_PATHS.WINNER
          : DIRECTOR_PATHS.LOSER;

      // 🔒 If session not started, allow updates
      if (!sessionStartedRef.current) {
        setLivePath(p);
      }
    });

    return unsub;
  }, []);

  /* ---------- BILL DIRECTOR ---------- */
  const directorRef = useRef(null);

  useEffect(() => {
    const effectivePath =
      lockedPathRef.current ?? livePath;

    directorRef.current = createBillDirector({
      path: effectivePath,
      seed: "DEV",
    });
  }, [livePath]);

  const ballsRef = useRef([]);

  const [selected, setSelected] = useState(new Set());
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const [credits, setCredits] = useState(INITIAL_CREDITS);
  const creditsRef = useRef(INITIAL_CREDITS);

  const [betIndex, setBetIndex] = useState(2);
  const bet = BETS[betIndex];

  const [phase, setPhase] = useState("IDLE");

  const drawRef = useRef([]);
  const revealCountRef = useRef(0);
  const stakeRef = useRef(0);
  const planRef = useRef(null);

  const [balls, setBalls] = useState([]);
  const [hits, setHits] = useState(new Set());
  const [lastWin, setLastWin] = useState(0);

  /* ===================== SPIN ===================== */

const spin = async () => {
  setSoundEnabled(true); // 🔊 FIRST LINE — user gesture unlock

  if (phase !== "IDLE") return;
  if (!directorRef.current) return;
  if (credits < bet) return;
  if (!selectedRef.current.size) return;


    // 🔒 LOCK PATH ON FIRST SPIN
    if (!sessionStartedRef.current) {
      lockedPathRef.current = livePath;
      sessionStartedRef.current = true;
    }

    setPhase("SPINNING");
    setLastWin(0);
    setHits(new Set());
    ballsRef.current = [];
    setBalls([]);

    stakeRef.current = bet;
    creditsRef.current -= bet;
    setCredits(creditsRef.current);

    const plan = directorRef.current.next({
      creditsNow: creditsRef.current,
      selectedCount: selectedRef.current.size,
      stake: bet,
      selectedSet: selectedRef.current,
    });

    planRef.current = plan;

    drawRef.current = buildImmutableDraw({
      selectedSet: selectedRef.current,
      desiredHitCount: plan.desiredHitCount,
      forcedHits: plan.forcedHits,
    });

    revealCountRef.current = 0;

    for (let i = 0; i < PREVIEW_COUNT; i++) {
      revealCountRef.current++;
      ballsRef.current = drawRef.current.slice(0, revealCountRef.current);
      setBalls(ballsRef.current);
      setHits(new Set(ballsRef.current.filter(n => selectedRef.current.has(n))));
      playSound("ball", 0.3);
      await delay(220);
    }

    setPhase("HALFTIME");
  };

  /* ===================== RAISE ===================== */

  const raise = async () => {
 setSoundEnabled(true);
  playSound("click", 0.2);
    if (phase !== "HALFTIME") return;
    if (creditsRef.current < bet) return;

    stakeRef.current += bet;
    creditsRef.current -= bet;
    setCredits(creditsRef.current);

    await resume();
  };

  /* ===================== RESOLVE ===================== */

  const resume = async () => {
    if (phase !== "HALFTIME") return;
    setPhase("RESOLVE");

    while (revealCountRef.current < DRAW_SIZE) {
      revealCountRef.current++;
      ballsRef.current = drawRef.current.slice(0, revealCountRef.current);
      setBalls(ballsRef.current);
      setHits(new Set(ballsRef.current.filter(n => selectedRef.current.has(n))));
      playSound("ball", 0.3);
      await delay(220);
    }

    const hitCount = ballsRef.current.filter(n =>
      selectedRef.current.has(n)
    ).length;

    let multiplier = getBaseMultiplier(selectedRef.current.size, hitCount);

    if (planRef.current?.isBigEvent === true && hitCount === 8) {
      multiplier = BIG_EVENT_MULT_BY_BASE_BET[Number(bet)] ?? multiplier;
    }

    const payout = stakeRef.current * multiplier;

    if (payout > 0) {
      creditsRef.current += payout;
      setCredits(creditsRef.current);
      setLastWin(payout);
      playSound("win", 0.5);
    }

    planRef.current = null;
    setPhase("IDLE");
  };

  /* ===================== API ===================== */

  return {
    selected,
    balls,
    hits,
    credits,
    bet: bet.toFixed(2),
    lastWin: lastWin.toFixed(2),
    phase,

    canSpin: phase === "IDLE" && credits >= bet && selected.size > 0,
    canDecision: phase === "HALFTIME",
    canRaise: phase === "HALFTIME" && credits >= bet,
    canBetChange: phase === "IDLE",

    spin,
    resume,
    raise,

    incBet: () =>
      phase === "IDLE" &&
      setBetIndex((i) => Math.min(i + 1, BETS.length - 1)),

    decBet: () =>
      phase === "IDLE" &&
      setBetIndex((i) => Math.max(i - 1, 0)),

    toggleCell: (n) => {
      if (phase !== "IDLE") return;


  setSoundEnabled(true);
  playSound("click", 0.15);

      const next = new Set(selectedRef.current);
      if (next.has(n)) next.delete(n);
      else if (next.size < MAX_SELECT) next.add(n);
      setSelected(next);
    },
  };
}
