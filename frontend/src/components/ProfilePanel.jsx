import React, { useState } from "react";

export default function LoginTab({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cashApp, setCashApp] = useState("");

  const submit = () => {
    if (!username || !password) return;

    onLogin({
      username,
      credits: 0,
      level: 0,
      cashApp: mode === "create" ? cashApp : null,
    });
  };

  return (
    <div className="login-tab">
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {mode === "create" && (
        <>
          <input
            placeholder="$Cash-App ID"
            value={cashApp}
            onChange={(e) => setCashApp(e.target.value)}
          />
          <div className="hint">
            Cash-App ID is required for refunds.
          </div>
        </>
      )}

      <button onClick={submit}>SUBMIT</button>

      {mode === "login" ? (
        <div className="link" onClick={() => setMode("create")}>
          Don’t have an account? Join here.
        </div>
      ) : (
        <div className="link" onClick={() => setMode("login")}>
          Back to login
        </div>
      )}
    </div>
  );
}
