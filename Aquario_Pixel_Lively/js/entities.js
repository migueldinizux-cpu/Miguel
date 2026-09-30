'use strict';
// =====================================================================
//  Entidades e comportamento
// =====================================================================
let fish = [], schools = [], puffer = null, crab = null, jellies = [], anemones = [], seahorses = [];
let moray = null, eels = null, clam = null, chest = null, otter = null;
let strands = { back: [], mid: [], front: [] };
let bubbles = [], pops = [], foods = [], ripples = [], sparkles = [], snow = [], vents = [], passers = [];
let spawnT = {};

const mouseNear = (x, y, r) => mouse.seen && mouse.active > 0.05 && Math.hypot(mouse.x - x, mouse.y - y) < r;

// ---------------- bolhas e partículas ----------------
let BUB = null;
function bubbleSprites() {
  const out = [paint(1, 1, () => '#e6fcffd0'), paint(2, 2, (x, y) => x + y === 0 ? '#ffffffe0' : x + y === 2 ? '#86d6f0a0' : '#bdf2ffb0')];
  for (const s of [3, 5, 7]) { const R = (s - 1) / 2, hl = Math.max(1, Math.round(R * 0.5)); out.push(paint(s, s, (x, y) => { const d = Math.hypot(x - R, y - R); if (d > R + 0.4) return null; if (x === hl && y === hl) return '#ffffff'; return d > R - 0.9 ? '#c4f5ffd0' : '#8fdcff30'; })); }
  return out;
}
class Bubble {
  constructor(x, y, r) { this.x = x; this.y = y; this.r = clamp(r, 0, 4); this.vy = -rand(4, 8); this.ph = rand(TAU); this.a = rand(0.6, 1.4); this.dead = false; }
  update(dt) {
    this.vy += (-(9 + this.r * 5) - this.vy) * Math.min(1, dt * 1.2); this.y += this.vy * dt; this.x += Math.sin(T * 3.2 + this.ph) * this.a * dt * 5;
    if (this.y < waterTop + this.r) this.pop();
    else if (mouse.seen && mouse.active > 0.3 && Math.hypot(mouse.x - this.x, mouse.y - this.y) < this.r + 2.5) this.pop();
  }
  pop() { if (this.dead) return; this.dead = true; if (this.y > waterTop + this.r + 2) sfx('bubble', { v: 0.45 + this.r * 0.12 }); for (let k = 0; k < 3 + this.r; k++) { const a = rand(TAU), v = rand(8, 16); pops.push({ x: this.x, y: this.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.25 }); } }
  draw() { const s = BUB[this.r]; ctx.drawImage(s, Math.round(this.x - s.width / 2), Math.round(this.y - s.height / 2)); }
}
const addBubble = (x, y, r) => { if (bubbles.length < 260) bubbles.push(new Bubble(x, y, r)); };
const spark = (x, y, o = {}) => { if (sparkles.length < 400) sparkles.push(Object.assign({ x, y, vx: rand(-4, 4), vy: rand(-4, 4), l: rand(0.6, 1.4), m: 1.4 }, o)); };

