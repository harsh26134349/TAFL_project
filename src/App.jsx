import { useState, useEffect } from "react";
import { Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";
import CytoscapeComponent from "react-cytoscapejs";

// ================= DFA MINIMIZATION =================
function minimizeDFA(dfa) {
    const { states, alphabet, transitions, accept } = dfa;

    let steps = [];
    let P = [accept, states.filter((s) => !accept.includes(s))].filter(
        (g) => g.length
    );

    const finalStr = accept.join(", ") || "none";
    const nonFinalStr = states.filter((s) => !accept.includes(s)).join(", ") || "none";

    steps.push({
        title: "Step 1: Initial Partition",
        partitions: JSON.parse(JSON.stringify(P)),
        explanation: (
            <div className="space-y-4 text-sm md:text-base">
                <p>We begin by dividing all states into two groups:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-indigo-600 dark:text-indigo-300 font-medium">
                    <li><strong className="text-slate-800 dark:text-white">FINAL</strong> states (accepting states)</li>
                    <li><strong className="text-slate-800 dark:text-white">NON-FINAL</strong> states (non-accepting states)</li>
                </ul>
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <p className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">Reason:</p>
                    <p className="text-slate-700 dark:text-slate-300">States in different categories cannot be equivalent because they differ in acceptance behavior.</p>
                </div>
                <div className="font-mono text-sm bg-slate-100 dark:bg-black/30 p-3 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                    <p><span className="text-pink-500">Final</span> = {'{'} {finalStr} {'}'}</p>
                    <p><span className="text-purple-500">Non-final</span> = {'{'} {nonFinalStr} {'}'}</p>
                </div>
            </div>
        )
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
                    title: `Step ${iteration}: Refinement of Partitions`,
                    partitions: JSON.parse(JSON.stringify(splitGroups)),
                    explanation: (
                        <div className="space-y-4 text-sm md:text-base">
                            <p>We now check whether states in the same group behave similarly.</p>
                            <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
                                <p className="font-semibold mb-2 text-slate-800 dark:text-white">For each state:</p>
                                <ul className="list-none space-y-2 ml-1 text-slate-700 dark:text-slate-300">
                                    <li className="flex items-center gap-2"><span className="text-indigo-500 text-lg leading-none">→</span> Check transitions for each input symbol</li>
                                    <li className="flex items-center gap-2"><span className="text-indigo-500 text-lg leading-none">→</span> See which group the transition leads to</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-300">
                                <p>If two states go to different groups → they are <strong>NOT equivalent</strong>. So we split the group.</p>
                            </div>
                            <p className="font-medium px-3 py-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-lg inline-block">
                                Since transitions differ for states in <span className="font-mono font-bold">{'{'} {group.join(", ")} {'}'}</span> → split them.
                            </p>
                        </div>
                    )
                });
                iteration++;
                changed = true;
            }

            newP.push(...splitGroups);
        }

        if (changed) {
            steps.push({
                title: `Step ${iteration}: Iterative Splitting`,
                partitions: JSON.parse(JSON.stringify(newP)),
                explanation: (
                    <div className="space-y-4 text-sm md:text-base">
                        <p>Repeat the refinement process:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-slate-700 dark:text-slate-300">
                            <li>Compare transitions again</li>
                            <li>Split groups if needed</li>
                        </ul>
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mt-4">
                            <p className="font-bold text-emerald-700 dark:text-emerald-400 mb-1">Stop condition met:</p>
                            <p className="text-slate-700 dark:text-slate-300">No more splits are possible. At this point, all states inside a group are definitively equivalent.</p>
                        </div>
                    </div>
                )
            });
            iteration++;
        }

        P = newP;
    }

    const isAlreadyMinimal = P.length === states.length;
    const mappedGroupsList = P.map((g, i) => (
        <li key={i}><span className="font-mono font-bold text-indigo-500 dark:text-indigo-400">G{i}</span> → new state</li>
    ));

    steps.push({
        title: `Step ${iteration}: Construct Minimized DFA & Final Result`,
        partitions: JSON.parse(JSON.stringify(P)),
        explanation: (
            <div className="space-y-5 text-sm md:text-base">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                        <p className="font-bold mb-2 text-slate-800 dark:text-white">Each group becomes a single state:</p>
                        <ul className="list-none space-y-1 text-slate-700 dark:text-slate-300 pl-1">
                            {mappedGroupsList}
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex flex-col justify-center">
                            <p className="font-bold text-blue-700 dark:text-blue-400 text-sm">Transitions</p>
                            <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5">Use any representative from the group</p>
                        </div>
                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex flex-col justify-center">
                            <p className="font-bold text-purple-700 dark:text-purple-400 text-sm">Final states</p>
                            <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5">If ANY state in group is final → group is final</p>
                        </div>
                        <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl flex flex-col justify-center">
                            <p className="font-bold text-pink-700 dark:text-pink-400 text-sm">Start state</p>
                            <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5">Group containing original start state</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl">
                    <p className="font-bold text-indigo-700 dark:text-indigo-400 mb-2">The minimized DFA:</p>
                    <ul className="flex flex-wrap gap-2 list-none">
                        <li className="px-3 py-1 bg-white dark:bg-black/20 rounded-full shadow-sm text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">Has fewer or equal states</li>
                        <li className="px-3 py-1 bg-white dark:bg-black/20 rounded-full shadow-sm text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">Preserves language</li>
                        <li className="px-3 py-1 bg-white dark:bg-black/20 rounded-full shadow-sm text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">Removes redundant states</li>
                    </ul>
                </div>
                {isAlreadyMinimal && (
                    <div className="p-3 bg-green-500/20 text-green-700 dark:text-green-400 font-bold rounded-xl border border-green-500/30 text-center animate-pulse">
                        If no merges occurred: DFA is already minimal ✨
                    </div>
                )}
            </div>
        ),
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
        alphabet,
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
            target: states[0], // 🔥 safe (we already checked length)
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
                "color": "#ffffff",
                "background-color": dark ? "#4f46e5" : "#6366f1",
                "border-width": 2,
                "border-color": dark ? "#818cf8" : "#4f46e5",
                "font-size": "14px",
                "font-weight": "bold",
                "text-outline-width": 1,
                "text-outline-color": dark ? "#312e81" : "#4338ca",
                "shadow-blur": 10,
                "shadow-color": "#4f46e5",
                "shadow-opacity": 0.3,
            },
        },
        {
            selector: ".final",
            style: {
                "border-width": 4,
                "border-color": "#4ade80",
                "background-color": "#16a34a",
                "text-outline-color": "#14532d",
                "shadow-blur": 20,
                "shadow-color": "#22c55e",
                "shadow-opacity": 0.8,
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
                "line-color": "#ec4899",
                "target-arrow-color": "#ec4899",
                "width": 3,
            },
        },
        {
            selector: "edge",
            style: {
                "curve-style": "bezier",
                "control-point-step-size": 80,
                "target-arrow-shape": "triangle",
                "line-color": dark ? "#64748b" : "#cbd5e1",
                "target-arrow-color": dark ? "#64748b" : "#cbd5e1",
                "label": "data(label)",
                "color": dark ? "#f8fafc" : "#1e293b",
                "font-size": "12px",
                "font-weight": "bold",
                "text-background-color": dark ? "#1e293b" : "#ffffff",
                "text-background-opacity": 1,
                "text-background-padding": "3px",
                "text-border-opacity": 1,
                "text-border-width": 1,
                "text-border-color": dark ? "#334155" : "#e2e8f0",
                "width": 2,
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
            className={`min-h-screen relative overflow-x-hidden transition-colors duration-500 pb-12 ${
                dark ? "bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"
            }`}
        >
            {/* Ambient Animated Blobs */}
            <div className={`ambient-blob blob-1 ${dark ? "opacity-60" : "opacity-30"}`}></div>
            <div className={`ambient-blob blob-2 ${dark ? "opacity-60" : "opacity-30"}`}></div>

            <div className="relative z-10">
                {/* HEADER */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 backdrop-blur-md bg-white/5 shadow-sm">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-pink-500 flex items-center gap-2 drop-shadow-sm">
                        <span className="text-4xl">⚗️</span> DFA Minimizer
                    </h1>
                    <button
                        onClick={() => setDark(!dark)}
                        className={`p-3 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-md ${
                            dark ? "bg-white/10 hover:bg-white/20 text-yellow-300" : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                        title="Toggle Theme"
                    >
                        {dark ? <Sun size={22} className="animate-[spin_10s_linear_infinite]" /> : <Moon size={22} />}
                    </button>
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 max-w-7xl mx-auto">
                    {/* LEFT PANEL — DFA Input */}
                    <div
                        className={`lg:col-span-5 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                            dark ? "glass-panel-dark" : "glass-panel"
                        }`}
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm shadow-md">1</span>
                            Configuration
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold opacity-80 mb-2">
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
                                    className={`w-full p-3 rounded-xl ${dark ? "glass-input-dark" : "glass-input"}`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold opacity-80 mb-2">
                                    Alphabet (comma-separated)
                                </label>
                                <input
                                    value={alphabetInput}
                                    onChange={(e) => setAlphabetInput(e.target.value)}
                                    placeholder="e.g. 0,1"
                                    className={`w-full p-3 rounded-xl ${dark ? "glass-input-dark" : "glass-input"}`}
                                />
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold mb-3 opacity-80">
                                    Transition Table
                                </h3>
                                <div className={`overflow-hidden rounded-xl border ${dark ? "border-white/10 bg-slate-900/50" : "border-slate-200 bg-white"}`}>
                                    <div className="overflow-x-auto">
                                        <table className="text-sm w-full text-center">
                                            <thead className={`${dark ? "bg-white/5 text-slate-300" : "bg-slate-50 text-slate-600"}`}>
                                                <tr>
                                                    <th className="py-3 px-3 font-semibold text-left">State</th>
                                                    {alphabet.map((a) => (
                                                        <th key={a} className="py-3 px-3 font-semibold">
                                                            δ({a})
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${dark ? "divide-white/5" : "divide-slate-100"}`}>
                                                {states.map((s) => (
                                                    <tr key={s} className={`transition-colors ${dark ? "hover:bg-white/5" : "hover:bg-slate-50"}`}>
                                                        <td className="py-2 px-3 font-mono font-bold text-indigo-500 dark:text-indigo-400 text-left">{s}</td>
                                                        {alphabet.map((a) => (
                                                            <td key={a} className="py-2 px-2">
                                                                <select
                                                                    value={transitions[s]?.[a] || ""}
                                                                    onChange={(e) =>
                                                                        setTransitions((prev) => ({
                                                                            ...prev,
                                                                            [s]: { ...prev[s], [a]: e.target.value },
                                                                        }))
                                                                    }
                                                                    className={`p-2 rounded-lg w-full min-w-[60px] appearance-none cursor-pointer text-center outline-none transition-all shadow-sm ${
                                                                        dark
                                                                            ? "bg-slate-800 hover:bg-slate-700 border border-slate-600 focus:border-indigo-500 text-white"
                                                                            : "bg-slate-50 hover:bg-white border border-slate-300 focus:border-indigo-400 text-slate-900"
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
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-semibold mb-3 opacity-80">
                                    Final / Accepting States
                                </p>
                                <div className="flex gap-2.5 flex-wrap">
                                    {states.map((s) => {
                                        const isSelected = finalStates.includes(s);
                                        return (
                                            <button
                                                key={s}
                                                onClick={() => {
                                                    setFinalStates((prev) =>
                                                        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                                                    );
                                                }}
                                                className={`px-4 py-2 rounded-full text-sm font-mono font-medium transition-all duration-300 border ${
                                                    isSelected
                                                        ? "bg-green-500 border-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:bg-green-600"
                                                        : dark ? "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white" : "bg-white border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900 shadow-sm"
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                onClick={handleRun}
                                className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 active:scale-[0.98] transition-all duration-300 py-4 rounded-xl font-bold text-white text-lg shadow-[0_0_20px_rgba(99,102,241,0.4)] flex justify-center items-center gap-2 group"
                            >
                                <span className="text-xl group-hover:translate-x-1 transition-transform">🚀</span> Run Minimization
                            </button>
                        </div>
                    </div>

                    {/* RIGHT PANEL — Initial Graph */}
                    <div
                        className={`lg:col-span-7 flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl min-h-[450px] ${
                            dark ? "glass-panel-dark" : "glass-panel"
                        }`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-3">
                                <span className="w-8 h-8 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm shadow-md">2</span>
                                Initial DFA Graph
                            </h2>
                            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${dark ? "bg-white/10 text-slate-300" : "bg-slate-200 text-slate-600"}`}>
                                cose layout
                            </span>
                        </div>

                        {graph.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-50 space-y-4">
                                <div className="w-24 h-24 border-4 border-dashed rounded-full animate-[spin_10s_linear_infinite] flex items-center justify-center border-indigo-400/50">
                                    <span className="animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] w-4 h-4 bg-indigo-500 rounded-full"></span>
                                </div>
                                <p className="text-sm font-medium tracking-wide">Configure your DFA and click Run</p>
                            </div>
                        ) : (
                            <div className={`flex-1 rounded-xl overflow-hidden border relative shadow-inner ${dark ? "border-white/10 bg-black/20" : "border-slate-200 bg-slate-50"}`}>
                                <CytoscapeComponent
                                    elements={graph}
                                    layout={graphLayout}
                                    style={{ width: "100%", height: "100%", minHeight: "400px" }}
                                    stylesheet={cytoscapeStylesheet}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* STEP-BY-STEP SLIDES */}
                {steps.length > 0 && (
                    <div className="px-6 mt-4 max-w-7xl mx-auto animate-fadeIn pb-12">
                        <div className={`p-8 transition-all duration-500 shadow-2xl relative overflow-hidden ${dark ? "glass-panel-dark" : "glass-panel"}`}>
                            
                            {/* Decorative background accent for steps */}
                            <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500/20 blur-3xl rounded-full pointer-events-none" />

                            {/* HEADER */}
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4 relative z-10">
                                <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-orange-400">
                                    Step {stepIndex + 1} <span className="text-xl opacity-60 text-slate-500 dark:text-slate-400">/ {steps.length}</span>
                                </h2>

                                <div className="flex items-center gap-4">
                                    {/* LEFT */}
                                    <button
                                        onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
                                        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-95 shadow-md hover:-translate-x-1 ${
                                            dark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200"
                                        }`}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>

                                    {/* PLAY / PAUSE */}
                                    <button
                                        onClick={() => setPlaying(!playing)}
                                        className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:scale-105 active:scale-95 transition-all"
                                    >
                                        {playing ? (
                                            <div className="flex gap-1.5">
                                                <span className="w-1.5 h-6 bg-white rounded-full"></span>
                                                <span className="w-1.5 h-6 bg-white rounded-full"></span>
                                            </div>
                                        ) : (
                                            <div className="w-0 h-0 border-l-[14px] border-l-white border-y-[9px] border-y-transparent ml-1.5"></div>
                                        )}
                                    </button>

                                    {/* RIGHT */}
                                    <button
                                        onClick={() =>
                                            setStepIndex(Math.min(steps.length - 1, stepIndex + 1))
                                        }
                                        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-95 shadow-md hover:translate-x-1 ${
                                            dark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200"
                                        }`}
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* PROGRESS BAR */}
                            <div className={`w-full h-3 rounded-full overflow-hidden mb-10 shadow-inner ${dark ? "bg-black/40" : "bg-slate-200"}`}>
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out relative"
                                    style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[gradientMove_2s_linear_infinite] bg-[length:20px_20px] [background-image:linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)]" />
                                </div>
                            </div>

                            {/* STEP CONTENT */}
                            <div className={`p-6 md:p-8 rounded-2xl border transition-all duration-300 animate-fadeIn relative z-10 shadow-sm ${
                                dark ? "bg-slate-800/50 border-white/10 backdrop-blur-md" : "bg-white border-slate-200"
                            }`}>
                                <h3 className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-5 flex items-center gap-3">
                                    <span className="inline-block w-2 h-8 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full"></span>
                                    {steps[stepIndex].title}
                                </h3>
                                <div className="text-slate-800 dark:text-slate-200">
                                    {steps[stepIndex].explanation}
                                </div>
                            </div>

                            {/* PARTITIONS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-8 mb-8 relative z-10">
                                {steps[stepIndex].partitions.map((group, i) => (
                                    <div
                                        key={i}
                                        className={`p-5 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                                            dark ? "bg-slate-900/60 border-indigo-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)]" : "bg-slate-50 border-indigo-200 shadow-sm"
                                        }`}
                                    >
                                        <strong className="block text-sm font-extrabold tracking-widest text-purple-600 dark:text-purple-400 mb-4 uppercase">
                                            Group G{i}
                                        </strong>

                                        <div className="flex flex-wrap gap-2.5">
                                            {group.map((s) => (
                                                <span
                                                    key={s}
                                                    className={`px-3.5 py-1.5 rounded-lg text-sm font-mono font-bold shadow-sm ${
                                                        dark ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40" : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                                                    }`}
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
                                <div className="mt-10 animate-fadeIn relative z-10 border-t pt-8 border-white/10">
                                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-xl shadow-[0_0_15px_rgba(52,211,153,0.5)]">✓</span>
                                        Minimized DFA Graph
                                    </h3>

                                    {steps[stepIndex].partitions.length === states.length && (
                                        <div className="mb-6 p-5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 font-semibold flex items-center gap-3 shadow-inner">
                                            <span className="text-2xl">✨</span> This DFA was already perfectly minimal!
                                        </div>
                                    )}

                                    {finalGraph.length === 0 ? (
                                        <div className="p-12 text-center opacity-50 flex flex-col items-center justify-center gap-4">
                                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="font-medium">Generating minimized graph architecture...</span>
                                        </div>
                                    ) : (
                                        <div className={`rounded-2xl overflow-hidden border shadow-xl relative ${
                                            dark ? "bg-black/30 border-white/10" : "bg-slate-50 border-slate-200"
                                        }`}>
                                            <CytoscapeComponent
                                                elements={finalGraph}
                                                layout={graphLayout}
                                                style={{ width: "100%", height: "500px" }}
                                                stylesheet={cytoscapeStylesheet}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}