import React, { useEffect } from "react";
import LoginTab from "./LoginTab";
import ProfileTab from "./ProfileTab";
import PayTable from "./PayTable";
import "./menuOverlay.css";

export default function MenuOverlay({
  open,
  tab,
  setTab,
  onClose,
  isLoggedIn,
  onLoginSuccess,
  onLogout,
  credits,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ✅ Unmount when closed so it can't block clicks
  if (!open) return null;

  return (
    <>
      <div className="menu-backdrop" onClick={onClose} />

      <aside className="menu-panel">
        <header className="menu-header">
          <div className="menu-tabs">
            <button
              className={tab === "login" ? "active" : ""}
              onClick={() => setTab("login")}
            >
              LOGIN
            </button>

            <button
              className={tab === "profile" ? "active" : ""}
              onClick={() => setTab("profile")}
              disabled={!isLoggedIn}
            >
              PROFILE
            </button>

            <button
              className={tab === "paytable" ? "active" : ""}
              onClick={() => setTab("paytable")}
            >
              PAY TABLE
            </button>
          </div>

          <button className="menu-close" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="menu-body">
          {tab === "login" && <LoginTab onLoginSuccess={onLoginSuccess} />}

          {tab === "profile" && (
            <ProfileTab credits={credits} onLogout={onLogout} />
          )}

          {tab === "paytable" && <PayTable />}
        </div>
      </aside>
    </>
  );
}