// ---------------- peixes ----------------
class Fish {
  constructor(key, school) {
    this.key = key; this.sp = FISH[key]; this.sh = sheet(key); this.school = school || null;
    this.x = school ? school.x + rand(-18, 18) : rand(10, W - 10);
    this.y = school ? school.y + rand(-10, 10) : rand(waterTop + 20, groundTop - 20);
    this.dir = chance(0.5) ? -1 : 1; this.w = this.dir > 0 ? rand(-0.5, 0.5) : Math.PI + rand(-0.5, 0.5);
    this.vx = this.dir * this.sp.speed * 0.5; this.vy = 0; this.anim = rand(8); this.scare = 0;
    this.cur = RNG(); this.mul = rand(0.85, 1.15); this.pref = rand(0.12, 0.85); this.off = rand(TAU);
    this.home = key === 'clown' && anemones.length ? anemones[0] : null;
  }
  update(dt) {
    const sp = this.sp, base = sp.speed * this.mul, sh = this.sh, top = waterTop + sh.hh + 4, bot = gy(this.x) - sh.hh - 6;
    let md = 1e9, mdx = 0, mdy = 0;
    if (mouse.seen && mouse.active > 0.05) {
      mdx = this.x - mouse.x; mdy = this.y - mouse.y; md = Math.hypot(mdx, mdy) || 1;
      const R = 26 + Math.min(mouse.speed * 0.1, 40); if (md < R && (mouse.speed > 28 || md < 10)) this.scare = Math.max(this.scare, 1);
    }
    // perigo: tentáculos do kraken
    let dx0 = 0, dy0 = 0, danger = false;
    for (const p of passers) if (p.kind === 'kraken') { const q = p.nearest(this.x, this.y); if (q && q.d < 24) { danger = true; dx0 = q.nx; dy0 = q.ny; } }
    if (danger) this.scare = Math.max(this.scare, 0.6);
    let pd = null;
    if (this.pred && (this.pred.t -= dt) > 0) { const px = this.x - this.pred.x, py = this.y - this.pred.y, d = Math.hypot(px, py) || 1; if (d < 40) { pd = { nx: px / d, ny: py / d }; this.scare = Math.max(this.scare, 0.25); } }
    this.scare = Math.max(0, this.scare - dt);
    let food = null;
    if (!this.scare) { let fd = 140; for (const fo of foods) { if (fo.dead) continue; const d = Math.abs(fo.x - this.x) + Math.abs(fo.y - this.y); if (d < fd) { fd = d; food = fo; } } }
    let w;
    if (this.school) w = this.school.w + Math.sin(T * 0.7 + this.off) * 0.25;
    else {
      this.w += (RNG() - 0.5) * dt * 2.4;
      if (this.x < -6 && Math.cos(this.w) < 0) this.w = Math.PI - this.w;
      if (this.x > W + 6 && Math.cos(this.w) > 0) this.w = Math.PI - this.w;
      if (this.y < top + 8 && Math.sin(this.w) < 0) this.w = -this.w;
      if (this.y > bot - 8 && Math.sin(this.w) > 0) this.w = -this.w;
      w = this.w;
    }
    let tvx = Math.cos(w) * base, tvy = Math.sin(w) * base * 0.35;
    tvy += clamp((lerp(top, bot, this.pref) - this.y) * 0.03, -0.4, 0.4) * base;
    if (this.school) {
      const s = this.school; let n = 0, sx = 0, sy = 0, avx = 0, avy = 0;
      for (const o of s.members) { if (o === this) continue; const ddx = o.x - this.x, ddy = o.y - this.y, d2 = ddx * ddx + ddy * ddy; if (d2 < 1000) { n++; avx += o.vx; avy += o.vy; if (d2 < 64) { const d = Math.sqrt(d2) || 0.5; sx -= ddx / d * (8 - d); sy -= ddy / d * (8 - d); } } }
      tvx += (s.cx - this.x) * 0.22 + sx * 2.2; tvy += (s.cy - this.y) * 0.22 + sy * 2.2;
      if (n) { tvx = lerp(tvx, avx / n, 0.3); tvy = lerp(tvy, avy / n, 0.3); }
    }
    if (this.scare > 0) {
      if (this.home) { const hx = this.home.x - this.x, hy = this.home.y - 6 - this.y, d = Math.hypot(hx, hy) || 1; tvx = hx / d * base * 2.5; tvy = hy / d * base * 2.5; }
      else if (danger) { tvx = dx0 * base * 3.2; tvy = dy0 * base * 3.2; }
      else if (pd) { tvx = pd.nx * base * 1.7; tvy = pd.ny * base * 1.7; }
      else if (md < 200) { tvx = mdx / md * base * 3.2; tvy = mdy / md * base * 3.2; }
      if (night() > 0.3 && RNG() < dt * 8) spark(this.x - this.dir * sh.hw, this.y, { vx: 0, vy: 0, l: 0.8, m: 0.8 });
    } else if (food) {
      const fx = food.x - this.x, fy = food.y - this.y, d = Math.hypot(fx, fy) || 1;
      tvx = fx / d * base * 2.2; tvy = fy / d * base * 2.2;
      if (d < 2.5 + sh.hh * 0.3) { food.dead = true; if (chance(0.5)) addBubble(this.x + this.dir * sh.hw, this.y, 0); }
    } else {
      if (this.home) { const hx = this.home.x + Math.sin(T * 0.4 + this.off) * 7 - this.x, hy = this.home.y - 14 + Math.cos(T * 0.5 + this.off) * 3 - this.y, d = Math.hypot(hx, hy) || 1; if (d > 12) { const k = Math.min(1, (d - 12) / 12); tvx = lerp(tvx, hx / d * base, k); tvy = lerp(tvy, hy / d * base, k); } }
      if (this.cur > 0.4 && mouse.speed < 12 && md < 80) {
        if (md > 18) { const k = base * 0.8 * mouse.active; tvx = lerp(tvx, -mdx / md * k, 0.75); tvy = lerp(tvy, -mdy / md * k, 0.75); } else { tvx *= 0.25; tvy *= 0.25; }
      }
    }
    const kk = Math.min(1, (this.scare > 0 ? 7 : food ? 4 : 1.8) * dt);
    this.vx += (tvx - this.vx) * kk; this.vy += (tvy - this.vy) * kk;
    const maxS = base * (this.scare > 0 ? 3.4 : food ? 2.3 : 1.3), s = Math.hypot(this.vx, this.vy);
    if (s > maxS) { this.vx *= maxS / s; this.vy *= maxS / s; }
    this.x = clamp(this.x + this.vx * dt, -40, W + 40); this.y += this.vy * dt;
    if (this.y < top) { this.y = top; if (this.vy < 0) this.vy *= -0.3; }
    if (this.y > bot) { this.y = bot; if (this.vy > 0) this.vy *= -0.3; }
    if (this.vx > base * 0.12) this.dir = 1; else if (this.vx < -base * 0.12) this.dir = -1;
    this.anim += dt * (4 + s / base * 6);
  }
  draw() { drawSprite(this.sh, Math.floor(this.anim), this.x, this.y, this.dir); }
}
function updateSchools(dt) {
  for (const s of schools) {
    let cx = 0, cy = 0; for (const m of s.members) { cx += m.x; cy += m.y; }
    const n = s.members.length || 1; s.cx = cx / n; s.cy = cy / n;
    s.w += (RNG() - 0.5) * dt * 1.8;
    if (s.cx < -5 && Math.cos(s.w) < 0) s.w = Math.PI - s.w;
    if (s.cx > W + 5 && Math.cos(s.w) > 0) s.w = Math.PI - s.w;
    if (s.cy < waterTop + 18 && Math.sin(s.w) < 0) s.w = -s.w;
    if (s.cy > groundTop - 16 && Math.sin(s.w) > 0) s.w = -s.w;
  }
}
function buildFish() {
  fish = []; schools = [];
  const N = clamp(Math.round(CFG.fishCount), 0, 80);
  const order = ['clown', 'tang', 'yellowTang', 'idol', 'butterfly', 'clown', 'queenAngel', 'gramma', 'parrot', 'lionfish', 'tang', 'snapper', 'butterfly', 'yellowTang', 'gramma', 'idol', 'queenAngel', 'snapper'];
  const nSingles = Math.round(N * 0.42);
  for (let i = 0; i < nSingles; i++) fish.push(new Fish(order[i % order.length]));
  let rest = N - nSingles;
  const kinds = ['chromis', 'anthias', 'sardine', 'chromis'];
  const nS = rest > 24 ? 4 : rest > 14 ? 3 : rest > 4 ? 2 : rest > 0 ? 1 : 0;
  for (let s = 0; s < nS; s++) {
    const count = Math.round(rest / (nS - s)); rest -= count;
    const sc = { x: rand(40, W - 40), y: rand(waterTop + 30, groundTop - 40), w: rand(TAU), members: [], cx: 0, cy: 0 };
    for (let k = 0; k < count; k++) { const f = new Fish(kinds[s], sc); sc.members.push(f); fish.unshift(f); }
    schools.push(sc);
  }
  puffer = N >= 4 ? new Puffer() : null;
}

// ---------------- moradores ----------------
class Puffer {
  constructor() { this.sh = sheet('puffer'); this.x = rand(40, W - 40); this.y = lerp(waterTop, groundTop, 0.62); this.dir = 1; this.vx = 0; this.vy = 0; this.w = rand(TAU); this.puff = 0; this.timer = 0; this.anim = 0; }
  update(dt) {
    if (mouse.seen && mouse.active > 0.05) { const d = Math.hypot(mouse.x - this.x, mouse.y - this.y); if (d < 34 && (mouse.speed > 14 || d < 15)) this.timer = 3.2; }
    if (this.timer > 0) { this.timer -= dt; this.puff = Math.min(4, this.puff + dt * 8); } else this.puff = Math.max(0, this.puff - dt * 1.3);
    const pf = this.puff / 4, top = waterTop + 16, bot = gy(this.x) - 14;
    this.w += (RNG() - 0.5) * dt * 1.5;
    if (this.x < 14 && Math.cos(this.w) < 0) this.w = Math.PI - this.w;
    if (this.x > W - 14 && Math.cos(this.w) > 0) this.w = Math.PI - this.w;
    if (this.y < top + 6 && Math.sin(this.w) < 0) this.w = -this.w;
    if (this.y > bot - 6 && Math.sin(this.w) > 0) this.w = -this.w;
    let tvx = Math.cos(this.w) * 7 * (1 - pf * 0.85), tvy = Math.sin(this.w) * 2.4 * (1 - pf) - pf * 1.5;
    if (pf < 0.1) { let best = null, bd = 90; for (const fo of foods) { if (fo.dead) continue; const d = Math.hypot(fo.x - this.x, fo.y - this.y); if (d < bd) { bd = d; best = fo; } } if (best) { tvx = (best.x - this.x) / bd * 12; tvy = (best.y - this.y) / bd * 12; if (bd < 6) best.dead = true; } }
    const k = Math.min(1, dt * 1.5); this.vx += (tvx - this.vx) * k; this.vy += (tvy - this.vy) * k;
    this.x += this.vx * dt; this.y = clamp(this.y + this.vy * dt, top, bot);
    if (pf < 0.2) { if (this.vx > 0.8) this.dir = 1; else if (this.vx < -0.8) this.dir = -1; }
    this.anim += dt * (pf > 0.5 ? 8 : 4);
  }
  draw() { drawSprite(this.sh, Math.round(this.puff) * 2 + (Math.floor(this.anim) % 2), this.x, this.y + Math.sin(T * 2) * 0.6, this.dir); }
}

