import React, { useEffect, useState } from "react";
import { kenoSystem } from "../game/kenoSystem";

export default function SystemPanel() {
  const [, force] = useState(0);

  useEffect(() => {
    const id = setInterval(() => force(n => n + 1), 300);
    return () => clearInterval(id);
  }, []);

  const toggle = (key) => {
    kenoSystem.flags[key] = !kenoSystem.flags[key];
    force(n => n + 1);
  };

  const flags = kenoSystem.flags;

  return (
    <div className="admin-section">
      <h3>System Controls</h3>

      <Control
        label="Disable Raise"
        active={flags.disableRaise}
        onClick={() => toggle("disableRaise")}
      />

      <Control
        label="Disable Bonus"
        active={flags.disableBonus}
        onClick={() => toggle("disableBonus")}
      />

      <Control
        label="Freeze Buckets"
        active={flags.freezeBuckets}
        onClick={() => toggle("freezeBuckets")}
      />

      <Control
        label="Read-Only Mode"
        active={flags.readOnlyMode}
        onClick={() => toggle("readOnlyMode")}
        danger
      />
    </div>
  );
}

function Control({ label, active, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        marginBottom: 8,
        padding: 8,
        width: "100%",
        background: active
          ? danger ? "#FF3B3B" : "#7CFF6B"
          : "#1b2038",
        color: "#fff",
        border: "none",
        cursor: "pointer",
      }}
    >
      {label}: {active ? "ON" : "OFF"}
    </button>
  );
}
