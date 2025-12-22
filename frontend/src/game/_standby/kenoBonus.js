/**
 * Keno Bonus Engine (JOE-CONTROLLED)
 *
 * IMPORTANT:
 * - Bonus entry is NO LONGER RNG-DRIVEN
 * - JoeEngine is the SOLE authority for triggering bonuses
 * - This file now contains constants only
 *
 * NO UI
 * NO TIMING
 * NO STATE
 */

// Informational only (used by Joe bonus math)
export const BONUS_MULT = 2;

// Legacy values retained for reference / tuning only
export const BONUS_AWARD_3 = 10;
export const BONUS_AWARD_4 = 20;

/**
 * Bonus evaluation is DISABLED.
 * JoeEngine controls all bonus entry via INTENT.BONUS.
 *
 * @returns {number} always 0
 */
export function evaluateBonus() {
  return 0;
}
