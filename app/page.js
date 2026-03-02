"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "kana_trainer_state_v2";

export default function KanaTrainer() {
  // Keep 5 for testing. Swap to your full list later.
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
  const rafRef = useRef(null);
  const submittingRef = useRef(false);

  const [order, setOrder] = useState([]);
  const [pos, setPos] = useState(0);
  const [romaji, setRomaji] = useState("");
  const [results, setResults] = useState([]); // { kana, romaji, time, difficulty }
  const [error, setError] = useState(false);
  const [runningTime, setRunningTime] = useState(0);

  // Load state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) throw new Error("no saved state");

      const saved = JSON.parse(raw);
      const ok =
        saved &&
        saved.version === 2 &&
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
      version: 2,
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

  const finished = order.length > 0 && pos >= order.length;
  const current = !finished ? kanaList[order[pos]] : null;

  function classify(seconds) {
    if (seconds <= 2.0) return "Easy";
    if (seconds <= 4.0) return "Medium";
    return "Hard";
  }

  // Reset timer each new kana + focus input
  useEffect(() => {
    if (!order.length) return;
    if (finished) return;

    submittingRef.current = false;
    startRef.current = performance.now();
    setRunningTime(0);
    setRomaji("");
    setError(false);

    setTimeout(() => inputRef.current?.focus(), 0);
  }, [order, pos, finished]);

  // Live running timer (resets via startRef on each kana)
  useEffect(() => {
    if (!order.length) return;

    if (finished) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    function tick() {
      const elapsed = (performance.now() - startRef.current) / 1000;
      setRunningTime(elapsed);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [order.length, finished]);

  function recordCorrectAnswer() {
    if (finished) return;
    if (submittingRef.current) return;

    submittingRef.current = true;

    const elapsed = (performance.now() - startRef.current) / 1000;
    const expected = current[1];

    setResults((prev) => [
      ...prev,
      {
        kana: current[0],
        romaji: expected,
        time: elapsed,
        difficulty: classify(elapsed),
      },
    ]);

    setPos((p) => p + 1);
  }

  function handleChange(value) {
    if (finished) return;

    setRomaji(value);
    if (error) setError(false);

    const typed = value.trim().toLowerCase();
    const expected = current[1];

    // Auto-submit only on exact match
    if (typed === expected) {
      recordCorrectAnswer();
    } else {
      // show "error" styling only when they've typed at least expected length
      if (typed.length >= expected.length) setError(true);
    }
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
    setRunningTime(0);
    submittingRef.current = false;
    startRef.current = performance.now();

    setTimeout(() => inputRef.current?.focus(), 0);
  }

  const answered = results.length;
  const total = kanaList.length;

  const avgTime = results.length
    ? results.reduce((sum, r) => sum + r.time, 0) / results.length
    : 0;

  const sortedRecap = useMemo(() => {
    return [...results].sort((a, b) => b.time - a.time);
  }, [results]);

  if (!order.length) return null;

  return (
    <main style={styles.main}>
      <div style={styles.shell}>
        <h1 style={styles.title}>Japanese Kana Trainer</h1>

        <button style={styles.resetBtn} onClick={resetAll} type="button">
          Reset
        </button>

        <div style={styles.statsRow}>
          <Stat label="Answered" value={String(answered)} />
          <Stat label="Progress" value={`${answered}/${total}`} />
          <Stat label="Avg time (s)" value={avgTime.toFixed(2)} />
          <Stat
            label="Running (s)"
            value={finished ? "0.00" : runningTime.toFixed(2)}
          />
        </div>

        {/* Main content area: Kana while playing, Recap table when finished */}
        {!finished ? (
          <div style={styles.kanaWrap}>
            <div style={styles.kana}>{current[0]}</div>
          </div>
        ) : (
          <div style={styles.recapWrap}>
            <div style={styles.recapTitle}>Session Recap</div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Kana</th>
                    <th style={styles.th}>Romaji</th>
                    <th style={styles.thRight}>Time (s)</th>
                    <th style={styles.th}>Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecap.map((r, idx) => (
                    <tr key={`${r.kana}-${idx}`} style={styles.tr}>
                      <td style={styles.tdKana}>{r.kana}</td>
                      <td style={styles.td}>{r.romaji}</td>
                      <td style={styles.tdRight}>{r.time.toFixed(2)}</td>
                      <td style={styles.td}>{r.difficulty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.doneText}>
              Sorted longest → shortest. Hit <b>Reset</b> to reshuffle.
            </div>
          </div>
        )}

        <div style={styles.inputCard}>
          <div style={styles.inputLabelRow}>
            <div style={styles.inputLabel}>Romaji</div>
          </div>

          <div style={styles.inputFieldWrap}>
            <input
              ref={inputRef}
              value={romaji}
              onChange={(e) => handleChange(e.target.value)}
              style={{
                ...styles.input,
                ...(error ? styles.inputError : null),
              }}
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              disabled={finished}
              placeholder=""
            />
            <div style={styles.inputHint}>Auto-submits when correct</div>
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
    width: "min(900px, 100%)",
    textAlign: "center",
  },

  title: {
    margin: 0,
    fontSize: "clamp(34px, 5vw, 44px)",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },

  resetBtn: {
    marginTop: 14,
    height: 34,
    padding: "0 14px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    fontWeight: 600,
  },

  statsRow: {
    marginTop: 22,
    display: "flex",
    gap: 28,
    justifyContent: "center",
    alignItems: "flex-start",
    flexWrap: "nowrap",
    overflowX: "auto",
    paddingBottom: 6,
  },

  stat: {
    textAlign: "center",
    minWidth: 140,
    flex: "0 0 auto",
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

  recapWrap: {
    marginTop: 26,
    marginBottom: 18,
    display: "grid",
    gap: 12,
    justifyItems: "center",
  },
  recapTitle: {
    fontSize: 14,
    fontWeight: 700,
    opacity: 0.9,
  },
  tableWrap: {
    width: "min(760px, 100%)",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    fontSize: 12,
    fontWeight: 700,
    padding: "12px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    opacity: 0.9,
  },
  thRight: {
    textAlign: "right",
    fontSize: 12,
    fontWeight: 700,
    padding: "12px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    opacity: 0.9,
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  td: {
    padding: "12px 14px",
    fontSize: 13,
    opacity: 0.9,
  },
  tdRight: {
    padding: "12px 14px",
    fontSize: 13,
    textAlign: "right",
    opacity: 0.9,
    fontVariantNumeric: "tabular-nums",
  },
  tdKana: {
    padding: "12px 14px",
    fontSize: 18,
    letterSpacing: "0.02em",
    opacity: 0.95,
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

  doneText: {
    fontSize: 12,
    opacity: 0.75,
    marginTop: 2,
  },
};