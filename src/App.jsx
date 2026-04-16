import { useState, useEffect, useRef, useCallback } from "react";
import CytoscapeComponent from "react-cytoscapejs";

// ─────────────────────────────────────────
//  DFA MINIMIZATION LOGIC
// ─────────────────────────────────────────
function minimizeDFA(dfa) {
  const { states, alphabet, transitions, accept } = dfa;
  let steps = [];
  let P = [accept, states.filter((s) => !accept.includes(s))].filter(
    (g) => g.length > 0
  );

  steps.push({
    title: "Initial Partition",
    phase: "setup",
    partitions: JSON.parse(JSON.stringify(P)),
    explanation:
      "Divide states into FINAL (accepting) and NON-FINAL groups. This is the foundation — states with different acceptance behavior can never be equivalent.",
  });

  let iteration = 2;
  let changed = true;

  while (changed) {
    changed = false;
    let newP = [];

    for (let group of P) {
      let map = {};
      for (let state of group) {
        let key = alphabet
          .map((a) => {
            let next = transitions[state]?.[a];
            if (!next) return -1;
            return P.findIndex((g) => g.includes(next));
          })
          .join("|");
        if (!map[key]) map[key] = [];
        map[key].push(state);
      }

      let splitGroups = Object.values(map);
      if (splitGroups.length > 1) {
        steps.push({
          title: `Split Group`,
          phase: "split",
          partitions: JSON.parse(JSON.stringify(splitGroups)),
          explanation: `Group [${group.join(", ")}] has states that behave differently on some input. We split based on where transitions lead — states in different equivalence classes cannot be merged.`,
        });
        iteration++;
        changed = true;
      }
      newP.push(...splitGroups);
    }

    if (changed) {
      steps.push({
        title: `Refined Partition`,
        phase: "refine",
        partitions: JSON.parse(JSON.stringify(newP)),
        explanation:
          "Partition updated after splitting. We repeat until no further splits occur — this guarantees the minimum number of equivalence classes.",
      });
      iteration++;
    }

    P = newP;
  }

  steps.push({
    title: "Minimized DFA",
    phase: "final",
    partitions: JSON.parse(JSON.stringify(P)),
    explanation:
      "No further refinements are possible. Each partition class becomes exactly one state in the minimized DFA. Equivalent states have been merged.",
    isFinal: true,
  });

  return steps;
}

function buildMinimizedDFA(dfa, partitions) {
  const { alphabet, transitions, accept } = dfa;
  let mapping = {};
  let newAccept = [];

  partitions.forEach((group, i) => {
    group.forEach((s) => (mapping[s] = "G" + i));
    if (group.some((s) => accept.includes(s))) newAccept.push("G" + i);
  });

  let newTransitions = {};
  partitions.forEach((group, i) => {
    let rep = group[0];
    newTransitions["G" + i] = {};
    alphabet.forEach((a) => {
      let target = transitions[rep]?.[a];
      newTransitions["G" + i][a] = target ? mapping[target] : undefined;
    });
  });

  return {
    states: Object.keys(newTransitions),
    transitions: newTransitions,
    accept: newAccept,
  };
}

function generateGraph(dfa, finalStates) {
  const { states, alphabet, transitions } = dfa;
  const edgeMap = {};

  states.forEach((from) => {
    alphabet.forEach((symbol) => {
      const to = transitions[from]?.[symbol];
      if (!to) return;
      const key = `${from}→${to}`;
      if (!edgeMap[key]) edgeMap[key] = { from, to, symbols: [] };
      edgeMap[key].symbols.push(symbol);
    });
  });

  const nodes = states.map((s) => ({
    data: { id: s, label: s },
    classes: (finalStates || []).includes(s) ? "final" : "normal",
  }));

  const edges = Object.values(edgeMap).map(({ from, to, symbols }) => ({
    data: {
      id: `${from}-${to}`,
      source: from,
      target: to,
      label: symbols.join(", "),
    },
  }));

  return [...nodes, ...edges];
}

