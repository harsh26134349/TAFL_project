import { useState, useEffect } from "react";
import { Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";
import CytoscapeComponent from "react-cytoscapejs";

// ================= DFA MINIMIZATION =================
function minimizeDFA(dfa) {
  const { states, alphabet, transitions, accept } = dfa;

  let steps = [];
  let P = [accept, states.filter(s => !accept.includes(s))].filter(g => g.length);

  steps.push({
    title: "Step 1: Initial Partition",
    partitions: JSON.parse(JSON.stringify(P)),
    explanation:
      "We first divide states into FINAL and NON-FINAL groups. This is always the starting point because accepting behavior must match.",
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
          .join("-");

        if (!map[key]) map[key] = [];
        map[key].push(state);
      }

      let splitGroups = Object.values(map);

      if (splitGroups.length > 1) {
        steps.push({
          title: `Step ${iteration}: Splitting Group`,
          partitions: JSON.parse(JSON.stringify(splitGroups)),
          explanation: `We examine group [${group.join(", ")}]. Some states behave differently on inputs, so we split them into smaller groups based on their transition targets.`,
        });
        iteration++;
        changed = true;
      }

      newP.push(...splitGroups);
    }

    if (changed) {
      steps.push({
        title: `Step ${iteration}: Updated Partition`,
        partitions: JSON.parse(JSON.stringify(newP)),
        explanation:
          "After splitting inconsistent states, we update our groups. Now states inside each group behave more similarly.",
      });
      iteration++;
    }

    P = newP;
  }

  steps.push({
    title: `Step ${iteration}: Final Minimized DFA`,
    partitions: JSON.parse(JSON.stringify(P)),
    explanation:
      "No more splits are possible. Each group now represents one state in the minimized DFA.",
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
    if (group.some((s) => accept.includes(s))) {
      newAccept.push("G" + i);
    }
  });

  let newTransitions = {};

  partitions.forEach((group, i) => {
    let rep = group[0];
    newTransitions["G" + i] = {};
    alphabet.forEach((a) => {
      let target = transitions[rep]?.[a];
      newTransitions["G" + i][a] = mapping[target];
    });
  });

  return {
    states: Object.keys(newTransitions),
    transitions: newTransitions,
    accept: newAccept,
  };
}

function generateGraph(dfa) {
  const { states, transitions, accept = [] } = dfa;
  let elements = [];

  states.forEach((s) => {
    elements.push({
      data: { id: s, label: s },
      classes: accept.includes(s) ? "final" : "normal",
    });
  });

  states.forEach((s) => {
    Object.entries(transitions[s] || {}).forEach(([symbol, target]) => {
      if (!target) return;
      elements.push({ data: { source: s, target: target, label: symbol } });
    });
  });

  return elements;
}

