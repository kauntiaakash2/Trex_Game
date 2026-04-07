# 🦖 T-Rex Runner (Pygame)

![T-Rex Runner Banner](./Trex_Game.png)

A colorful, modern take on the classic offline runner game built with **Python + Pygame**.
Jump, duck, dodge obstacles, beat your best score, and enjoy generated sound effects without needing any external audio files.

---

## ✨ Features

- 🎮 Smooth endless-runner gameplay loop
- 🦘 Responsive jump physics and gravity
- 🧎 Duck mechanic (`DOWN` / `S`) for low obstacles
- 🌵 Mixed obstacle types (cactus + bird)
- ⚡ Progressive difficulty (speed increases over time)
- 🏆 Best score tracking during session
- 🎨 Bright visuals (sky, sun, clouds, grass, motion pebbles)
- 🔊 Procedurally generated sound effects (jump / score / hit)
- 🔇 Graceful fallback if audio device is unavailable

---

## 🕹️ Controls

| Key | Action |
|-----|--------|
| `SPACE` or `UP` | Jump |
| `DOWN` or `S` | Duck |
| `R` | Restart after game over |
| Window close button | Quit |

---

## 🚀 Getting Started

### 1) Prerequisites

- Python 3.9+
- `pygame`

### 2) Install dependency

```bash
pip install pygame
```

### 3) Run the game

```bash
python Trex_Game.py
```

---

## 📁 Project Structure

```text
Trex_Game/
├── Trex_Game.py      # Main game source code
├── Trex_Game.png     # Header/banner image
└── README.md
```

---

## 🧠 Notes

- Sound effects are generated directly in code via sine-wave synthesis, so no `.wav` assets are needed.
- If your environment has no audio output, the game still runs normally without sound.

---

## 📜 License

This project is open for learning and personal use.
