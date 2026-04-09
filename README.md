# 🦖 T-Rex Runner — Play in the Browser

![T-Rex Runner Banner](./Trex_Game.png)

A colorful T-Rex endless runner that now runs **directly in your browser** (HTML/CSS/JavaScript) and includes sound effects, jump/duck controls, speed progression, and score tracking.

---

## 🌐 Play Online

**Game** **available** **at:** https://trex-game-iota.vercel.app/

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
- Mobile-friendly touch buttons (Jump, Duck, Restart)
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

