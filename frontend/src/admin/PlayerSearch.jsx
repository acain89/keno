import React, { useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import "./admin.css";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "../services/firebase";


export default function PlayerSearch() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adjust, setAdjust] = useState({}); // uid -> delta

  const runSearch = async () => {
    const qTerm = term.trim().toLowerCase();
    if (!qTerm) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const q = query(
        collection(db, "users"),
        where("username", "==", qTerm)
      );

      const snap = await getDocs(q);

      const found = [];
      snap.forEach((d) => {
        found.push({
          uid: d.id,
          ...d.data(),
        });
      });

      setResults(found);
    } catch (err) {
      console.error(err);
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const applyAdjustment = async (uid, currentCredits) => {
  const raw = adjust[uid];
  const delta = Number(raw);

  // Guard: empty, zero, or invalid input
  if (!raw || Number.isNaN(delta) || delta === 0) return;

  const before = Number(currentCredits) || 0;
  const after = Math.max(0, before + delta);

  try {
    // Update player credits
    await updateDoc(doc(db, "users", uid), {
      credits: after,
    });

    // Write admin audit log
    await addDoc(collection(db, "adminLogs"), {
      targetUid: uid,
      delta,
      before,
      after,
      adminUid: auth.currentUser?.uid ?? "unknown",
      timestamp: serverTimestamp(),
    });

    // Optimistic UI update
    setResults((prev) =>
      prev.map((p) =>
        p.uid === uid ? { ...p, credits: after } : p
      )
    );

    // Clear input
    setAdjust((a) => ({ ...a, [uid]: "" }));
  } catch (err) {
    console.error("Credit adjustment failed:", err);
    alert("Failed to update credits.");
  }
};



      // Update UI immediately
      setResults((r) =>
        r.map((p) =>
          p.uid === uid
            ? { ...p, credits: (p.credits || 0) + delta }
            : p
        )
      );

      setAdjust((a) => ({ ...a, [uid]: "" }));
    } catch (err) {
      console.error("Credit update failed", err);
      alert("Failed to update credits");
    }
  };

  return (
    <div className="admin-card">
      <h3>Player Search</h3>

      <div className="admin-row">
        <input
          type="text"
          placeholder="Username"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
        />
        <button className="btn" onClick={runSearch} disabled={loading}>
          Search
        </button>
      </div>

      {loading && <div className="admin-muted">Searching…</div>}
      {error && <div className="admin-error">{error}</div>}

      {results.map((p) => (
        <div key={p.uid} className="admin-player">
          <div className="admin-player-header">
            <strong>{p.username}</strong>
            <span className="admin-muted">
              Credits: {p.credits ?? 0}
            </span>
          </div>

          <div className="admin-player-meta">
            <div>UID: {p.uid}</div>
            <div>Cash App: {p.cashApp || "—"}</div>
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
            <button
              className="btn"
              onClick={() => applyAdjustment(p.uid, p.credits)}
            >
              Apply
            </button>
          </div>
        </div>
      ))}

      {!loading && results.length === 0 && term && (
        <div className="admin-muted">No players found</div>
      )}
    </div>
  );
}
