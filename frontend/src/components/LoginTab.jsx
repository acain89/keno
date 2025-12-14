import React, { useState } from "react";
import "./login.css";

export default function LoginTab({ onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // login | create
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cashApp, setCashApp] = useState("");

  return (
    <div className="login-panel">
      {mode === "login" && (
        <>
          <input
            className="login-input"
            type="text"
            placeholder="Email or Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="login-submit" onClick={onLoginSuccess}>
            SUBMIT
          </button>

          <div
            className="login-link"
            onClick={() => setMode("create")}
          >
            Don’t have an account? Join here.
          </div>
        </>
      )}

      {mode === "create" && (
        <>
          <input
            className="login-input"
            type="text"
            placeholder="Email or Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="cashapp-field">
            <span className="cashapp-prefix">$</span>
            <input
              type="text"
              placeholder="Cash-App ID"
              value={cashApp}
              onChange={(e) =>
                setCashApp(e.target.value.replace(/^\$/, ""))
              }
            />
          </div>

          <div className="cashapp-note">
            Cash-App ID is required for refunds.
          </div>

          <button className="login-submit" onClick={onLoginSuccess}>
            SUBMIT
          </button>

          <div
            className="login-link"
            onClick={() => setMode("login")}
          >
            Back to login
          </div>
        </>
      )}
    </div>
  );
}