class Crab {
  constructor() { this.sh = sheet('crab'); this.x = rand(30, W - 30); this.dir = 1; this.state = 'idle'; this.t = rand(1, 3); this.anim = 0; this.hide = 0; }
  update(dt) {
    const near = mouseNear(this.x, gy(this.x) - 5, 36);
    if (this.state !== 'hide' && this.state !== 'flee' && near && mouse.speed > 8) { this.state = 'flee'; this.dir = mouse.x < this.x ? 1 : -1; this.t = 0.9; }
    switch (this.state) {
      case 'walk': this.x += this.dir * 9 * dt; this.anim += dt * 8; if ((this.t -= dt) < 0) { this.state = 'idle'; this.t = rand(1, 4); } break;
      case 'idle': if ((this.t -= dt) < 0) { this.state = 'walk'; this.t = rand(1.5, 4); if (chance(0.5)) this.dir *= -1; } break;
      case 'flee': this.x += this.dir * 34 * dt; this.anim += dt * 20; if ((this.t -= dt) < 0) { this.state = 'hide'; this.t = rand(4, 7); } break;
      case 'hide': this.hide = Math.min(1, this.hide + dt * 3); if ((this.t -= dt) < 0 && !near) this.state = 'emerge'; break;
      case 'emerge': this.hide -= dt * 1.5; if (this.hide <= 0) { this.hide = 0; this.state = 'idle'; this.t = 1; } break;
    }
    if (this.x < 12) this.dir = 1; if (this.x > W - 12) this.dir = -1; this.x = clamp(this.x, 8, W - 8);
  }
  draw() { const g0 = Math.round(gy(this.x)); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, g0 + 1); ctx.clip(); drawSprite(this.sh, Math.floor(this.anim), this.x, g0 + 1 + this.hide * 10, 1); ctx.restore(); }
}

class Seahorse {
  constructor(x, col) { this.sh = sheet(col); this.hx = x; this.x = x; this.y = gy(x) - rand(22, 40); this.hy = this.y; this.dir = chance(0.5) ? 1 : -1; this.anim = rand(4); this.t = rand(3, 8); this.tx = x; }
  update(dt) {
    if (mouseNear(this.x, this.y, 30) && mouse.speed > 10) { this.tx = this.hx + (this.x > mouse.x ? 16 : -16); this.dir = this.x > mouse.x ? 1 : -1; }
    else if ((this.t -= dt) < 0) { this.t = rand(3, 8); this.tx = this.hx + rand(-12, 12); this.dir = this.tx > this.x ? 1 : -1; }
    this.x += (this.tx - this.x) * Math.min(1, dt * 0.5); this.y = this.hy + Math.sin(T * 0.8 + this.hx) * 3; this.anim += dt * 10;
  }
  draw() { drawSprite(this.sh, Math.floor(this.anim), this.x, this.y, this.dir); }
}

class Moray {
  constructor(p) { this.sh = sheet('moray'); this.x = p.x; this.y = p.y; this.ext = 0; this.tgt = 4; this.t = rand(4, 9); this.mouth = 0; }
  update(dt) {
    if (mouseNear(this.x + 14, this.y - 6, 34)) this.tgt = 0;
    else if ((this.t -= dt) < 0) { this.t = rand(5, 12); this.tgt = chance(0.75) ? randi(3, 5) : 0; }
    this.ext += clamp(this.tgt - this.ext, -dt * 9, dt * 2.5);
    this.mouth = (Math.sin(T * 2.4) > 0.3) ? 1 : 0;
  }
  draw() { drawSprite(this.sh, Math.round(this.ext) * 2 + this.mouth, this.x, this.y, 1); }
}

class Eels {
  constructor(p) { this.list = []; const n = Math.max(4, Math.round(p.w / 5)); for (let i = 0; i < n; i++) { const x = p.x - p.w / 2 + (i + 0.5) * p.w / n + rand(-1.5, 1.5); this.list.push({ x, ext: rand(0.5, 1), h: rand(11, 17), ph: rand(TAU), sp: chance(0.5) }); } }
  update(dt) { for (const e of this.list) { const near = mouse.seen && mouse.active > 0.05 && Math.abs(mouse.x - e.x) < 26 && mouse.y > gy(e.x) - 44 && mouse.y < gy(e.x) + 6; e.ext += clamp((near ? 0 : 1) - e.ext, -dt * 6, dt * 0.5); } }
  draw() {
    for (const e of this.list) {
      const g0 = Math.round(gy(e.x)); ctx.fillStyle = '#2a2018'; ctx.fillRect(Math.round(e.x) - 1, g0, 3, 1);
      const h = Math.round(e.h * e.ext); if (h < 1) continue;
      const lean = Math.sin(T * 0.9 + e.ph) * 2;
      for (let j = 0; j < h; j++) {
        const t = j / e.h, x = Math.round(e.x + lean * t * t + (j > h - 3 ? (j - h + 3) * 0.8 : 0)), y = g0 - j;
        const band = e.sp ? (hash2(Math.round(e.x), j, 3) < 0.25 ? '#1a1a22' : '#ece6d8') : ((j % 5 < 1) ? '#f4f0e8' : '#f08a3a');
        ctx.fillStyle = band; ctx.fillRect(x, y, 2, 1); ctx.fillStyle = e.sp ? '#b8b0a0' : '#c05a1e'; ctx.fillRect(x + 1, y, 1, 1);
      }
      const hx = Math.round(e.x + lean + 2), hy = g0 - h; ctx.fillStyle = '#0a0a12'; ctx.fillRect(hx + 1, hy + 1, 1, 1);
    }
  }
}

class Clam {
  constructor(x) { this.sh = sheet('clam'); this.x = Math.round(x); this.y = Math.round(gy(x)) + 1; this.open = 1; this.tgt = 3; this.t = 0; }
  hit(x, y) { return Math.abs(x - this.x) < 14 && y > this.y - 16 && y < this.y + 3; }
  click() { sfx('clam'); this.tgt = this.tgt > 0 ? 0 : 3; if (this.tgt === 3) { for (let k = 0; k < 6; k++) spark(this.x + rand(-4, 4), this.y - 7, { vy: rand(-12, -4), l: rand(0.5, 1), m: 1, gold: true }); if (typeof petGivePearl === 'function') petGivePearl(this.x, this.y - 8); } }
  update(dt) { if (mouseNear(this.x, this.y - 6, 18) && mouse.speed > 20) this.tgt = 0; if (this.tgt === 0 && (this.t += dt) > 6) { this.tgt = 3; this.t = 0; } this.open += clamp(this.tgt - this.open, -dt * 8, dt * 1.5); }
  draw() { drawSprite(this.sh, Math.round(this.open), this.x, this.y, 1); }
  glow(a) { drawSpriteGlow(this.sh, Math.round(this.open), this.x, this.y, 1); }
}

