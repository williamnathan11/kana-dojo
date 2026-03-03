"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "kana_trainer_state_v6";
const KANA_URL = "/kana.json";

export default function KanaTrainer() {
  const isMobileUI = useMedia("(pointer: coarse), (max-width: 640px)");

  const inputRef = useRef(null);
  const startRef = useRef(0);
  const rafRef = useRef(null);
  const submittingRef = useRef(false);

  const [kanaList, setKanaList] = useState(null); // null = loading
  const [kanaLoadError, setKanaLoadError] = useState("");

  const [order, setOrder] = useState([]);
  const [pos, setPos] = useState(0);
  const [romaji, setRomaji] = useState("");
  const [results, setResults] = useState([]); // { kana, romaji, time, difficulty }
  const [error, setError] = useState(false);
  const [runningTime, setRunningTime] = useState(0);
  const [started, setStarted] = useState(false); // Welcome gate

  // Load kana.json
  useEffect(() => {
    let cancelled = false;

    async function loadKana() {
      try {
        setKanaLoadError("");
        setKanaList(null);

        const res = await fetch(KANA_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load ${KANA_URL} (${res.status})`);

        const data = await res.json();
        if (!data || !Array.isArray(data.items)) {
          throw new Error("Invalid kana.json format: expected { items: [...] }");
        }

        const list = data.items.map((x) => [String(x.kana ?? ""), String(x.romaji ?? "")]);

        if (!list.length) throw new Error("kana.json has 0 items");
        for (const [k, r] of list) {
          if (!k.trim() || !r.trim()) throw new Error("kana.json contains empty kana/romaji");
        }

        if (!cancelled) setKanaList(list);
      } catch (e) {
        if (!cancelled) {
          setKanaLoadError(e?.message || "Failed to load kana.json");
          setKanaList([]); // stop spinner
        }
      }
    }

    loadKana();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load state (after kanaList available)
  useEffect(() => {
    if (!kanaList || kanaList.length === 0) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) throw new Error("no saved state");

      const saved = JSON.parse(raw);
      const ok =
        saved &&
        saved.version === 6 &&
        Array.isArray(saved.order) &&
        typeof saved.pos === "number" &&
        Array.isArray(saved.results) &&
        saved.kanaCount === kanaList.length &&
        typeof saved.started === "boolean";

      if (!ok) throw new Error("bad saved state");

      setOrder(saved.order);
      setPos(saved.pos);
      setResults(saved.results);
      setStarted(saved.started);
    } catch {
      const shuffled = shuffle([...Array(kanaList.length).keys()]);
      setOrder(shuffled);
      setPos(0);
      setResults([]);
      setStarted(false);
    }
  }, [kanaList]);

  // Persist state
  useEffect(() => {
    if (!kanaList || kanaList.length === 0) return;
    if (!order.length) return;

    const payload = {
      version: 6,
      kanaCount: kanaList.length,
      order,
      pos,
      results,
      started,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [kanaList, order, pos, results, started]);

  const finished = kanaList && order.length > 0 && pos >= order.length;
  const current = !finished && kanaList ? kanaList[order[pos]] : null;

  function classify(seconds) {
    if (seconds <= 2.0) return "Easy";
    if (seconds <= 4.0) return "Medium";
    return "Hard";
  }

  // Reset timer each new kana (only after started)
  useEffect(() => {
    if (!kanaList || kanaList.length === 0) return;
    if (!order.length) return;

    if (!started) {
      setRunningTime(0);
      return;
    }
    if (finished) return;

    submittingRef.current = false;
    startRef.current = performance.now();
    setRunningTime(0);
    setRomaji("");
    setError(false);

    // Mobile: don't force-focus (prevents keyboard popping / layout jump)
    if (!isMobileUI) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [kanaList, order, pos, finished, started, isMobileUI]);

  // Live running timer
  useEffect(() => {
    if (!kanaList || kanaList.length === 0) return;
    if (!order.length) return;

    if (!started || finished) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      setRunningTime(0);
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
  }, [kanaList, order.length, started, finished]);

  function recordCorrectAnswer() {
    if (finished || !started || !current) return;
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

    // Mobile fallback: if keydown doesn't fire cleanly, first typed char starts session
    if (!started) {
      if (value && value.trim().length > 0) {
        setRomaji("");
        setStarted(true);
      }
      return;
    }

    setRomaji(value);
    if (error) setError(false);

    const typed = value.trim().toLowerCase();
    const expected = current?.[1];

    if (expected && typed === expected) {
      recordCorrectAnswer();
    } else {
      if (expected && typed.length >= expected.length) setError(true);
    }
  }

  function handleKeyDown(e) {
    if (finished) return;

    // Welcome gate: first key starts session and does NOT type into the input
    if (!started) {
      if (e.key && (e.key.length === 1 || e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
      }
      setRomaji("");
      setStarted(true);
      return;
    }
  }

  function resetAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    if (!kanaList || kanaList.length === 0) return;

    const shuffled = shuffle([...Array(kanaList.length).keys()]);
    setOrder(shuffled);
    setPos(0);
    setResults([]);
    setRomaji("");
    setError(false);
    setRunningTime(0);
    setStarted(false);
    submittingRef.current = false;
    // No autofocus on reset (mobile-friendly)
  }

  const answered = results.length;
  const total = kanaList?.length ?? 0;

  const avgTime = results.length
    ? results.reduce((sum, r) => sum + r.time, 0) / results.length
    : 0;

  const sortedRecap = useMemo(() => {
    return [...results].sort((a, b) => b.time - a.time);
  }, [results]);

  // Loading / error states
  if (kanaList === null) {
    return (
      <main style={{ ...styles.main, minHeight: "100dvh" }}>
        <div style={styles.shell}>
          <h1 style={styles.title}>Japanese Kana Trainer</h1>
          <div style={{ marginTop: 14, opacity: 0.75 }}>Loading kana…</div>
        </div>
      </main>
    );
  }

  if (kanaLoadError) {
    return (
      <main style={{ ...styles.main, minHeight: "100dvh" }}>
        <div style={styles.shell}>
          <h1 style={styles.title}>Japanese Kana Trainer</h1>
          <div style={{ marginTop: 14, opacity: 0.9 }}>
            Couldn’t load <b>{KANA_URL}</b>
          </div>
          <div style={{ marginTop: 8, opacity: 0.7 }}>{kanaLoadError}</div>
        </div>
      </main>
    );
  }

  if (!order.length) return null;

  const mainStyle = {
    ...styles.main,
    minHeight: "100dvh",
    justifyContent: isMobileUI ? "flex-start" : "center",
    paddingTop: isMobileUI ? "18px" : "48px",
    paddingLeft: isMobileUI ? "12px" : "16px",
    paddingRight: isMobileUI ? "12px" : "16px",
    paddingBottom: isMobileUI
      ? "calc(16px + env(safe-area-inset-bottom))"
      : "48px",
  };

  const statsRowStyle = {
    ...styles.statsRow,
    flexWrap: isMobileUI ? "wrap" : "nowrap",
    overflowX: "visible",
    gap: isMobileUI ? 14 : 28,
    rowGap: isMobileUI ? 14 : 0,
  };

  const statStyle = {
    ...styles.stat,
    minWidth: isMobileUI ? 130 : 140,
  };

  const inputCardStyle = isMobileUI
    ? {
        ...styles.inputCard,
        position: "sticky",
        bottom: "calc(10px + env(safe-area-inset-bottom))",
        backdropFilter: "blur(10px)",
      }
    : styles.inputCard;

  const inputStyle = {
    ...styles.input,
    height: isMobileUI ? 52 : 44,
    fontSize: 16, // prevents iOS input zoom
    paddingRight: isMobileUI ? 14 : 190,
  };

  return (
    <main style={mainStyle}>
      <div style={{ ...styles.shell, width: "100%", maxWidth: 900 }}>
        <h1 style={styles.title}>Japanese Kana Trainer</h1>

        <button style={styles.resetBtn} onClick={resetAll} type="button">
          Reset
        </button>

        <div style={statsRowStyle}>
          <Stat label="Answered" value={String(answered)} statStyle={statStyle} />
          <Stat label="Progress" value={`${answered}/${total}`} statStyle={statStyle} />
          <Stat label="Avg time (s)" value={avgTime.toFixed(2)} statStyle={statStyle} />
          <Stat
            label="Running (s)"
            value={started && !finished ? runningTime.toFixed(2) : "0.00"}
            statStyle={statStyle}
          />
        </div>

        {!finished ? (
          <div style={styles.kanaWrap}>
            <div style={started ? styles.kana : styles.welcome}>
              {started ? current?.[0] : "Welcome!"}
            </div>
            {!started && (
              <div style={styles.welcomeHint}>
                Tap the textbox, then type to begin.
              </div>
            )}
          </div>
        ) : (
          <div style={styles.recapWrap}>
            <div style={styles.recapTitle}>Session Recap</div>

            {isMobileUI ? (
              <div style={styles.cardList}>
                {sortedRecap.map((r, idx) => (
                  <div key={`${r.kana}-${idx}`} style={styles.recapCard}>
                    <div style={styles.recapCardKana}>{r.kana}</div>
                    <div style={styles.recapCardMeta}>
                      <div style={styles.recapCardRow}>
                        <span style={styles.recapKey}>Romaji</span>
                        <span style={styles.recapVal}>{r.romaji}</span>
                      </div>
                      <div style={styles.recapCardRow}>
                        <span style={styles.recapKey}>Time</span>
                        <span style={styles.recapVal}>{r.time.toFixed(2)} s</span>
                      </div>
                      <div style={styles.recapCardRow}>
                        <span style={styles.recapKey}>Difficulty</span>
                        <span style={styles.recapVal}>{r.difficulty}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
            )}

            <div style={styles.doneText}>
              Sorted longest → shortest. Hit <b>Reset</b> to reshuffle.
            </div>
          </div>
        )}

        <div style={inputCardStyle}>
          <div style={styles.inputLabelRow}>
            <div style={styles.inputLabel}>Romaji</div>
          </div>

          <div style={styles.inputFieldWrap}>
            <input
              ref={inputRef}
              value={romaji}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                ...inputStyle,
                ...(error ? styles.inputError : null),
              }}
              inputMode="text"
              enterKeyHint="done"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={finished}
              placeholder=""
            />

            {!isMobileUI && (
              <div style={styles.inputHint}>
                {!started ? "Press any key to begin" : "Auto-submits when correct"}
              </div>
            )}
          </div>

          {isMobileUI && (
            <div style={styles.inputHintBelow}>
              {!started ? "Press any key to begin" : "Auto-submits when correct"}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, statStyle }) {
  return (
    <div style={statStyle}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function useMedia(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, [query]);

  return matches;
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
    background:
      "radial-gradient(1200px 600px at 50% 15%, rgba(255,255,255,0.06), rgba(0,0,0,0)), #0b0f19",
    color: "rgba(255,255,255,0.92)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxSizing: "border-box",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  },

  shell: { textAlign: "center" },

  title: {
    margin: 0,
    fontSize: "clamp(30px, 5vw, 44px)",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },

  resetBtn: {
    marginTop: 14,
    height: 40,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    fontWeight: 700,
    touchAction: "manipulation",
  },

  statsRow: {
    marginTop: 18,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingBottom: 6,
  },

  stat: { textAlign: "center", flex: "0 0 auto" },
  statLabel: { fontSize: 11, opacity: 0.72, marginBottom: 6 },
  statValue: { fontSize: 26, fontWeight: 750, letterSpacing: "-0.01em" },

  kanaWrap: {
    marginTop: 26,
    marginBottom: 16,
    display: "grid",
    placeItems: "center",
    gap: 10,
  },
  kana: {
    fontSize: "clamp(76px, 12vw, 118px)",
    fontWeight: 500,
    lineHeight: 1,
    letterSpacing: "0.02em",
    userSelect: "none",
    filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.35))",
  },
  welcome: {
    fontFamily: "Georgia",
    fontSize: "clamp(56px, 10vw, 92px)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  welcomeHint: { fontSize: 12, opacity: 0.7 },

  recapWrap: { marginTop: 18, marginBottom: 14, display: "grid", gap: 12, justifyItems: "center" },
  recapTitle: { fontSize: 14, fontWeight: 700, opacity: 0.9 },

  tableWrap: {
    width: "min(760px, 100%)",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 560 },
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
  tr: { borderBottom: "1px solid rgba(255,255,255,0.06)" },
  td: { padding: "12px 14px", fontSize: 13, opacity: 0.9 },
  tdRight: {
    padding: "12px 14px",
    fontSize: 13,
    textAlign: "right",
    opacity: 0.9,
    fontVariantNumeric: "tabular-nums",
  },
  tdKana: { padding: "12px 14px", fontSize: 18, letterSpacing: "0.02em", opacity: 0.95 },

  cardList: {
    width: "min(760px, 100%)",
    display: "grid",
    gap: 10,
  },
  recapCard: {
    display: "grid",
    gridTemplateColumns: "64px 1fr",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
  },
  recapCardKana: {
    fontSize: 30,
    display: "grid",
    placeItems: "center",
    opacity: 0.95,
  },
  recapCardMeta: { display: "grid", gap: 6 },
  recapCardRow: { display: "flex", justifyContent: "space-between", gap: 10 },
  recapKey: { fontSize: 12, opacity: 0.65 },
  recapVal: { fontSize: 13, opacity: 0.92, fontVariantNumeric: "tabular-nums" },

  doneText: { fontSize: 12, opacity: 0.75, marginTop: 2 },

  inputCard: {
    width: "min(560px, 100%)",
    margin: "0 auto",
    padding: 16,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    textAlign: "left",
  },
  inputLabelRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  inputLabel: { fontSize: 12, opacity: 0.85 },
  inputFieldWrap: { position: "relative" },
  input: {
    width: "100%",
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
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
  inputHintBelow: {
    marginTop: 8,
    fontSize: 11,
    opacity: 0.62,
  },
};