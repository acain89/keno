import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  limit,
} from "firebase/firestore";

import { auth, db } from "../services/firebase";

export default function Register() {
  const navigate = useNavigate();

  // REQUIRED FIELDS (IN ORDER)
  const [username, setUsername] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cashApp, setCashApp] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizeUsername = (v) => v.trim();
  const normalizeEmail = (v) => v.trim().toLowerCase();
  const normalizeCashApp = (v) => v.replace(/\$/g, "").trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const un = normalizeUsername(username);
    const em = normalizeEmail(recoveryEmail);
    const pw = password;
    const ca = normalizeCashApp(cashApp);

    if (!un || !em || !pw || !ca) {
      setError("All fields are required.");
      return;
    }

    // 🚫 Username MUST NOT be an email
    if (un.includes("@")) {
      setError("Username cannot be an email address.");
      return;
    }

    setLoading(true);

    try {
      // 🔍 Enforce unique username
      const q = query(
        collection(db, "users"),
        where("username", "==", un),
        limit(1)
      );

      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error("Username already taken.");
      }

      // 🔐 Firebase Auth uses recovery email (hidden from UX later)
      const cred = await createUserWithEmailAndPassword(auth, em, pw);
      const uid = cred.user.uid;

      // 🧾 Firestore user profile
      await setDoc(doc(db, "users", uid), {
        uid,
        username: un,
        email: em,          // recovery email stored here
        cashApp: ca,        // store WITHOUT "$"
        credits: 0,
        createdAt: serverTimestamp(),
      });

      // 🔁 Ensure auth state is fully established
      await signInWithEmailAndPassword(auth, em, pw);

      navigate("/");
    } catch (err) {
      setError(err?.message || "Account creation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Create Account</h2>

      {/* 🔒 Autofill blockers: prevents Chrome from shoving email into Username */}
      <form onSubmit={handleSubmit} autoComplete="off">
        {/* USERNAME (REQUIRED) */}
        <label>Username</label>
        <input
          type="text"
          name="un_field"                 // not "username"
          autoComplete="off"              // avoid email autofill
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username (not email)"
          required
        />

        {/* RECOVERY EMAIL (REQUIRED) */}
        <label>Recovery Email</label>
        <input
          type="email"
          name="recovery_email_field"
          autoComplete="email"
          value={recoveryEmail}
          onChange={(e) => setRecoveryEmail(e.target.value)}
          placeholder="Used only to recover your account"
          required
        />

        {/* PASSWORD (REQUIRED) */}
        <label>Password</label>
        <input
          type="password"
          name="new_password_field"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* CASH APP (REQUIRED) */}
        <label>Cash App ID</label>
        <div className="cashapp-field">
          <span className="cash-prefix">$</span>
          <input
            type="text"
            name="cashapp_field"
            autoComplete="off"
            spellCheck={false}
            value={cashApp}
            onChange={(e) => setCashApp(normalizeCashApp(e.target.value))}
            placeholder="cashtag (without $)"
            required
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}
