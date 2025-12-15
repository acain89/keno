import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import BucketLive from "./BucketLive";
import BucketLifetime from "./BucketLifetime";
import SystemPanel from "./SystemPanel";
import PlayerSearch from "./PlayerSearch";
import "./admin.css";

export default function AdminOverlay({ onClose }) {
  // 🔐 Global hotkey handler (Ctrl + Shift + K)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === "k"
      ) {
        e.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="admin-overlay">
      <div className="admin-header">
        <h2>Admin Panel</h2>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="admin-body">
        <PlayerSearch />
        <BucketLive />
        <BucketLifetime />
        <SystemPanel />
      </div>
    </div>,
    document.body
  );
}
