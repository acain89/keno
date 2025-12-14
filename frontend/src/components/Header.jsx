import React from "react";

export default function Header({
  username = "Player07",
  credits = 1240.75,
  onMenu = () => {},
  menuPulse = true,
}) {
  return (
    <div className="header">
      <button
        className="profile-btn"
        onClick={onMenu}
        style={
          menuPulse
            ? { boxShadow: "0 0 12px rgba(56,232,255,.35)" }
            : undefined
        }
      >
        MENU
      </button>

      <div className="username">{username}</div>
      <div className="credits">Credits: {Number(credits).toFixed(2)}</div>
    </div>
  );
}