class Chest {
  constructor(x) { this.sh = sheet('chest'); this.x = Math.round(x); this.y = Math.round(gy(x)) + 2; this.open = 0; this.bt = rand(3, 7); }
  hit(x, y) { return Math.abs(x - this.x) < 16 && y > this.y - 24 && y < this.y + 3; }
  click() {
    const was = this.open > 0; this.open = 6; if (was) return;
    sfx('chest'); if (typeof statInc === 'function') statInc('chest');
    for (let k = 0; k < 16; k++) addBubble(this.x + rand(-9, 9), this.y - 12 - rand(4), randi(0, 3));
    for (let k = 0; k < 22; k++) spark(this.x + rand(-8, 8), this.y - 12, { vx: rand(-16, 16), vy: rand(-32, -8), l: rand(0.6, 1.4), m: 1.4, gold: true });
  }
  update(dt) {
    this.bt -= dt;
    if (this.open > 0) { this.open -= dt; if (this.bt < 0) { this.bt = rand(0.15, 0.35); addBubble(this.x + rand(-7, 7), this.y - 14, randi(0, 3)); } }
    else if (this.bt < 0) { this.bt = rand(4, 9); for (let k = randi(1, 3); k > 0; k--) addBubble(this.x + rand(-5, 5), this.y - 13, randi(0, 1)); }
  }
  draw() { drawSprite(this.sh, this.open > 0 ? 1 : 0, this.x, this.y, 1); }
}

const ANEMONE_COLS = { magenta: ['#a83d88', '#cf4ea3', '#ffb8ea', '#ff6fd0', '#86306d'], green: ['#3f8a4a', '#58b060', '#e4ff9a', '#b8ff5a', '#35623a'], orange: ['#c8602a', '#f08a4a', '#ffe0a0', '#ffb04a', '#8a4020'] };
class Anemone {
  constructor(x, col) {
    this.x = Math.round(x); this.y = Math.round(gy(x)) + 1; this.n = 17; this.ret = 1; this.bend = 0; this.bv = 0; this.c = ANEMONE_COLS[col];
    this.len = []; for (let i = 0; i < this.n; i++) this.len.push(rand(9, 13) + (1 - Math.abs(i / (this.n - 1) - 0.5) * 2) * 4);
    const S2 = new Spr(22, 8), M = S2.mat(this.c[4]); S2.ellipsoid(11, 8.5, 10.5, 6.5, M, {}); this.foot = S2.bake();
  }
  update(dt) {
    let target = 1, bt = 0;
    if (mouse.seen && mouse.active > 0.05) { const dx = mouse.x - this.x, dy = mouse.y - (this.y - 12), d = Math.hypot(dx, dy); if (d < 22) target = 0.3; if (Math.abs(dx) < 30 && dy > -20 && dy < 12) bt = -Math.sign(dx || 1) * (1 - Math.abs(dx) / 30) * 4; }
    this.ret += (target - this.ret) * Math.min(1, dt * (target < this.ret ? 9 : 0.9));
    this.bv += ((bt - this.bend) * 8 - this.bv * 3) * dt; this.bend += this.bv * dt;
  }
  each(fn) {
    const bx0 = this.x - 8, by = this.y - 6;
    for (let i = 0; i < this.n; i++) {
      let a = (i / (this.n - 1) - 0.5) * 1.7 + this.bend * 0.05, x = bx0 + i, y = by;
      const steps = Math.max(2, Math.round(this.len[i] * this.ret));
      for (let s = 0; s < steps; s++) { a += Math.sin(T * 1.6 + i * 0.9 + s * 0.3) * 0.07 + this.bend * 0.012; x += Math.sin(a); y -= Math.cos(a); fn(Math.round(x), Math.round(y), i, s, steps); }
    }
  }
  drawBase() { ctx.drawImage(this.foot, this.x - 11, this.y - 8); }
  draw() {
    ctx.fillStyle = this.c[0]; this.each((x, y, i, s, n) => { if (s < n - 2 && i % 2) ctx.fillRect(x, y, s < 3 ? 2 : 1, 1); });
    ctx.fillStyle = this.c[1]; this.each((x, y, i, s, n) => { if (s < n - 2 && !(i % 2)) ctx.fillRect(x, y, s < 3 ? 2 : 1, 1); });
    ctx.fillStyle = this.c[2]; this.each((x, y, i, s, n) => { if (s >= n - 2) ctx.fillRect(x, y, 1, 1); });
  }
  glow(a) { ctx.globalAlpha = a; ctx.fillStyle = this.c[3]; this.each((x, y, i, s, n) => { if (s >= n - 2) ctx.fillRect(x, y, 1, 1); }); ctx.globalAlpha = 1; }
}

