import React from "react";

export default function Header({
  isLoggedIn,
  username,
  credits,
  onMenu = () => {},
  menuPulse = true,
}) {
  return (
    <div className="header">
      <button
        className="profile-btn"
        onClick={onMenu}
        // ✅ DO NOT disable — MENU must open login panel when logged out
        style={
          menuPulse
            ? { boxShadow: "0 0 12px rgba(56,232,255,.35)" }
            : undefined
        }
      >
        MENU
      </button>

      {isLoggedIn ? (
        <>
          <div className="username">{username || "Player"}</div>
          <div className="credits">Credits: {Number(credits || 0).toFixed(2)}</div>
        </>
      ) : (
        <div className="username muted">Login Required</div>
      )}
    </div>
  );
}
