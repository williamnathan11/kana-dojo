"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function TestPage() {
  const router = useRouter();

  const kanaList = useMemo(() => [
    ["あ", "a"],
    ["い", "i"],
    ["う", "u"],
    ["え", "e"],
    ["お", "o"],
  ], []);

  const [order, setOrder] = useState([]);
  const [pos, setPos] = useState(0);
  const [romaji, setRomaji] = useState("");
  const [times, setTimes] = useState([]);
  const [liveTime, setLiveTime] = useState(0);

  const startRef = useRef(0);
  const rafRef = useRef(null);

  const user = typeof window !== "undefined" ? localStorage.getItem("kana_user") : null;

  useEffect(() => {
    if (!user) router.push("/");

    const shuffled = shuffle([...Array(kanaList.length).keys()]);
    setOrder(shuffled);
    startRef.current = performance.now();
  }, []);

  useEffect(() => {
    function tick() {
      const elapsed = (performance.now() - startRef.current) / 1000;
      setLiveTime(elapsed);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (!order.length) return null;

  const currentIndex = order[pos];
  const current = kanaList[currentIndex];

  const finished = pos >= order.length;

  function handleChange(value) {
    setRomaji(value);

    if (value.trim().toLowerCase() === current[1]) {
      const elapsed = (performance.now() - startRef.current) / 1000;

      setTimes([...times, elapsed]);
      setPos(pos + 1);
      setRomaji("");
      startRef.current = performance.now();
    }
  }

  function saveLeaderboard(avgTime) {
    const board = JSON.parse(localStorage.getItem("kana_leaderboard") || "[]");
    board.push({ name: user, avgTime });
    localStorage.setItem("kana_leaderboard", JSON.stringify(board));
  }

  const avgTime =
    times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;

  useEffect(() => {
    if (finished && times.length > 0) {
      saveLeaderboard(avgTime);
    }
  }, [finished]);

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1>Japanese Kana Trainer</h1>
        <p>User: {user}</p>

        {!finished ? (
          <>
            <div style={styles.kana}>{current[0]}</div>

            <input
              style={styles.input}
              value={romaji}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Type romaji..."
              autoFocus
            />

            <p>Timer: {liveTime.toFixed(2)}s</p>
          </>
        ) : (
          <>
            <h2>Finished 🎉</h2>
            <p>Average Time: {avgTime.toFixed(2)}s</p>

            <button
              style={styles.button}
              onClick={() => router.push("/")}
            >
              Back to Leaderboard
            </button>
          </>
        )}
      </div>
    </main>
  );
}

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  kana: {
    fontSize: "6rem",
    margin: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(0,0,0,0.3)",
    color: "white",
  },
  button: {
    marginTop: 15,
    padding: 12,
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
  },
};