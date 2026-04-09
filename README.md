# 🦖 T-Rex Runner — Play in the Browser

![T-Rex Runner Banner](./Trex_Game.png)

A colorful T-Rex endless runner that now runs **directly in your browser** (HTML/CSS/JavaScript) and includes sound effects, jump/duck controls, speed progression, and score tracking.

---

## 🌐 Play Online (Deploy in minutes)

You can deploy this as a static site on **GitHub Pages**, **Netlify**, or **Vercel**.

### Option A: GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` (or your default branch), folder `/ (root)`
4. Save and wait for deployment.
5. Your game will be available at:
   `https://<your-username>.github.io/<repo-name>/`

### Option B: Netlify

1. Create a new site from your Git repo.
2. Build command: *(leave empty)*
3. Publish directory: `.`
4. Deploy.

### Option C: Vercel

1. Import your repo into Vercel.
2. Framework preset: **Other**.
3. Build command: *(none)*
4. Output directory: `.`
5. Deploy.

---

## 🎮 Controls

- `SPACE` or `↑` → Jump
- `↓` or `S` → Duck
- `R` → Restart after game over

---

## ✨ Features

- Browser-ready canvas game (`index.html` + `game.js`)
- Bright colorful visuals (sky, clouds, ground, sun)
- Dino jump + duck mechanics
- Mixed obstacle types (cactus + bird)
- Progressive difficulty (speed ramps up)
- Score + best score HUD
- Procedural sound effects with Web Audio API

---

## 🧪 Run Locally

Because browsers can block some features when opening files directly, run a small local server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

---

## 📁 Project Files

```text
.
├── index.html
├── style.css
├── game.js
├── Trex_Game.py        # Original pygame version
├── Trex_Game.png
└── README.md
```

