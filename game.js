const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const jumpBtn = document.getElementById('btn-jump');
const duckBtn = document.getElementById('btn-duck');
const restartBtn = document.getElementById('btn-restart');
const scoreForm = document.getElementById('score-form');
const playerNameInput = document.getElementById('player-name');
const leaderboardList = document.getElementById('leaderboard-list');
const scoreMessage = document.getElementById('score-message');

const WORLD = {
  width: canvas.width,
  height: canvas.height,
  groundY: 340,
  gravity: 0.8,
  jumpVelocity: -16,
  startSpeed: 7,
  maxSpeed: 17,
  speedStep: 0.18,
};

let started = false;
let gameOver = false;
let score = 0;
let best = 0;
let speed = WORLD.startSpeed;
let groundScroll = 0;
let lastTs = 0;
let scoreSubmitted = false;

const stars = Array.from({ length: 45 }, () => ({
  x: Math.random() * WORLD.width,
  y: Math.random() * 180,
  size: Math.random() * 2 + 0.5,
  glow: Math.random() * 0.8 + 0.2,
}));

class Dino {
  constructor() {
    this.standH = 56;
    this.duckH = 34;
    this.rect = { x: 120, y: WORLD.groundY - this.standH, w: 52, h: this.standH };
    this.vy = 0;
    this.ducking = false;
  }

  get onGround() { return this.rect.y + this.rect.h >= WORLD.groundY; }

  jump() {
    if (this.onGround) {
      this.vy = WORLD.jumpVelocity;
      playTone(700, 0.08, 0.05);
    }
  }

  setDuck(v) {
    if (v && this.onGround && !this.ducking) {
      this.ducking = true;
      this.rect.h = this.duckH;
      this.rect.w = 64;
      this.rect.y = WORLD.groundY - this.rect.h;
    } else if (!v && this.ducking) {
      this.ducking = false;
      this.rect.h = this.standH;
      this.rect.w = 52;
      this.rect.y = WORLD.groundY - this.rect.h;
    }
  }

  update() {
    this.vy += WORLD.gravity;
    this.rect.y += this.vy;
    if (this.rect.y + this.rect.h > WORLD.groundY) {
      this.rect.y = WORLD.groundY - this.rect.h;
      this.vy = 0;
    }
  }

  draw() {
    ctx.save();
    const grad = ctx.createLinearGradient(this.rect.x, this.rect.y, this.rect.x + this.rect.w, this.rect.y + this.rect.h);
    grad.addColorStop(0, this.ducking ? '#22ff9f' : '#5effd0');
    grad.addColorStop(1, this.ducking ? '#0c8060' : '#1abf98');
    roundRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h, 10, grad);

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    roundRect(this.rect.x + 8, this.rect.y + 8, Math.max(8, this.rect.w * 0.3), 8, 4, ctx.fillStyle);

    ctx.shadowBlur = 14;
    ctx.shadowColor = 'rgba(76,255,216,0.75)';
    roundRect(this.rect.x + this.rect.w - 15, this.rect.y + 10, 6, 6, 2, '#ffffff');
    ctx.restore();
  }
}

class Obstacle {
  constructor(x) {
    this.kind = Math.random() < 0.35 ? 'bird' : 'cactus';
    if (this.kind === 'bird') {
      this.rect = { x, y: pick([WORLD.groundY - 95, WORLD.groundY - 120]), w: 46, h: 30 };
    } else {
      const w = randInt(24, 42);
      const h = randInt(48, 78);
      this.rect = { x, y: WORLD.groundY - h, w, h };
    }
  }

  update() { this.rect.x -= speed; }

  draw() {
    if (this.kind === 'bird') {
      const birdGrad = ctx.createLinearGradient(this.rect.x, this.rect.y, this.rect.x + this.rect.w, this.rect.y + this.rect.h);
      birdGrad.addColorStop(0, '#ff92d5');
      birdGrad.addColorStop(1, '#ff4eaf');
      ctx.fillStyle = birdGrad;
      ellipse(this.rect.x + this.rect.w / 2, this.rect.y + this.rect.h / 2, this.rect.w / 2, this.rect.h / 2);
      ctx.fillStyle = '#fefefe';
      ellipse(this.rect.x + 18, this.rect.y + 13, 8, 4);
    } else {
      const cactusGrad = ctx.createLinearGradient(this.rect.x, this.rect.y, this.rect.x + this.rect.w, this.rect.y + this.rect.h);
      cactusGrad.addColorStop(0, '#66f67f');
      cactusGrad.addColorStop(1, '#17a24a');
      roundRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h, 6, cactusGrad);
      roundRect(this.rect.x - 10, this.rect.y + this.rect.h / 3, 10, 8, 3, '#3ad06a');
    }

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ellipse(this.rect.x + this.rect.w / 2, WORLD.groundY + 4, this.rect.w * 0.55, 5);
  }
}

