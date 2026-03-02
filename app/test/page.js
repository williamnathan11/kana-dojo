"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function TestPage() {
  const router = useRouter();

  const kanaList = useMemo(() => buildKanaList(), []);

  const [order, setOrder] = useState([]);
  const [pos, setPos] = useState(0);
  const [romaji, setRomaji] = useState("");
  const [results, setResults] = useState([]);
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

      setResults([...results, elapsed]);
      setPos(pos + 1);
      setRomaji("");
      startRef.current = performance.now();
    }
  }

  const avgTime =
    results.length > 0
      ? results.reduce((a, b) => a + b, 0) / results.length
      : 0;

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

function buildKanaList() {
  return [
    ["あ", "a"],
    ["い", "i"],
    ["う", "u"],
    ["え", "e"],
    ["お", "o"],
    ["か", "ka"],
    ["き", "ki"],
    ["く", "ku"],
    ["け", "ke"],
    ["こ", "ko"],
    ["さ", "sa"],
    ["し", "shi"],
    ["す", "su"],
    ["せ", "se"],
    ["そ", "so"],
    ["た", "ta"],
    ["ち", "chi"],
    ["つ", "tsu"],
    ["て", "te"],
    ["と", "to"],
  ];
}

const styles = {
  main: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0b0f19",
    color: "#fff",
  },
  card: {
    background: "#111827",
    padding: 30,
    borderRadius: 12,
    textAlign: "center",
    width: 400,
  },
  kana: {
    fontSize: "6rem",
    margin: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "none",
  },
  button: {
    padding: 10,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
};