class Jelly {
  constructor() {
    this.type = chance(0.7) ? 'moon' : 'nettle';
    this.x = rand(20, W - 20); this.y = rand(H * 0.18, H * 0.55); this.size = this.type === 'moon' ? rand(6, 9) : rand(5, 7); this.ph = rand(TAU); this.vx = rand(-2, 2); this.vy = 0;
    this.col = this.type === 'moon' ? pick([{ b: '#dfe8ff', l: '#f4f8ff', d: '#a8b8e8', go: '#c890e8', g: '#9fb8ff' }, { b: '#f2d8ff', l: '#fbf0ff', d: '#c8a0e0', go: '#ff90c8', g: '#ff9fe8' }])
      : { b: '#f2b050', l: '#ffd890', d: '#b86a2a', go: '#8a2a30', g: '#ffb060' };
    this.nt = this.type === 'moon' ? randi(9, 13) : randi(5, 7); this.tl = this.type === 'moon' ? rand(6, 10) : rand(24, 36);
  }
  update(dt) {
    this.ph += dt * 1.7;
    let want = Math.sin(this.ph) > 0.5 ? -9 : 3;
    if (this.y < waterTop + 28) want = 4; if (this.y > groundTop - 50) want = -9;
    this.vy = lerp(this.vy, want, Math.min(1, dt * 2));
    if (mouseNear(this.x, this.y, 38)) { const d = Math.hypot(mouse.x - this.x, mouse.y - this.y), f = (1 - d / 38) * mouse.active; this.vx += clamp(mouse.vx, -200, 200) * f * dt * 0.8; this.vy += clamp(mouse.vy, -200, 200) * f * dt * 0.5; }
    this.vx = lerp(this.vx, Math.sin(this.ph * 0.1) * 2, Math.min(1, dt * 0.5));
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.x < -14) this.x = W + 14; if (this.x > W + 14) this.x = -14;
  }
  bell(fn) {
    const pc = Math.max(0, Math.sin(this.ph)), rx = this.size * (1 - 0.18 * pc), ry = this.size * 0.72 * (1 + 0.15 * pc);
    for (let dy = Math.ceil(-ry); dy <= 0; dy++) { const hw = rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2)), w = Math.max(1, Math.round(hw * 2)); fn(Math.round(this.x - w / 2), Math.round(this.y + dy), w, dy, ry); }
    return { rx, ry, pc };
  }
  draw() {
    const pc = Math.max(0, Math.sin(this.ph)), rx = this.size * (1 - 0.18 * pc), c = this.col;
    ctx.fillStyle = c.d;
    for (let i = 0; i < this.nt; i++) {
      const bx = this.x + (i / (this.nt - 1) - 0.5) * rx * 1.9;
      for (let k = 1; k < this.tl; k++) { ctx.globalAlpha = 0.5 * (1 - k / this.tl) + 0.08; const ox = Math.sin(T * 2 + i * 1.7 + k * 0.25 - this.ph * 0.3) * k * (this.type === 'moon' ? 0.1 : 0.07) * (1 + pc * 0.5); ctx.fillRect(Math.round(bx + ox), Math.round(this.y + k * (1 - 0.2 * pc)), 1, 1); }
    }
    ctx.fillStyle = c.b;
    const armL = this.type === 'moon' ? this.tl * 0.9 : this.tl * 0.8;
    for (const j of [-1.5, 0, 1.5]) for (let k = 1; k < armL; k++) { ctx.globalAlpha = 0.6 * (1 - k / armL); const w = this.type === 'moon' ? 1 : 2; ctx.fillRect(Math.round(this.x + j + Math.sin(T * 1.3 + k * 0.35 + j) * (1 + k * 0.05) - w / 2), Math.round(this.y + k), w, 1); }
    const { ry } = this.bell((x, y, w, dy, ry) => { ctx.globalAlpha = dy === 0 ? 0.85 : 0.62; ctx.fillStyle = dy === 0 ? c.d : (dy < -ry * 0.6 ? c.l : c.b); ctx.fillRect(x, y, w, 1); });
    if (this.type === 'moon') { ctx.globalAlpha = 0.75; ctx.fillStyle = c.go; for (const ox of [-0.45, 0.45]) { const cx = this.x + ox * rx, cy = this.y - ry * 0.45; ctx.fillRect(Math.round(cx - 1), Math.round(cy), 3, 1); ctx.fillRect(Math.round(cx - 1), Math.round(cy - 1), 1, 1); ctx.fillRect(Math.round(cx + 1), Math.round(cy - 1), 1, 1); } }
    else { ctx.globalAlpha = 0.6; ctx.fillStyle = c.go; for (let k = -2; k <= 2; k += 2) ctx.fillRect(Math.round(this.x + k * rx * 0.3), Math.round(this.y - ry * 0.6), 1, Math.round(ry * 0.6)); }
    ctx.globalAlpha = 0.9; ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(this.x - rx * 0.45), Math.round(this.y - ry * 0.7), 1, 1);
    ctx.globalAlpha = 1;
  }
  glow(a) { const gs = glowSprite(this.col.g, 18); ctx.globalAlpha = a * (0.5 + 0.25 * Math.sin(this.ph)); ctx.drawImage(gs, Math.round(this.x - 18), Math.round(this.y - 4 - 18)); ctx.globalAlpha = a * 0.55; ctx.fillStyle = this.col.g; this.bell((x, y, w) => ctx.fillRect(x, y, w, 1)); ctx.globalAlpha = 1; }
}

class Otter {
  constructor() { this.sh = sheet('otter'); this.shw = sheet('otterWave'); this.x = rand(W * 0.2, W * 0.8); this.dir = chance(0.5) ? 1 : -1; this.anim = 0; this.wave = 0; this.away = 0; }
  update(dt) {
    if (this.away > 0) { this.away -= dt; if (this.away <= 0) { this.dir = chance(0.5) ? 1 : -1; this.x = this.dir > 0 ? -30 : W + 30; } return; }
    this.x += this.dir * 3.2 * dt; this.anim += dt * 3;
    if (mouseNear(this.x, waterTop + 8, 34)) this.wave = 2; else this.wave -= dt;
    if (this.x < -40 || this.x > W + 40) this.away = rand(30, 70);
  }
  draw() { if (this.away > 0) return; drawSprite(this.wave > 0 ? this.shw : this.sh, Math.floor(this.anim), this.x, waterTop + 5 + Math.sin(T * 1.2 + this.x * 0.05) * 1.2, this.dir); }
}

