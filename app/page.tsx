"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Buckets (seconds)
const EASY_MAX = 0.5;
const MEDIUM_MAX = 1.5;

const LS_STATE_KEY = "kana_dojo_v1_state";
const LS_USER_KEY = "kana_dojo_v1_user";

function classify(seconds) {
  if (seconds <= EASY_MAX) return "easy";
  if (seconds <= MEDIUM_MAX) return "medium";
  return "hard";
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
  const kana = [];

  const hira_base = [
    ["あ","a"],["い","i"],["う","u"],["え","e"],["お","o"],
    ["か","ka"],["き","ki"],["く","ku"],["け","ke"],["こ","ko"],
    ["さ","sa"],["し","shi"],["す","su"],["せ","se"],["そ","so"],
    ["た","ta"],["ち","chi"],["つ","tsu"],["て","te"],["と","to"],
    ["な","na"],["に","ni"],["ぬ","nu"],["ね","ne"],["の","no"],
    ["は","ha"],["ひ","hi"],["ふ","fu"],["へ","he"],["ほ","ho"],
    ["ま","ma"],["み","mi"],["む","mu"],["め","me"],["も","mo"],
    ["や","ya"],["ゆ","yu"],["よ","yo"],
    ["ら","ra"],["り","ri"],["る","ru"],["れ","re"],["ろ","ro"],
    ["わ","wa"],["を","wo"],
    ["ん","n"],
  ];
  const kata_base = [
    ["ア","a"],["イ","i"],["ウ","u"],["エ","e"],["オ","o"],
    ["カ","ka"],["キ","ki"],["ク","ku"],["ケ","ke"],["コ","ko"],
    ["サ","sa"],["シ","shi"],["ス","su"],["セ","se"],["ソ","so"],
    ["タ","ta"],["チ","chi"],["ツ","tsu"],["テ","te"],["ト","to"],
    ["ナ","na"],["ニ","ni"],["ヌ","nu"],["ネ","ne"],["ノ","no"],
    ["ハ","ha"],["ヒ","hi"],["フ","fu"],["ヘ","he"],["ホ","ho"],
    ["マ","ma"],["ミ","mi"],["ム","mu"],["メ","me"],["モ","mo"],
    ["ヤ","ya"],["ユ","yu"],["ヨ","yo"],
    ["ラ","ra"],["リ","ri"],["ル","ru"],["レ","re"],["ロ","ro"],
    ["ワ","wa"],["ヲ","wo"],
    ["ン","n"],
  ];

  const hira_dak = [
    ["が","ga"],["ぎ","gi"],["ぐ","gu"],["げ","ge"],["ご","go"],
    ["ざ","za"],["じ","ji"],["ず","zu"],["ぜ","ze"],["ぞ","zo"],
    ["だ","da"],["ぢ","ji"],["づ","zu"],["で","de"],["ど","do"],
    ["ば","ba"],["び","bi"],["ぶ","bu"],["べ","be"],["ぼ","bo"],
    ["ぱ","pa"],["ぴ","pi"],["ぷ","pu"],["ぺ","pe"],["ぽ","po"],
  ];
  const kata_dak = [
    ["ガ","ga"],["ギ","gi"],["グ","gu"],["ゲ","ge"],["ゴ","go"],
    ["ザ","za"],["ジ","ji"],["ズ","zu"],["ゼ","ze"],["ゾ","zo"],
    ["ダ","da"],["ヂ","ji"],["ヅ","zu"],["デ","de"],["ド","do"],
    ["バ","ba"],["ビ","bi"],["ブ","bu"],["ベ","be"],["ボ","bo"],
    ["パ","pa"],["ピ","pi"],["プ","pu"],["ペ","pe"],["ポ","po"],
  ];

  // Small kana (xtsu; change to ltsu if you prefer)
  // const hira_small = [["ぁ","a"],["ぃ","i"],["ぅ","u"],["ぇ","e"],["ぉ","o"],["ゃ","ya"],["ゅ","yu"],["ょ","yo"],["っ","xtsu"]];
  // const kata_small = [["ァ","a"],["ィ","i"],["ゥ","u"],["ェ","e"],["ォ","o"],["ャ","ya"],["ュ","yu"],["ョ","yo"],["ッ","xtsu"]];

  // Yōon
  const yoon_hira = [
    ["きゃ","kya"],["きゅ","kyu"],["きょ","kyo"],
    ["しゃ","sha"],["しゅ","shu"],["しょ","sho"],
    ["ちゃ","cha"],["ちゅ","chu"],["ちょ","cho"],
    ["にゃ","nya"],["にゅ","nyu"],["にょ","nyo"],
    ["ひゃ","hya"],["ひゅ","hyu"],["ひょ","hyo"],
    ["みゃ","mya"],["みゅ","myu"],["みょ","myo"],
    ["りゃ","rya"],["りゅ","ryu"],["りょ","ryo"],
    ["ぎゃ","gya"],["ぎゅ","gyu"],["ぎょ","gyo"],
    ["じゃ","ja"],["じゅ","ju"],["じょ","jo"],
    ["びゃ","bya"],["びゅ","byu"],["びょ","byo"],
    ["ぴゃ","pya"],["ぴゅ","pyu"],["ぴょ","pyo"],
  ];
  const yoon_kata = [
    ["キャ","kya"],["キュ","kyu"],["キョ","kyo"],
    ["シャ","sha"],["シュ","shu"],["ショ","sho"],
    ["チャ","cha"],["チュ","chu"],["チョ","cho"],
    ["ニャ","nya"],["ニュ","nyu"],["ニョ","nyo"],
    ["ヒャ","hya"],["ヒュ","hyu"],["ヒョ","hyo"],
    ["ミャ","mya"],["ミュ","myu"],["ミョ","myo"],
    ["リャ","rya"],["リュ","ryu"],["リョ","ryo"],
    ["ギャ","gya"],["ギュ","gyu"],["ギョ","gyo"],
    ["ジャ","ja"],["ジュ","ju"],["ジョ","jo"],
    ["ビャ","bya"],["ビュ","byu"],["ビョ","byo"],
    ["ピャ","pya"],["ピュ","pyu"],["ピョ","pyo"],
  ];

  // Foreign kana (YOUR EXACT SPEC)
  const kata_foreign = [
    ["ヴァ","va"],["ヴィ","vi"],["ヴ","vu"],["ヴェ","ve"],["ヴォ","vo"],["ヴュ","vyu"],
    ["ファ","fa"],["フィ","fi"],["フェ","fe"],["フォ","fo"],["フュ","fyu"],
    // ["フャ","fya"],["フュ","fyu"],["フョ","fyo"],
    ["シェ","she"],["チェ","che"],["ジェ","je"],
    ["ティ","ti"],["ディ","di"],
    ["トゥ","tu"],["ドゥ","du"],
    ["テュ","tyu"],["デュ","dyu"],
    ["ツァ","tsa"],["ツィ","tsi"],["ツェ","tse"],["ツォ","tso"],
    // ["スィ","si"],["ズィ","zi"],
    ["ウィ","wi"],["ウェ","we"],["ウォ","wo"],
    ["クァ","kwa"],["クィ","kwi"],["クェ","kwe"],["クォ","kwo"],
    ["グァ","gwa"],
    // ["グィ","gwi"],["グェ","gwe"],["グォ","gwo"],
    ["イェ","ye"],
    // ["キェ","kye"],["ギェ","gye"],
    // ["ニェ","nye"],["ヒェ","hye"],["ビェ","bye"],["ピェ","pye"],
    // ["ミェ","mye"],["リェ","rye"],
  ];

  kana.push(
    ...hira_base, ...kata_base,
    ...hira_dak, ...kata_dak,
    //..hira_small, ...kata_small,
    ...yoon_hira, ...yoon_kata,
    ...kata_foreign
  );

  // Dedupe
  const seen = new Set();
  const out = [];
  for (const [k, r] of kana) {
    const key = `${k}__${r}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push([k, r]);
    }
  }
  return out;
}

const ALL_KANA = buildKanaList();

function loadState() {
  try {
    const raw = localStorage.getItem(LS_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(LS_STATE_KEY, JSON.stringify(state));
  } catch {}
}

export default function TestPage() {
  const router = useRouter();
  const kanaList = useMemo(() => ALL_KANA, []);

  const [userName, setUserName] = useState("");

  const [order, setOrder] = useState([]);
  const [pos, setPos] = useState(0);
  const [results, setResults] = useState([]);

  const [romaji, setRomaji] = useState("");
  const [error, setError] = useState("");

  // timer
  const startRef = useRef(0);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const rafRef = useRef(null);

  // Ensure name exists
  useEffect(() => {
    try {
      const savedName = localStorage.getItem(LS_USER_KEY) || "";
      const trimmed = savedName.trim();
      if (!trimmed) {
        router.replace("/");
        return;
      }
      setUserName(trimmed);
    } catch {
      router.replace("/");
    }
  }, [router]);

// Init session state (load or new)
useEffect(() => {
  const loaded = loadState();

  const isValidLoaded =
    loaded &&
    Array.isArray(loaded.order) &&
    typeof loaded.pos === "number" &&
    loaded.kanaLen === kanaList.length &&
    loaded.order.every(
      (x) => Number.isInteger(x) && x >= 0 && x < kanaList.length
    );

  if (isValidLoaded) {
    setOrder(loaded.order);
    setPos(loaded.pos);
    setResults(loaded.results || []);
    setRomaji("");
    setError("");
    startRef.current = performance.now() - (loaded.liveElapsedMs || 0);
  } else {
    // If kana list changed, old saved order becomes invalid => reset cleanly
    const newOrder = shuffle([...Array(kanaList.length).keys()]);
    setOrder(newOrder);
    setPos(0);
    setResults([]);
    setRomaji("");
    setError("");
    startRef.current = performance.now();

    saveState({
      kanaLen: kanaList.length,
      order: newOrder,
      pos: 0,
      results: [],
      liveElapsedMs: 0,
    });
  }
}, [kanaList.length]);

  // Live timer loop
  useEffect(() => {
    function tick() {
      const ms = performance.now() - startRef.current;
      setLiveElapsed(ms / 1000);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Persist
useEffect(() => {
  if (!order.length) return;
  saveState({
    kanaLen: kanaList.length,
    order,
    pos,
    results,
    liveElapsedMs: performance.now() - startRef.current,
  });
}, [order, pos, results, kanaList.length]);

  const total = kanaList.length;
  const answered = results.length;
  const avgTime = answered ? results.reduce((a, r) => a + r.time_s, 0) / answered : null;

  const finished = order.length > 0 && pos >= order.length;

  const current = useMemo(() => {
    if (!order.length || finished) return null;
    const idx = order[pos];
    const [kana, expected] = kanaList[idx];
    return { idx, kana, expected };
  }, [order, pos, finished, kanaList]);

  function resetAll() {
    const newOrder = shuffle([...Array(kanaList.length).keys()]);
    setOrder(newOrder);
    setPos(0);
    setResults([]);
    setRomaji("");
    setError("");
    startRef.current = performance.now();
    saveState({ order: newOrder, pos: 0, results: [], liveElapsedMs: 0 });
  }

  function handleAutoAdvance(nextValue) {
    if (!current) return;

    const typed = nextValue.trim().toLowerCase();

    if (error) setError("");

    if (typed === current.expected) {
      const elapsedSec = (performance.now() - startRef.current) / 1000;
      const bucket = classify(elapsedSec);

      const row = {
        user: userName,
        kana: current.kana,
        expected: current.expected,
        time_s: Math.round(elapsedSec * 10000) / 10000,
        bucket,
        ts: new Date().toISOString(),
      };

      setResults((r) => [...r, row]);
      setPos((p) => p + 1);

      // reset for next kana
      setRomaji("");
      setError("");
      startRef.current = performance.now();
    }
  }

  const focusList = useMemo(() => {
    if (!finished || results.length === 0) return [];

    const map = new Map();
    for (const r of results) {
      const key = `${r.kana}__${r.expected}`;
      if (!map.has(key)) {
        map.set(key, { kana: r.kana, expected: r.expected, hard: 0, times: [] });
      }
      const o = map.get(key);
      if (r.bucket === "hard") o.hard += 1;
      o.times.push(r.time_s);
    }

    const arr = [];
    for (const o of map.values()) {
      const avg_time = o.times.reduce((a, b) => a + b, 0) / o.times.length;
      arr.push({ ...o, avg_time, seen: o.times.length });
    }

    arr.sort((a, b) => {
      if (b.hard !== a.hard) return b.hard - a.hard;
      if (b.avg_time !== a.avg_time) return b.avg_time - a.avg_time;
      return b.seen - a.seen;
    });

    return arr;
  }, [finished, results]);

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <div style={styles.pageTitle}>Japanese Kana Trainer</div>
        <div style={styles.subRow}>
          <span style={styles.userChip}>User: {userName}</span>
        </div>

        <div style={styles.headerRow}>
          <Stat label="Answered" value={String(answered)} />
          <Stat label="Progress" value={`${Math.min(pos, total)}/${total}`} />
          <Stat label="Avg time (s)" value={avgTime == null ? "-" : avgTime.toFixed(2)} />
          <Stat label="Timer (s)" value={liveElapsed.toFixed(2)} />
          <button style={styles.resetBtn} onClick={resetAll} type="button">
            Reset
          </button>
        </div>

        {!finished && current && (
          <>
            <div style={styles.kanaBox}>{current.kana}</div>

            <div style={styles.form}>
              <input
                style={styles.input}
                value={romaji}
                onChange={(e) => {
                  const v = e.target.value;
                  setRomaji(v);
                  handleAutoAdvance(v);
                }}
                placeholder="Type romaji…"
                autoFocus
              />
              <button
                style={styles.smallBtn}
                type="button"
                onClick={() => {
                  if (!current) return;
                  const typed = romaji.trim().toLowerCase();
                  if (typed !== current.expected) setError("Not correct yet. Keep typing.");
                }}
              >
                Check
              </button>
            </div>

            {error && <div style={styles.error}>{error}</div>}
            <div style={styles.hint}>
              created by <b>William Nathan Thomas</b>
            </div>
          </>
        )}

        {finished && (
          <>
            <div style={styles.done}>Session complete 🎉</div>

            <div style={styles.sectionTitle}>What to focus on next 🎯</div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Kana</th>
                    <th style={styles.th}>Romaji</th>
                    <th style={styles.th}>Hard</th>
                    <th style={styles.th}>Avg time</th>
                    <th style={styles.th}>Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {focusList.slice(0, 40).map((r) => (
                    <tr key={`${r.kana}__${r.expected}`}>
                      <td style={styles.tdKana}>{r.kana}</td>
                      <td style={styles.td}>{r.expected}</td>
                      <td style={styles.td}>{r.hard}</td>
                      <td style={styles.td}>{r.avg_time.toFixed(2)}</td>
                      <td style={styles.td}>{r.seen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button style={styles.resetBtnBig} onClick={resetAll} type="button">
              Start New Session (Shuffle)
            </button>
          </>
        )}
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

const styles = {
  main: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0b0f19",
    color: "#e7eaf3",
    padding: 16,
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  },
  card: {
    width: "min(980px, 95vw)",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 18,
  },
  pageTitle: { fontSize: 22, fontWeight: 900, textAlign: "center" },
  subRow: { display: "flex", justifyContent: "center", marginTop: 8, marginBottom: 10 },
  userChip: {
    fontSize: 12,
    opacity: 0.85,
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.22)",
  },
  headerRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr) auto",
    gap: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  stat: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 12,
    padding: "10px 12px",
  },
  statLabel: { fontSize: 12, opacity: 0.75 },
  statValue: { fontSize: 18, fontWeight: 700, marginTop: 2 },
  resetBtn: {
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#e7eaf3",
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 600,
  },
  kanaBox: {
    textAlign: "center",
    fontSize: "18vw",
    lineHeight: 1,
    padding: "18px 0 8px 0",
    userSelect: "none",
  },
  form: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  input: {
    width: "min(520px, 72vw)",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.35)",
    color: "#e7eaf3",
    fontSize: 16,
    outline: "none",
  },
  smallBtn: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "#e7eaf3",
    cursor: "pointer",
    fontWeight: 700,
  },
  error: { marginTop: 10, textAlign: "center", color: "#ffb4b4", fontWeight: 700 },
  hint: { marginTop: 10, textAlign: "center", opacity: 0.8, fontSize: 13 },
  done: { textAlign: "center", fontSize: 22, fontWeight: 900, padding: "14px 0" },
  sectionTitle: { marginTop: 8, marginBottom: 8, fontSize: 16, fontWeight: 800 },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    opacity: 0.9,
    whiteSpace: "nowrap",
  },
  td: { padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" },
  tdKana: {
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontSize: 20,
    whiteSpace: "nowrap",
  },
  resetBtnBig: {
    marginTop: 14,
    width: "100%",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#e7eaf3",
    padding: "12px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
  },
};