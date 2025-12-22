import React, { useState } from "react";

// ⚠️ Dev-only plaintext code
const ADMIN_CODE = "893889";

export default function AdminAuthModal({ onSuccess, onClose }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const cleaned = String(code || "").trim();

    if (cleaned === ADMIN_CODE) {
      setError("");
      onSuccess(true); // ✅ explicit success signal
    } else {
      setError("Invalid admin code");
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
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, ""))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") submit(); // ✅ Enter works
          }}
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
