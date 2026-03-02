"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "kana_trainer_state_v1";

export default function KanaTrainer() {
  // Keep 5 for testing. Swap to your full 255 list later.
  const kanaList = useMemo(
    () => [
      ["あ", "a"],
      ["い", "i"],
      ["う", "u"],
      ["え", "e"],
      ["お", "o"],
    ],
    []
  );

  const inputRef = useRef(null);
  const startRef = useRef(0);

  const [order, setOrder] = useState([]);
  const [pos, setPos] = useState(0);
  const [romaji, setRomaji] = useState("");
  const [results, setResults] = useState([]); // { kana, romaji, time, difficulty }
  const [error, setError] = useState(false);

  // Load persisted state (optional but matches "ongoing progress" feel in screenshot)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) throw new Error("no saved state");

      const saved = JSON.parse(raw);
      const ok =
        saved &&
        saved.version === 1 &&
        Array.isArray(saved.order) &&
        typeof saved.pos === "number" &&
        Array.isArray(saved.results) &&
        saved.kanaCount === kanaList.length;

      if (!ok) throw new Error("bad saved state");

      setOrder(saved.order);
      setPos(saved.pos);
      setResults(saved.results);
    } catch {
      const shuffled = shuffle([...Array(kanaList.length).keys()]);
      setOrder(shuffled);
      setPos(0);
      setResults([]);
    }
  }, [kanaList.length]);

  // Persist state
  useEffect(() => {
    if (!order.length) return;
    const payload = {
      version: 1,
      kanaCount: kanaList.length,
      order,
      pos,
      results,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [order, pos, results, kanaList.length]);

  // Start timing each new prompt
  useEffect(() => {
    if (!order.length) return;
    if (pos >= order.length) return;
    startRef.current = performance.now();
    setRomaji("");
    setError(false);
    // focus input like a game
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [order, pos]);

  if (!order.length) return null;

  const finished = pos >= order.length;
  const current = !finished ? kanaList[order[pos]] : null;

  function classify(seconds) {
    // More human thresholds than 0.5s/1.5s; tweak anytime.
    if (seconds <= 2.0) return "Easy";
    if (seconds <= 4.0) return "Medium";
    return "Hard";
  }

  function avgOf(filterFn) {
    const arr = results.filter(filterFn);
    if (!arr.length) return 0;
    return arr.reduce((sum, r) => sum + r.time, 0) / arr.length;
  }

  const answered = results.length;
  const total = kanaList.length;

  const avgTime = results.length
    ? results.reduce((sum, r) => sum + r.time, 0) / results.length
    : 0;

  const avgEasy = avgOf((r) => r.difficulty === "Easy");
  const avgMed = avgOf((r) => r.difficulty === "Medium");
  const avgHard = avgOf((r) => r.difficulty === "Hard");

  function onSubmit() {
    if (finished) return;

    const typed = romaji.trim().toLowerCase();
    const expected = current[1];

    if (typed !== expected) {
      setError(true);
      return;
    }

    const elapsed = (performance.now() - startRef.current) / 1000;
    const difficulty = classify(elapsed);

    setResults((prev) => [
      ...prev,
      {
        kana: current[0],
        romaji: expected,
        time: elapsed,
        difficulty,
      },
    ]);

    setPos((p) => p + 1);
  }

  function resetAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    const shuffled = shuffle([...Array(kanaList.length).keys()]);
    setOrder(shuffled);
    setPos(0);
    setResults([]);
    setRomaji("");
    setError(false);
    startRef.current = performance.now();
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <main style={styles.main}>
      <div style={styles.shell}>
        <h1 style={styles.title}>Japanese Kana Trainer</h1>
        <div style={styles.subtitle}>Enter to submit.</div>

        <div style={styles.statsTopRow}>
          <Stat label="Answered" value={String(answered)} />
          <Stat label="Progress" value={`${answered}/${total}`} />
          <Stat label="Avg time (s)" value={avgTime.toFixed(2)} />
          <button style={styles.resetBtn} onClick={resetAll} type="button">
            Reset
          </button>
        </div>

        <div style={styles.statsBottomRow}>
          <Stat label="Avg easy (s)" value={avgEasy.toFixed(2)} />
          <Stat label="Avg medium (s)" value={avgMed.toFixed(2)} />
          <Stat label="Avg hard (s)" value={avgHard.toFixed(2)} />
        </div>

        <div style={styles.kanaWrap}>
          <div style={styles.kana}>{finished ? "✓" : current[0]}</div>
        </div>

        <div style={styles.inputCard}>
          <div style={styles.inputLabelRow}>
            <div style={styles.inputLabel}>Romaji</div>
          </div>

          <div style={styles.inputFieldWrap}>
            <input
              ref={inputRef}
              value={romaji}
              onChange={(e) => {
                setRomaji(e.target.value);
                if (error) setError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              style={{
                ...styles.input,
                ...(error ? styles.inputError : null),
              }}
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              placeholder=""
              disabled={finished}
            />
            <div style={styles.inputHint}>Press Enter to submit form</div>
          </div>

          <div style={styles.actionsRow}>
            <button
              style={{
                ...styles.submitBtn,
                ...(finished ? styles.submitBtnDisabled : null),
              }}
              onClick={onSubmit}
              type="button"
              disabled={finished}
            >
              Submit (Enter)
            </button>

            {finished && (
              <div style={styles.doneText}>
                Session complete. Hit <b>Reset</b> to reshuffle.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
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
    background:
      "radial-gradient(1200px 600px at 50% 15%, rgba(255,255,255,0.06), rgba(0,0,0,0)), #0b0f19",
    color: "rgba(255,255,255,0.92)",
    display: "grid",
    placeItems: "center",
    padding: "48px 16px",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  },

  shell: {
    width: "min(760px, 100%)",
    textAlign: "center",
  },

  title: {
    margin: 0,
    fontSize: "clamp(34px, 5vw, 44px)",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.65,
  },

  statsTopRow: {
    marginTop: 26,
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr auto",
    gap: 28,
    alignItems: "start",
    justifyItems: "center",
  },
  statsBottomRow: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 28,
    justifyItems: "center",
  },

  stat: {
    textAlign: "center",
    minWidth: 120,
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.72,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.01em",
  },

  resetBtn: {
    height: 34,
    padding: "0 14px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    fontWeight: 600,
  },

  kanaWrap: {
    marginTop: 34,
    marginBottom: 24,
    display: "grid",
    placeItems: "center",
  },
  kana: {
    fontSize: "clamp(84px, 10vw, 118px)",
    fontWeight: 500,
    lineHeight: 1,
    letterSpacing: "0.02em",
    userSelect: "none",
    filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.35))",
  },

  inputCard: {
    width: "min(560px, 100%)",
    margin: "0 auto",
    padding: 16,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    textAlign: "left",
  },

  inputLabelRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    opacity: 0.85,
  },

  inputFieldWrap: {
    position: "relative",
  },
  input: {
    width: "100%",
    height: 44,
    padding: "0 14px",
    paddingRight: 190,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    fontSize: 14,
  },
  inputError: {
    border: "1px solid rgba(255,80,80,0.85)",
    boxShadow: "0 0 0 3px rgba(255,80,80,0.12)",
  },
  inputHint: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 11,
    opacity: 0.55,
    pointerEvents: "none",
    whiteSpace: "nowrap",
  },

  actionsRow: {
    marginTop: 12,
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  submitBtn: {
    height: 34,
    padding: "0 14px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.92)",
    cursor: "pointer",
    fontWeight: 600,
  },
  submitBtnDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  doneText: {
    fontSize: 12,
    opacity: 0.75,
  },
};