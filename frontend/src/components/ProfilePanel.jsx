import React, { useEffect, useState } from "react";
import { auth } from "../services/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import "./ProfilePanel.css";

export default function ProfilePanel({ onClose }) {
  const [profile, setProfile] = useState(null);
  const [cashApp, setCashApp] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        setProfile(snap.data());
        setCashApp(snap.data().cashApp || "");
      }
    });
  }, []);

  const save = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      cashApp: cashApp.trim(),
    });
    setSaving(false);
  };

  if (!profile) return null;

  return (
    <div className="profile-panel">
      <h2>Profile</h2>

      <div className="profile-row">
        <span>Username</span>
        <strong>{profile.username}</strong>
      </div>

      <div className="profile-row">
        <span>Cash App</span>
        <input
          value={cashApp}
          onChange={(e) => setCashApp(e.target.value)}
          placeholder="$player07"
        />
      </div>

      <button className="btn" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>

      <button className="btn ghost" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
