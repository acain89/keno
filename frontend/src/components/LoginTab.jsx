import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../services/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";

const USERNAME_DOMAIN = "@keno.game";

function normalizeUsername(u) {
  return u.trim().toLowerCase();
}

export default function LoginTab({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cashApp, setCashApp] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");

    const cleanUsername = normalizeUsername(username);

    if (!cleanUsername || !password) {
      setError("Username and password are required.");
      return;
    }

    if (mode === "signup" && !cashApp) {
      setError("Cash App ID is required.");
      return;
    }

    // Internal email mapping (never shown to user)
    const email = `${cleanUsername}${USERNAME_DOMAIN}`;

    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // 🔒 Persist profile data (NOT public)
        await setDoc(doc(db, "users", cred.user.uid), {
          username: cleanUsername,
          cashApp: cashApp.trim(),
          createdAt: serverTimestamp(),
        });
      }

      setLoading(false);
      onLoginSuccess?.();
    } catch (err) {
      console.error(err);

      if (err.code === "auth/user-not-found") {
        setError("Account not found.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Username already taken.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError("Authentication failed.");
      }

      setLoading(false);
    }
  };

  return (
    <div className="login-panel">
      <h2>{mode === "login" ? "Login" : "Create Account"}</h2>

      <form onSubmit={submit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          autoComplete={
            mode === "login" ? "current-password" : "new-password"
          }
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />

        {mode === "signup" && (
          <input
            type="text"
            placeholder="Cash App ID (e.g. $player07)"
            value={cashApp}
            onChange={(e) => setCashApp(e.target.value)}
            disabled={loading}
            required
          />
        )}

        {error && <div className="login-error">{error}</div>}

        <button className="btn primary" type="submit" disabled={loading}>
          {loading
            ? "Please wait…"
            : mode === "login"
            ? "Login"
            : "Create Account"}
        </button>
      </form>

      <div className="login-switch">
        {mode === "login" ? (
          <span
            className="login-link"
            onClick={() => {
              setError("");
              setMode("signup");
            }}
          >
            Don’t have an account? <strong>Join here</strong>
          </span>
        ) : (
          <span
            className="login-link"
            onClick={() => {
              setError("");
              setMode("login");
            }}
          >
            Already have an account? <strong>Login</strong>
          </span>
        )}
      </div>
    </div>
  );
}
