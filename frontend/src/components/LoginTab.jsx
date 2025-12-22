import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

const USERNAME_DOMAIN = "@keno.game";

const normalizeUsername = (u) =>
  u.trim().toLowerCase().replace(/\s+/g, "");

export default function LoginTab({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cashApp, setCashApp] = useState("");
  const [mode, setMode] = useState("login");
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

    if (mode === "signup" && !cashApp.trim()) {
      setError("Cash App ID is required.");
      return;
    }

    const email = `${cleanUsername}${USERNAME_DOMAIN}`;

    try {
      setLoading(true);

      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const userRef = doc(db, "users", cred.user.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          await setDoc(
            userRef,
            {
              userId: cred.user.uid,
              username: cleanUsername,
              cashApp: cashApp.trim(),
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

      onLoginSuccess?.();
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("Account not found.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Username already taken.");
      } else {
        setError("Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-panel">
      <h2 className="login-title">
        {mode === "login" ? "Login" : "Create Account"}
      </h2>

      <form onSubmit={submit} className="login-form" autoComplete="off">
        <div className="login-field">
          <label>Username</label>
          <input
            type="text"
            value={username}
            spellCheck={false}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="login-field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {mode === "signup" && (
          <div className="login-field">
            <label>Cash App ID</label>
            <input
              type="text"
              placeholder="$player07"
              value={cashApp}
              onChange={(e) => setCashApp(e.target.value)}
            />
          </div>
        )}

        {error && <div className="login-error">{error}</div>}

        <button
          className="login-btn"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Please wait…"
            : mode === "login"
            ? "Login"
            : "Create Account"}
        </button>
      </form>

      <div className="login-switch">
        {mode === "login" ? (
          <span onClick={() => setMode("signup")}>
            Don’t have an account? <strong>Create one</strong>
          </span>
        ) : (
          <span onClick={() => setMode("login")}>
            Already have an account? <strong>Login</strong>
          </span>
        )}
      </div>
    </div>
  );
}