// ─────────────────────────────────────────
//  PHASE BADGE
// ─────────────────────────────────────────
function PhaseBadge({ phase }) {
  const map = {
    setup:  { label: "SETUP",   color: "#6ee7f7" },
    split:  { label: "SPLIT",   color: "#fb923c" },
    refine: { label: "REFINE",  color: "#a78bfa" },
    final:  { label: "FINAL",   color: "#4ade80" },
  };
  const { label, color } = map[phase] || map.setup;
  return (
    <span
      style={{
        background: color + "22",
        color,
        border: `1px solid ${color}55`,
        borderRadius: 4,
        fontSize: 10,
        fontFamily: "'Space Mono', monospace",
        fontWeight: 700,
        letterSpacing: "0.12em",
        padding: "2px 8px",
      }}
    >
      {label}
    </span>
  );
}

// ─────────────────────────────────────────
//  CYTOSCAPE STYLESHEET
// ─────────────────────────────────────────
const makeCyStyle = (dark) => [
  {
    selector: "node",
    style: {
      label: "data(label)",
      "text-valign": "center",
      "text-halign": "center",
      color: dark ? "#e2e8f0" : "#1e293b",
      "font-family": "Space Mono, monospace",
      "font-size": "13px",
      "font-weight": "700",
      width: 44,
      height: 44,
      "background-color": dark ? "#1e293b" : "#f1f5f9",
      "border-width": 2,
      "border-color": dark ? "#334155" : "#cbd5e1",
    },
  },
  {
    selector: "node.final",
    style: {
      "background-color": dark ? "#0f3d2e" : "#dcfce7",
      "border-color": "#22c55e",
      "border-width": 3,
      color: "#4ade80",
    },
  },
  {
    selector: "edge",
    style: {
      "curve-style": "bezier",
      "control-point-step-size": 60,
      "target-arrow-shape": "triangle",
      "line-color": dark ? "#334155" : "#94a3b8",
      "target-arrow-color": dark ? "#334155" : "#94a3b8",
      label: "data(label)",
      "font-size": "11px",
      "font-family": "Space Mono, monospace",
      color: dark ? "#94a3b8" : "#475569",
      "text-background-color": dark ? "#0f172a" : "#f8fafc",
      "text-background-opacity": 1,
      "text-background-padding": "3px",
      "text-background-shape": "roundrectangle",
    },
  },
  {
    selector: "edge:loop",
    style: { "curve-style": "loop", "loop-direction": "-45deg", "loop-sweep": "45deg" },
  },
];