// ---------------- algas ----------------
const KELP = { mid: '#6f9a26', dk: '#4a6a16', lt: '#a6cc40', blade: '#86b030', bladeD: '#5a7e1e', bladeL: '#bce05a', bulb: '#c8d860' };
function kelpCols(layer) {
  if (layer === 'back') { const o = {}; for (const k in KELP) o[k] = mixC(KELP[k], '#1d6ca8', 0.55); return o; }
  if (layer === 'front') { const o = {}; for (const k in KELP) o[k] = mixC(KELP[k], '#0e2a20', 0.35); return o; }
  return KELP;
}
function mkKelp(x, baseY, len, layer) {
  len = Math.max(8, Math.round(len));
  const s = { x, baseY: Math.round(baseY), len, th: layer === 'front' ? 3 : 2, c: kelpCols(layer), ph: rand(TAU), spd: rand(0.55, 1), amp: rand(3, 6), bend: 0, bv: 0, xs: new Float32Array(len + 1).fill(x), blades: [], type: 'kelp' };
  for (let i = 6; i < len - 2; i += randi(5, 8)) s.blades.push({ i, side: s.blades.length % 2 ? 1 : -1, len: Math.round(lerp(5, 10, i / len) + rand(-1, 1)) });
  return s;
}
function mkGrass(x, baseY, len, red) {
  len = Math.max(4, Math.round(len));
  const c = red ? { mid: '#c23a5e', dk: '#8e2446', lt: '#f06a8a' } : { mid: '#3f9e52', dk: '#2a7440', lt: '#7fd66a' };
  return { x, baseY: Math.round(baseY), len, th: 1, c, ph: rand(TAU), spd: rand(1, 1.8), amp: rand(1.5, 3), bend: 0, bv: 0, xs: new Float32Array(len + 1).fill(x), type: 'grass' };
}
function updateStrand(s, dt) {
  let target = 0;
  if (mouse.seen && mouse.active > 0.05) {
    const segI = s.baseY - mouse.y;
    if (segI > -3 && segI < s.len + 3) {
      const idx = clamp(Math.round(segI), 0, s.len), dx = s.xs[idx] - mouse.x, R = 10 + s.th * 3, ad = Math.abs(dx);
      if (ad < R) { const prox = 1 - ad / R, wm = Math.max(0.3, idx / s.len); target = Math.sign(dx || 1) * prox * R * 0.9 / wm * mouse.active; s.bv += clamp(mouse.vx, -300, 300) * prox * dt * 2.2; }
    }
  }
  target = clamp(target, -s.len * 0.45, s.len * 0.45);
  s.bv += ((target - s.bend) * 7 - s.bv * 2.6) * dt; s.bend += s.bv * dt;
}
function drawStrand(s, g) { drawStrandTo(g || ctx, s); }
function drawStrandTo(ctx, s) {
  const n = s.len, xs = s.xs;
  for (let i = 0; i <= n; i++) { const w = i / n; xs[i] = s.x + Math.sin(T * s.spd + s.ph - i * 0.07) * s.amp * Math.pow(w, 1.4) + Math.sin(T * s.spd * 1.73 + s.ph * 2 - i * 0.15) * s.amp * 0.3 * w + s.bend * w * w; }
  const runs = (off, wid) => { let rx = Math.round(xs[0]), st = 0; for (let i = 1; i <= n + 1; i++) { const cx = i <= n ? Math.round(xs[i]) : null; if (cx !== rx) { ctx.fillRect(rx + off, s.baseY - (i - 1), wid, i - st); rx = cx; st = i; } } };
  ctx.fillStyle = s.c.mid; runs(0, s.th);
  if (s.th >= 2) { ctx.fillStyle = s.c.dk; runs(s.th - 1, 1); ctx.fillStyle = s.c.lt; runs(0, 1); ctx.fillStyle = s.c.mid; }
  if (s.type === 'kelp') {
    for (const b of s.blades) {
      const i = b.i; if (i > n) continue;
      const sw = Math.sin(T * s.spd * 1.3 + s.ph + i * 0.2) * 0.8;
      for (let j = 1; j <= b.len; j++) {
        const t = j / b.len, x = Math.round(xs[i] + (b.side > 0 ? s.th - 1 : 0) + b.side * j * 0.9 + sw * t * 2), y = Math.round(s.baseY - i - j * 0.55 - t * t * 2);
        const wdt = Math.max(1, Math.round(Math.sin(Math.PI * Math.pow(t, 0.8)) * 2.4 + 0.3));
        ctx.fillStyle = s.c.blade; ctx.fillRect(x, y, 1, wdt);
        ctx.fillStyle = s.c.bladeL; ctx.fillRect(x, y, 1, 1);
        if (wdt > 1) { ctx.fillStyle = s.c.bladeD; ctx.fillRect(x, y + wdt - 1, 1, 1); }
      }
      ctx.fillStyle = s.c.bulb; ctx.fillRect(Math.round(xs[i] + (b.side > 0 ? s.th : -1)), s.baseY - i - 1, 1, 1);
    }
    ctx.fillStyle = s.c.lt; ctx.fillRect(Math.round(xs[n]), s.baseY - n, s.th, 1);
  } else {
    ctx.fillStyle = s.c.lt; const k = Math.max(1, Math.round(n * 0.3)); for (let i = n - k; i <= n; i++) ctx.fillRect(Math.round(xs[i]), s.baseY - i, 1, 1);
  }
}

// ---------------- visitantes ----------------
const PASS = {
  dolphins: { sheet: 'dolphin', n: [2, 4], sp: [26, 34], y: [0.18, 0.5], layer: 'mid', every: [45, 90], first: 5 },
  turtle: { sheet: 'turtle', n: [1, 1], sp: [9, 11], y: [0.2, 0.55], layer: 'mid', every: [55, 110], first: 14 },
  humpback: { sheet: 'humpback', calf: 'calf', n: [1, 1], sp: [7, 9], y: [0.12, 0.26], layer: 'far', every: [160, 280], first: 26 },
  mermaid: { sheet: 'mermaid', n: [1, 1], sp: [13, 16], y: [0.3, 0.6], layer: 'near', every: [120, 220], first: 48 },
  barracuda: { sheet: 'barracuda', n: [2, 4], sp: [15, 19], y: [0.2, 0.5], layer: 'mid', every: [80, 150], first: 62 },
  orca: { sheet: 'orca', n: [1, 2], sp: [18, 23], y: [0.2, 0.42], layer: 'mid', every: [100, 180], first: 75 },
  boto: { sheet: 'boto', n: [1, 1], sp: [15, 19], y: [0.3, 0.62], layer: 'near', every: [120, 220], first: 92 },
  manta: { sheet: 'manta', n: [1, 1], sp: [11, 14], y: [0.14, 0.38], layer: 'mid', every: [85, 160], first: 108 },
  manatee: { sheet: 'manatee', n: [1, 1], sp: [5, 7], y: [0.66, 0.74], layer: 'near', every: [140, 260], first: 125 },
  hippocampus: { sheet: 'hippocampus', n: [1, 1], sp: [20, 26], y: [0.22, 0.52], layer: 'mid', every: [140, 260], first: 140 },
  leviathan: { n: [1, 1], layer: 'far', every: [210, 380], first: 165 },
  sealion: { sheet: 'sealion', n: [1, 1], sp: [30, 40], y: [0.25, 0.6], layer: 'near', every: [100, 190], first: 185 },
  sperm: { sheet: 'sperm', n: [1, 1], sp: [8, 10], y: [0.16, 0.34], layer: 'far', every: [220, 380], first: 230 },
  narwhal: { sheet: 'narwhal', n: [1, 3], sp: [14, 18], y: [0.16, 0.4], layer: 'mid', every: [170, 300], first: 270 },
  zaratan: { sheet: 'zaratan', n: [1, 1], sp: [4, 5], y: [0.1, 0.2], layer: 'far', every: [320, 540], first: 310 },
  kraken: { n: [1, 1], layer: 'near', every: [320, 600], first: 360 },
  distant: { n: [1, 1], layer: 'far', every: [16, 34], first: 1 },
};
const LAYER_CAP = { far: 2, mid: 2, near: 2 };
function layerShift(layer) { return layer === 'far' ? -parX * PX.far2 : layer === 'mid' ? -parX * PX.mid : 0; }

