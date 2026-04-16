# DFA Minimizer

An interactive step-by-step DFA minimization visualizer built with React, Vite, Tailwind CSS, and Cytoscape.js.

## Features

- Configure DFA with up to 15 states and a custom alphabet
- Visual graph of the original DFA
- Step-by-step Myhill-Nerode / table-filling minimization walkthrough
- Auto-play slideshow with adjustable speed
- Visual graph of the minimized DFA
- Dark / light mode toggle

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Deploy to GitHub + Vercel

### Step 1 — Push to GitHub

1. Create a new repository on [github.com/new](https://github.com/new)  
   - Name it `dfa-minimizer` (or anything you like)  
   - Leave it empty (no README, no .gitignore)

2. In your terminal, inside this project folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Step 2 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (or sign up with GitHub).
2. Click **"Add New Project"**.
3. Import your `dfa-minimizer` GitHub repository.
4. Vercel will auto-detect **Vite**. The settings will be:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.

Your app will be live at `https://dfa-minimizer.vercel.app` (or similar) within ~1 minute.

> Every future `git push` to `main` will trigger an automatic redeploy.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| Cytoscape.js | Graph visualization |
| react-cytoscapejs | React wrapper for Cytoscape |
| lucide-react | Icons |
