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
        alphabet, // ✅ FIX 1: Passed the alphabet down so generateGraph works
        transitions: newTransitions,
        accept: newAccept,
    };
}

function generateGraph(dfa) {
    const { states, alphabet, transitions, accept } = dfa;

    const edgeMap = {};

    // 🔹 EDGE MERGING
    states.forEach((from) => {
        alphabet.forEach((symbol) => {
            const to = transitions[from]?.[symbol];
            if (!to) return;

            const key = `${from}-${to}`;
            if (!edgeMap[key]) edgeMap[key] = [];
            edgeMap[key].push(symbol);
        });
    });

    const edges = Object.entries(edgeMap).map(([key, symbols]) => {
        const [from, to] = key.split("-");
        return {
            data: {
                source: from,
                target: to,
                label: symbols.join(", "),
            },
        };
    });

    // 🔹 FINAL STATES (FIXED)
    const nodes = states.map((s) => ({
        data: { id: s },
        classes: accept.includes(s) ? "final" : "",
    }));

    // 🔹 START ARROW (NEW)
    const startNode = {
        data: { id: "__start__" },
        classes: "start-node",
    };

    const startEdge = {
        data: {
            source: "__start__",
            target: states.length ? states[0] : null,
        },
        classes: "start-edge",
    };

    return [startNode, ...nodes, startEdge, ...edges];
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
                "label": "data(id)",
                "text-valign": "center",
                "text-halign": "center",
                "color": "#fff",
                "background-color": "#475569",
            },
        },
        {
            selector: ".final",
            style: {
                "border-width": 4,
                "border-color": "#22c55e",
                "background-color": "#16a34a",
                "overlay-color": "#22c55e",
                "overlay-padding": 6,
                "overlay-opacity": 0.15,
                "text-outline-width": 2,
                "text-outline-color": "#16a34a",
            },
        },
        // 🔹 START NODE (truly invisible)
        {
            selector: ".start-node",
            style: {
                "width": 1,
                "height": 1,
                "background-opacity": 0,
                "border-width": 0,
                "label": "",
            },
        },
        // 🔹 START ARROW
        {
            selector: ".start-edge",
            style: {
                "target-arrow-shape": "triangle",
                "line-color": "#60a5fa",
                "target-arrow-color": "#60a5fa",
                "width": 2,
            },
        },
        {
            selector: "edge",
            style: {
                "curve-style": "bezier",
                "control-point-step-size": 80,
                "target-arrow-shape": "triangle",
                "line-color": "#94a3b8",
                "target-arrow-color": "#94a3b8",
                "label": "data(label)",
                "font-size": "12px",
                "text-background-color": "#0f172a",
                "text-background-opacity": 1,
                "text-background-padding": "2px",
            },
        },
    ];

    const graphLayout = {
        name: "cose",
        animate: true,
        padding: 50,
        nodeRepulsion: 400000,
        idealEdgeLength: 120,
    };

    return (
        <div
            className={`${dark ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"
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
                    className={`${dark ? "bg-white/5 text-white" : "bg-white text-slate-800"
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
                        className={`w-full mb-4 p-2 rounded border ${dark
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
                        className={`w-full mb-4 p-2 rounded border ${dark
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
                                                    className={`p-1 rounded w-full ${dark
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
                    className={`${dark ? "bg-white/5" : "bg-white"
                        } rounded-xl p-4 shadow flex flex-col`}
                >
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold opacity-70">
                            Initial DFA Graph
                        </h3>
                        <span className="text-xs opacity-40">cose layout</span>
                    </div>

                    {graph.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-sm opacity-40">
                            Configure your DFA and click Run
                        </div>
                    ) : (
                        <CytoscapeComponent
                            elements={graph}
                            layout={graphLayout}
                            style={{ width: "100%", height: "320px" }}
                            stylesheet={cytoscapeStylesheet}
                        />
                    )}
                </div>
            </div>

            {/* STEP-BY-STEP SLIDES */}
            {steps.length > 0 && (
                <div className="px-6 pb-10">
                    <div className={`${dark ? "bg-white/5 text-white" : "bg-white text-slate-800"} p-6 rounded-2xl shadow-xl backdrop-blur-md border border-white/10`}>

                        {/* HEADER */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                Step {stepIndex + 1} / {steps.length}
                            </h2>

                            <div className="flex justify-center items-center gap-6 mt-4">

                                {/* LEFT */}
                                <button
                                    onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
                                >
                                    ◀
                                </button>

                                {/* PLAY / PAUSE */}
                                <button
                                    onClick={() => setPlaying(!playing)}
                                    className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 shadow-lg hover:scale-105 transition"
                                >
                                    {playing ? (
                                        // Pause icon
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-5 bg-white rounded"></span>
                                            <span className="w-1.5 h-5 bg-white rounded"></span>
                                        </div>
                                    ) : (
                                        // Play icon (triangle)
                                        <div className="w-0 h-0 border-l-[10px] border-l-white border-y-[7px] border-y-transparent ml-1"></div>
                                    )}
                                </button>

                                {/* RIGHT */}
                                <button
                                    onClick={() =>
                                        setStepIndex(Math.min(steps.length - 1, stepIndex + 1))
                                    }
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
                                >
                                    ▶
                                </button>

                            </div>
                        </div>
                        {/* STEP CONTENT */}
                        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 animate-fadeIn">

                            <h3 className="text-lg font-semibold text-indigo-300 mb-2">
                                {steps[stepIndex].title}
                            </h3>

                            <p className="text-sm text-gray-300 leading-relaxed">
                                {steps[stepIndex].explanation}
                            </p>

                        </div>

                        {/* PROGRESS BAR */}
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-4 mt-4">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 transition-all duration-500"
                                style={{
                                    width: `${((stepIndex + 1) / steps.length) * 100}%`,
                                }}
                            />
                        </div>

                        {/* PARTITIONS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                            {steps[stepIndex].partitions.map((group, i) => (
                                <div
                                    key={i}
                                    className={`${dark ? "bg-white/10" : "bg-slate-100"} p-3 rounded-lg`}
                                >
                                    <strong className="block text-xs font-mono mb-2 opacity-60">
                                        Group G{i}
                                    </strong>

                                    <div className="flex flex-wrap gap-2">
                                        {group.map((s) => (
                                            <span
                                                key={s}
                                                className="px-2 py-1 rounded bg-indigo-500/30 text-xs font-mono"
                                            >
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* FINAL GRAPH */}
                        {steps[stepIndex].isFinal && (
                            <div className="mt-4">
                                <h3 className="font-semibold mb-2">Minimized DFA Graph</h3>

                                {steps[stepIndex].partitions.length === states.length && (
                                    <div className="mb-3 p-3 rounded bg-green-500/20 text-green-300 text-sm">
                                        ✅ Your DFA is already minimized.
                                    </div>
                                )}

                                {/* ✅ FIX 2: Safe render check for finalGraph */}
                                {finalGraph.length === 0 ? (
                                    <div className="text-sm opacity-40">
                                        Generating minimized graph...
                                    </div>
                                ) : (
                                    <CytoscapeComponent
                                        elements={finalGraph}
                                        layout={graphLayout}
                                        style={{ width: "100%", height: "320px" }}
                                        stylesheet={cytoscapeStylesheet}
                                    />
                                )}
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}