// ─────────────────────────────────────────
//  GRAPH PANEL
// ─────────────────────────────────────────
function GraphPanel({ elements, dark, title, subtitle }) {
  return (
    <div
      style={{
        background: dark ? "rgba(15,23,42,0.6)" : "rgba(248,250,252,0.8)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", color: dark ? "#94a3b8" : "#64748b", textTransform: "uppercase", fontFamily: "Space Mono, monospace" }}>
          {title}
        </span>
        <span style={{ fontSize: 11, color: dark ? "#475569" : "#94a3b8", fontFamily: "Space Mono, monospace" }}>{subtitle}</span>
      </div>
      {elements.length === 0 ? (
        <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: dark ? "#334155" : "#cbd5e1", fontSize: 13, fontFamily: "Space Mono, monospace", letterSpacing: "0.05em" }}>
          — awaiting input —
        </div>
      ) : (
        <CytoscapeComponent
          elements={elements}
          layout={{ name: "breadthfirst", directed: true, padding: 40, spacingFactor: 1.6, animate: true, animationDuration: 600 }}
          style={{ width: "100%", height: 280, borderRadius: 10, background: "transparent" }}
          stylesheet={makeCyStyle(dark)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(true);
  const [numStates, setNumStates] = useState(4);
  const [alphabetInput, setAlphabetInput] = useState("0,1");
  const [states, setStates] = useState([]);
  const [alphabet, setAlphabet] = useState([]);
  const [transitions, setTransitions] = useState({});
  const [finalStates, setFinalStates] = useState([]);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [graph, setGraph] = useState([]);
  const [finalGraph, setFinalGraph] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2000);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    const s = Array.from({ length: numStates }, (_, i) => `q${i}`);
    setStates(s);
  }, [numStates]);

  useEffect(() => {
    const a = alphabetInput.split(",").map((x) => x.trim()).filter(Boolean);
    setAlphabet(a);
  }, [alphabetInput]);

  useEffect(() => {
    let t = {};
    states.forEach((st) => {
      t[st] = {};
      alphabet.forEach((a) => {
        t[st][a] = transitions?.[st]?.[a] || "";
      });
    });
    setTransitions(t);
    // eslint-disable-next-line
  }, [states, alphabet]);

  useEffect(() => {
    if (!playing || steps.length === 0) return;
    const timer = setTimeout(() => {
      setStepIndex((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        setPlaying(false);
        return prev;
      });
    }, speed);
    return () => clearTimeout(timer);
  }, [playing, stepIndex, speed, steps.length]);

  const handleRun = () => {
    const dfa = { states, alphabet, transitions, accept: finalStates };
    const resultSteps = minimizeDFA(dfa);
    setSteps(resultSteps);
    setStepIndex(0);
    setGraph(generateGraph(dfa, finalStates));
    const minimized = buildMinimizedDFA(dfa, resultSteps[resultSteps.length - 1].partitions);
    setFinalGraph(generateGraph(minimized, minimized.accept));
    setHasRun(true);
    setPlaying(false);
  };

  // ── Shared input style
  const inputClass = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
    background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
    color: dark ? "#e2e8f0" : "#1e293b",
    fontFamily: "Space Mono, monospace",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  const selectClass = {
    ...inputClass,
    padding: "6px 8px",
    cursor: "pointer",
  };

  const step = steps[stepIndex];
  const isAlreadyMinimal = step?.isFinal && step?.partitions.length === states.length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dark
          ? "radial-gradient(ellipse at 20% 10%, #0f1e35 0%, #080d18 60%, #0a0f1e 100%)"
          : "radial-gradient(ellipse at 20% 10%, #e8eef8 0%, #f0f4fc 60%, #f8faff 100%)",
        color: dark ? "#e2e8f0" : "#1e293b",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

        .state-chip {
          transition: background 0.2s, transform 0.15s;
        }
        .state-chip:hover { transform: scale(1.08); }

        input[type=range] { accent-color: #6366f1; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }

        .run-btn {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
          box-shadow: 0 4px 24px rgba(99,102,241,0.35);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .run-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(99,102,241,0.5);
        }
        .run-btn:active { transform: scale(0.97); }

        .nav-btn {
          transition: background 0.15s, transform 0.12s;
        }
        .nav-btn:hover {
          background: rgba(99,102,241,0.2) !important;
          transform: scale(1.08);
        }
        .nav-btn:active { transform: scale(0.95); }

        table { border-collapse: collapse; width: 100%; }
        th, td { padding: 6px 10px; }
        tr:not(:last-child) td { border-bottom: 1px solid rgba(255,255,255,0.04); }
      `}</style>

      {/* ── TOPBAR */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 32px",
          borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"}`,
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: dark ? "rgba(8,13,24,0.75)" : "rgba(240,244,252,0.8)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#fff",
            boxShadow: "0 2px 12px rgba(99,102,241,0.4)",
          }}>∂</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>DFA Minimizer</div>
            <div style={{ fontSize: 11, color: dark ? "#475569" : "#94a3b8", fontFamily: "Space Mono, monospace" }}>Hopcroft's Algorithm</div>
          </div>
        </div>
        <button
          onClick={() => setDark(!dark)}
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            background: "transparent",
            color: dark ? "#94a3b8" : "#64748b",
            cursor: "pointer",
            fontFamily: "Space Mono, monospace",
            fontSize: 12,
            letterSpacing: "0.05em",
          }}
        >
          {dark ? "☀ LIGHT" : "☾ DARK"}
        </button>
      </header>

      {/* ── MAIN LAYOUT */}
      <main style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

          {/* LEFT — CONFIG PANEL */}
          <div
            style={{
              background: dark ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.8)",
              border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
              borderRadius: 20,
              padding: 24,
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <span style={{ fontSize: 20 }}>⚙</span>
              <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>DFA Configuration</span>
            </div>

            {/* States + Alphabet */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontFamily: "Space Mono, monospace", letterSpacing: "0.08em", color: dark ? "#475569" : "#94a3b8", marginBottom: 6, textTransform: "uppercase" }}>
                  States (max 15)
                </label>
                <input
                  type="number"
                  value={numStates}
                  min={1} max={15}
                  onChange={(e) => setNumStates(Math.min(15, Math.max(1, Number(e.target.value))))}
                  style={inputClass}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontFamily: "Space Mono, monospace", letterSpacing: "0.08em", color: dark ? "#475569" : "#94a3b8", marginBottom: 6, textTransform: "uppercase" }}>
                  Alphabet
                </label>
                <input
                  value={alphabetInput}
                  onChange={(e) => setAlphabetInput(e.target.value)}
                  placeholder="0, 1"
                  style={inputClass}
                />
              </div>
            </div>

            {/* Transition Table */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontFamily: "Space Mono, monospace", letterSpacing: "0.08em", color: dark ? "#475569" : "#94a3b8", marginBottom: 10, textTransform: "uppercase" }}>
                Transition Function δ
              </label>
              <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                <table>
                  <thead>
                    <tr style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}>
                      <th style={{ textAlign: "left", fontSize: 11, fontFamily: "Space Mono, monospace", color: dark ? "#475569" : "#94a3b8", letterSpacing: "0.06em" }}>STATE</th>
                      {alphabet.map((a) => (
                        <th key={a} style={{ textAlign: "center", fontSize: 11, fontFamily: "Space Mono, monospace", color: dark ? "#6366f1" : "#8b5cf6", letterSpacing: "0.06em" }}>
                          δ({a})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {states.map((s) => (
                      <tr key={s}>
                        <td style={{ fontFamily: "Space Mono, monospace", fontWeight: 700, fontSize: 13, color: dark ? "#c4b5fd" : "#7c3aed" }}>
                          {finalStates.includes(s) ? "★ " : ""}{s}
                        </td>
                        {alphabet.map((a) => (
                          <td key={a}>
                            <select
                              value={transitions[s]?.[a] || ""}
                              onChange={(e) =>
                                setTransitions((prev) => ({
                                  ...prev,
                                  [s]: { ...prev[s], [a]: e.target.value },
                                }))
                              }
                              style={selectClass}
                            >
                              <option value="">—</option>
                              {states.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Final States */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, fontFamily: "Space Mono, monospace", letterSpacing: "0.08em", color: dark ? "#475569" : "#94a3b8", marginBottom: 10, textTransform: "uppercase" }}>
                Accepting States
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {states.map((s) => {
                  const active = finalStates.includes(s);
                  return (
                    <button
                      key={s}
                      className="state-chip"
                      onClick={() =>
                        setFinalStates((prev) =>
                          prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                        )
                      }
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        border: active
                          ? "1px solid #22c55e"
                          : `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                        background: active
                          ? "rgba(34,197,94,0.15)"
                          : dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                        color: active ? "#4ade80" : dark ? "#64748b" : "#94a3b8",
                        fontFamily: "Space Mono, monospace",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {active ? "✓ " : ""}{s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Speed Slider */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontFamily: "Space Mono, monospace", letterSpacing: "0.08em", color: dark ? "#475569" : "#94a3b8", marginBottom: 6, textTransform: "uppercase" }}>
                Playback Speed — {(speed / 1000).toFixed(1)}s / step
              </label>
              <input
                type="range"
                min={500} max={4000} step={250}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <button className="run-btn" onClick={handleRun} style={{
              width: "100%", padding: "13px 0",
              borderRadius: 10, border: "none",
              cursor: "pointer", color: "#fff",
              fontSize: 14, fontWeight: 700, letterSpacing: "0.05em",
              fontFamily: "Space Mono, monospace",
            }}>
              ▶ RUN MINIMIZATION
            </button>
          </div>

          {/* RIGHT — GRAPH */}
          <GraphPanel
            elements={graph}
            dark={dark}
            title="Initial DFA"
            subtitle={graph.length > 0 ? `${states.length} states` : "not loaded"}
          />
        </div>

        {/* ── STEP VIEWER */}
        {hasRun && steps.length > 0 && (
          <div
            className="fade-in"
            style={{
              background: dark ? "rgba(15,23,42,0.7)" : "rgba(255,255,255,0.85)",
              border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
              borderRadius: 20,
              padding: 28,
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Step-by-Step Trace</span>
                <PhaseBadge phase={step?.phase} />
              </div>
              <span style={{ fontFamily: "Space Mono, monospace", fontSize: 12, color: dark ? "#475569" : "#94a3b8" }}>
                {stepIndex + 1} / {steps.length}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, borderRadius: 10, background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", marginBottom: 22, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
                borderRadius: 10,
                width: `${((stepIndex + 1) / steps.length) * 100}%`,
                transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Step content */}
              <div>
                {/* Step title + explanation */}
                <div
                  style={{
                    background: dark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)",
                    border: `1px solid rgba(99,102,241,0.2)`,
                    borderRadius: 12,
                    padding: 18,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 15, color: dark ? "#a5b4fc" : "#6366f1", marginBottom: 8, letterSpacing: "-0.01em" }}>
                    {step?.title}
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: dark ? "#94a3b8" : "#64748b" }}>
                    {step?.explanation}
                  </p>
                </div>

                {/* Navigation */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                  <button
                    className="nav-btn"
                    onClick={() => { setStepIndex(Math.max(0, stepIndex - 1)); setPlaying(false); }}
                    style={{
                      width: 40, height: 40, borderRadius: 10,
                      border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                      background: "transparent",
                      color: dark ? "#64748b" : "#94a3b8",
                      cursor: "pointer", fontSize: 14,
                    }}
                  >◀</button>

                  <button
                    onClick={() => setPlaying(!playing)}
                    style={{
                      width: 52, height: 52, borderRadius: 12,
                      border: "none",
                      background: playing
                        ? "linear-gradient(135deg, #ef4444, #f97316)"
                        : "linear-gradient(135deg, #6366f1, #a855f7)",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 16,
                      boxShadow: playing
                        ? "0 4px 16px rgba(239,68,68,0.3)"
                        : "0 4px 16px rgba(99,102,241,0.35)",
                      transition: "all 0.2s",
                    }}
                  >
                    {playing ? "⏸" : "▶"}
                  </button>

                  <button
                    className="nav-btn"
                    onClick={() => { setStepIndex(Math.min(steps.length - 1, stepIndex + 1)); setPlaying(false); }}
                    style={{
                      width: 40, height: 40, borderRadius: 10,
                      border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                      background: "transparent",
                      color: dark ? "#64748b" : "#94a3b8",
                      cursor: "pointer", fontSize: 14,
                    }}
                  >▶</button>
                </div>

                {/* Step dots */}
                <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
                  {steps.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setStepIndex(i); setPlaying(false); }}
                      style={{
                        width: i === stepIndex ? 22 : 7,
                        height: 7,
                        borderRadius: 4,
                        border: "none",
                        background: i === stepIndex
                          ? "linear-gradient(90deg, #6366f1, #a855f7)"
                          : dark ? "#1e293b" : "#cbd5e1",
                        cursor: "pointer",
                        transition: "all 0.25s",
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Partitions */}
              <div>
                <div style={{ fontSize: 11, fontFamily: "Space Mono, monospace", letterSpacing: "0.08em", color: dark ? "#475569" : "#94a3b8", textTransform: "uppercase", marginBottom: 12 }}>
                  Current Partition
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {step?.partitions.map((group, i) => (
                    <div
                      key={i}
                      className="fade-in"
                      style={{
                        background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                        border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                        borderRadius: 10,
                        padding: 12,
                      }}
                    >
                      <div style={{ fontSize: 10, fontFamily: "Space Mono, monospace", color: dark ? "#6366f1" : "#8b5cf6", marginBottom: 8, letterSpacing: "0.1em" }}>
                        G{i}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {group.map((s) => (
                          <span
                            key={s}
                            style={{
                              padding: "3px 9px",
                              borderRadius: 5,
                              background: "rgba(99,102,241,0.18)",
                              color: dark ? "#a5b4fc" : "#6366f1",
                              fontFamily: "Space Mono, monospace",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Final minimized graph */}
            {step?.isFinal && (
              <div style={{ marginTop: 24 }} className="fade-in">
                {isAlreadyMinimal && (
                  <div style={{
                    padding: "12px 18px",
                    borderRadius: 10,
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.25)",
                    color: "#4ade80",
                    fontSize: 13,
                    fontFamily: "Space Mono, monospace",
                    marginBottom: 16,
                    letterSpacing: "0.04em",
                  }}>
                    ✓ DFA is already minimal — no states can be merged.
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
                  <GraphPanel elements={finalGraph} dark={dark} title="Minimized DFA" subtitle={`${step.partitions.length} states`} />

                  <div style={{
                    background: dark ? "rgba(15,23,42,0.6)" : "rgba(248,250,252,0.8)",
                    border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
                    borderRadius: 16,
                    padding: 20,
                  }}>
                    <div style={{ fontSize: 11, fontFamily: "Space Mono, monospace", letterSpacing: "0.08em", color: dark ? "#475569" : "#94a3b8", textTransform: "uppercase", marginBottom: 14 }}>
                      State Mapping
                    </div>
                    {step.partitions.map((group, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <span style={{ fontFamily: "Space Mono, monospace", fontSize: 12, fontWeight: 700, color: dark ? "#6366f1" : "#8b5cf6", minWidth: 28 }}>G{i}</span>
                        <span style={{ fontSize: 12, color: dark ? "#475569" : "#94a3b8" }}>←</span>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {group.map((s) => (
                            <span key={s} style={{
                              padding: "2px 8px", borderRadius: 4,
                              background: "rgba(99,102,241,0.15)",
                              color: dark ? "#a5b4fc" : "#6366f1",
                              fontFamily: "Space Mono, monospace",
                              fontSize: 11,
                            }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                      <div style={{ fontSize: 12, color: dark ? "#64748b" : "#94a3b8", marginBottom: 6, fontFamily: "Space Mono, monospace" }}>
                        REDUCTION
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Space Mono, monospace", color: dark ? "#e2e8f0" : "#1e293b" }}>
                        {states.length}
                        <span style={{ color: "#6366f1", margin: "0 8px" }}>→</span>
                        {step.partitions.length}
                        <span style={{ fontSize: 12, fontWeight: 400, color: dark ? "#475569" : "#94a3b8", marginLeft: 10 }}>
                          {states.length === step.partitions.length ? "no reduction" : `−${states.length - step.partitions.length} state${states.length - step.partitions.length !== 1 ? "s" : ""}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
