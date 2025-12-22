import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import KenoGame from "./components/KenoGame";
import Login from "./pages/Login";
import DevOverlay from "./dev/DevOverlay";

import "./keno.css";

/* ======================================================
   ADMIN CONFIG
====================================================== */
const ADMIN_HOTKEY = "Ctrl + Alt + K";
const DEV_HOTKEY = "Ctrl + Alt + D";
const ADMIN_PASSCODE = "893889";

/* ======================================================
   APP
====================================================== */
export default function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [devVisible, setDevVisible] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  /* ======================================================
     GLOBAL HOTKEYS (CAPTURE PHASE)
  ====================================================== */
  useEffect(() => {
    const handler = (e) => {
      if (e.repeat) return;

      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // ADMIN (LOCKED)
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "k") {
        console.log("ADMIN HOTKEY FIRED");
        e.preventDefault();
        e.stopPropagation();

        if (!adminUnlocked) {
          const code = window.prompt("Enter 6-digit admin passcode:");
          if (code !== ADMIN_PASSCODE) return;
          setAdminUnlocked(true);
        }

        setShowAdmin((v) => {
          console.log("showAdmin ->", !v);
          return !v;
        });
        return;
      }

      // DEV
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        e.stopPropagation();
        setDevVisible((v) => !v);
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [adminUnlocked]);

  return (
    <BrowserRouter>
      {devVisible && <DevOverlay visible hotkey={DEV_HOTKEY} />}

      <Routes>
        <Route
          path="/"
          element={
            <KenoGame
              showAdmin={showAdmin}
              onCloseAdmin={() => setShowAdmin(false)}
            />
          }
        />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
