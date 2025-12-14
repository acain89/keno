import React, { useState } from "react";

// ⚠️ Replace with your own hash later
const ADMIN_CODE = "893889"; // dev-only plaintext

export default function AdminAuthModal({ onSuccess, onClose }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (code === ADMIN_CODE) {
      onSuccess();
    } else {
      setError("Invalid code");
      setCode("");
    }
  };

  return (
    <div className="admin-overlay">
      <div className="admin-modal">
        <h2>Admin Access</h2>

        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={code}
          autoFocus
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-actions">
          <button onClick={submit}>Unlock</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
