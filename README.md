# DFA Visualizer

An interactive, step-by-step **DFA Minimization Visualizer** built with React. Designed as a teaching tool for students learning automata theory.

## ✨ Features

- 🔢 Configure DFA with up to **15 states** and a custom alphabet
- 📊 **Visual graph** of the initial DFA (powered by Cytoscape.js)
- 🧠 **Step-by-step minimization** using the Table-Filling / Partition Refinement algorithm
- 🎓 **Teaching mode** — each step includes a plain-English explanation
- ▶️ **Auto-play** with adjustable speed (1s / 3s / 5s per step)
- 🌗 **Dark / Light mode** toggle
- ✅ Detects when a DFA is already minimized

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- npm (comes with Node.js)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/dfa-visualizer.git
cd dfa-visualizer
npm install
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
```

Output will be in the `/build` folder.

## 🛠️ Tech Stack

| Library | Purpose |
|---|---|
| [React 18](https://react.dev/) | UI framework |
| [Cytoscape.js](https://js.cytoscape.org/) | Graph rendering |
| [react-cytoscapejs](https://github.com/plotly/react-cytoscapejs) | React wrapper for Cytoscape |
| [lucide-react](https://lucide.dev/) | Icons |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |

## 📖 How to Use

1. Set the **number of states** (e.g. 4 for q0–q3)
2. Enter the **alphabet** as comma-separated symbols (e.g. `0,1`)
3. Fill in the **transition table** — for each state and symbol, pick the next state
4. Check the **final/accepting states**
5. Click **Run Minimization**
6. Use **Play** or the arrow buttons to walk through each step

## 📐 Algorithm

This visualizer implements the **Partition Refinement** (Hopcroft-style) algorithm:

1. Start with two groups: accepting states and non-accepting states
2. Repeatedly split groups whose members transition to different groups on some input
3. Stop when no more splits are possible
4. Each remaining group becomes one state in the minimized DFA

## 📄 License

MIT — free to use, modify, and distribute.
