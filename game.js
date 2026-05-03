const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const scoreValue = document.getElementById('score-value');
const bestValue = document.getElementById('best-value');
const multiplierValue = document.getElementById('multiplier-value');
const powerStatus = document.getElementById('power-status');
const audioToggle = document.getElementById('audio-toggle');
const btnJump = document.getElementById('btn-jump');
const btnDuck = document.getElementById('btn-duck');
const btnPause = document.getElementById('btn-pause');

const W = canvas.width, H = canvas.height, GROUND = H - 90;
const STATE = { start: 'start', running: 'running', paused: 'paused', over: 'over' };
let mode = STATE.start, last = 0, score = 0, best = Number(localStorage.getItem('nd_best') || 0);
let speed = 7, spawnTimer = 0, worldTime = 0, weatherPhase = 0;
let particles = [], obstacles = [], powerups = [];
let audioEnabled = true, activePower = null, powerTimer = 0, multiplier = 1;
bestValue.textContent = best;

const hero = { x: 170, y: GROUND - 72, w: 64, h: 72, vy: 0, ducking: false, shield: 0 };

function setOverlay(html = '', visible = false) {
  overlay.innerHTML = html ? `<div class="panel">${html}</div>` : '';
  overlay.classList.toggle('visible', visible);
}
setOverlay('Press <b>Space</b> or tap to start<br/>Swipe down / hold duck to slide', true);

function jump() { if (hero.y + hero.h >= GROUND - 1) { hero.vy = -18; sfx(700,.08,.05);} }
function setDuck(v){ hero.ducking = v; hero.h = v ? 44 : 72; hero.w = v ? 80 : 64; hero.y = Math.min(hero.y, GROUND - hero.h); }

function spawnObstacle() {
  const typePool = ['spike','bot','drone'];
  const type = typePool[Math.floor(Math.random()*typePool.length)];
  if (type === 'spike') obstacles.push({type,x:W+40,y:GROUND-50,w:38,h:50,vx:speed});
  if (type === 'bot') obstacles.push({type,x:W+40,y:GROUND-62,w:54,h:62,vx:speed+1});
  if (type === 'drone') obstacles.push({type,x:W+40,y:GROUND-150-(Math.random()*40),w:58,h:36,vx:speed+2,phase:Math.random()*Math.PI*2});
}
function spawnPowerup(){
  const kinds=['shield','slow','multi']; const kind=kinds[Math.floor(Math.random()*kinds.length)];
  powerups.push({kind,x:W+40,y:GROUND-120-Math.random()*80,w:28,h:28,vx:speed});
}

function collide(a,b,pad=5){return a.x+pad < b.x+b.w-pad && a.x+a.w-pad > b.x+pad && a.y+pad < b.y+b.h-pad && a.y+a.h-pad > b.y+pad;}

function update(dt){
  if(mode!==STATE.running) return;
  worldTime += dt; weatherPhase += dt*0.00002;
  const slowFactor = activePower==='slow' ? 0.58 : 1;
  speed = Math.min(20, speed + dt*0.00045);
  spawnTimer += dt;
  if(spawnTimer > Math.max(450, 1300 - speed*38)){ spawnObstacle(); spawnTimer = 0; }
  if(Math.random() < 0.0025) spawnPowerup();

  hero.vy += 0.9 * slowFactor; hero.y += hero.vy * slowFactor;
  if(hero.y + hero.h > GROUND){ hero.y = GROUND-hero.h; hero.vy = 0; }

  obstacles.forEach(o=>{
    o.x -= o.vx*slowFactor;
    if(o.type==='drone') o.y += Math.sin(worldTime*0.01+o.phase)*0.4;
    if(collide(hero,o)) {
      if(hero.shield>0){ hero.shield=0; burst(hero.x+40,hero.y+20,'#9dfdff'); obstacles = obstacles.filter(x=>x!==o); return; }
      mode=STATE.over; setOverlay(`Game Over<br/>Score ${Math.floor(score)}<br/><small>Press R to restart</small>`, true); sfx(150,.2,.06);
    }
  });
  obstacles = obstacles.filter(o=>o.x+o.w>-30);

  powerups.forEach(p=>{ p.x-=p.vx*slowFactor; if(collide(hero,p,2)){ applyPower(p.kind); burst(p.x,p.y,'#ffe37c'); p.hit=true; sfx(880,.1,.05);} });
  powerups = powerups.filter(p=>!p.hit && p.x+p.w>-40);

  if(activePower){ powerTimer -= dt; if(powerTimer<=0){ activePower=null; multiplier=1; powerStatus.textContent='No Power-up'; }}
  if(hero.shield>0) hero.shield -= dt;

  score += (dt*0.01) * multiplier;
  if(score>best){ best=Math.floor(score); localStorage.setItem('nd_best', best); }
  scoreValue.textContent = Math.floor(score); bestValue.textContent = best; multiplierValue.textContent = multiplier;
  particles = particles.filter(p=>(p.life-=dt)>0).map(p=>({...p,x:p.x+p.vx,y:p.y+p.vy,vy:p.vy+0.02}));
}

function applyPower(kind){
  activePower = kind; powerTimer = 4500;
  if(kind==='shield'){ hero.shield=4500; powerStatus.textContent='Shield Active'; }
  if(kind==='slow'){ powerStatus.textContent='Slow Motion'; }
  if(kind==='multi'){ multiplier=2; powerStatus.textContent='2x Multiplier'; }
}

function burst(x,y,color){ for(let i=0;i<18;i++) particles.push({x,y,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4,life:500+Math.random()*400,color}); }

function draw(){
  drawBackground(); drawGround(); drawHero(); obstacles.forEach(drawObstacle); powerups.forEach(drawPower); drawParticles();
}

