# 🦖 T-Rex Runner — Online Multiplayer Leaderboard

![T-Rex Runner Banner](./Trex_Game.png)

A browser T-Rex runner with a **real online leaderboard**.
Players submit scores to a shared backend so everyone can compete on the same ranking.

---

## ✅ Why leaderboard failed before on Vercel

Static deployments cannot write to local files (`leaderboard.db`) in a persistent way.
To work online, Vercel needs a hosted data store.

This repo now uses a Vercel Serverless API route (`/api/leaderboard`) backed by **Vercel KV (Upstash Redis)**.

---

## 🚀 Vercel Setup (required for online leaderboard)

1. In your Vercel project, go to **Storage**.
2. Create/connect **KV (Upstash Redis)**.
3. Ensure these env vars exist (Vercel adds them automatically when KV is linked):
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
4. Redeploy the project.

After this, leaderboard reads/writes work online at:
- `GET /api/leaderboard`
- `POST /api/leaderboard`

---

## 🎮 Controls

- `SPACE` or `↑` → Jump
- `↓` or `S` → Duck
- `R` → Restart after game over
- Tap/click canvas or **Jump** button on mobile
- Hold **Duck** button on mobile to duck

---

## ✨ Features

- Browser canvas game (`index.html` + `game.js`)
- Serverless API leaderboard (`api/leaderboard.py`)
- Shared cross-user persistent scores (via Vercel KV)
- Mobile-friendly touch controls
- Procedural game sounds

---

## 🧪 Local Run

### Python mode (legacy local backend)

```bash
pip install -r requirements.txt
python app.py
```

Open:

```text
http://localhost:8000
```

> Note: local mode uses SQLite; production Vercel mode uses KV.

---

## 📁 Project Files

```text
.
├── api/
│   └── leaderboard.py   # Vercel serverless leaderboard API
├── app.py               # Local Flask server with SQLite
├── index.html
├── style.css
├── game.js
├── requirements.txt
├── Trex_Game.py         # Original pygame version
├── Trex_Game.png
└── README.md
```
