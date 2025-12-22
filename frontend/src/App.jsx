import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";

import KenoGame from "./components/KenoGame";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DevOverlay from "./dev/DevOverlay";

import "./keno.css";

/* ======================================================
   ADMIN CONFIG
====================================================== */
const ADMIN_PASSCODE = "893889";

/* ======================================================
   APP
====================================================== */
export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [showAdmin, setShowAdmin] = useState(false);
  const [devVisible, setDevVisible] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  /* ================= MOBILE TAP STATE ================= */
  const TAP_THRESHOLD = 5;
  const TAP_WINDOW_MS = 1200;
  const TAP_ZONE_PX = 80;

  const [tapCount, setTapCount] = useState(0);
  const [firstTapTime, setFirstTapTime] = useState(null);

  /* ======================================================
     AUTH LISTENER
  ====================================================== */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setAuthReady(true);

      if (!u) {
        setShowAdmin(false);
        setDevVisible(false);
        setAdminUnlocked(false);
      }
    });

    return unsub;
  }, []);

  /* ======================================================
     DESKTOP HOTKEYS
  ====================================================== */
  useEffect(() => {
    const handler = (e) => {
      if (e.repeat) return;

      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // ADMIN (Ctrl + Alt + K)
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();

        if (!adminUnlocked) {
          const code = window.prompt("Enter 6-digit admin passcode:");
          if (code !== ADMIN_PASSCODE) return;
          setAdminUnlocked(true);
        }

        setShowAdmin((v) => !v);
      }

      // DEV (Ctrl + Alt + D)
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setDevVisible((v) => !v);
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [adminUnlocked]);

  /* ======================================================
     MOBILE ADMIN UNLOCK (5 TAPS TOP-RIGHT)
  ====================================================== */
  useEffect(() => {
    const handleTouch = (e) => {
      const touch = e.touches?.[0];
      if (!touch) return;

      const { clientX, clientY } = touch;
      const { innerWidth } = window;

      // top-right corner only
      if (clientX < innerWidth - TAP_ZONE_PX || clientY > TAP_ZONE_PX) return;

      const now = Date.now();

      if (!firstTapTime || now - firstTapTime > TAP_WINDOW_MS) {
        setFirstTapTime(now);
        setTapCount(1);
        return;
      }

      setTapCount((count) => {
        const next = count + 1;

        if (next >= TAP_THRESHOLD) {
          if (!adminUnlocked) {
            const code = window.prompt("Enter 6-digit admin passcode:");
            if (code !== ADMIN_PASSCODE) {
              setTapCount(0);
              setFirstTapTime(null);
              return 0;
            }
            setAdminUnlocked(true);
          }

          setShowAdmin((v) => !v);
          setTapCount(0);
          setFirstTapTime(null);
          return 0;
        }

        return next;
      });
    };

    window.addEventListener("touchstart", handleTouch, { passive: true });
    return () => window.removeEventListener("touchstart", handleTouch);
  }, [adminUnlocked, firstTapTime]);

  if (!authReady) return null;

  return (
    <BrowserRouter>
      {devVisible && <DevOverlay />}

      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <KenoGame
                showAdmin={showAdmin}
                onCloseAdmin={() => setShowAdmin(false)}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />

        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <Register />}
        />
      </Routes>
    </BrowserRouter>
  );
}
