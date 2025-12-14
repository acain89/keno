import React from "react";
import "./profile.css";

export default function ProfileTab({
  username = "Player07",
  email = "acain89@gmail.com",
  credits = 0,
  level = 0,
  onLevelUp = () => {},
  onLogout = () => {},
}) {
  const canLevelUp = credits >= 20;

  return (
    <div className="profile-panel">
      {/* HEADER */}
      <div className="profile-header">
        <div className="profile-title">PROFILE</div>
        <button className="profile-close" onClick={onLogout}>
          LOG OUT
        </button>
      </div>

      {/* USER */}
      <div className="profile-top">
        <div className="level-badge">
          <div className="level-badge__value">LV {level}</div>
        </div>

        <div>
          <div className="profile-username">{username}</div>
          <div className="profile-email">{email}</div>
        </div>
      </div>

      {/* CREDITS */}
      <div className="profile-credits">
        Credits: <span>${credits.toFixed(2)}</span>
      </div>

      <button
        className="profile-submit-btn"
        disabled={!canLevelUp}
        onClick={onLevelUp}
      >
        LEVEL UP
      </button>

      {/* INFO */}
      <div className="profile-info">
        <div>
          <strong>To buy credits:</strong>
          <div>$skillgrid16 (Cash App)</div>
        </div>

        <div className="profile-warn">
          IMPORTANT.
          <div>Level-Ups are $20 increments only.</div>
          <div>This game is for entertainment only.</div>
        </div>

        <div>
          Support: <strong>skillgrid16@gmail.com</strong>
        </div>
      </div>
    </div>
  );
}