function drawBackground(){
  const t = (Math.sin(weatherPhase)+1)/2;
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,`rgb(${20+120*t},${24+70*t},${45+40*t})`); g.addColorStop(1,`rgb(${8+20*t},${12+18*t},${24+28*t})`); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  parallax(0.2,220,'#1a2753'); parallax(0.45,260,'#26356e');
  if(t<0.45){ for(let i=0;i<55;i++){ ctx.fillStyle='rgba(210,235,255,.8)'; ctx.fillRect((i*97)%W, 30+(i*53)%220,2,2);} }
  if(Math.sin(worldTime*0.001)>0.6){ // rain phase
    ctx.strokeStyle='rgba(130,180,255,.35)'; ctx.lineWidth=1;
    for(let i=0;i<70;i++){ let x=(i*41+worldTime*0.6)%W,y=(i*63+worldTime*0.4)%H; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-8,y+16); ctx.stroke(); }
  }
}
function parallax(f,base,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,GROUND);for(let x=0;x<=W;x+=8){ctx.lineTo(x,base+Math.sin((x+worldTime*f)*0.008)*22);}ctx.lineTo(W,GROUND);ctx.closePath();ctx.fill();}
function drawGround(){ctx.fillStyle='#0f1b3d';ctx.fillRect(0,GROUND,W,H-GROUND);ctx.strokeStyle='#4eb8ff';ctx.beginPath();ctx.moveTo(0,GROUND);ctx.lineTo(W,GROUND);ctx.stroke();}
function drawHero(){
  ctx.save(); ctx.translate(hero.x,hero.y);
  if(hero.shield>0){ ctx.strokeStyle='rgba(140,250,255,.8)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(hero.w/2,hero.h/2,hero.h*.65,0,Math.PI*2); ctx.stroke(); }
  const b=ctx.createLinearGradient(0,0,hero.w,hero.h); b.addColorStop(0,'#67f4ff'); b.addColorStop(1,'#339bff');
  round(0,8,hero.w*.7,hero.h*.75,16,b); round(hero.w*.42,0,hero.w*.5,hero.h*.52,15,'#84ffe3');
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(hero.w*.72,hero.h*.2,4,0,Math.PI*2); ctx.fill();
  ctx.restore();
}
function drawObstacle(o){ if(o.type==='spike') round(o.x,o.y,o.w,o.h,10,'#7dff8f'); if(o.type==='bot') round(o.x,o.y,o.w,o.h,12,'#ff7f9b'); if(o.type==='drone') round(o.x,o.y,o.w,o.h,14,'#ffc86e');}
function drawPower(p){ const c={shield:'#9dfdff',slow:'#a8b1ff',multi:'#ffe37c'}[p.kind]; round(p.x,p.y,p.w,p.h,14,c); }
function drawParticles(){ particles.forEach(p=>{ ctx.fillStyle=p.color; ctx.fillRect(p.x,p.y,3,3); }); }
function round(x,y,w,h,r,f){ctx.fillStyle=f;ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.fill();}

function frame(ts){ const dt=Math.min(40, ts-last||16); last=ts; update(dt); draw(); requestAnimationFrame(frame);} requestAnimationFrame(frame);

function startOrJump(){ if(mode===STATE.start){mode=STATE.running; setOverlay('',false);} if(mode===STATE.running) jump(); }
function reset(){ mode=STATE.start; score=0; speed=7; obstacles=[]; powerups=[]; particles=[]; activePower=null; hero.shield=0; hero.y=GROUND-hero.h; hero.vy=0; setOverlay('Press <b>Space</b> or tap to start<br/>Swipe down / hold duck to slide', true); }
function togglePause(){ if(mode===STATE.running){mode=STATE.paused;setOverlay('Paused<br/>Press P to continue', true);} else if(mode===STATE.paused){mode=STATE.running;setOverlay('',false);} }

document.addEventListener('keydown',e=>{ if([' ','ArrowUp','ArrowDown'].includes(e.key)) e.preventDefault(); if(e.key===' '||e.key==='ArrowUp') startOrJump(); if(e.key==='ArrowDown') setDuck(true); if(e.key.toLowerCase()==='p') togglePause(); if(e.key.toLowerCase()==='r'&&mode===STATE.over) reset();});
document.addEventListener('keyup',e=>{ if(e.key==='ArrowDown') setDuck(false);});

let startY=null;
canvas.addEventListener('pointerdown',e=>{ startY=e.clientY; startOrJump(); });
canvas.addEventListener('pointermove',e=>{ if(startY!==null && e.clientY-startY>24) setDuck(true); });
canvas.addEventListener('pointerup',()=>{ startY=null; setDuck(false); });

btnJump.onclick=()=>startOrJump();
btnPause.onclick=()=>togglePause();
btnDuck.onpointerdown=(e)=>{e.preventDefault();setDuck(true)};
['pointerup','pointerleave','pointercancel'].forEach(ev=>btnDuck.addEventListener(ev,()=>setDuck(false)));

audioToggle.onclick=()=>{audioEnabled=!audioEnabled;audioToggle.textContent=audioEnabled?'🔊 Audio On':'🔈 Audio Off';};
let ac; function sfx(f,d,g){ if(!audioEnabled)return; try{ac=ac||new (window.AudioContext||window.webkitAudioContext)(); const o=ac.createOscillator(),a=ac.createGain();o.frequency.value=f;o.connect(a);a.connect(ac.destination);const t=ac.currentTime;a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(g,t+.01);a.gain.exponentialRampToValueAtTime(.0001,t+d);o.start(t);o.stop(t+d+.02);}catch{}}
