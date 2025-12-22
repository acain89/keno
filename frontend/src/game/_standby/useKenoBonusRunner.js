import { useEffect, useRef } from "react";
import { playSound } from "../core/sound";

const DROP_DELAY = 350;
const SPIN_PAUSE = 600;

/**
 * Bonus Runner
 *
 * Responsibilities:
 * - Animate bonus spins
 * - Draw balls via drawFn
 * - Apply payouts via payoutFn
 *
 * Does NOT:
 * - Decide outcomes
 * - Modify odds
 * - Enforce caps
 *
 * All authority lives in the caller.
 */

export default function useKenoBonusRunner({
  inBonus,
  bonusSpinsLeft,
  selected,
  drawFn,
  payoutFn,
  registerBonusSpin,
  onReset,
  onBall,
  onHit,
}) {
  const runningRef = useRef(false);
  const spinsLeftRef = useRef(bonusSpinsLeft);

  useEffect(() => {
    spinsLeftRef.current = bonusSpinsLeft;
  }, [bonusSpinsLeft]);

  useEffect(() => {
    if (!inBonus) return;
    if (runningRef.current) return;

    runningRef.current = true;

    const run = async () => {
      try {
        while (spinsLeftRef.current > 0 && inBonus) {
          onReset?.();

          const draw = drawFn();

          for (const ball of draw) {
            playSound("ball", 0.25);
            onBall?.(ball);
            if (selected.has(ball)) onHit?.(ball);
            await new Promise((r) => setTimeout(r, DROP_DELAY));
          }

          const win = Number(payoutFn() || 0);
          registerBonusSpin(win);

          spinsLeftRef.current -= 1;
          await new Promise((r) => setTimeout(r, SPIN_PAUSE));
        }
      } finally {
        runningRef.current = false;
      }
    };

    run();
  }, [
    inBonus,
    selected,
    drawFn,
    payoutFn,
    registerBonusSpin,
    onReset,
    onBall,
    onHit,
  ]);
}