let dino = new Dino();
let obstacles = [new Obstacle(WORLD.width + 180), new Obstacle(WORLD.width + 520)];

function spawnObstacle() {
  const lastRight = Math.max(...obstacles.map((o) => o.rect.x + o.rect.w), WORLD.width);
  obstacles.push(new Obstacle(lastRight + randInt(280, 460)));
}

function reset() {
  dino = new Dino();
  obstacles = [new Obstacle(WORLD.width + 180), new Obstacle(WORLD.width + 520)];
  gameOver = false;
  started = false;
  score = 0;
  speed = WORLD.startSpeed;
  groundScroll = 0;
  scoreSubmitted = false;
  scoreMessage.textContent = '';
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function drawBackground() {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  skyGrad.addColorStop(0, '#120925');
  skyGrad.addColorStop(0.52, '#1f335a');
  skyGrad.addColorStop(1, '#172033');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  stars.forEach((star) => {
    ctx.fillStyle = `rgba(166,220,255,${star.glow})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  const moonGrad = ctx.createRadialGradient(790, 76, 5, 790, 76, 52);
  moonGrad.addColorStop(0, 'rgba(255,242,201,1)');
  moonGrad.addColorStop(1, 'rgba(255,242,201,0)');
  ctx.fillStyle = moonGrad;
  ctx.beginPath();
  ctx.arc(790, 76, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffe8b2';
  ctx.beginPath();
  ctx.arc(790, 76, 27, 0, Math.PI * 2);
  ctx.fill();

  drawMountainLayer('#3d2b73', 178, 36, 0.35);
  drawMountainLayer('#2f2f68', 220, 44, 0.55);

  const horizon = WORLD.groundY - 8;
  const roadGrad = ctx.createLinearGradient(0, horizon, 0, WORLD.height);
  roadGrad.addColorStop(0, '#4b2f73');
  roadGrad.addColorStop(1, '#1a1738');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, horizon, WORLD.width, WORLD.height - horizon);

  ctx.fillStyle = '#4ef7ff';
  ctx.fillRect(0, WORLD.groundY - 6, WORLD.width, 2);

  ctx.strokeStyle = 'rgba(132,220,255,0.38)';
  ctx.lineWidth = 1;
  for (let x = -80; x <= WORLD.width + 100; x += 40) {
    const px = (x - groundScroll * 1.4) % (WORLD.width + 120);
    ctx.beginPath();
    ctx.moveTo(px, WORLD.groundY);
    ctx.lineTo(WORLD.width / 2, WORLD.height);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(44,225,255,0.6)';
  for (let x = -45; x <= WORLD.width + 45; x += 45) {
    const px = (x - groundScroll) % (WORLD.width + 45) - 8;
    ctx.beginPath();
    ctx.arc(px, WORLD.groundY + 28, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMountainLayer(color, baseY, amp, speedFactor) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, WORLD.groundY);
  for (let x = 0; x <= WORLD.width; x += 8) {
    const y = baseY + Math.sin((x + groundScroll * speedFactor) * 0.012) * amp;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(WORLD.width, WORLD.groundY);
  ctx.closePath();
  ctx.fill();
}

function drawHUD() {
  glassPanel(12, 12, 210, 98);
  ctx.fillStyle = '#e0f4ff';
  ctx.font = '700 24px Inter, Segoe UI, sans-serif';
  ctx.fillText(`Score: ${score}`, 24, 40);
  ctx.fillText(`Best: ${best}`, 24, 68);
  ctx.fillText(`Speed: ${speed.toFixed(1)}`, 24, 96);

  glassPanel(660, 12, 286, 42);
  ctx.font = '600 24px Inter, Segoe UI, sans-serif';
  ctx.fillStyle = '#b5e8ff';
  ctx.fillText('SPACE/↑ Jump   ↓/S Duck', 676, 41);

  if (!started && !gameOver) {
    glassPanel(300, 108, 360, 64);
    ctx.font = '700 30px Inter, Segoe UI, sans-serif';
    ctx.fillStyle = '#f8feff';
    ctx.fillText('Press SPACE to start', 328, 150);
  }

  if (gameOver) {
    glassPanel(238, 108, 484, 206, true);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 66px Inter, Segoe UI, sans-serif';
    ctx.fillText('Game Over', 300, 182);
    ctx.font = '700 34px Inter, Segoe UI, sans-serif';
    ctx.fillStyle = '#d8f4ff';
    ctx.fillText(`Final Score: ${score}`, 360, 226);
    ctx.fillText(`Best Score: ${best}`, 364, 264);
    ctx.font = '600 24px Inter, Segoe UI, sans-serif';
    ctx.fillText('Press R to restart', 390, 298);
  }
}

function glassPanel(x, y, w, h, strong = false) {
  const panelGrad = ctx.createLinearGradient(x, y, x, y + h);
  panelGrad.addColorStop(0, strong ? 'rgba(40,71,122,0.72)' : 'rgba(27,54,98,0.45)');
  panelGrad.addColorStop(1, strong ? 'rgba(13,24,49,0.82)' : 'rgba(10,24,48,0.56)');
  roundRect(x, y, w, h, 12, panelGrad);
  ctx.strokeStyle = 'rgba(151,227,255,0.55)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

function update() {
  if (!started || gameOver) return;

  groundScroll = (groundScroll + speed) % (WORLD.width + 45);
  dino.update();
  for (const o of obstacles) o.update();

  if (obstacles[0] && obstacles[0].rect.x + obstacles[0].rect.w < 0) {
    obstacles.shift();
    spawnObstacle();
    score += 1;
    best = Math.max(best, score);
    speed = Math.min(WORLD.maxSpeed, speed + WORLD.speedStep);
    playTone(980, 0.05, 0.04);
  }

  if (obstacles.some((o) => intersects(dino.rect, o.rect))) {
    gameOver = true;
    playTone(180, 0.18, 0.06);
    if (!scoreSubmitted && score > 0) {
      scoreMessage.textContent = 'Game over! Enter name and submit your score.';
    }
  }
}

function render() {
  drawBackground();
  for (const o of obstacles) o.draw();
  dino.draw();
  drawHUD();
}

function tick(ts) {
  const delta = ts - lastTs;
  if (delta >= 1000 / 60) {
    update();
    render();
    lastTs = ts;
  }
  requestAnimationFrame(tick);
}

function handleJump() {
  if (!gameOver) {
    started = true;
    dino.jump();
  }
}

document.addEventListener('keydown', (e) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
  if ((e.key === ' ' || e.key === 'ArrowUp') && !gameOver) handleJump();
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') dino.setDuck(true);
  if ((e.key === 'r' || e.key === 'R') && gameOver) reset();
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') dino.setDuck(false);
});

jumpBtn?.addEventListener('click', handleJump);
restartBtn?.addEventListener('click', () => gameOver && reset());

duckBtn?.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  dino.setDuck(true);
});

const stopDuck = (e) => {
  e.preventDefault();
  dino.setDuck(false);
};

duckBtn?.addEventListener('pointerup', stopDuck);
duckBtn?.addEventListener('pointercancel', stopDuck);
duckBtn?.addEventListener('pointerleave', stopDuck);
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  handleJump();
});

scoreForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = playerNameInput.value.trim();
  if (!gameOver) {
    scoreMessage.textContent = 'Finish a run before submitting.';
    return;
  }
  if (!name) {
    scoreMessage.textContent = 'Please enter your name.';
    return;
  }
  if (score <= 0) {
    scoreMessage.textContent = 'Score must be greater than 0.';
    return;
  }

  try {
    await submitScore(name, score);
    scoreSubmitted = true;
    scoreMessage.textContent = 'Score submitted! Leaderboard updated.';
    await fetchLeaderboard();
  } catch (err) {
    scoreMessage.textContent = `Could not submit score: ${err.message}`;
  }
});

async function fetchLeaderboard() {
  try {
    const resp = await fetch('/api/leaderboard?limit=10');
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(payload.error || 'Leaderboard unavailable');

    leaderboardList.innerHTML = '';
    const entries = payload.entries || [];
    if (!entries.length) {
      leaderboardList.innerHTML = '<li>No scores yet. Be the first!</li>';
      return;
    }

    entries.forEach((entry) => {
      const li = document.createElement('li');
      const when = new Date(entry.created_at).toLocaleDateString();
      li.textContent = `${entry.name} — ${entry.score} pts (${when})`;
      leaderboardList.appendChild(li);
    });
  } catch (err) {
    leaderboardList.innerHTML = `<li>Unable to load leaderboard: ${err.message}</li>`;
  }
}

async function submitScore(name, scoreValue) {
  const resp = await fetch('/api/leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score: scoreValue }),
  });
  if (!resp.ok) {
    const payload = await resp.json().catch(() => ({}));
    throw new Error(payload.error || 'submission failed');
  }
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

function roundRect(x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function ellipse(x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

let audioCtx;
function playTone(freq, duration, gainValue) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = gainValue;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainValue, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  } catch (_) {
    // Silently skip audio if browser blocks/doesn't support WebAudio.
  }
}

fetchLeaderboard();
render();
requestAnimationFrame(tick);
