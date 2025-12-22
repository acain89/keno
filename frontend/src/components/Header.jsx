// src/components/Header.jsx
import React from "react";

export default function Header({
  isLoggedIn = true,
  username = "Player",
  credits = 0,
  onMenu = () => {},
  menuPulse = true,
}) {
  return (
    <div className="header">
      <button
        className={`profile-btn ${menuPulse ? "profile-pulse" : ""}`}
        onClick={onMenu}
      >
        MENU
      </button>

      {isLoggedIn ? (
        <>
          <div className="username">{username}</div>
          <div className="credits">
            Credits: {Number(credits).toFixed(2)}
          </div>
        </>
      ) : (
        <div className="username muted">Login Required</div>
      )}
    </div>
  );
}
