import { useState, useEffect, useRef } from "react";
import { Sun, Moon, ChevronLeft, ChevronRight, Network, Settings, Play, Shuffle, CheckCircle, Info, Key, X, Loader2, Sparkles } from "lucide-react";
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
                <ul className="list-disc list-inside space-y-1 ml-2 text-blue-600 dark:text-blue-400 font-medium">
                    <li><strong className="text-slate-800 dark:text-slate-200">FINAL</strong> states (accepting states)</li>
                    <li><strong className="text-slate-800 dark:text-slate-200">NON-FINAL</strong> states (non-accepting states)</li>
                </ul>
                <div className="p-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Reason:</p>
                    <p className="text-slate-700 dark:text-slate-400 text-sm">States in different categories cannot be equivalent because they differ in acceptance behavior.</p>
                </div>
                <div className="font-mono text-sm bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border border-slate-200 dark:border-slate-800 space-y-1 text-slate-600 dark:text-slate-400">
                    <p><span className="font-semibold text-slate-800 dark:text-slate-200">Final</span> = {'{'} {finalStr} {'}'}</p>
                    <p><span className="font-semibold text-slate-800 dark:text-slate-200">Non-final</span> = {'{'} {nonFinalStr} {'}'}</p>
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
                            <div className="p-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md">
                                <p className="font-semibold mb-2 text-slate-800 dark:text-slate-200">For each state:</p>
                                <ul className="list-none space-y-2 ml-1 text-slate-700 dark:text-slate-400 text-sm">
                                    <li className="flex items-center gap-2"><span className="text-blue-500">→</span> Check transitions for each input symbol</li>
                                    <li className="flex items-center gap-2"><span className="text-blue-500">→</span> See which group the transition leads to</li>
                                </ul>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-md text-slate-700 dark:text-slate-300 text-sm">
                                <p>If two states go to different groups → they are <strong>NOT equivalent</strong>. So we split the group.</p>
                            </div>
                            <p className="font-medium text-sm px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md inline-block">
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
                        <div className="p-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md mt-4">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Stop condition met:</p>
                            <p className="text-slate-700 dark:text-slate-400 text-sm">No more splits are possible. At this point, all states inside a group are definitively equivalent.</p>
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
        <li key={i}><span className="font-mono font-bold text-blue-600 dark:text-blue-400">G{i}</span> → new state</li>
    ));

    steps.push({
        title: `Step ${iteration}: Construct Minimized DFA & Final Result`,
        partitions: JSON.parse(JSON.stringify(P)),
        explanation: (
            <div className="space-y-5 text-sm md:text-base">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700">
                        <p className="font-semibold mb-2 text-slate-800 dark:text-slate-200">Each group becomes a single state:</p>
                        <ul className="list-none space-y-1 text-slate-700 dark:text-slate-400 text-sm pl-1">
                            {mappedGroupsList}
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <div className="p-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-md flex flex-col justify-center">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Transitions</p>
                            <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">Use any representative from the group</p>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-md flex flex-col justify-center">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Final states</p>
                            <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">If ANY state in group is final → group is final</p>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-md flex flex-col justify-center">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Start state</p>
                            <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">Group containing original start state</p>
                        </div>
                    </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-md">
                    <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">The minimized DFA:</p>
                    <ul className="flex flex-wrap gap-2 list-none">
                        <li className="px-2 py-1 bg-white dark:bg-slate-800 rounded-md shadow-sm text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">Has fewer or equal states</li>
                        <li className="px-2 py-1 bg-white dark:bg-slate-800 rounded-md shadow-sm text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">Preserves language</li>
                        <li className="px-2 py-1 bg-white dark:bg-slate-800 rounded-md shadow-sm text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">Removes redundant states</li>
                    </ul>
                </div>
                {isAlreadyMinimal && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold rounded-md border border-green-200 dark:border-green-800 text-center flex items-center justify-center gap-2 text-sm">
                        <CheckCircle size={16} /> If no merges occurred: DFA is already minimal
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

    const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
    const [showApiModal, setShowApiModal] = useState(false);
    const [isGeneratingDFA, setIsGeneratingDFA] = useState(false);
    const [languagePrompt, setLanguagePrompt] = useState("");
    const [pendingPrompt, setPendingPrompt] = useState(false);

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

    const handleRandomDFA = () => {
        const randNum = Math.floor(Math.random() * 5) + 3; // 3 to 7 states
        const newStates = Array.from({ length: randNum }, (_, i) => `q${i}`);
        
        setNumStates(randNum);
        setStates(newStates);

        let newT = {};
        newStates.forEach(st => {
            newT[st] = {};
            alphabet.forEach(a => {
                newT[st][a] = newStates[Math.floor(Math.random() * newStates.length)];
            });
        });
        setTransitions(newT);

        const newFinalStates = newStates.filter(() => Math.random() > 0.6);
        if (newFinalStates.length === 0) newFinalStates.push(newStates[Math.floor(Math.random() * newStates.length)]);
        if (newFinalStates.length === newStates.length) newFinalStates.pop();
        setFinalStates(newFinalStates);
        
        setGraph([]);
        setFinalGraph([]);
        setSteps([]);
    };

    const handleGenerateDFA = () => {
        if (!languagePrompt.trim()) return;
        if (!geminiKey) {
            setPendingPrompt(true);
            setShowApiModal(true);
        } else {
            generateDFAWithGemini(languagePrompt, geminiKey);
        }
    };

    const generateDFAWithGemini = async (prompt, key) => {
        setIsGeneratingDFA(true);
        setShowApiModal(false);
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: `You are an expert in Theory of Computation. Create a Deterministic Finite Automaton (DFA) for the following language description: "${prompt}"

Return strictly valid JSON (and no other markdown or text). Format:
{
  "numStates": <integer>,
  "alphabet": "<comma_separated_string>",
  "transitions": {
    "q0": {"0": "q1", "1": "q2"}
  },
  "finalStates": ["q3"]
}
States must be 'q' followed by an integer index, starting from 'q0'. The start state is 'q0'. Make sure the DFA is complete (all states have transitions for all alphabet symbols).` }
                        ]
                    }]
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || "Failed to generate DFA");

            const textResponse = data.candidates[0].content.parts[0].text;
            const jsonString = textResponse.replace(/```json\n?|```/g, "").trim();
            const dfaData = JSON.parse(jsonString);

            setTransitions(dfaData.transitions || {});
            setFinalStates(dfaData.finalStates || []);
            if (dfaData.numStates) setNumStates(Math.min(15, Math.max(1, dfaData.numStates)));
            if (dfaData.alphabet) setAlphabetInput(dfaData.alphabet);
            
            setGraph([]);
            setSteps([]);
            setFinalGraph([]);
            
        } catch (error) {
            console.error("Gemini API Error:", error);
            alert("Error generating DFA: " + error.message);
        } finally {
            setIsGeneratingDFA(false);
            setPendingPrompt(false);
        }
    };

    const handleSaveApiKey = () => {
        localStorage.setItem("gemini_api_key", geminiKey);
        if (pendingPrompt) {
            generateDFAWithGemini(languagePrompt, geminiKey);
        } else {
            setShowApiModal(false);
        }
    };

    const cytoscapeStylesheet = [
        {
            selector: "node",
            style: {
                "label": "data(id)",
                "text-valign": "center",
                "text-halign": "center",
                "color": "#ffffff",
                "background-color": dark ? "#2563eb" : "#3b82f6",
                "border-width": 2,
                "border-color": dark ? "#60a5fa" : "#2563eb",
                "font-size": "14px",
                "font-weight": "bold",
                "text-outline-width": 1,
                "text-outline-color": dark ? "#1e3a8a" : "#1d4ed8",
                "shadow-blur": 0,
            },
        },
        {
            selector: ".final",
            style: {
                "border-width": 4,
                "border-color": "#4ade80",
                "background-color": "#16a34a",
                "text-outline-color": "#14532d",
                "shadow-blur": 0,
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
            <div className="relative z-10">
                {/* HEADER */}
                <div className={`flex justify-between items-center px-6 py-4 border-b shadow-sm transition-colors duration-300 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-slate-800 dark:text-slate-100">
                        <Network className="text-blue-600 dark:text-blue-500" size={26} />
                        DFA Minimizer
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto">
                    {/* LEFT PANEL — DFA Input */}
                    <div
                        className={`lg:col-span-5 p-6 transition-all duration-200 ${
                            dark ? "glass-panel-dark" : "glass-panel"
                        }`}
                    >
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-3 text-slate-800 dark:text-slate-200 border-b pb-4 border-slate-200 dark:border-slate-800">
                            <Settings className="text-slate-500" size={22} /> Configuration
                        </h2>

                        <div className="space-y-6">
                            <div className={`p-4 rounded-md border ${dark ? "bg-purple-900/10 border-purple-500/20" : "bg-purple-50/50 border-purple-200"}`}>
                                <label className="block text-sm font-semibold opacity-80 mb-2 flex items-center gap-2">
                                    <Sparkles size={16} className="text-purple-500" /> Generate from Language
                                </label>
                                <textarea
                                    value={languagePrompt}
                                    onChange={(e) => setLanguagePrompt(e.target.value)}
                                    placeholder="e.g. Language where 'a' can come at most twice consecutively"
                                    rows={2}
                                    className={`w-full p-2.5 text-sm rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all ${dark ? "bg-slate-900/80 border border-slate-700 text-slate-200 placeholder:text-slate-600" : "bg-white border border-slate-300 text-slate-800 placeholder:text-slate-400"}`}
                                />
                                <button
                                    onClick={handleGenerateDFA}
                                    disabled={isGeneratingDFA || !languagePrompt.trim()}
                                    className={`mt-3 w-full transition-all duration-200 py-2 rounded-md font-semibold text-sm flex justify-center items-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98] ${
                                        dark ? "bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30" : "bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300"
                                    } ${(isGeneratingDFA || !languagePrompt.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isGeneratingDFA ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    {isGeneratingDFA ? "Generating..." : "Generate DFA"}
                                </button>
                            </div>

                            <hr className={dark ? "border-slate-800" : "border-slate-200"} />

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
                                    className={`w-full p-2.5 ${dark ? "glass-input-dark" : "glass-input"}`}
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
                                    className={`w-full p-2.5 ${dark ? "glass-input-dark" : "glass-input"}`}
                                />
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold mb-3 opacity-80">
                                    Transition Table
                                </h3>
                                <div className={`overflow-hidden rounded-md border ${dark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white"}`}>
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
                                                className={`px-3 py-1.5 rounded-md text-sm font-mono font-medium transition-all duration-200 border ${
                                                    isSelected
                                                        ? "bg-green-600 border-green-500 text-white hover:bg-green-700 shadow-sm"
                                                        : dark ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white" : "bg-white border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900 shadow-sm"
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-4 flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleRandomDFA}
                                        className={`flex-1 transition-all duration-200 py-2.5 rounded-md font-semibold text-sm flex justify-center items-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98] ${
                                            dark ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700" : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                                        }`}
                                    >
                                        <Shuffle size={16} /> Randomize
                                    </button>
                                </div>
                                <button
                                    onClick={handleRun}
                                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 py-2.5 rounded-md font-semibold text-white text-sm shadow-sm flex justify-center items-center gap-2"
                                >
                                    <Play size={16} /> Run Minimization
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL — Initial Graph */}
                    <div
                        className={`lg:col-span-7 flex flex-col p-6 transition-all duration-200 min-h-[450px] ${
                            dark ? "glass-panel-dark" : "glass-panel"
                        }`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold flex items-center gap-3 text-slate-800 dark:text-slate-200">
                                <Network className="text-slate-500" size={22} /> Initial Graph View
                            </h2>
                            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${dark ? "bg-white/10 text-slate-300" : "bg-slate-200 text-slate-600"}`}>
                                cose layout
                            </span>
                        </div>

                        {graph.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-50 space-y-4">
                                <div className="w-20 h-20 border-4 border-dashed rounded-full animate-[spin_10s_linear_infinite] flex items-center justify-center border-slate-300 dark:border-slate-600">
                                    <span className="w-3 h-3 bg-slate-400 dark:bg-slate-500 rounded-full"></span>
                                </div>
                                <p className="text-sm font-medium tracking-wide">Configure your DFA and click Run</p>
                            </div>
                        ) : (
                            <div className={`flex-1 rounded-md overflow-hidden border relative ${dark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
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
                        <div className={`p-6 transition-all duration-300 shadow-sm relative overflow-hidden ${dark ? "glass-panel-dark" : "glass-panel"}`}>
                            
                            {/* HEADER */}
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4 relative z-10 border-b pb-4 border-slate-200 dark:border-slate-800">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                    <Info className="text-blue-500" size={20} /> Step {stepIndex + 1} <span className="text-base font-medium text-slate-500 dark:text-slate-400">/ {steps.length}</span>
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
                                        className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-95 transition-all"
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
                            <div className={`w-full h-2 rounded-full overflow-hidden mb-8 shadow-inner ${dark ? "bg-slate-800" : "bg-slate-200"}`}>
                                <div
                                    className="h-full bg-blue-600 transition-all duration-500 ease-out relative rounded-full"
                                    style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                                >
                                </div>
                            </div>

                            {/* STEP CONTENT */}
                            <div className={`p-5 md:p-6 rounded-md border transition-all duration-200 animate-fadeIn relative z-10 shadow-sm ${
                                dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                            }`}>
                                <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b pb-3 border-slate-200 dark:border-slate-800">
                                    {steps[stepIndex].title}
                                </h3>
                                <div className="text-slate-800 dark:text-slate-200">
                                    {steps[stepIndex].explanation}
                                </div>
                            </div>

                            {/* PARTITIONS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-6 mb-6 relative z-10">
                                {steps[stepIndex].partitions.map((group, i) => (
                                    <div
                                        key={i}
                                        className={`p-4 rounded-md border transition-all duration-200 ${
                                            dark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
                                        }`}
                                    >
                                        <strong className="block text-sm font-extrabold tracking-widest text-purple-600 dark:text-purple-400 mb-4 uppercase">
                                            Group G{i}
                                        </strong>

                                        <div className="flex flex-wrap gap-2.5">
                                            {group.map((s) => (
                                                <span
                                                    key={s}
                                                    className={`px-3 py-1 rounded-md text-sm font-mono font-bold shadow-sm ${
                                                        dark ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" : "bg-blue-100 text-blue-700 border border-blue-200"
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
                                    <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-slate-800 dark:text-slate-100">
                                        <CheckCircle size={28} className="text-green-600 dark:text-green-500" />
                                        Minimized DFA Graph
                                    </h3>

                                    {steps[stepIndex].partitions.length === states.length && (
                                        <div className="mb-6 p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 font-semibold flex items-center gap-3 text-sm">
                                            <Info className="text-green-600 dark:text-green-500" size={20} /> This DFA was already perfectly minimal!
                                        </div>
                                    )}

                                    {finalGraph.length === 0 ? (
                                        <div className="p-12 text-center opacity-50 flex flex-col items-center justify-center gap-4">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="font-medium">Generating minimized graph architecture...</span>
                                        </div>
                                    ) : (
                                        <div className={`rounded-md overflow-hidden border relative ${
                                            dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
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
            {/* API KEY MODAL */}
            {showApiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className={`w-full max-w-md p-6 rounded-md shadow-2xl ${dark ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200"}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                <Key className="text-blue-500" size={20} /> API Key Required
                            </h3>
                            <button onClick={() => { setShowApiModal(false); setPendingPrompt(false); }} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            To generate a DFA from natural language, we use Google's Gemini AI. Your key is securely stored locally in your browser.
                            <br/><br/>
                            Don't have one? Get a free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-medium">Google AI Studio</a>.
                        </p>
                        <input
                            type="password"
                            placeholder="AIzaSy..."
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            className={`w-full p-2.5 mb-4 ${dark ? "glass-input-dark" : "glass-input"}`}
                        />
                        <button
                            onClick={handleSaveApiKey}
                            disabled={!geminiKey}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md font-semibold transition-all"
                        >
                            Save & Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}