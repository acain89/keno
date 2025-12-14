import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createEngine } from "./src/engine.js";

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Engine (in-memory). Restart server = reset to seeds.
const engine = createEngine({
  // Early-trigger chance per paid spin (meter still guarantees by 50).
  // Tune later. 1%–2% feels good with must-hit-by.
  bonusEarlyP: 0.0125,
});

// Serve frontend
app.use("/", express.static(path.join(__dirname, "public")));

// Health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Read tier state (banks + meter + active bonus)
app.get("/api/state", (req, res) => {
  const tier = req.query.tier;
  if (!tier) return res.status(400).json({ error: "tier required" });
  return res.json(engine.getTierState(String(tier)));
});

// Start a paid spin (returns first 5 balls + spinId)
app.post("/api/spin/start", (req, res) => {
  const { tier, baseBet, picks } = req.body || {};
  try {
    const out = engine.startSpin({ tier, baseBet, picks });
    return res.json(out);
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) });
  }
});

// Finish a paid spin with KEEP/RAISE
app.post("/api/spin/finish", (req, res) => {
  const { spinId, decision } = req.body || {};
  try {
    const out = engine.finishSpin({ spinId, decision });
    return res.json(out);
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) });
  }
});

// Bonus: play one free spin (no payout per spin)
app.post("/api/bonus/spin", (req, res) => {
  const { tier, picks } = req.body || {};
  try {
    const out = engine.bonusSpin({ tier, picks });
    return res.json(out);
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) });
  }
});

// Bonus: resolve (called automatically by bonusSpin when spins hit 0, but exposed anyway)
app.post("/api/bonus/resolve", (req, res) => {
  const { tier } = req.body || {};
  try {
    const out = engine.resolveBonus({ tier });
    return res.json(out);
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) });
  }
});

const PORT = process.env.PORT || 5179;
app.listen(PORT, () => {
  console.log(`Keno server running on http://localhost:${PORT}`);
});
