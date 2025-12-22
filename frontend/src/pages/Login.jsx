import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import "./login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Enter username and password.");
      return;
    }

    // ❌ Block email-style usernames
    if (username.includes("@")) {
      setError("Login uses username, not email.");
      return;
    }

    setLoading(true);

    try {
      // 🔍 Look up user by username
      const q = query(
        collection(db, "users"),
        where("username", "==", username),
        limit(1)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        setError("Invalid username or password.");
        setLoading(false);
        return;
      }

      const userDoc = snap.docs[0].data();
      const email = userDoc.email;

      if (!email) {
        setError("Account misconfigured. Contact support.");
        setLoading(false);
        return;
      }

      // 🔐 Firebase auth (email remains hidden)
      await signInWithEmailAndPassword(auth, email, password);
      // App.jsx handles redirect on auth change
    } catch (err) {
      console.error("Login error:", err.code, err.message);

      switch (err.code) {
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Invalid username or password.");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Try again later.");
          break;
        default:
          setError("Login failed. Please try again.");
      }

      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <form className="login-card" onSubmit={onSubmit}>
        <h2>Login</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value.trim())}
          autoComplete="username"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <div className="login-error">{error}</div>}

        <button className="btn primary" disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </button>

        <div className="login-footer">
          <span>Don’t have an account?</span>

          <button
            type="button"
            className="btn secondary create-account-btn"
            onClick={() => navigate("/register")}
          >
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
}
