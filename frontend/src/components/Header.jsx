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
        disabled={!isLoggedIn}
        style={
          isLoggedIn && menuPulse
            ? { boxShadow: "0 0 12px rgba(56,232,255,.35)" }
            : undefined
        }
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
