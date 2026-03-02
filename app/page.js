"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function KanaTrainer() {
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
  const [results, setResults] = useState([]);
  const [liveTime, setLiveTime] = useState(0);
  const [started, setStarted] = useState(false);

  const startRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const shuffled = shuffle([...Array(kanaList.length).keys()]);
    setOrder(shuffled);
  }, []);

  useEffect(() => {
    if (!started) return;

    function tick() {
      const elapsed = (performance.now() - startRef.current) / 1000;
      setLiveTime(elapsed);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [started]);

  if (!order.length) return null;

  const finished = pos >= order.length;
  const current = kanaList[order[pos]];

  function classify(seconds) {
    if (seconds <= 0.5) return "Easy";
    if (seconds <= 1.5) return "Medium";
    return "Hard";
  }

  function handleChange(value) {
    setRomaji(value);

    if (!started) return;

    if (value.trim().toLowerCase() === current[1]) {
      const elapsed = (performance.now() - startRef.current) / 1000;

      setResults([...results, {
        kana: current[0],
        time: elapsed,
        difficulty: classify(elapsed),
      }]);

      setPos(pos + 1);
      setRomaji("");
      startRef.current = performance.now();
    }
  }

  function startTimer() {
    if (!started) {
      setStarted(true);
      startRef.current = performance.now();
    }
  }

  const avgTime =
    results.length > 0
      ? results.reduce((a, b) => a + b.time, 0) / results.length
      : 0;

  const focusKana = results
    .filter(r => r.difficulty === "Hard")
    .map(r => r.kana);

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.title}>Japanese Kana Trainer</h1>

        {!finished ? (
          <>
            <div
              style={styles.kana}
              onClick={startTimer}
            >
              {current[0]}
            </div>

            <input
              style={styles.input}
              value={romaji}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Type romaji..."
              autoFocus
            />

            <div style={styles.timer}>
              {started ? `Timer: ${liveTime.toFixed(2)}s` : "Click kana to start"}
            </div>
          </>
        ) : (
          <>
            <h2>Session Complete 🎉</h2>

            <p>Average Time: {avgTime.toFixed(2)}s</p>

            <p>
              Easy: {results.filter(r => r.difficulty === "Easy").length} | 
              Medium: {results.filter(r => r.difficulty === "Medium").length} | 
              Hard: {results.filter(r => r.difficulty === "Hard").length}
            </p>

            {focusKana.length > 0 && (
              <p>Focus on: {focusKana.join(", ")}</p>
            )}

            <button
              style={styles.button}
              onClick={() => window.location.reload()}
            >
              Restart
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
    padding: 40,
    borderRadius: 20,
    width: 450,
    textAlign: "center",
  },
  title: {
    fontWeight: 900,
    marginBottom: 20,
  },
  kana: {
    fontSize: "7rem",
    margin: 20,
    cursor: "pointer",
    userSelect: "none",
  },
  input: {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(0,0,0,0.3)",
    color: "white",
    fontSize: 16,
  },
  timer: {
    marginTop: 12,
    opacity: 0.8,
  },
  button: {
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
  },
};