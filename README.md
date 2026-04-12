# 🦖 T-Rex Runner — Multiplayer Leaderboard Edition

![T-Rex Runner Banner](./Trex_Game.png)

A colorful browser T-Rex runner with a **shared persistent leaderboard**.
Players can submit scores, and everyone visiting your deployed app can compete on the same ranking.

---

## 🏆 Shared Leaderboard (How it works)

- Scores are stored in a server-side **SQLite** database (`leaderboard.db`).
- Anyone opening the same deployed URL sees the same top scores.
- Submit your name + score after a run and challenge others.

---

## 🎮 Controls

- `SPACE` or `↑` → Jump
- `↓` or `S` → Duck
- `R` → Restart after game over
- Tap/click canvas or **Jump** button on mobile
- Hold **Duck** button on mobile to duck

---

## ✨ Features

- Browser-ready canvas game (`index.html` + `game.js`)
- Persistent cross-user leaderboard API (`app.py`)
- Mobile-friendly touch buttons (Jump, Duck, Restart)
- Bright visuals and procedural Web Audio effects
- Progressive speed + obstacle variety

---

## 🚀 Run Locally

### 1) Install dependencies

```bash
pip install -r requirements.txt
```

### 2) Start server

```bash
python app.py
```

### 3) Open in browser

```text
http://localhost:8000
```

---

## 🌐 Deploy Online (so others can compete)

Because leaderboard data is stored server-side, deploy this as a **Python web app** (not static-only):

- **Render / Railway / Fly.io** (recommended)
- Start command: `python app.py`
- Expose port `8000`
- Keep a persistent disk/volume if you want leaderboard data to survive restarts

---

## 📁 Project Files

```text
.
├── app.py              # Flask app + leaderboard API + static file host
├── requirements.txt    # Python dependencies
├── index.html          # Browser UI
├── style.css
├── game.js
├── leaderboard.db      # Auto-created after first run
├── Trex_Game.py        # Original pygame version
├── Trex_Game.png
└── README.md
```

