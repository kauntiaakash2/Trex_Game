const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const jumpBtn = document.getElementById('btn-jump');
const duckBtn = document.getElementById('btn-duck');
const restartBtn = document.getElementById('btn-restart');

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

class Dino {
  constructor() {
    this.standH = 56;
    this.duckH = 34;
    this.rect = { x: 120, y: WORLD.groundY - this.standH, w: 52, h: this.standH };
    this.vy = 0;
    this.ducking = false;
  }

  get onGround() {
    return this.rect.y + this.rect.h >= WORLD.groundY;
  }

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
    roundRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h, 8, this.ducking ? '#1f6b54' : '#246f48');
    roundRect(this.rect.x + this.rect.w - 15, this.rect.y + 10, 6, 6, 2, '#ffffff');
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
      ctx.fillStyle = '#e2763f';
      ellipse(this.rect.x + this.rect.w / 2, this.rect.y + this.rect.h / 2, this.rect.w / 2, this.rect.h / 2);
      ctx.fillStyle = '#ffffff';
      ellipse(this.rect.x + 18, this.rect.y + 13, 8, 4);
    } else {
      roundRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h, 5, '#1a7a47');
      roundRect(this.rect.x - 10, this.rect.y + this.rect.h / 3, 10, 8, 3, '#1a7a47');
    }
  }
}

let dino = new Dino();
let obstacles = [new Obstacle(WORLD.width + 180), new Obstacle(WORLD.width + 520)];

function spawnObstacle() {
  const lastRight = Math.max(...obstacles.map(o => o.rect.x + o.rect.w), WORLD.width);
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
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function drawBackground() {
  ctx.fillStyle = '#b6ebff';
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.fillStyle = '#ffd949';
  ctx.beginPath();
  ctx.arc(820, 80, 34, 0, Math.PI * 2);
  ctx.fill();

  const cloudOffset = (score * 2) % (WORLD.width + 220);
  const baseX = WORLD.width - cloudOffset;
  drawCloud((baseX % (WORLD.width + 220)) - 80, 70);
  drawCloud(((baseX + 180) % (WORLD.width + 220)) - 80, 96);

  ctx.fillStyle = '#7c5330';
  ctx.fillRect(0, WORLD.groundY, WORLD.width, WORLD.height - WORLD.groundY);
  ctx.fillStyle = '#5aa53d';
  ctx.fillRect(0, WORLD.groundY - 8, WORLD.width, 8);

  for (let x = -45; x <= WORLD.width + 45; x += 45) {
    const px = (x - groundScroll) % (WORLD.width + 45) - 8;
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(px, WORLD.groundY + 28, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCloud(x, y) {
  ctx.fillStyle = '#ffffff';
  ellipse(x + 44, y + 14, 35, 17);
  ellipse(x + 70, y + 12, 30, 15);
  ellipse(x + 24, y + 15, 28, 14);
}

function drawHUD() {
  ctx.fillStyle = '#1f2e39';
  ctx.font = '24px Segoe UI, sans-serif';
  ctx.fillText(`Score: ${score}`, 18, 34);
  ctx.fillText(`Best: ${best}`, 18, 62);
  ctx.fillText(`Speed: ${speed.toFixed(1)}`, 18, 90);
  ctx.font = '20px Segoe UI, sans-serif';
  ctx.fillText('SPACE/↑ Jump   ↓/S Duck', 650, 30);

  if (!started && !gameOver) {
    ctx.font = '28px Segoe UI, sans-serif';
    ctx.fillText('Press SPACE to start', 340, 132);
  }

  if (gameOver) {
    roundRect(250, 115, 460, 190, 12, '#ffffff');
    ctx.strokeStyle = '#5b6770';
    ctx.lineWidth = 3;
    ctx.strokeRect(250, 115, 460, 190);

    ctx.fillStyle = '#1f2e39';
    ctx.font = '54px Segoe UI, sans-serif';
    ctx.fillText('Game Over', 338, 175);
    ctx.font = '30px Segoe UI, sans-serif';
    ctx.fillText(`Final Score: ${score}`, 364, 220);
    ctx.fillText(`Best Score: ${best}`, 368, 255);
    ctx.font = '24px Segoe UI, sans-serif';
    ctx.fillText('Press R to restart', 390, 286);
  }
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

  if (obstacles.some(o => intersects(dino.rect, o.rect))) {
    gameOver = true;
    playTone(180, 0.18, 0.06);
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
  if ([" ", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
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

render();
requestAnimationFrame(tick);
