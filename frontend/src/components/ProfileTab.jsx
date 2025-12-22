import React from "react";
import "./profile.css";

export default function ProfileTab({
  username = "Keno-07",
  email = "acain89@gmail.com",
  credits = 0,
  onLogout = () => {},
}) {
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
        <div>
          <div className="profile-username">{username}</div>
          <div className="profile-email">{email}</div>
        </div>
      </div>

      {/* CREDITS */}
      <div className="profile-credits">
        Credits: <span>${credits.toFixed(2)}</span>
      </div>

      {/* INFO */}
      <div className="profile-info">
        <div>
          <strong>To buy credits:</strong>
          <div>$skillgrid16 (Cash App)</div>
          <div className="profile-match">
            $20 + $20 match = $100
          </div>
        </div>

        <div className="profile-warn">
          IMPORTANT.
          <div>This game is for entertainment only.</div>
        </div>

        <div>
          Support: <strong>skillgrid16@gmail.com</strong>
        </div>
      </div>
    </div>
  );
}
