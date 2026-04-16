import { useState, useEffect } from "react";
import CytoscapeComponent from "react-cytoscapejs";

/* ================= DFA MINIMIZATION ================= */
function minimizeDFA(dfa) {
  const { states, alphabet, transitions, accept } = dfa;

  let steps = [];

  let P = [
    accept,
    states.filter((s) => !accept.includes(s)),
  ].filter((g) => g.length);

  steps.push({
    title: "Step 1: Initial Partition",
    partitions: JSON.parse(JSON.stringify(P)),
    explanation:
      "Divide states into FINAL and NON-FINAL groups.",
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
          explanation: `States in [${group.join(
            ", "
          )}] behave differently → split.`,
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
        explanation: "Update partition after split.",
      });
      iteration++;
    }

    P = newP;
  }

  steps.push({
    title: `Step ${iteration}: Final Minimized DFA`,
    partitions: JSON.parse(JSON.stringify(P)),
    explanation: "No more splits possible.",
    isFinal: true,
  });

  return steps;
}

/* ================= BUILD MIN DFA ================= */
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

/* ================= GRAPH ================= */
function generateGraph(dfa, finalStates) {
  const { states, alphabet, transitions } = dfa;
  const edgeMap = {};

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

  const nodes = states.map((s) => ({
    data: { id: s },
    classes: finalStates.includes(s) ? "final" : "",
  }));

  const startNode = {
    data: { id: "__start__" },
    classes: "start-node",
  };

  const startEdge = {
    data: {
      source: "__start__",
      target: states[0],
    },
    classes: "start-edge",
  };

  return [startNode, ...nodes, startEdge, ...edges];
}

/* ================= APP ================= */
export default function App() {
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

  useEffect(() => {
    const s = Array.from({ length: numStates }, (_, i) => `q${i}`);
    setStates(s);
  }, [numStates]);

  useEffect(() => {
    setAlphabet(
      alphabetInput.split(",").map((x) => x.trim()).filter(Boolean)
    );
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

    setGraph(generateGraph(dfa, finalStates));

    const minimized = buildMinimizedDFA(
      dfa,
      resultSteps[resultSteps.length - 1].partitions
    );

    setFinalGraph(generateGraph(minimized, minimized.accept));
  };

  const stylesheet = [
    {
      selector: "node",
      style: {
        label: "data(id)",
        color: "#fff",
        "text-valign": "center",
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
      },
    },
    {
      selector: ".start-node",
      style: { "background-opacity": 0 },
    },
    {
      selector: ".start-edge",
      style: {
        "target-arrow-shape": "triangle",
        "line-color": "#60a5fa",
        "target-arrow-color": "#60a5fa",
      },
    },
    {
      selector: "edge",
      style: {
        "curve-style": "bezier",
        "target-arrow-shape": "triangle",
        "line-color": "#94a3b8",
        "target-arrow-color": "#94a3b8",
        label: "data(label)",
      },
    },
  ];

  return (
    <div className="p-6">
      <h1>DFA Minimizer</h1>

      <button onClick={handleRun}>Run</button>

      <CytoscapeComponent
        elements={graph}
        layout={{ name: "breadthfirst", directed: true }}
        style={{ width: "100%", height: "300px" }}
        stylesheet={stylesheet}
      />

      {steps.length > 0 && (
        <div>
          <h2>{steps[stepIndex].title}</h2>
          <p>{steps[stepIndex].explanation}</p>
        </div>
      )}

      {steps[stepIndex]?.isFinal && (
        <div>
          <h2>Minimized DFA</h2>
          <CytoscapeComponent
            elements={finalGraph}
            layout={{ name: "breadthfirst", directed: true }}
            style={{ width: "100%", height: "300px" }}
            stylesheet={stylesheet}
          />
        </div>
      )}
    </div>
  );
}
