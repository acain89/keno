import { useCallback, useRef, useState } from "react";

export default function useKenoGame() {
  // ===== STATE =====
  const [selected, setSelected] = useState(new Set());
  const [hits, setHits] = useState(new Set());
  const [balls, setBalls] = useState([]);
  const [paused, setPaused] = useState(false);
  const [lastWin, setLastWin] = useState("0.00");

  // keep draw stable across pause
  const drawRef = useRef([]);

  // ===== HELPERS =====
  const drawUnique = () => {
    const s = new Set();
    while (s.size < 10) s.add(Math.floor(Math.random() * 40) + 1);
    return [...s];
  };

  // ===== GRID =====
  const toggleCell = useCallback((n) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) {
        next.delete(n);
      } else if (next.size < 10) {
        next.add(n);
      }
      return next;
    });
  }, []);

  // ===== BALLS =====
  const addBall = (n) => {
    setBalls((b) => [...b, n]);
    setHits((h) => new Set(h).add(n));
  };

  // ===== SPIN =====
  const spin = async () => {
    setLastWin("0.00");
    setBalls([]);
    setHits(new Set());
    setPaused(false);

    const draw = drawUnique();
    drawRef.current = draw;

    // first 5 balls
    for (let i = 0; i < 5; i++) {
      addBall(draw[i]);
      await new Promise((r) => setTimeout(r, 220));
    }

    setPaused(true);
  };

  // ===== RESUME =====
  const resume = async () => {
    if (!paused) return;

    setPaused(false);
    const draw = drawRef.current;

    for (let i = 5; i < 10; i++) {
      addBall(draw[i]);
      await new Promise((r) => setTimeout(r, 220));
    }

    setLastWin((Math.floor(Math.random() * 9) * 0.25).toFixed(2));
  };

  return {
    // state
    selected,
    hits,
    balls,
    paused,
    lastWin,

    // actions
    toggleCell,
    spin,
    resume,
  };
}
