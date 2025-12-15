import { useCallback, useEffect, useRef, useState } from "react";
import { kenoBuckets } from "./kenoBuckets";
import { kenoSystem } from "./kenoSystem";
import { kenoPlayers, createPlayerHistory } from "./kenoPlayers";
import { ensureLifetimeTier } from "./kenoLifetime";
import { playSound } from "../core/sound";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";


// Firebase Auth (must exist in this repo at ../services/firebase)
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";

/**
 * BOP Keno w/ 95% RTP target (CURRENT):
 * - 94% of wager -> Bucket B
 * - 1% of wager  -> Drift bank D (positive drift, not direct payouts)
 * - 5% of wager  -> Host (tracked in lifetime; not stored in buckets)
 *
 * Bootstrap:
 * - Seed bucket with 25% of C (tracked separately as `bootstrap`)
 * - Included in B at start, never refilled, burns down first on payouts
 * - Gradually replaced by real wagers over time
 *
 * Payouts always come from B and obey:
 * - eligibility: B >= T
 * - floor: B must never drop below F
 * - allowance W is random slice of (B - F)
 * - pick largest payable win <= W using multiplier table
 *
 * Drift D biases p(trigger) and (optionally) slice upward, then burns down when it helped.
 */

// ---------- Bets / tiers ----------
const BETS = [0.25, 0.5, 1.0, 2.0];

// Tier caps per spec (C), with F=15% C, T=30% C, seeded at T
const TIER_BY_BET = {
  0.25: { C: 75 },
  0.5: { C: 150 },
  1.0: { C: 300 },
  2.0: { C: 600 },
};

// ---------- Multiplier table (k -> [hit, mult]) ----------
const MULT = {
  1: [[1, 1]],
  2: [
    [1, 1],
    [2, 4],
  ],
  3: [
    [2, 2],
    [3, 8],
  ],
  4: [
    [2, 1],
    [3, 4],
    [4, 15],
  ],
  5: [
    [2, 1],
    [3, 3],
    [4, 8],
    [5, 25],
  ],
  6: [
    [3, 1],
    [4, 3],
    [5, 10],
    [6, 35],
  ],
  7: [
    [3, 1],
    [4, 2],
    [5, 6],
    [6, 18],
    [7, 60],
  ],
  8: [
    [3, 1],
    [4, 2],
    [5, 5],
    [6, 15],
    [7, 40],
    [8, 100],
  ],
  9: [
    [4, 1],
    [5, 2],
    [6, 6],
    [7, 20],
    [8, 60],
    [9, 140],
  ],
  10: [
    [4, 1],
    [5, 2],
    [6, 5],
    [7, 16],
    [8, 45],
    [9, 120],
    [10, 200],
  ],
};

// ---------- BOP params ----------
const P_MIN = 0.03;
const P_MAX = 0.22;

// Drift params
const ALPHA = 0.08;
const P_DRIFT_CAP = 0.30;
const BETA = 0.35;
const DRIFT_BURN = 0.60;

// Split (must be consistent everywhere)
const BUCKET_PCT = 0.94;
const DRIFT_PCT = 0.01;
const HOST_PCT = 0.05;

// ✅ Bootstrap percent of C (one-time seed, burns down, never refilled)
const BOOTSTRAP_PCT = 0.25;

// Slice table
const SLICE_PCTS = [0.05, 0.10, 0.15, 0.20, 0.25, 0.45];
const SLICE_WTS = [28, 22, 18, 14, 10, 8];

// ---------- Helpers ----------
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickWeighted(values, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < values.length; i++) {
    r -= weights[i];
    if (r <= 0) return values[i];
  }
  return values[values.length - 1];
}

function sampleFromArray(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
}

