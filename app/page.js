"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [name, setName] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("kana_leaderboard") || "[]");
    saved.sort((a, b) => a.avgTime - b.avgTime);
    setLeaderboard(saved.slice(0, 10));
  }, []);

  function start() {
    if (!name.trim()) return;
    localStorage.setItem("kana_user", name.trim());
    router.push("/test");
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.title}>Japanese Kana Trainer</h1>

        <input
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button style={styles.button} onClick={start}>
          Start
        </button>

        <h2 style={{ marginTop: 30 }}>Leaderboard 🏆</h2>

        {leaderboard.length === 0 && <p>No records yet.</p>}

        {leaderboard.map((entry, i) => (
          <div key={i} style={styles.leaderRow}>
            <span>{i + 1}. {entry.name}</span>
            <span>{entry.avgTime.toFixed(2)}s</span>
          </div>
        ))}
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0b0f19",
    color: "#e7eaf3",
  },
  card: {
    background: "rgba(255,255,255,0.06)",
    padding: 30,
    borderRadius: 16,
    width: 400,
    textAlign: "center",
  },
  title: {
    fontWeight: 900,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(0,0,0,0.3)",
    color: "white",
    marginBottom: 15,
  },
  button: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
  },
  leaderRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 8,
    padding: 8,
    background: "rgba(255,255,255,0.05)",
    borderRadius: 8,
  },
};