class Passer {
  constructor(kind) {
    const d = PASS[kind]; this.kind = kind; this.d = d; this.layer = d.layer; this.sh = sheet(d.sheet);
    this.dir = chance(0.5) ? 1 : -1; this.speed = rand(d.sp[0], d.sp[1]); this.y = rand(d.y[0], d.y[1]) * H;
    this.x = this.dir > 0 ? -this.sh.w * 0.6 : W + this.sh.w * 0.6; this.t = 0; this.dead = false; this.hover = 0; this.boost = 0;
    const n = randi(d.n[0], d.n[1]); this.m = [];
    for (let i = 0; i < n; i++) this.m.push({ ox: -i * this.sh.w * rand(0.55, 0.9) * this.dir, oy: (i ? rand(-18, 18) : 0), ph: rand(TAU), an: rand(8) });
    if (d.calf) { this.calf = sheet(d.calf); this.m.push({ ox: -this.sh.w * 0.25 * this.dir, oy: this.sh.h * 0.45, ph: rand(TAU), an: rand(8), calf: true }); }
    this.span = this.sh.w * (n + 0.5);
  }
  pos(m) { return { x: this.x + m.ox + layerShift(this.layer), y: this.y + m.oy + Math.sin(this.t * 0.6 + m.ph) * 3 }; }
  hit(x, y) { for (const m of this.m) { const p = this.pos(m); if (Math.abs(x - p.x) < this.sh.hw && Math.abs(y - p.y) < (this.sh.hh || 10) + 4) return true; } return false; }
  click() { if (this.kind === 'hippocampus' || this.kind === 'dolphins' || this.kind === 'sealion') { this.boost = 2.5; sfx('whoosh'); for (const m of this.m) { const p = this.pos(m); for (let k = 0; k < 8; k++) addBubble(p.x - this.dir * 10 + rand(-4, 4), p.y + rand(-3, 3), randi(0, 2)); } } }
  update(dt) {
    this.t += dt;
    let sp = this.speed * (1 + this.boost);
    this.boost = Math.max(0, this.boost - dt);
    const lead = this.pos(this.m[0]);
    if (this.kind === 'mermaid' || this.kind === 'boto') { if (mouseNear(lead.x, lead.y, 36)) this.hover = 2.2; this.hover -= dt; if (this.hover > 0) sp *= 0.25; }
    if (this.kind === 'dolphins' && mouse.seen && mouse.active > 0.5 && mouse.speed < 15 && Math.abs(mouse.x - lead.x) < 90) { this.y += clamp(mouse.y - lead.y, -30, 30) * dt * 0.8; sp *= 0.7; }
    if (this.kind === 'sealion') { this.y += Math.sin(this.t * 1.6) * 22 * dt; if (mouse.seen && mouse.active > 0.5 && Math.abs(mouse.x - lead.x) < 70) this.y += clamp(mouse.y - lead.y, -40, 40) * dt * 1.5; this.y = clamp(this.y, H * 0.15, groundTop - 20); }
    this.x += this.dir * sp * dt;
    for (const m of this.m) m.an += dt * (this.d.anim || 6) * (sp / this.speed) * (this.sh.n / 8);
    if (this.kind === 'mermaid' && RNG() < dt * (night() > 0.3 ? 10 : 3)) spark(lead.x - this.dir * 28, lead.y + rand(-2, 3), { vx: 0, vy: rand(-3, 0), l: 0.8, m: 0.8 });
    if ((this.kind === 'dolphins' || this.kind === 'sealion') && RNG() < dt * 2) addBubble(lead.x + this.dir * 20, lead.y - 3, 0);
    if (this.dir > 0 ? this.x - this.span > W + 20 : this.x + this.span < -20) this.dead = true;
  }
  draw() {
    for (const m of this.m) {
      const p = this.pos(m);
      let sh = m.calf ? this.calf : this.sh;
      if (this.hover > 0 && this.kind === 'mermaid') sh = sheet('mermaidWave');
      if (this.hover > 0 && this.kind === 'boto') sh = sheet('botoTip');
      drawSprite(sh, Math.floor(m.an), p.x, p.y, this.dir);
    }
  }
}
class DistantSchool {
  constructor() { this.kind = 'distant'; this.layer = 'far'; this.dir = chance(0.5) ? 1 : -1; this.speed = rand(11, 17); this.x = this.dir > 0 ? -70 : W + 70; this.y = rand(0.14, 0.44) * H; this.t = 0; this.dead = false; this.m = []; for (let k = randi(16, 30); k > 0; k--) this.m.push({ ox: rand(-30, 30), oy: rand(-10, 10), ph: rand(TAU) }); this.col = mixC(waterSmooth(this.y), '#0a2340', 0.45); }
  hit() { return false; }
  update(dt) { this.t += dt; this.x += this.dir * this.speed * dt; this.y += Math.sin(this.t * 0.3) * dt * 3; if (this.dir > 0 ? this.x > W + 70 : this.x < -70) this.dead = true; }
  draw() { ctx.fillStyle = this.col; const sh = layerShift('far'); for (const m of this.m) { const x = this.x + m.ox + Math.sin(this.t * 0.9 + m.ph) * 2 + sh, y = this.y + m.oy + Math.sin(this.t * 1.3 + m.ph + m.ox * 0.08) * 2 + Math.sin((this.x + m.ox) * 0.03) * 5; ctx.fillRect(Math.round(x) - (this.dir > 0 ? 1 : 0), Math.round(y), 3, 1); } }
}
// leviatã: serpente gigante ao fundo, o corpo segue o rastro da cabeça
let LEV_DISCS = null;
class Leviathan {
  constructor() {
    this.kind = 'leviathan'; this.layer = 'far'; this.dir = chance(0.5) ? 1 : -1; this.speed = rand(12, 15);
    this.x = this.dir > 0 ? -30 : W + 30; this.baseY = rand(0.16, 0.34) * H; this.t = 0; this.trail = []; this.N = 110; this.dead = false; this.head = sheet('levHead');
    if (!LEV_DISCS) LEV_DISCS = discSet('#3a5c6e', 10, { fog: '#2a78ac', fogT: 0.5, tex: (x, y, dx, dy) => (hash2(x, y, 2) < 0.2 ? -0.08 : 0) });
  }
  hit() { return false; }
  update(dt) {
    this.t += dt; this.x += this.dir * this.speed * dt;
    const y = this.baseY + Math.sin(this.t * 0.35) * 16;
    this.trail.unshift({ x: this.x, y }); if (this.trail.length > 1400) this.trail.pop();
    const tail = this.trail[this.trail.length - 1];
    if (this.trail.length > 60 && (this.dir > 0 ? tail.x > W + 40 : tail.x < -40)) this.dead = true;
  }
  body() {
    const pts = [], sh = layerShift('far'); let acc = 0, k = 0;
    for (let i = 1; i < this.trail.length && pts.length < this.N; i++) {
      const a = this.trail[i - 1], b = this.trail[i]; acc += Math.hypot(b.x - a.x, b.y - a.y);
      if (acc >= 3) { acc = 0; const t = pts.length / this.N; pts.push({ x: b.x + sh, y: b.y + Math.sin(T * 1.2 - k * 0.25) * 2, r: 1.5 + 8 * Math.sin(Math.PI * Math.pow(1 - t, 0.7)) * (t < 0.08 ? 0.8 : 1) }); k++; }
    }
    return pts;
  }
  draw() { const pts = this.body(); drawChain(LEV_DISCS, pts.slice().reverse()); const h = this.trail[0]; if (h) drawSprite(this.head, Math.sin(this.t * 0.7) > 0.8 ? 1 : 0, h.x + layerShift('far'), h.y, this.dir); }
  glow(a) { if (a < 0.05) return; ctx.fillStyle = '#8ffcff'; const pts = this.body(); for (let i = 4; i < pts.length; i += 6) { ctx.globalAlpha = a * (0.4 + 0.4 * Math.sin(T * 2 + i)); ctx.fillRect(Math.round(pts[i].x), Math.round(pts[i].y - pts[i].r * 0.3), 1, 1); } ctx.globalAlpha = 1; }
}
// kraken: tentáculos surgem do fundo, ondulam e voltam
let KR_DISCS = null;
class Kraken {
  constructor() {
    this.kind = 'kraken'; this.layer = 'near'; this.t = 0; this.dead = false; this.arms = [];
    if (!KR_DISCS) KR_DISCS = discSet('#8a3050', 11, { hue: 18, tex: (x, y, dx, dy) => (dy > 0.3 ? 0.08 : 0) });
    const n = randi(3, 4), c = rand(0.3, 0.7) * W;
    for (let i = 0; i < n; i++) this.arms.push({ bx: c + (i - (n - 1) / 2) * rand(28, 44), L: rand(110, 170), ph: rand(TAU), curl: rand(0.8, 1.6) * (chance(0.5) ? 1 : -1), p: 0, delay: i * 0.6, sink: false, pts: [] });
    this.dur = rand(16, 22);
  }
  hit(x, y) { for (const a of this.arms) for (const p of a.pts) if (Math.hypot(p.x - x, p.y - y) < p.r + 4) { if (!a.sink) sfx('splash', { gap: 0 }); a.sink = true; return true; } return false; }
  click() {}
  nearest(x, y) { let best = null; for (const a of this.arms) for (let i = 0; i < a.pts.length; i += 3) { const p = a.pts[i], d = Math.hypot(p.x - x, p.y - y) - p.r; if (!best || d < best.d) best = { d, nx: (x - p.x) / (d + p.r || 1), ny: (y - p.y) / (d + p.r || 1) }; } return best; }
  update(dt) {
    this.t += dt; let alive = false;
    for (const a of this.arms) {
      const t = this.t - a.delay;
      const target = a.sink || this.t > this.dur ? 0 : (t > 0 ? 1 : 0);
      a.p += clamp(target - a.p, -dt * (a.sink ? 0.9 : 0.35), dt * 0.3);
      if (a.p > 0.01 || target > 0) alive = true;
      a.pts = []; const segs = 50, len = a.L * a.p; let x = a.bx, y = H + 12, ang = -Math.PI / 2;
      for (let s = 0; s <= segs; s++) {
        const q = s / segs; a.pts.push({ x, y, r: lerp(12, 1.5, Math.pow(q, 0.8)) });
        ang += (Math.sin(T * 0.9 + a.ph + q * 3) * 0.05 + a.curl * Math.pow(q, 3) * 0.2);
        x += Math.cos(ang) * len / segs; y += Math.sin(ang) * len / segs;
      }
      if (a.p > 0.3 && RNG() < dt * 1.5) { const p = a.pts[randi(10, 40)]; addBubble(p.x + rand(-3, 3), p.y, randi(0, 2)); }
    }
    if (!alive && this.t > 3) this.dead = true;
  }
  draw() {
    for (const a of this.arms) {
      if (a.p < 0.01) continue;
      drawChain(KR_DISCS, a.pts);
      ctx.fillStyle = '#f2c8d0';
      for (let i = 4; i < a.pts.length - 3; i += 3) { const p = a.pts[i], q = a.pts[i + 1], dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1, s = a.curl > 0 ? 1 : -1; const sx = p.x + (-dy / l) * p.r * 0.6 * s, sy = p.y + (dx / l) * p.r * 0.6 * s; const r = Math.max(1, Math.round(p.r * 0.3)); ctx.fillRect(Math.round(sx), Math.round(sy), r, r); }
    }
  }
}

