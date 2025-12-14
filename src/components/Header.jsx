import React from "react";

export default function Header({
  username = "Player07",
  credits = 1240.75,
  onProfile = () => {},
  profilePulse = true, // keeps your neon vibe available
}) {
  return (
    <div className="header">
      <button
        className="profile-btn"
        onClick={onProfile}
        style={
          profilePulse
            ? { boxShadow: "0 0 12px rgba(56,232,255,.35)" }
            : undefined
        }
      >
        PROFILE
      </button>

      <div className="username">{username}</div>
      <div className="credits">Credits: {Number(credits).toFixed(2)}</div>
    </div>
  );
}
