# Keno (Operational Localhost Build)

This is a complete, runnable implementation of your **final Keno spec**:
- 40 tiles, pick 1–10
- 10 unique balls (first 5 → KEEP/RAISE → last 5)
- 8 tier-locked BaseBanks + 8 tier-locked BonusBanks
- Money flow per paid spin: **10% host / 85% base / 5% bonus**
- Base payout clamps to tier cap & BaseBank balance
- Bonus: RNG + must-hit-by (<=50 paid spins), 10 spins, 2% retrigger, single payout at end, clamped to BonusBank

## Run
1) Install Node 18+  
2) In this folder:

```bash
npm install
npm run dev
