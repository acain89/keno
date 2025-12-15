import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../services/firebase";

export default function LoginTab({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      // Firebase auth state WILL update
      // useKenoGame.onAuthStateChanged will fire
      onLoginSuccess?.();
    } catch (err) {
      console.error(err);
      setError(err.message || "Authentication failed");
      setLoading(false);
    }
  };

  return (
    <div className="login-panel">
      <h2>{mode === "login" ? "Login" : "Create Account"}</h2>

      <form onSubmit={submit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          autoComplete="username"
          onChange={(e) => setEmail(e.target.value)}
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
          required
        />

        {error && <div className="login-error">{error}</div>}

        <button className="btn primary" disabled={loading}>
          {loading
            ? "Please wait…"
            : mode === "login"
            ? "Login"
            : "Create Account"}
        </button>
      </form>

      <div className="login-switch">
        {mode === "login" ? (
          <button
            className="link"
            onClick={() => {
              setError("");
              setMode("signup");
            }}
          >
            Don’t have an account? Create one
          </button>
        ) : (
          <button
            className="link"
            onClick={() => {
              setError("");
              setMode("login");
            }}
          >
            Already have an account? Login
          </button>
        )}
      </div>
    </div>
  );
}
