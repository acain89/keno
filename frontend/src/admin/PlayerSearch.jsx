import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { auth } from "../services/firebase";
import "./admin.css";

const PATHS = ["LOSER", "WINNER"];
const MAX_RESULTS = 8;

export default function PlayerSearch({ onSelect }) {
  const [term, setTerm] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adjust, setAdjust] = useState({});
  const [pathEdit, setPathEdit] = useState({});
  const [selectedUid, setSelectedUid] = useState(null);

  /* ======================================================
     LOAD USERS (ADMIN SCOPE)
  ====================================================== */
  useEffect(() => {
    let alive = true;
    setLoading(true);

    (async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        if (!alive) return;

        const rows = [];
        snap.forEach((d) =>
          rows.push({ uid: d.id, ...d.data() })
        );
        setAllUsers(rows);
      } catch (e) {
        setError("Failed to load users.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  /* ======================================================
     PREFIX FILTER (USERNAME OR CASHAPP)
  ====================================================== */
  useEffect(() => {
    const q = term.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }

    const matches = allUsers.filter((u) => {
      const un = (u.username || "").toLowerCase();
      const ca = (u.cashApp || "").toLowerCase();
      return un.startsWith(q) || ca.startsWith(q);
    });

    setResults(matches.slice(0, MAX_RESULTS));
  }, [term, allUsers]);

  /* ======================================================
     CREDIT ADJUST
  ====================================================== */
  const applyAdjustment = async (p) => {
    const raw = adjust[p.uid];
    const delta = Number(raw);
    if (!raw || Number.isNaN(delta) || delta === 0) return;

    const before = Number(p.credits) || 0;
    const after = Math.max(0, before + delta);
    const path = after === 0 ? "LOSER" : p.path || "LOSER";

    await updateDoc(doc(db, "users", p.uid), {
      credits: after,
      path,
    });

    await addDoc(collection(db, "adminLogs"), {
      targetUid: p.uid,
      type: "CREDIT_ADJUST",
      delta,
      before,
      after,
      path,
      adminUid: auth.currentUser?.uid ?? "unknown",
      timestamp: serverTimestamp(),
    });

    setAllUsers((u) =>
      u.map((x) => (x.uid === p.uid ? { ...x, credits: after, path } : x))
    );
    setAdjust((a) => ({ ...a, [p.uid]: "" }));
  };

  /* ======================================================
     PATH ASSIGN (AUTHORITATIVE)
  ====================================================== */
  const applyPath = async (p) => {
    const path = pathEdit[p.uid];
    if (!path || path === p.path) return;

    await updateDoc(doc(db, "users", p.uid), { path });

    await addDoc(collection(db, "adminLogs"), {
      targetUid: p.uid,
      type: "PATH_ASSIGN",
      path,
      adminUid: auth.currentUser?.uid ?? "unknown",
      timestamp: serverTimestamp(),
    });

    setAllUsers((u) =>
      u.map((x) => (x.uid === p.uid ? { ...x, path } : x))
    );
  };

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
          {results.map((p) => (
            <div
              key={p.uid}
              className={`admin-suggestion ${
                selectedUid === p.uid ? "active" : ""
              }`}
              onClick={() => {
                setSelectedUid(p.uid);
                onSelect?.(p);
              }}
            >
              <strong>{p.username}</strong>
              <span className="admin-muted">
                {p.cashApp || "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      {selectedUid &&
        allUsers
          .filter((u) => u.uid === selectedUid)
          .map((p) => (
            <div key={p.uid} className="admin-player">
              <div className="admin-player-meta">
                <div>UID: {p.uid}</div>
                <div>Credits: {p.credits ?? 0}</div>
                <div>Path: {p.path || "LOSER"}</div>
              </div>

              <div className="admin-adjust">
                <input
                  type="number"
                  placeholder="+ / − credits"
                  value={adjust[p.uid] || ""}
                  onChange={(e) =>
                    setAdjust((a) => ({
                      ...a,
                      [p.uid]: e.target.value,
                    }))
                  }
                />
                <button className="btn" onClick={() => applyAdjustment(p)}>
                  Apply
                </button>
              </div>

              <div className="admin-adjust">
                <select
                  value={pathEdit[p.uid] || p.path || "LOSER"}
                  onChange={(e) =>
                    setPathEdit((r) => ({
                      ...r,
                      [p.uid]: e.target.value,
                    }))
                  }
                >
                  {PATHS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <button className="btn" onClick={() => applyPath(p)}>
                  Set Path
                </button>
              </div>
            </div>
          ))}

      {loading && <div className="admin-muted">Loading users…</div>}
      {error && <div className="admin-error">{error}</div>}
    </div>
  );
}
