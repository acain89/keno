import React from "react";

/**
 * DevOverlay
 *
 * READ-ONLY developer instrumentation layer.
 * - No game control
 * - No side effects
 * - Safe to mount permanently
 */

export default function DevOverlay({
  visible = false,
  hotkey = "Ctrl + Alt + D",

  // Joe state (optional / injected later)
  pathId = "—",
  beatIndex = "—",
  intent = "—",
  target = "—",
  remainingCap = "—",
}) {
  if (!visible) return null;

  return (
    <div style={styles.wrap}>
      <div style={styles.title}>DEV OVERLAY</div>
      <div style={styles.subtitle}>Hotkey: {hotkey}</div>

      <Row label="Path ID" value={pathId} />
      <Row label="Beat" value={beatIndex} />
      <Row label="Intent" value={intent} />
      <Row label="Target $" value={target} />
      <Row label="Remaining Cap" value={remainingCap} />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>{value}</span>
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    top: 12,
    left: 12,
    zIndex: 9999,
    background: "rgba(0,0,0,0.85)",
    color: "#00ffcc",
    fontFamily: "monospace",
    fontSize: 12,
    padding: "10px 12px",
    borderRadius: 6,
    boxShadow: "0 0 10px rgba(0,255,204,0.35)",
    minWidth: 200,
    pointerEvents: "none",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 2,
    borderBottom: "1px solid rgba(0,255,204,0.3)",
    paddingBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    opacity: 0.6,
    marginBottom: 6,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 4,
  },
  label: {
    opacity: 0.7,
    marginRight: 10,
  },
  value: {
    color: "#ffffff",
  },
};