function buildDrawWithExactHits(selectedArr, hitCount) {
  const selectedSet = new Set(selectedArr);

  // pick hitCount numbers from selected
  const hits = sampleFromArray(
    selectedArr,
    Math.min(hitCount, selectedArr.length)
  );

  // pick remaining from non-selected numbers
  const need = 10 - hits.length;
  const pool = [];
  for (let n = 1; n <= 40; n++) if (!selectedSet.has(n)) pool.push(n);
  const misses = sampleFromArray(pool, need);

  // shuffle combined
  const draw = [...hits, ...misses];
  for (let i = draw.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [draw[i], draw[j]] = [draw[j], draw[i]];
  }
  return draw;
}

function getTierConfigForBet(bet) {
  const base = TIER_BY_BET[Number(bet)];
  const C = base.C;
  const F = 0.15 * C;
  const T = 0.30 * C;
  return { C, F, T };
}

function firstPayHitForK(k) {
  const rows = MULT[k] || [];
  if (!rows.length) return Infinity;
  return Math.min(...rows.map(([h]) => h));
}

function pickLargestPayableWin({ k, wager, allowanceW, bucketB, floorF }) {
  const rows = (MULT[k] || []).slice();

  // sort by payout desc
  rows.sort((a, b) => b[1] * wager - a[1] * wager);

  for (const [hit, mult] of rows) {
    const payout = wager * mult;
    if (payout <= allowanceW && bucketB - payout >= floorF) {
      return { hit, mult, payout };
    }
  }
  return null;
}

export default function useKenoGame() {
  // ===== AUTH (REQUIRED) =====
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Used by UI to open a modal when a locked action is attempted
  const [loginPromptTick, setLoginPromptTick] = useState(0);
  const requestLogin = useCallback(() => {
    // Don't spam prompts while auth is still resolving
    if (!authReady) return;
    setLoginPromptTick((t) => t + 1);
  }, [authReady]);

  useEffect(() => {
    // Fail closed: auth is required, but don't hang forever
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        setUser(null);
        setAuthReady(true);
      }
    }, 1500);

    try {
      if (!auth || typeof onAuthStateChanged !== "function") {
        clearTimeout(timeout);
        setUser(null);
        setAuthReady(true);
        return;
      }

      const unsub = onAuthStateChanged(auth, (u) => {
        resolved = true;
        clearTimeout(timeout);
        setUser(u || null);
        setAuthReady(true);
      });

      return () => {
        clearTimeout(timeout);
        if (typeof unsub === "function") unsub();
      };
    } catch {
      clearTimeout(timeout);
      setUser(null);
      setAuthReady(true);
    }
  }, []);

  const isLoggedIn = !!user;

  // ===== STATE =====
  const [credits, setCredits] = useState(100);
  const [raiseActive, setRaiseActive] = useState(false);

  const [selected, setSelected] = useState(new Set());
  const [hits, setHits] = useState(new Set()); // drawn AND selected
  const [balls, setBalls] = useState([]); // drawn balls in order
  const [paused, setPaused] = useState(false);
  const [lastWin, setLastWin] = useState("0.00");

  // bet controls (base tier bet)
  const [betIndex, setBetIndex] = useState(2); // default $1.00
  const bet = BETS[betIndex].toFixed(2);

  // Derive player identity ONLY from auth
  const PLAYER_ID = user?.uid || null;

  // ✅ Display username ONLY (strip internal @keno.game)
  const USERNAME = user?.email
    ? String(user.email).toLowerCase().replace("@keno.game", "")
    : "Player";

  // IMPORTANT: CashApp is NOT loaded here; it's profile/admin only (Firestore later)
  const CASHAPP_ID = "";

  // ===== BUCKETS (stable init) =====
  const bucketsRef = useRef(null);
  if (!bucketsRef.current) {
    const init = {};
    for (const b of BETS) {
      const { C, T } = getTierConfigForBet(b);

      // ✅ bootstrap seed (one-time)
      const bootstrap = C * BOOTSTRAP_PCT;

      // ✅ start B with (T + bootstrap), and track bootstrap separately
      init[String(b)] = { B: T + bootstrap, D: 0, C, bootstrap };
    }
    bucketsRef.current = init;

    // Expose live reference for admin panels
    kenoBuckets.byTier = bucketsRef.current;
  }

  // keep draw stable across pause
  const drawRef = useRef([]);
  const selectedRef = useRef(new Set());
  const plannedWinRef = useRef({ payout: 0, hitTarget: 0 });

  // ===== PLAYER REGISTRY (AUTH ONLY; NO DEV STUBS) =====
  useEffect(() => {
    if (!authReady || !isLoggedIn || !PLAYER_ID) return;

    if (!kenoPlayers.byId[PLAYER_ID]) {
      kenoPlayers.byId[PLAYER_ID] = {
        id: PLAYER_ID,
        username: USERNAME,
        cashAppId: CASHAPP_ID,

        // current view values (kept live each render)
        credits,
        setCredits,

        history: createPlayerHistory(),
        historyLog: [],
      };
    }

    // keep these live each render (no stale closures)
    kenoPlayers.byId[PLAYER_ID].setCredits = setCredits;
    kenoPlayers.byId[PLAYER_ID].credits = credits;
    kenoPlayers.byId[PLAYER_ID].username = USERNAME;
  }, [authReady, isLoggedIn, PLAYER_ID, USERNAME, credits]);

