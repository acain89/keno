// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/* ======================================================
   GLOBAL ADMIN HOTKEY (PROOF-LEVEL)
====================================================== */
window.addEventListener(
  "keydown",
  (e) => {
    const key = String(e.key || "").toLowerCase();
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === "k") {
      e.preventDefault();
      console.log("ADMIN HOTKEY FIRED");

      // fire global event
      window.dispatchEvent(new Event("ADMIN_TOGGLE"));
    }
  },
  true
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
