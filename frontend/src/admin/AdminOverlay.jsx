import React from "react";
import { createPortal } from "react-dom";
import BucketLive from "./BucketLive";
import BucketLifetime from "./BucketLifetime";
import SystemPanel from "./SystemPanel";
import "./admin.css";
import PlayerSearch from "./PlayerSearch";

export default function AdminOverlay({ onClose }) {
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