useEffect(() => {
  if (!authReady || !isLoggedIn || !PLAYER_ID) return;

  let alive = true;

  (async () => {
    try {
      const ref = doc(db, "users", PLAYER_ID);
      const snap = await getDoc(ref);

      if (!alive) return;

      if (snap.exists()) {
        const data = snap.data();
        if (typeof data.credits === "number") {
          setCredits(data.credits);
        }
      } else {
        // First login safety net
        await setDoc(ref, {
          username: USERNAME,
          credits: 100,
          createdAt: new Date(),
        });
      }
    } catch (err) {
      console.error("Failed to load credits", err);
    }
  })();

  return () => {
    alive = false;
  };
}, [authReady, isLoggedIn, PLAYER_ID, USERNAME]);

useEffect(() => {
  if (!authReady || !isLoggedIn || !PLAYER_ID) return;

  const ref = doc(db, "users", PLAYER_ID);
  updateDoc(ref, { credits }).catch(() => {});
}, [credits, authReady, isLoggedIn, PLAYER_ID]);

  // ===== GRID =====
  const toggleCell = useCallback(
    (n) => {
      if (!isLoggedIn) {
        requestLogin();
        return;
      }
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(n)) next.delete(n);
        else if (next.size < 10) next.add(n);
        return next;
      });
    },
    [isLoggedIn, requestLogin]
  );

  // ===== BET =====
  const incBet = useCallback(() => {
    if (kenoPlayers.byId[PLAYER_ID]?.frozen) return;
    if (!isLoggedIn) {
      requestLogin();
      return;
    }
    setBetIndex((i) => Math.min(BETS.length - 1, i + 1));
  }, [isLoggedIn, requestLogin]);

  const decBet = useCallback(() => {
    if (!isLoggedIn) {
      requestLogin();
      return;
    }
    setBetIndex((i) => Math.max(0, i - 1));
  }, [isLoggedIn, requestLogin]);

  // ===== RAISE =====
  const onRaise = useCallback(() => {
     if (kenoPlayers.byId[PLAYER_ID]?.frozen) return;
     if (!isLoggedIn) {
      requestLogin();
      return;
    }

    // system-level kill switches
    if (kenoSystem?.flags?.readOnlyMode) return;
    if (kenoSystem?.flags?.disableRaise) return;

    // game-state guards
    if (raiseActive || paused) return;

    const baseBet = Number(bet);
    if (credits < baseBet) return;

    // deduct extra portion immediately
    setCredits((c) => c - baseBet);

    // fund bucket + drift ONLY if buckets are not frozen
    // ✅ bootstrap is NEVER refilled here
    if (!kenoSystem?.flags?.freezeBuckets) {
      const tier = bucketsRef.current[String(baseBet)];
      tier.B += baseBet * BUCKET_PCT;
      tier.D += baseBet * DRIFT_PCT;
    }

    // player accounting
    const p = PLAYER_ID ? kenoPlayers.byId[PLAYER_ID] : null;
    if (p?.history) {
      p.history.totalCreditsPlayed += baseBet; // raise is an extra wager
      p.history.raisesUsed += 1;
      p.history.lastPlayedAt = Date.now();
    }

    setRaiseActive(true);
  }, [isLoggedIn, requestLogin, bet, credits, paused, raiseActive, PLAYER_ID]);

  // ===== BALLS =====
  const addBall = (n) => {
    playSound("ball", 0.25);

    setBalls((b) => [...b, n]);

    if (selectedRef.current.has(n)) {
      setHits((h) => new Set(h).add(n));
    }
  };

  // ===== CORE: plan outcome using BOP + drift =====
  const planOutcome = () => {
    const baseBet = Number(bet);
    const wager = raiseActive ? baseBet * 2 : baseBet;

    const tierKey = String(baseBet);
    const tier = bucketsRef.current[tierKey];
    const { C, F, T } = getTierConfigForBet(baseBet);

    // lifetime tracker (must exist per tier)
    const life = ensureLifetimeTier(tierKey);

    // lifetime: base spin only (raise accounted separately elsewhere)
    life.spins += 1;
    life.wagered += baseBet;
    life.driftIn += baseBet * DRIFT_PCT;
    life.host += baseBet * HOST_PCT;

    // funding split for the base wager
    // ✅ bootstrap is NEVER refilled here
    if (!kenoSystem?.flags?.freezeBuckets) {
      tier.B += baseBet * BUCKET_PCT;
      tier.D += baseBet * DRIFT_PCT;
    }

    // track max bucket AFTER funding
    life.maxBucket = Math.max(life.maxBucket, tier.B);

    const k = selectedRef.current.size;

    // if player picked 0, always nonpay
    if (k <= 0) {
      plannedWinRef.current = { payout: 0, hitTarget: 0 };
      drawRef.current = buildDrawWithExactHits([], 0);
      return;
    }

    // eligibility gate
    if (tier.B < T) {
      const fp = firstPayHitForK(k);
      const maxNonPay = Math.max(0, fp === Infinity ? 0 : fp - 1);
      const hitTarget = randInt(0, maxNonPay);
      plannedWinRef.current = { payout: 0, hitTarget };
      drawRef.current = buildDrawWithExactHits(
        [...selectedRef.current],
        hitTarget
      );
      return;
    }

    // base trigger prob
    const ramp = clamp((tier.B - T) / (C - T), 0, 1);
    const pBase = P_MIN + (P_MAX - P_MIN) * ramp;

    // drift boost
    const pBoost = ALPHA * clamp(tier.D / C, 0, 1);
    const pFinal = Math.min(pBase + pBoost, P_DRIFT_CAP);

    const triggered = Math.random() < pFinal;

    if (!triggered) {
      const fp = firstPayHitForK(k);
      const maxNonPay = Math.max(0, fp === Infinity ? 0 : fp - 1);
      const hitTarget = randInt(0, maxNonPay);
      plannedWinRef.current = { payout: 0, hitTarget };
      drawRef.current = buildDrawWithExactHits(
        [...selectedRef.current],
        hitTarget
      );
      return;
    }

    // choose slice
    let slice = pickWeighted(SLICE_PCTS, SLICE_WTS);

    // drift slice shift (optional)
    let driftUsed = pFinal > pBase;
    const shiftChance = BETA * clamp(tier.D / C, 0, 1);
    if (Math.random() < shiftChance) {
      const idx = SLICE_PCTS.indexOf(slice);
      if (idx >= 0 && idx < SLICE_PCTS.length - 1) {
        slice = SLICE_PCTS[idx + 1];
        driftUsed = true;
      }
    }

    const spendable = tier.B - F;
    if (spendable <= 0) {
      // fallback nonpay
      const fp = firstPayHitForK(k);
      const maxNonPay = Math.max(0, fp === Infinity ? 0 : fp - 1);
      const hitTarget = randInt(0, maxNonPay);
      plannedWinRef.current = { payout: 0, hitTarget };
      drawRef.current = buildDrawWithExactHits(
        [...selectedRef.current],
        hitTarget
      );
      return;
    }

    const allowanceW = slice * spendable;

    // pick win
    const win = pickLargestPayableWin({
      k,
      wager,
      allowanceW,
      bucketB: tier.B,
      floorF: F,
    });

    if (!win) {
      // treat as trigger-fail -> nonpay
      const fp = firstPayHitForK(k);
      const maxNonPay = Math.max(0, fp === Infinity ? 0 : fp - 1);
      const hitTarget = randInt(0, maxNonPay);
      plannedWinRef.current = { payout: 0, hitTarget };
      drawRef.current = buildDrawWithExactHits(
        [...selectedRef.current],
        hitTarget
      );
      return;
    }

    // apply payout to bucket (wins always come from B)
    tier.B -= win.payout;

    // ✅ burn bootstrap first (never refilled)
    if (typeof tier.bootstrap === "number" && tier.bootstrap > 0) {
      tier.bootstrap = Math.max(0, tier.bootstrap - win.payout);
    }

    // lifetime paid/max
    life.paid += win.payout;
    life.maxPayout = Math.max(life.maxPayout, win.payout);

    // burn drift if it contributed
    if (driftUsed) {
      const burned = win.payout * DRIFT_BURN;
      tier.D = Math.max(0, tier.D - burned);
      life.driftBurned += burned;
    }

    plannedWinRef.current = { payout: win.payout, hitTarget: win.hit };
    drawRef.current = buildDrawWithExactHits([...selectedRef.current], win.hit);
  };

  // ===== SPIN =====
  const spin = async () => {
    if (!isLoggedIn) {
      requestLogin();
      return;
    }

    playSound("spin", 0.6);

    const baseBet = Number(bet);
    if (credits < baseBet) return;

    // deduct base wager immediately
    setCredits((c) => c - baseBet);

    // player accounting
    const p = PLAYER_ID ? kenoPlayers.byId[PLAYER_ID] : null;
    if (p?.history) {
      p.history.totalCreditsPlayed += baseBet;
      p.history.spinsPlayed += 1;
      p.history.lastPlayedAt = Date.now();
    }

    setLastWin("0.00");
    setBalls([]);
    setHits(new Set());
    setPaused(false);

    // lock selection for the spin
    selectedRef.current = new Set(selected);

    // plan the full 10-ball draw + payout target
    planOutcome();
    const draw = drawRef.current;

    // first 5 balls
    for (let i = 0; i < 5; i++) {
      addBall(draw[i]);
      await new Promise((r) => setTimeout(r, 220));
    }

    setPaused(true);
  };

  // ===== RESUME =====
  const resume = async () => {
    if (!isLoggedIn) {
      requestLogin();
      return;
    }
    if (!paused) return;

    setPaused(false);
    const draw = drawRef.current;

    for (let i = 5; i < 10; i++) {
      addBall(draw[i]);
      await new Promise((r) => setTimeout(r, 220));
    }

    // payout was pre-planned by BOP
    const payout = plannedWinRef.current.payout;
    setLastWin(payout.toFixed(2));

    // player accounting + performance
    const p = PLAYER_ID ? kenoPlayers.byId[PLAYER_ID] : null;
    if (p?.history) {
      p.history.totalPaidOut += payout;
      p.history.biggestWin = Math.max(p.history.biggestWin, payout);
      p.history.lastPlayedAt = Date.now();
    }

    // per-spin audit log
    if (p?.historyLog) {
      p.historyLog.push({
        time: Date.now(),
        bet: Number(bet),
        raised: raiseActive,
        payout,
        hitTarget: plannedWinRef.current.hitTarget,
        selectedCount: selectedRef.current.size,
      });
    }

    // reset raise after spin completes
    setRaiseActive(false);
  };

  return {
    // auth gate flags for UI
    authReady,
    isLoggedIn,
    loginRequired: authReady && !isLoggedIn,

    // UI hook to open login modal on blocked actions
    requestLogin,
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
  };
}
