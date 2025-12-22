import { useEffect, useRef, useState } from "react";

/**
 * Bonus Flow Controller (BILL-SAFE / MONEY-NEUTRAL)
 *
 * Guarantees:
 * - Bonus NEVER decides payouts
 * - Bonus ONLY aggregates Bill-final payouts
 * - No UI side effects
 * - No banners
 * - Clean enter / retrigger / exit
 */

export default function useKenoBonusFlow() {
  const [inBonus, setInBonus] = useState(false);
  const [bonusSpinsLeft, setBonusSpinsLeft] = useState(0);
  const [bonusWinnings, setBonusWinnings] = useState(0);

  const inBonusRef = useRef(false);

  /* -------------------------------------------------------
     ENTER / RETRIGGER BONUS (STATE ONLY)
  ------------------------------------------------------- */
  const startBonus = (spins) => {
    const count = Math.max(0, Number(spins || 0));
    if (count <= 0) return;

    inBonusRef.current = true;
    setInBonus(true);
    setBonusSpinsLeft((s) => s + count);
  };

  /* -------------------------------------------------------
     REGISTER ONE BONUS SPIN (BILL FINAL ONLY)
  ------------------------------------------------------- */
  const registerBonusSpin = (winAmount = 0) => {
    if (!inBonusRef.current) return;

    const amt = Number(winAmount);

    if (Number.isFinite(amt) && amt > 0) {
      setBonusWinnings((w) => w + amt);
    }

    setBonusSpinsLeft((s) => Math.max(0, s - 1));
  };

  /* -------------------------------------------------------
     EXIT BONUS (SILENT, CLEAN)
  ------------------------------------------------------- */
  useEffect(() => {
    if (!inBonusRef.current) return;
    if (bonusSpinsLeft > 0) return;

    inBonusRef.current = false;
    setInBonus(false);
    setBonusSpinsLeft(0);
    setBonusWinnings(0);
  }, [bonusSpinsLeft]);

  /* -------------------------------------------------------
     API
  ------------------------------------------------------- */
  return {
    inBonus,
    bonusSpinsLeft,
    bonusWinnings,

    startBonus,
    registerBonusSpin,
  };
}
