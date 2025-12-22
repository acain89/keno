import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";

export default function LoginTab({ onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // login | register

  // LOGIN
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // REGISTER (REQUIRED)
  const [regUsername, setRegUsername] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [cashApp, setCashApp] = useState("");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ======================================================
     LOGIN
  ====================================================== */
  const handleLogin = async (e) => {
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
        throw new Error("Invalid username or password.");
      }

      const email = snap.docs[0].data().email;
      await signInWithEmailAndPassword(auth, email, password);

      onLoginSuccess?.();
    } catch (err) {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     REGISTER (FIXED)
  ====================================================== */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (!regUsername || !recoveryEmail || !regPassword || !cashApp) {
      setError("All fields are required.");
      return;
    }

    if (regUsername.includes("@")) {
      setError("Username cannot be an email address.");
      return;
    }

    setLoading(true);

    try {
      // Enforce unique username
      const q = query(
        collection(db, "users"),
        where("username", "==", regUsername),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error("Username already taken.");
      }

      // Create auth user (email is recovery only)
      const cred = await createUserWithEmailAndPassword(
        auth,
        recoveryEmail,
        regPassword
      );

      const uid = cred.user.uid;

      await setDoc(doc(db, "users", uid), {
        uid,
        username: regUsername,
        email: recoveryEmail,
        cashApp: cashApp.replace("$", ""),
        credits: 0,
        createdAt: serverTimestamp(),
      });

      await signInWithEmailAndPassword(auth, recoveryEmail, regPassword);

      onLoginSuccess?.();
    } catch (err) {
      setError(err.message || "Account creation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-tab">
      {mode === "login" ? (
        <form onSubmit={handleLogin}>
          <h2>Login</h2>

          <input
            type="text"
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
            required
          />

          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button disabled={loading}>
            {loading ? "Signing in…" : "Login"}
          </button>

          <p className="switch-auth">
            Need an account?{" "}
            <span onClick={() => setMode("register")}>Create Account</span>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRegister} autoComplete="off">
          <h2>Create Account</h2>

          {/* USERNAME */}
          <label>Username</label>
          <input
            type="text"
            placeholder="Username (not email)"
            autoComplete="off"
            value={regUsername}
            onChange={(e) => setRegUsername(e.target.value.trim())}
            required
          />

          {/* RECOVERY EMAIL */}
          <label>Recovery Email</label>
          <input
            type="email"
            placeholder="Used only for account recovery"
            autoComplete="email"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value.trim())}
            required
          />

          {/* PASSWORD */}
          <label>Password</label>
          <input
            type="password"
            autoComplete="new-password"
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            required
          />

          {/* CASH APP */}
          <label>Cash App ID</label>
          <div className="cashapp-field">
            <span>$</span>
            <input
              type="text"
              value={cashApp}
              onChange={(e) =>
                setCashApp(e.target.value.replace("$", "").trim())
              }
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button disabled={loading}>
            {loading ? "Creating…" : "Create Account"}
          </button>

          <p className="switch-auth">
            Already have an account?{" "}
            <span onClick={() => setMode("login")}>Login</span>
          </p>
        </form>
      )}
    </div>
  );
}
