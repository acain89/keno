import { CONFIG, SEEDS } from "./config.js";
import { mulberry32, pickWeighted, shuffle, clampMoney } from "./util.js";

/**
 * Core Keno Engine (backend only)
 * In-memory banks, tier-locked, restart = reset
 */
export function createEngine({ bonusEarlyP = 0.0125 } = {}) {
  const rng = mulberry32(CONFIG.RNG_SEED >>> 0);

  const tiers = {};
  for (const tier of CONFIG.TIERS) {
    const k = tier.toFixed(2);
    tiers[k] = {
      tier: k,
      baseBet: tier,
      tierMaxBet: clampMoney(tier * 2),
      tierCap: clampMoney(tier * 2 * 40),
      baseBank: SEEDS[k].baseBankSeed,
      bonusBank: SEEDS[k].bonusBankSeed,
      meter: 0,
      bonus: {
        active: false,
        spinsRemaining: 0,
        totalBonusSpins: 0,
        retriggers: 0,
        resolved: false,
        lastBonusWin: 0,
      },
    };
  }

  const pending = new Map();

  const normTier = (t) => {
    const k = Number(t).toFixed(2);
    if (!tiers[k]) throw new Error("Invalid tier");
    return tiers[k];
  };

  const assertPicks = (p) => {
    if (!Array.isArray(p) || p.length < 1 || p.length > 10)
      throw new Error("Pick 1–10 tiles");
    const s = new Set(p);
    if (s.size !== p.length) throw new Error("Duplicate picks");
    for (const n of p)
      if (!Number.isInteger(n) || n < 1 || n > 40)
        throw new Error("Tiles must be 1–40");
    return [...s].sort((a, b) => a - b);
  };

  const draw10 = () => {
    const arr = Array.from({ length: 40 }, (_, i) => i + 1);
    shuffle(arr, rng);
    return arr.slice(0, 10);
  };

  const countHits = (p, d) => d.filter((x) => p.includes(x)).length;

  const getMult = (k, h) => {
    const rules = CONFIG.PAYTABLE[String(k)] || [];
    for (const r of rules) {
      if (r.minHits && h >= r.minHits) return r.mult;
      if (r.hits === h) return r.mult;
    }
    return 0;
  };

  function startSpin({ tier, baseBet, picks }) {
    const st = normTier(tier);
    if (Number(baseBet) !== st.baseBet) throw new Error("Tier mismatch");
    if (st.bonus.active) throw new Error("Finish bonus first");

    const clean = assertPicks(picks);
    const drawn = draw10();
    const id = `${Date.now()}_${Math.floor(rng() * 1e9)}`;

    pending.set(id, { tier: st.tier, picks: clean, drawn });

    return { spinId: id, first5: drawn.slice(0, 5) };
  }

  function finishSpin({ spinId, decision }) {
    const sp = pending.get(spinId);
    if (!sp) throw new Error("Invalid spin");
    pending.delete(spinId);

    const st = normTier(sp.tier);
    const raise = decision === "raise";
    const finalBet = clampMoney(st.baseBet * (raise ? 2 : 1));

    // funding
    st.baseBank += clampMoney(finalBet * 0.85);
    st.bonusBank += clampMoney(finalBet * 0.05);
    st.meter += raise ? 2 : 1;

    const h = countHits(sp.picks, sp.drawn);
    const mult = getMult(sp.picks.length, h);
    const raw = clampMoney(finalBet * mult);
    const win = clampMoney(Math.min(raw, st.baseBank, st.tierCap));
    st.baseBank -= win;

    if (!st.bonus.active) {
      if (rng() < bonusEarlyP || st.meter >= 50) {
        st.meter = 0;
        st.bonus.active = true;
        st.bonus.spinsRemaining = 10;
        st.bonus.totalBonusSpins = 10;
      }
    }

    return {
      drawn10: sp.drawn,
      hits: h,
      multiplier: mult,
      win,
      bonusActive: st.bonus.active,
    };
  }

  function bonusSpin({ tier, picks }) {
    const st = normTier(tier);
    if (!st.bonus.active) throw new Error("No bonus active");

    const drawn = draw10();
    st.bonus.spinsRemaining--;

    if (rng() < 0.02) {
      st.bonus.spinsRemaining += 10;
      st.bonus.retriggers++;
      st.bonus.totalBonusSpins += 10;
    }

    if (st.bonus.spinsRemaining <= 0) {
      return resolveBonus({ tier });
    }

    return { drawn10: drawn, spinsRemaining: st.bonus.spinsRemaining };
  }

  function resolveBonus({ tier }) {
    const st = normTier(tier);
    const mult = pickWeighted(CONFIG.BONUS_WEIGHTS, rng);
    const raw = clampMoney(st.tierMaxBet * mult);
    const win = clampMoney(Math.min(raw, st.bonusBank, st.tierCap));
    st.bonusBank -= win;
    st.bonus.active = false;
    return { bonusWin: win, bonusMultiplier: mult };
  }

  function getTierState(tier) {
    const st = normTier(tier);
    return {
      baseBank: st.baseBank,
      bonusBank: st.bonusBank,
      meter: st.meter,
      bonus: st.bonus,
    };
  }

  return { startSpin, finishSpin, bonusSpin, resolveBonus, getTierState };
}
