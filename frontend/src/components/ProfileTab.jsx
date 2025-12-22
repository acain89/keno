import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import "./profile.css";

export default function ProfileTab({
  username,
  email,
  credits,
  onLogout,
}) {
  const handleLogout = async () => {
    try {
      await signOut(auth); // 🔐 real logout
      onLogout?.();        // notify parent safely
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="profile-panel">
      {/* HEADER */}
      <div className="profile-header">
        <div className="profile-title">PROFILE</div>
        <button className="profile-close" onClick={handleLogout}>
          LOG OUT
        </button>
      </div>

      {/* USER */}
      <div className="profile-top">
        <div>
          <div className="profile-username">
            {username || "—"}
          </div>
          <div className="profile-email">
            {email || ""}
          </div>
        </div>
      </div>

      {/* CREDITS */}
      <div className="profile-credits">
        Credits: <span>${Number(credits || 0).toFixed(2)}</span>
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