function spawnPasser(kind) {
  const p = kind === 'distant' ? new DistantSchool() : kind === 'leviathan' ? new Leviathan() : kind === 'kraken' ? new Kraken() : new Passer(kind);
  passers.push(p); if (kind === 'kraken') sfx('kraken'); return p;
}
function director(dt) {
  for (const k in PASS) {
    spawnT[k] -= dt; if (spawnT[k] > 0) continue;
    const d = PASS[k];
    if (passers.some(p => p.kind === k)) continue;
    if (k !== 'distant' && passers.filter(p => p.layer === d.layer && p.kind !== 'distant').length >= LAYER_CAP[d.layer]) { spawnT[k] = rand(4, 10); continue; }
    spawnPasser(k); spawnT[k] = rand(d.every[0], d.every[1]);
  }
}

// ---------------- montar os moradores ----------------
function buildLife() {
  BUB = BUB || bubbleSprites();
  anemones = LAYOUT.anemones.map(a => new Anemone(a.x, a.col));
  buildFish();
  crab = new Crab();
  chest = LAYOUT.chest !== null ? new Chest(LAYOUT.chest) : null;
  clam = LAYOUT.clam !== null ? new Clam(LAYOUT.clam) : null;
  eels = LAYOUT.eels ? new Eels(LAYOUT.eels) : null;
  moray = LAYOUT.moray ? new Moray(LAYOUT.moray) : null;
  otter = new Otter();
  buildPet();
  jellies = []; for (let k = 0; k < Math.max(2, Math.round(W / 200)); k++) jellies.push(new Jelly());
  // algas
  strands = { back: [], mid: [], front: [] };
  for (let k = 0; k < Math.round(W / 60); k++) { const x = rand(W); strands.back.push(mkKelp(x, gy(x) + 3, rand(0.3, 0.7) * (gy(x) - waterTop), 'back')); }
  for (const x of LAYOUT.seagrass) { const red = chance(0.25); for (let b = randi(3, 6); b > 0; b--) { const bx = x + rand(-4, 4); strands.mid.push(mkGrass(bx, gy(bx) + 1, rand(7, red ? 14 : 22), red)); } }
  const fx = [rand(3, W * 0.06), rand(W * 0.94, W - 3)]; if (W > 300) fx.push(chance(0.5) ? rand(W * 0.07, W * 0.13) : rand(W * 0.87, W * 0.93));
  for (const x of fx) strands.front.push(mkKelp(x, H + 2, rand(0.55, 0.85) * (H - waterTop), 'front'));
  // cavalos-marinhos perto das algas
  seahorses = []; const homes = LAYOUT.seagrass.length ? LAYOUT.seagrass : [W * 0.3];
  for (let k = 0; k < 2; k++) seahorses.push(new Seahorse(homes[k % homes.length] + rand(-6, 6), k ? 'seahorseP' : 'seahorseY'));
  vents = LAYOUT.vents.map(v => ({ x: v.x, y: v.y, t: rand(2, 8), burst: 0, bt: 0 }));
  snow = []; for (let k = Math.round(W * H / 2000); k > 0; k--) snow.push({ x: rand(W), y: rand(waterTop, H), z: rand(0.3, 1), ph: rand(TAU), vx: 0, vy: 0, glow: chance(0.35) });
  bubbles = []; pops = []; foods = []; ripples = []; sparkles = []; passers = [];
  spawnT = {}; for (const k in PASS) spawnT[k] = PASS[k].first;
}
