"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "kana_trainer_state_v4";

export default function KanaTrainer() {
  // 255 items: Hiragana + Katakana + dakuten/handakuten + yōon + small kana + common foreign katakana
  const kanaList = useMemo(() => {
    const hiragana_basic = [
      ["あ", "a"], ["い", "i"], ["う", "u"], ["え", "e"], ["お", "o"],
      ["か", "ka"], ["き", "ki"], ["く", "ku"], ["け", "ke"], ["こ", "ko"],
      ["さ", "sa"], ["し", "shi"], ["す", "su"], ["せ", "se"], ["そ", "so"],
      ["た", "ta"], ["ち", "chi"], ["つ", "tsu"], ["て", "te"], ["と", "to"],
      ["な", "na"], ["に", "ni"], ["ぬ", "nu"], ["ね", "ne"], ["の", "no"],
      ["は", "ha"], ["ひ", "hi"], ["ふ", "fu"], ["へ", "he"], ["ほ", "ho"],
      ["ま", "ma"], ["み", "mi"], ["む", "mu"], ["め", "me"], ["も", "mo"],
      ["や", "ya"], ["ゆ", "yu"], ["よ", "yo"],
      ["ら", "ra"], ["り", "ri"], ["る", "ru"], ["れ", "re"], ["ろ", "ro"],
      ["わ", "wa"], ["を", "wo"],
      ["ん", "n"],
    ];

    const hiragana_daku = [
      ["が", "ga"], ["ぎ", "gi"], ["ぐ", "gu"], ["げ", "ge"], ["ご", "go"],
      ["ざ", "za"], ["じ", "ji"], ["ず", "zu"], ["ぜ", "ze"], ["ぞ", "zo"],
      ["だ", "da"], ["ぢ", "di"], ["づ", "du"], ["で", "de"], ["ど", "do"],
      ["ば", "ba"], ["び", "bi"], ["ぶ", "bu"], ["べ", "be"], ["ぼ", "bo"],
      ["ぱ", "pa"], ["ぴ", "pi"], ["ぷ", "pu"], ["ぺ", "pe"], ["ぽ", "po"],
    ];

    const hiragana_yoon = [
      ["きゃ", "kya"], ["きゅ", "kyu"], ["きょ", "kyo"],
      ["しゃ", "sha"], ["しゅ", "shu"], ["しょ", "sho"],
      ["ちゃ", "cha"], ["ちゅ", "chu"], ["ちょ", "cho"],
      ["にゃ", "nya"], ["にゅ", "nyu"], ["にょ", "nyo"],
      ["ひゃ", "hya"], ["ひゅ", "hyu"], ["ひょ", "hyo"],
      ["みゃ", "mya"], ["みゅ", "myu"], ["みょ", "myo"],
      ["りゃ", "rya"], ["りゅ", "ryu"], ["りょ", "ryo"],
      ["ぎゃ", "gya"], ["ぎゅ", "gyu"], ["ぎょ", "gyo"],
      ["じゃ", "ja"], ["じゅ", "ju"], ["じょ", "jo"],
      ["びゃ", "bya"], ["びゅ", "byu"], ["びょ", "byo"],
      ["ぴゃ", "pya"], ["ぴゅ", "pyu"], ["ぴょ", "pyo"],
    ];

    const katakana_basic = [
      ["ア", "a"], ["イ", "i"], ["ウ", "u"], ["エ", "e"], ["オ", "o"],
      ["カ", "ka"], ["キ", "ki"], ["ク", "ku"], ["ケ", "ke"], ["コ", "ko"],
      ["サ", "sa"], ["シ", "shi"], ["ス", "su"], ["セ", "se"], ["ソ", "so"],
      ["タ", "ta"], ["チ", "chi"], ["ツ", "tsu"], ["テ", "te"], ["ト", "to"],
      ["ナ", "na"], ["ニ", "ni"], ["ヌ", "nu"], ["ネ", "ne"], ["ノ", "no"],
      ["ハ", "ha"], ["ヒ", "hi"], ["フ", "fu"], ["ヘ", "he"], ["ホ", "ho"],
      ["マ", "ma"], ["ミ", "mi"], ["ム", "mu"], ["メ", "me"], ["モ", "mo"],
      ["ヤ", "ya"], ["ユ", "yu"], ["ヨ", "yo"],
      ["ラ", "ra"], ["リ", "ri"], ["ル", "ru"], ["レ", "re"], ["ロ", "ro"],
      ["ワ", "wa"], ["ヲ", "wo"],
      ["ン", "n"],
    ];

    const katakana_daku = [
      ["ガ", "ga"], ["ギ", "gi"], ["グ", "gu"], ["ゲ", "ge"], ["ゴ", "go"],
      ["ザ", "za"], ["ジ", "ji"], ["ズ", "zu"], ["ゼ", "ze"], ["ゾ", "zo"],
      ["ダ", "da"], ["ヂ", "ji"], ["ヅ", "zu"], ["デ", "de"], ["ド", "do"],
      ["バ", "ba"], ["ビ", "bi"], ["ブ", "bu"], ["ベ", "be"], ["ボ", "bo"],
      ["パ", "pa"], ["ピ", "pi"], ["プ", "pu"], ["ペ", "pe"], ["ポ", "po"],
    ];

    const katakana_yoon = [
      ["キャ", "kya"], ["キュ", "kyu"], ["キョ", "kyo"],
      ["シャ", "sha"], ["シュ", "shu"], ["ショ", "sho"],
      ["チャ", "cha"], ["チュ", "chu"], ["チョ", "cho"],
      ["ニャ", "nya"], ["ニュ", "nyu"], ["ニョ", "nyo"],
      ["ヒャ", "hya"], ["ヒュ", "hyu"], ["ヒョ", "hyo"],
      ["ミャ", "mya"], ["ミュ", "myu"], ["ミョ", "myo"],
      ["リャ", "rya"], ["リュ", "ryu"], ["リョ", "ryo"],
      ["ギャ", "gya"], ["ギュ", "gyu"], ["ギョ", "gyo"],
      ["ジャ", "ja"], ["ジュ", "ju"], ["ジョ", "jo"],
      ["ビャ", "bya"], ["ビュ", "byu"], ["ビョ", "byo"],
      ["ピャ", "pya"], ["ピュ", "pyu"], ["ピョ", "pyo"],
    ];

    //const small_hiragana = [
    //  ["ぁ", "xa"], ["ぃ", "xi"], ["ぅ", "xu"], ["ぇ", "xe"], ["ぉ", "xo"],
    //  ["ゃ", "xya"], ["ゅ", "xyu"], ["ょ", "xyo"],
    //  ["っ", "xtsu"],
    //  ["ゎ", "xwa"],
    //  ["ゕ", "xka"], ["ゖ", "xke"],
    //];

    //const small_katakana = [
    //  ["ァ", "xa"], ["ィ", "xi"], ["ゥ", "xu"], ["ェ", "xe"], ["ォ", "xo"],
    //  ["ャ", "xya"], ["ュ", "xyu"], ["ョ", "xyo"],
    //  ["ッ", "xtsu"],
    //  ["ヮ", "xwa"],
    //  ["ヵ", "xka"], ["ヶ", "xke"],
    //];

    // Common foreign-sound katakana (33 items) to hit 241 total
    const extras = [
      ["ヴ", "vu"], ["ウィ", "wi"], ["ウェ", "we"], ["ウォ", "wo"],
      ["ヴァ", "va"], ["ヴィ", "vi"], ["ヴェ", "ve"], ["ヴォ", "vo"], ["ヴュ", "vyu"],
      ["ファ", "fa"], ["フィ", "fi"], ["フェ", "fe"], ["フォ", "fo"], ["フュ", "fyu"],
      ["ティ", "ti"], ["トゥ", "tu"], ["ディ", "di"], ["ドゥ", "du"], ["ドュ", "tyu"],["デュ", "dyu"],
      ["シェ", "she"], ["チェ", "che"], ["ジェ", "je"], ["イェ", "ye"],
      ["ツァ", "tsa"], ["ツィ", "tsi"], ["ツェ", "tse"], ["ツォ", "tso"],
      ["グァ", "gwa"],
      ["クァ", "kwa"], ["クィ", "kwi"], ["クェ", "kwe"], ["クォ", "kwo"],
    ];

    return [
      ...hiragana_basic,
      ...hiragana_daku,
      ...hiragana_yoon,
      ...katakana_basic,
      ...katakana_daku,
      ...katakana_yoon,
      ...extras,
    ];
  }, []);

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
  const [started, setStarted] = useState(false); // <-- Welcome gate

  // Load state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) throw new Error("no saved state");

      const saved = JSON.parse(raw);
      const ok =
        saved &&
        saved.version === 4 &&
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
  }, [kanaList.length]);

  // Persist state
  useEffect(() => {
    if (!order.length) return;
    const payload = {
      version: 4,
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
  }, [order, pos, results, started, kanaList.length]);

  const finished = order.length > 0 && pos >= order.length;
  const current = !finished ? kanaList[order[pos]] : null;

  function classify(seconds) {
    if (seconds <= 2.0) return "Easy";
    if (seconds <= 4.0) return "Medium";
    return "Hard";
  }

  // Reset timer each new kana (only after started)
  useEffect(() => {
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

    setTimeout(() => inputRef.current?.focus(), 0);
  }, [order, pos, finished, started]);

  // Live running timer (only after started)
  useEffect(() => {
    if (!order.length) return;

    // Stop ticking if not started or finished
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
  }, [order.length, started, finished]);

  function recordCorrectAnswer() {
    if (finished || !started) return;
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

    // Before starting: ignore typing (we start on keydown and prevent the character)
    if (!started) return;

    setRomaji(value);
    if (error) setError(false);

    const typed = value.trim().toLowerCase();
    const expected = current[1];

    if (typed === expected) {
      recordCorrectAnswer();
    } else {
      if (typed.length >= expected.length) setError(true);
    }
  }

  function handleKeyDown(e) {
    if (finished) return;

    // Welcome gate: first key starts the session and does NOT type into the box
    if (!started) {
      // Prevent “first key” from appearing in the input for keys that produce characters
      if (e.key.length === 1 || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
      }
      setStarted(true);
      return;
    }

    // Optional: allow Enter to do nothing (since autosubmit handles correctness)
    // Keeping this empty intentionally.
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
    setStarted(false);
    submittingRef.current = false;

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
            value={started && !finished ? runningTime.toFixed(2) : "0.00"}
          />
        </div>

        {!finished ? (
          <div style={styles.kanaWrap}>
            <div style={styles.kana}>{started ? current[0] : "Welcome!"}</div>
            {!started && (
              <div style={styles.welcomeHint}>
                Click the textbox, then press any key to begin.
              </div>
            )}
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
              onKeyDown={handleKeyDown}
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
            <div style={styles.inputHint}>
              {!started ? "Press any key to begin" : "Auto-submits when correct"}
            </div>
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
  shell: { width: "min(900px, 100%)", textAlign: "center" },
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
  stat: { textAlign: "center", minWidth: 140, flex: "0 0 auto" },
  statLabel: { fontSize: 11, opacity: 0.72, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: 700, letterSpacing: "-0.01em" },

  kanaWrap: { marginTop: 34, marginBottom: 24, display: "grid", placeItems: "center", gap: 10 },
  kana: {
    fontSize: "clamp(84px, 10vw, 118px)",
    fontWeight: 500,
    lineHeight: 1,
    letterSpacing: "0.02em",
    userSelect: "none",
    filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.35))",
  },
  welcomeHint: {
    fontSize: 12,
    opacity: 0.7,
  },

  recapWrap: { marginTop: 26, marginBottom: 18, display: "grid", gap: 12, justifyItems: "center" },
  recapTitle: { fontSize: 14, fontWeight: 700, opacity: 0.9 },
  tableWrap: {
    width: "min(760px, 100%)",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
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
  doneText: { fontSize: 12, opacity: 0.75, marginTop: 2 },

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
  inputLabelRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  inputLabel: { fontSize: 12, opacity: 0.85 },
  inputFieldWrap: { position: "relative" },
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
};