import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../services/firebase";
import "./admin.css";

const PATHS = ["LOSER", "WINNER"];
const MAX_RESULTS = 8;

export default function PlayerSearch() {
  console.log("✅ USING ADMIN PlayerSearch.jsx");

  const [term, setTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);

  const [creditDelta, setCreditDelta] = useState("");
  const [path, setPath] = useState("LOSER");

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /* ================= LOAD USERS ================= */
  useEffect(() => {
    let alive = true;
    setLoading(true);

    (async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        if (!alive) return;

        const rows = [];
        snap.forEach((d) => rows.push({ uid: d.id, ...d.data() }));
        setUsers(rows);
      } catch {
        setError("Failed to load users.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => (alive = false);
  }, []);

  /* ================= FILTER ================= */
  useEffect(() => {
    const q = term.trim().toLowerCase();
    if (!q) return setResults([]);

    const matches = users.filter((u) => {
      const un = (u.username || "").toLowerCase();
      const ca = (u.cashApp || "").toLowerCase();
      return un.startsWith(q) || ca.startsWith(q);
    });

    setResults(matches.slice(0, MAX_RESULTS));
  }, [term, users]);

  /* ================= ADMIN UPDATE (AUTHORITATIVE) ================= */
  const applyAdminUpdate = async ({
    creditDelta = 0,
    forcePath = null,
  }) => {
    if (!selected || busy) return;

    setBusy(true);

    const ref = doc(db, "users", selected.uid);

    const beforeCredits = Number(selected.credits) || 0;
    const delta = Number(creditDelta) || 0;
    const afterCredits = Math.max(0, beforeCredits + delta);

    const nextPath =
      forcePath ??
      selected.path ??
      (afterCredits === 0 ? "LOSER" : "WINNER");

    try {
      // 🔒 SINGLE AUTHORITATIVE WRITE
      await updateDoc(ref, {
        credits: afterCredits,
        path: nextPath,
        adminUpdatedAt: serverTimestamp(),
      });

      // 🧾 AUDIT LOG
      await addDoc(collection(db, "adminLogs"), {
        targetUid: selected.uid,
        type: "ADMIN_UPDATE",
        delta: delta || null,
        beforeCredits,
        afterCredits,
        path: nextPath,
        adminUid: auth.currentUser?.uid ?? "unknown",
        timestamp: serverTimestamp(),
      });

      // 🔄 CONFIRMATION READ (NO GUESSING)
      const confirmSnap = await getDocs(
        query(collection(db, "users"), where("__name__", "==", selected.uid))
      );

      if (!confirmSnap.empty) {
        const confirmed = confirmSnap.docs[0].data();

        // ✅ UPDATE UI FROM CONFIRMED STATE
        setSelected((s) => ({
          ...s,
          credits: confirmed.credits,
          path: confirmed.path,
        }));

        setUsers((u) =>
          u.map((x) =>
            x.uid === selected.uid
              ? {
                  ...x,
                  credits: confirmed.credits,
                  path: confirmed.path,
                }
              : x
          )
        );
      }

      setCreditDelta("");
    } catch (err) {
      console.error("❌ Admin update failed:", err);
      alert("Admin update failed. See console.");
    } finally {
      setBusy(false);
    }
  };

  /* ================= RENDER ================= */
  return (
    <div className="admin-card">
      <h3>Player Search</h3>

      <input
        type="text"
        placeholder="Username or Cash App"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />

      {results.length > 0 && (
        <div className="admin-autocomplete">
          {results.map((u) => (
            <div
              key={u.uid}
              className={`admin-suggestion ${
                selected?.uid === u.uid ? "active" : ""
              }`}
              onClick={() => {
                setSelected(u);
                setPath(u.path || "LOSER");
              }}
            >
              <strong>{u.username}</strong>
              <span className="admin-muted">{u.cashApp || "—"}</span>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <>
          <div className="admin-section">
            <h3>Selected Player</h3>
            <div className="admin-kv">
              <div>UID: {selected.uid}</div>
              <div>Credits: ${selected.credits ?? 0}</div>
              <div>Path: {selected.path || "LOSER"}</div>
            </div>
          </div>

          <div className="admin-section">
            <h3>Adjust Credits</h3>
            <div className="admin-adjust">
              <input
                type="number"
                placeholder="+ / − credits"
                value={creditDelta}
                onChange={(e) => setCreditDelta(e.target.value)}
                disabled={busy}
              />
              <button
                className="btn"
                disabled={busy}
                onClick={() =>
                  applyAdminUpdate({ creditDelta: Number(creditDelta) })
                }
              >
                {busy ? "Updating…" : "Apply"}
              </button>
            </div>
          </div>

          <div className="admin-section">
            <h3>Assign Outcome</h3>
            <div className="admin-adjust">
              <select
                value={path}
                onChange={(e) => setPath(e.target.value)}
                disabled={busy}
              >
                {PATHS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button
                className="btn"
                disabled={busy}
                onClick={() => applyAdminUpdate({ forcePath: path })}
              >
                {busy ? "Updating…" : "Set Path"}
              </button>
            </div>
          </div>
        </>
      )}

      {loading && <div className="admin-muted">Loading users…</div>}
      {error && <div className="admin-error">{error}</div>}
    </div>
  );
}
