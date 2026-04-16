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

    const currentP = [...P]; // ✅ FIX

    for (let group of currentP) {
      let map = {};

      for (let state of group) {
        let key = alphabet
          .map((a) => {
            let next = transitions[state]?.[a];
            if (!next) return -1;
            return currentP.findIndex((g) => g.includes(next)); // ✅ FIX
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
          explanation: `We examine group [${group.join(
            ", "
          )}]. Some states behave differently on inputs, so we split them into smaller groups based on their transition targets.`,
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

// ================= CYTOSCAPE STYLESHEET =================
function getCytoscapeStylesheet(dark) {
  return [
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
      },
    },
  ];
}

// ================= APP =================
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

  const stylesheet = getCytoscapeStylesheet(dark);

  return (
    <div className={`${dark ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"} min-h-screen`}>
      <div className="flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold">DFA Visualizer</h1>
        <button onClick={() => setDark(!dark)} className="p-2 rounded-full bg-white/10">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 p-6">
        <div className={`${dark ? "bg-white/5 text-white" : "bg-white text-slate-800"} p-6 rounded-xl shadow`}>
          <input type="number" value={numStates} onChange={(e) => setNumStates(Math.min(15, Number(e.target.value)))} className="w-full mb-3 p-2 rounded" />
          <input value={alphabetInput} onChange={(e) => setAlphabetInput(e.target.value)} className="w-full mb-4 p-2 rounded" />

          {states.map((s) => (
            <div key={s}>
              {alphabet.map((a) => (
                <select key={a} value={transitions[s]?.[a] || ""} onChange={(e) =>
                  setTransitions((prev) => ({
                    ...prev,
                    [s]: { ...prev[s], [a]: e.target.value },
                  }))
                }>
                  <option value="">-</option>
                  {states.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ))}
            </div>
          ))}

          <button onClick={handleRun} className="mt-4 w-full bg-indigo-500 py-2 rounded">
            Run Minimization
          </button>
        </div>

        <div className={`${dark ? "bg-white/5" : "bg-white"} rounded-xl p-4 shadow`}>
          <CytoscapeComponent elements={graph} layout={{ name: "circle" }} style={{ width: "100%", height: "300px" }} stylesheet={stylesheet} />
        </div>
      </div>
    </div>
  );
}