export default function App() {
  const [dark, setDark] = useState(true);
  const [numStates, setNumStates] = useState(3);
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
  const [speed, setSpeed] = useState(3000);

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

  useEffect(() => {
    const s = Array.from({ length: numStates }, (_, i) => `q${i}`);
    setStates(s);
  }, [numStates]);

  useEffect(() => {
    const a = alphabetInput
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states, alphabet]);

  const handleRun = () => {
    const dfa = { states, alphabet, transitions, accept: finalStates };
    const resultSteps = minimizeDFA(dfa);
    setSteps(resultSteps);
    setStepIndex(0);
    setGraph(generateGraph(dfa));

    const minimized = buildMinimizedDFA(
      dfa,
      resultSteps[resultSteps.length - 1].partitions
    );
    setFinalGraph(generateGraph(minimized));
  };

  const cytoscapeStylesheet = [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "text-valign": "center",
        color: dark ? "#fff" : "#111",
        "background-color": "#64748b",
      },
    },
    {
      selector: ".final",
      style: {
        "background-color": "#22c55e",
        "border-width": 3,
        "border-color": "#bbf7d0",
      },
    },
    {
      selector: "edge",
      style: {
        label: "data(label)",
        "curve-style": "bezier",
        "target-arrow-shape": "triangle",
        "line-color": dark ? "#94a3b8" : "#475569",
        "target-arrow-color": dark ? "#94a3b8" : "#475569",
        color: dark ? "#e2e8f0" : "#1e293b",
        "font-size": 12,
        "text-background-color": dark ? "#1e293b" : "#f1f5f9",
        "text-background-opacity": 1,
        "text-background-padding": "2px",
      },
    },
  ];

  return (
    <div
      className={`${
        dark ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"
      } min-h-screen`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center p-4 border-b border-white/10">
        <h1 className="text-2xl font-bold tracking-tight">DFA Minimizer</h1>
        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* LEFT PANEL — DFA Input */}
        <div
          className={`${
            dark ? "bg-white/5 text-white" : "bg-white text-slate-800"
          } p-6 rounded-xl shadow`}
        >
          <h2 className="text-lg font-semibold mb-4">DFA Configuration</h2>

          <label className="block text-xs opacity-60 mb-1">
            Number of States (max 15)
          </label>
          <input
            type="number"
            value={numStates}
            min={1}
            max={15}
            onChange={(e) =>
              setNumStates(Math.min(15, Math.max(1, Number(e.target.value))))
            }
            className={`w-full mb-4 p-2 rounded border ${
              dark
                ? "bg-white/10 text-white border-white/10"
                : "bg-slate-100 text-slate-800 border-slate-300"
            }`}
          />

          <label className="block text-xs opacity-60 mb-1">
            Alphabet (comma-separated)
          </label>
          <input
            value={alphabetInput}
            onChange={(e) => setAlphabetInput(e.target.value)}
            placeholder="e.g. 0,1"
            className={`w-full mb-4 p-2 rounded border ${
              dark
                ? "bg-white/10 text-white border-white/10"
                : "bg-slate-100 text-slate-800 border-slate-300"
            }`}
          />

          <h3 className="text-sm font-semibold mb-2 opacity-80">
            Transition Table
          </h3>
          <div className="overflow-x-auto mb-4">
            <table className="text-sm w-full">
              <thead>
                <tr>
                  <th className="text-left pr-3 pb-2 opacity-50">State</th>
                  {alphabet.map((a) => (
                    <th key={a} className="text-center pb-2 px-2 opacity-50">
                      δ({a})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {states.map((s) => (
                  <tr key={s}>
                    <td className="pr-3 py-1 font-mono font-bold">{s}</td>
                    {alphabet.map((a) => (
                      <td key={a} className="px-2 py-1">
                        <select
                          value={transitions[s]?.[a] || ""}
                          onChange={(e) =>
                            setTransitions((prev) => ({
                              ...prev,
                              [s]: { ...prev[s], [a]: e.target.value },
                            }))
                          }
                          className={`p-1 rounded w-full ${
                            dark
                              ? "bg-slate-800 text-white"
                              : "bg-slate-200 text-slate-800"
                          }`}
                        >
                          <option value="">—</option>
                          {states.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold mb-2 opacity-80">
              Final / Accepting States
            </p>
            <div className="flex gap-3 flex-wrap">
              {states.map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-1 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={finalStates.includes(s)}
                    onChange={() => {
                      setFinalStates((prev) =>
                        prev.includes(s)
                          ? prev.filter((x) => x !== s)
                          : [...prev, s]
                      );
                    }}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleRun}
            className="mt-2 w-full bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition py-2 rounded font-semibold text-white"
          >
            ▶ Run Minimization
          </button>
        </div>

        {/* RIGHT PANEL — Initial Graph */}
        <div
          className={`${
            dark ? "bg-white/5" : "bg-white"
          } rounded-xl p-4 shadow flex flex-col`}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold opacity-70">
              Initial DFA Graph
            </h3>
            <span className="text-xs opacity-40">circle layout</span>
          </div>

          {graph.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm opacity-40">
              Configure your DFA and click Run
            </div>
          ) : (
            <CytoscapeComponent
              elements={graph}
              layout={{ name: "circle" }}
              style={{ width: "100%", height: "320px" }}
              stylesheet={cytoscapeStylesheet}
            />
          )}
        </div>
      </div>

      {/* STEP-BY-STEP SLIDES */}
      {steps.length > 0 && (
        <div className="px-6 pb-10">
          <div
            className={`${
              dark ? "bg-white/5 text-white" : "bg-white text-slate-800"
            } p-6 rounded-xl shadow`}
          >
            {/* Controls */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPlaying(!playing)}
                  className="bg-orange-500 hover:bg-orange-600 active:scale-95 transition text-white px-5 py-2 rounded font-semibold"
                >
                  {playing ? "⏸ Pause" : "▶ Play"}
                </button>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className={`p-2 rounded text-sm ${
                    dark
                      ? "bg-slate-700 text-white"
                      : "bg-slate-200 text-black"
                  }`}
                >
                  <option value={1000}>1s / step</option>
                  <option value={3000}>3s / step</option>
                  <option value={5000}>5s / step</option>
                </select>
              </div>
              <span className="text-sm opacity-50 font-mono">
                {stepIndex + 1} / {steps.length}
              </span>
            </div>

            {/* Step Title & Explanation */}
            <h2 className="text-xl font-bold mb-1">
              {steps[stepIndex].title}
              <span className="ml-2 text-xs font-normal opacity-40">
                teaching mode
              </span>
            </h2>
            <p
              className={`mb-5 text-sm leading-relaxed ${
                dark ? "opacity-75" : "text-slate-600"
              }`}
            >
              {steps[stepIndex].explanation}
            </p>

            {/* Partitions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {steps[stepIndex].partitions.map((group, i) => (
                <div
                  key={i}
                  className={`${
                    dark ? "bg-white/10" : "bg-slate-100"
                  } p-3 rounded-lg`}
                >
                  <strong className="block text-xs font-mono mb-2 opacity-60">
                    Group G{i}
                  </strong>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {group.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-1 rounded bg-indigo-500/30 text-xs font-mono"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs opacity-50 space-y-0.5">
                    {group.map((state) => (
                      <div key={state}>
                        {state} →{" "}
                        {alphabet
                          .map((a) => transitions[state]?.[a] || "—")
                          .join(", ")}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Final DFA Graph */}
            {steps[stepIndex].isFinal && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Minimized DFA Graph</h3>
                  <span className="text-xs opacity-40">circle layout</span>
                </div>

                {steps[stepIndex].partitions.length === states.length && (
                  <div className="mb-3 p-3 rounded bg-green-500/20 text-green-300 text-sm">
                    ✅ Your DFA is already minimized. No equivalent states were
                    found.
                  </div>
                )}

                <CytoscapeComponent
                  elements={finalGraph}
                  layout={{ name: "circle" }}
                  style={{ width: "100%", height: "320px" }}
                  stylesheet={cytoscapeStylesheet}
                />
              </div>
            )}

            {/* Prev / Next */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
                disabled={stepIndex === 0}
                className="flex items-center gap-1 px-4 py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 transition"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={() =>
                  setStepIndex(Math.min(steps.length - 1, stepIndex + 1))
                }
                disabled={stepIndex === steps.length - 1}
                className="flex items-center gap-1 px-4 py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 transition"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
