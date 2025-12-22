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

    if (username.includes("@")) {
      setError("Login uses username, not email.");
      return;
    }

    setLoading(true);

    try {
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

      await signInWithEmailAndPassword(auth, email, password);
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
    <div className="auth-page">
      <div className="login-panel">
        <h2>Login</h2>

        <form onSubmit={onSubmit} autoComplete="off">
          <div className="form-group">
            <label>Username</label>
            <input
              className="login-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Login"}
          </button>

          <div className="login-footer">
            <span>Don’t have an account?</span>

            <button
              type="button"
              className="create-account-btn"
              onClick={() => navigate("/register")}
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
