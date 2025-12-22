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

    if (un.includes("@")) {
      setError("Username cannot be an email address.");
      return;
    }

    setLoading(true);

    try {
      const q = query(
        collection(db, "users"),
        where("username", "==", un),
        limit(1)
      );

      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error("Username already taken.");
      }

      const cred = await createUserWithEmailAndPassword(auth, em, pw);
      const uid = cred.user.uid;

      await setDoc(doc(db, "users", uid), {
        uid,
        username: un,
        email: em,
        cashApp: ca,
        credits: 0,
        createdAt: serverTimestamp(),
      });

      await signInWithEmailAndPassword(auth, em, pw);
      navigate("/");
    } catch (err) {
      setError(err?.message || "Account creation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-panel">
      <h2>Create Account</h2>

      <form onSubmit={handleSubmit} autoComplete="off">
        {/* USERNAME */}
        <div className="form-group">
          <label>Username</label>
          <input
            className="login-input"
            type="text"
            name="un_field"
            autoComplete="off"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Something classy."
            required
          />
        </div>

        {/* RECOVERY EMAIL */}
        <div className="form-group">
          <label>Recovery Email</label>
          <input
            className="login-input"
            type="email"
            name="recovery_email_field"
            autoComplete="email"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
            placeholder="It's required. I won't spam email you."
            required
          />
        </div>

        {/* PASSWORD */}
        <div className="form-group">
          <label>Password</label>
          <input
            className="login-input"
            type="password"
            name="new_password_field"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Something you will remember."
            required
          />
        </div>

        {/* CASH APP */}
        <div className="form-group">
          <label>Cash App ID</label>
          <div className="cashapp-field">
            <span className="cashapp-prefix">$</span>
            <input
              type="text"
              name="cashapp_field"
              autoComplete="off"
              spellCheck={false}
              value={cashApp}
              onChange={(e) =>
                setCashApp(normalizeCashApp(e.target.value))
              }
              placeholder="cashtag (Don't type the $)"
              required
            />
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button
          type="submit"
          className="register-submit"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}
