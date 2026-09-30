'use strict';
// =====================================================================
//  Espécie 2 — Medusa-lunar: flutua pulsando, é translúcida, tem um
//  coraçãozinho que brilha por dentro e vira uma medusa gigante com coroa de luz
// =====================================================================
const JELLY = {
  baby: { R: 9, ry: 0.84, hr: 5.5, speed: 15, nT: 4, tLen: 9, tW: 2, nA: 0, aLen: 0, lights: 0, crown: false, eye: 'cute', eyeW: 4, eyeH: 5, glow: false,
    c: { bell: '#ffb4da', rim: '#ffe6f4', inner: '#ff86c0', heart: '#ff4f98', ten: '#ffa0cf', arm: '#ffc4e2', cheek: '#ff7aae', spot: '#fff3fa' } },
  young: { R: 12, ry: 0.82, hr: 7, speed: 17, nT: 6, tLen: 28, tW: 1, nA: 2, aLen: 17, lights: 0, crown: false, eye: 'cute', eyeW: 5, eyeH: 6, glow: false,
    c: { bell: '#e6b0ff', rim: '#fbe8ff', inner: '#c884f0', heart: '#ff5aa8', ten: '#dca0f8', arm: '#f0c8ff', cheek: '#ff84bc', spot: '#fff4ff' } },
  teen: { R: 18, ry: 0.8, hr: 10.5, speed: 19, nT: 10, tLen: 60, tW: 1, nA: 4, aLen: 34, lights: 6, crown: false, eye: 'cute', eyeW: 6, eyeH: 7, glow: true, eyeLow: '#4a74c8',
    c: { bell: '#b4b4ff', rim: '#eeeaff', inner: '#8a8af0', heart: '#ff6ab8', ten: '#a8b8ff', arm: '#d0d0ff', cheek: '#ff8ac4', spot: '#fff6c0', light: '#9ffcff' } },
  adult: { R: 30, ry: 0.76, hr: 17, speed: 17, nT: 16, tLen: 120, tW: 1, nA: 4, aLen: 76, lights: 10, crown: true, eye: 'cute', eyeW: 8, eyeH: 9, glow: true, eyeLow: '#5a8ae0',
    c: { bell: '#8ea4f4', rim: '#e8ecff', inner: '#6a78d8', heart: '#ff70c0', ten: '#9ab4ff', arm: '#c4c8ff', cheek: '#ff8ec8', spot: '#fff4b0', light: '#a8fcff' } },
};
for (const k in JELLY) { const P = JELLY[k]; P.lid = shade(P.c.bell, -0.45); P.eyeDark = '#241a46'; }
// geometria (relativa à borda do sino, olhando para a direita); pc = contração 0..1
function jellyGeo(P, pc) {
  const R = P.R, ry = R * P.ry * (1 + 0.14 * pc), rx = R * (1 - 0.13 * pc);
  return { R, rx, ry, eyeX: R * 0.34, eyeY: -ry * (R < 12 ? 0.36 : 0.42), mouthY: -ry * 0.16, cheekX: R * 0.56, cheekY: -ry * 0.24, skirt: Math.max(4, R * 0.4) };
}
function jellyBellFrame(key, f, sw) {
  const P = JELLY[key], C = P.c, e = Math.floor(f / 3), pc = (f % 3) / 2, G = jellyGeo(P, pc), R = P.R, rx = G.rx, ry = G.ry;
  const crownH = P.crown ? R * 0.38 : 0, pad = 3, ryMax = R * P.ry * 1.14;
  const W2 = Math.ceil(R * 2.3 + pad * 2), cx = W2 / 2, cy = Math.ceil(pad + crownH + ryMax + 1), H2 = Math.ceil(cy + G.skirt + 4);
  const S = new Spr(W2, H2);
  const M = { b: S.mat(C.bell, { alpha: 0.86, dither: 0.8 }), rim: S.mat(C.rim, { alpha: 0.92 }), in: S.mat(C.inner, { alpha: 0.72 }), sp: S.mat(C.spot, P.glow ? { glow: C.spot + 'aa' } : {}),
    ht: S.mat(C.heart, P.glow ? { glow: C.heart + '99' } : {}), li: P.lights || P.crown ? S.mat(C.light, { glow: C.light + 'ee' }) : null, ch: S.mat(C.cheek), s1: sw ? S.mat(sw.c1) : null, s2: sw ? S.mat(sw.c2) : null };
  // cúpula translúcida, com canais radiais e pintinhas no alto
  S.ellipsoid(cx, cy, rx, ry, M.b, { z: 1, spec: 0.35, fn: q => {
    if (q.ly > 0.02) return null;
    if (hash2(Math.floor(q.x / 2), Math.floor(q.y / 2), 11) < (P.glow ? 0.08 : 0.05) && q.ly < -0.5) return { m: M.sp };
    const ang = Math.atan2(q.ly, q.lx), chn = Math.abs(Math.sin(ang * 4)) < 0.1 && q.ly < -0.2 ? -0.06 : 0;
    return { l: q.l + chn + (q.ly > -0.22 ? 0.05 : 0) };
  } });
  // parte de dentro da boca do sino e borda recortada
  for (let x = Math.floor(cx - rx * 0.92); x <= Math.ceil(cx + rx * 0.92); x++) S.put(x, cy, M.in, 0.35, 1.02);
  const lob = Math.max(2, Math.round(R / 4));
  for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const fr = ((x - (cx - rx)) / lob) % 1, dy = R >= 12 ? Math.round(Math.sin(Math.PI * fr) * (R >= 25 ? 2 : 1.2)) : 0;
    for (let y = 0; y <= dy; y++) S.put(x, cy + 1 + y, M.rim, 0.62 - y * 0.08, 1.05);
  }
  // coração que brilha por dentro
  const hs = R < 12 ? 1.4 : R * 0.17, hx = cx, hy = cy - ry * (R < 12 ? 0.8 : 0.7);
  for (let j = -Math.ceil(hs); j <= Math.ceil(hs); j++) for (let i = -Math.ceil(hs); i <= Math.ceil(hs); i++) if (heartIn(i, j, hs)) S.put(hx + i - 0.5, hy + j, M.ht, 0.62 - j / hs * 0.12 + (i < 0 && j < 0 ? 0.1 : 0), 1.03);
  // luzinhas na borda
  if (P.lights) for (let i = 0; i < P.lights; i++) { const x = cx - rx * 0.86 + i * (rx * 1.72 / (P.lights - 1)); S.put(x, cy + 1, M.li, 0.8, 1.2); if (R >= 25) S.put(x + 1, cy + 1, M.li, 0.7, 1.2); }
  // coroa de luz (gigante)
  if (P.crown) for (let k = -2; k <= 2; k++) {
    const th = k * 0.24, bx = cx + Math.sin(th) * rx * 0.98, by = cy - Math.cos(th) * ry * 0.98 + 1, L = crownH * (k === 0 ? 1 : Math.abs(k) === 1 ? 0.78 : 0.55);
    S.tube([{ x: bx, y: by, r: 1.7 }, { x: bx + Math.sin(th) * L, y: by - Math.cos(th) * L, r: 0.7 }], M.rim, { z: 1.1 });
    S.ellipsoid(bx + Math.sin(th) * L, by - Math.cos(th) * L, 1.5, 1.5, M.li, { z: 1.2 });
  }
  // saia de tricô (suéter/pijama) logo abaixo da borda, sem tapar o rosto
  if (sw) {
    const sk = G.skirt, st = Math.max(1, Math.round(R * 0.09));
    for (let y = Math.floor(cy - 1); y <= Math.ceil(cy + sk); y++) {
      const t = (y - cy + 1) / (sk + 1), hw = rx * (1.0 + t * 0.1);
      for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
        const nx = (x + 0.5 - cx) / hw; if (Math.abs(nx) > 1) continue;
        let m = swDetail(sw.pat, x, Math.floor(y - cy + 1), st) ? M.s2 : M.s1;
        if (y >= Math.ceil(cy + sk) - 0) m = M.s2;
        S.put(x, y, m, lit(nx * 0.9, 0.2, Math.sqrt(1 - nx * nx * 0.81)) + ((x + y) & 1 ? 0.03 : -0.03), 1.3);
      }
    }
  }
  // rosto
  const ex = G.eyeX, ey = cy + G.eyeY;
  for (const s of [-1, 1]) S.ellipsoid(cx + s * G.cheekX, cy + G.cheekY, Math.max(1, R * 0.12), Math.max(0.8, R * 0.065), M.ch, { z: 1.4, flat: 0.3 });
  petEye(S, P, cx - ex, ey, e); petEye(S, P, cx + ex, ey, e);
  petMouth(S, cx + 0.5, cy + G.mouthY, e, R >= 12 ? 4 : 3, R >= 25 ? 3 : R >= 12 ? 2 : 1);
  return { spr: S, meta: { ax: cx, ay: cy } };
}
function jellySheet(key, sw) {
  const name = 'jelBell_' + key + (sw ? '_' + sw.pat + sw.c1.slice(1) + sw.c2.slice(1) : '');
  if (!SHEET_DEFS[name]) defSheet(name, () => makeSheet(18, f => jellyBellFrame(key, f, sw), { outer: '#07122444' }));
  return sheet(name);
}
defSheet('petEgg_jelly', () => makeSheet(3, f => {
  const S = new Spr(20, 24), E = S.mat('#ffc8ec', { alpha: 0.8, glow: '#ffb0e044' }), IN = S.mat('#ff7ab8', { glow: '#ff90c888' }), SP = S.mat('#fff4fb'), CR = S.mat('#7a3a6a');
  S.ellipsoid(10, 13.5, 7.5, 9, E, { z: 1, spec: 0.55, fn: q => hash2(Math.floor(q.x / 2), Math.floor(q.y / 2), 17) < 0.1 ? { m: SP } : undefined });
  S.ellipsoid(10, 13.5, 3.2, 2.6, IN, { z: 1.2, fn: q => q.ly > 0.1 ? null : undefined });
  for (const dx of [-1.5, 0, 1.5]) S.line(10 + dx, 14, 10 + dx + (dx ? dx * 0.3 : 0), 17.5, IN, 0.5, 1.2);
  if (f >= 1) { let x = 5, y = 9; for (let k = 0; k < 9; k++) { S.put(x, y, CR, 0.2, 2); x += 1; y += (k % 2 ? -1 : 1); } }
  if (f >= 2) { let x = 7, y = 16; for (let k = 0; k < 7; k++) { S.put(x, y, CR, 0.2, 2); x += 1; y += (k % 2 ? 1 : -1); } S.put(10, 6, CR, 0.2, 2); S.put(10, 7, CR, 0.2, 2); }
  return { spr: S, meta: { ax: 10, ay: 22 } };
}, { outer: '#07122455' }));
const jellyDiscs = {};

class JellyPet extends Pet {
  setupStage(fresh) {
    const k = this.key;
    if (k === 'egg') { const n = this.nestPos(); this.hx = n.x; this.hy = n.y; this.P = null; return; }
    const P = JELLY[k]; this.P = P; this.pp = this.pp || 0; this.pc = 0; this.pRate = 0.5; this.zapT = 0;
    if (fresh) { const n = this.nestPos(); this.hx = n.x; this.hy = n.y - 8; }
    this.tents = [];
    for (let i = 0; i < P.nT; i++) { const u = P.nT === 1 ? 0 : (i / (P.nT - 1) * 2 - 1) * 0.86; this.tents.push({ kind: 't', u, len: P.tLen * (0.78 + 0.22 * hash2(i, 3, 1)), sp: P.tLen > 40 ? 1.5 : 1.2, far: i % 2 === 1, ph: rand(TAU), pts: [] }); }
    for (let i = 0; i < P.nA; i++) { const u = P.nA === 1 ? 0 : (i / (P.nA - 1) * 2 - 1) * 0.36; this.tents.push({ kind: 'a', u, len: P.aLen * (0.85 + 0.15 * hash2(i, 5, 1)), sp: 1.6, ph: rand(TAU), pts: [] }); }
    this.hangTents();
    const dk = 'arm' + k; this.armDisc = P.nA ? (jellyDiscs[dk] || (jellyDiscs[dk] = discSet(P.c.arm, Math.ceil(P.R * 0.17) + 1, { hue: 18 }))) : null;
    const nk = PET_KEYS[this.s.stage + 1];
    if (nk && !this.s.preview) setTimeout(() => { try { jellySheet(nk, null); } catch (e) { console.error(e); } }, 5000);
  }
  hangTents() { for (const t of this.tents) { const n = Math.ceil(t.len / t.sp); t.pts = []; for (let i = 0; i <= n; i++) t.pts.push({ x: this.hx + t.u * this.P.R, y: this.hy + 1 + i * t.sp }); } }
  geo() { return jellyGeo(this.P, this.pf() / 2); }
  pf() { return this.pc > 0.66 ? 2 : this.pc > 0.25 ? 1 : 0; }
  mouthOff() { const G = this.geo(); return { x: 0, y: G.mouthY }; }
  headOff() { const G = this.geo(); return { x: 0, y: -G.ry * 0.45 }; }
  hitRadius() { return this.P.R * 0.95; }
  restHead() {
    const k = this.key;
    if (k === 'baby' || k === 'young') { const n = this.nestPos(); return { x: n.x, y: n.y - 1, face: 1 }; }
    return { x: LAIR.x + lairShift() + 196, y: LAIR.y + RUIN_G - 128 - 6, face: 1 };   // pousa no capitel da coluna, como um abajur
  }
  wanderTarget() {
    const k = this.key, P = this.P, n = this.nestPos(), rad = k === 'baby' ? 80 : k === 'young' ? 170 : 1e9, bh = P.R * P.ry;
    const high = waterTop + bh + 10, low = Math.max(high + 10, groundTop - Math.min(P.tLen * 0.55, 80) - 10);
    return { x: clamp(n.x + rand(-rad, rad), P.R + 4, W - P.R - 4), y: k === 'baby' ? clamp(n.y - rand(15, 80), high, low) : rand(high, low) };
  }
  sparkPoint() { const t = pick(this.tents), p = t && t.pts.length ? pick(t.pts) : null; if (p && chance(0.5)) return { x: p.x, y: p.y }; const c = this.headCenter(); return { x: c.x + rand(-this.P.R, this.P.R), y: c.y + rand(-this.P.R * 0.6, this.P.R * 0.6) }; }
  // caça com os tentáculos: o peixe que encosta embaixo do sino leva um choquinho
  huntCatch(f) { const G = this.geo(), P = this.P; return Math.abs(f.x - this.hx) < G.R * 1.05 && f.y > this.hy - G.ry * 0.6 && f.y < this.hy + Math.min(P.tLen * 0.7, 70) + 4; }
  scaresPrey() { return false; }   // transparente: os peixes nem percebem a medusa chegando
  huntFx(m) { sfx('zap'); this.zapT = 0.25; this.zapTo = { x: m.x, y: m.y + this.P.R * 0.6 }; }
  defendFx(m, tip) { sfx('zap', { gap: 0 }); for (let i = 0; i < 18; i++) { const t = i / 17; spark(lerp(m.x, tip.x, t) + rand(-3, 3), lerp(m.y, tip.y, t) + rand(-3, 3), { vx: rand(-8, 8), vy: rand(-8, 8), l: 0.7, m: 0.7 }); } this.zapT = 0.4; this.zapTo = { x: tip.x, y: tip.y }; }
  // nada pulsando: contrai rápido (empurra) e relaxa devagar
  move(dt) {
    const P = this.P, dx = this.tx - this.hx, dy = this.ty - this.hy, d = Math.hypot(dx, dy) || 1;
    const urg = clamp(d / 30, 0, 1) * this.spMul, slow = this.state === 'sleep' || this.restW > 0.7;
    this.pRate = lerp(this.pRate, slow ? 0.28 : 0.42 + 0.85 * urg, Math.min(1, dt * 2));
    this.pp = (this.pp + dt * this.pRate) % 1;
    const p = this.pp, push = p < 0.3 ? 1.5 : 0.55;
    this.pc = p < 0.3 ? smooth(p / 0.3) : 1 - smooth((p - 0.3) / 0.7);
    const ds = Math.min(P.speed * this.spMul, d * 2.2) * push, k = Math.min(1, dt * 2.2);
    this.vx += (dx / d * ds - this.vx) * k; this.vy += (dy / d * ds - this.vy) * k;
    if (this.shake > 0) this.vx += Math.sin(this.t * 30) * 20 * dt * 10;
    this.hx += this.vx * dt; this.hy += this.vy * dt;
    this.hx = clamp(this.hx, -20, W + 20); this.hy = clamp(this.hy, waterTop + P.R * P.ry + 4, groundTop - 3);
    if (this.face) this.dir = this.face; else if (this.vx > 4) this.dir = 1; else if (this.vx < -4) this.dir = -1;
  }
  updateBody(dt) {
    this.restW += ((this.restTarget ? 1 : 0) - this.restW) * Math.min(1, dt * 1.1);
    this.zapT -= dt;
    const P = this.P, G = this.geo(), bx = this.hx, by = this.hy + this.hop + 1;
    for (const t of this.tents) {
      const pts = t.pts, n = pts.length, arm = t.kind === 'a';
      pts[0].x = bx + t.u * G.rx; pts[0].y = by;
      for (let i = 1; i < n; i++) {
        const a = pts[i - 1], b = pts[i], sway = Math.sin(this.t * (arm ? 1.1 : 1.6) + t.ph - i * 0.18) * (arm ? 0.55 : 0.4);
        b.x += (sway * 6 + t.u * 2.5) * dt; b.y += 14 * dt;
        const ddx = b.x - a.x, ddy = b.y - a.y, dd = Math.hypot(ddx, ddy) || 0.001;
        b.x = a.x + ddx / dd * t.sp; b.y = a.y + ddy / dd * t.sp;
        const g0 = gy(b.x) - 1; if (b.y > g0) b.y = g0;
      }
    }
  }
  previewPose(x, y) { this.hx = x; this.hy = y + 2; this.pc = 0; this.dir = 1; this.hangTents(); }
  drawTents(g, far) {
    const P = this.P, C = P.c, wide = P.tW > 1;
    for (const t of this.tents) {
      if (t.kind !== 't' || !!t.far !== far) continue;
      const pts = t.pts, n = pts.length; let band = -1;
      g.fillStyle = far ? shade(C.ten, -0.18) : C.ten;
      for (let i = 1; i < n; i++) {
        const b2 = Math.floor(i / n * 4); if (b2 !== band) { band = b2; g.globalAlpha = (far ? 0.5 : 0.78) * (1 - band * 0.2); }
        const a = pts[i - 1], b = pts[i];
        if (wide) { g.fillRect(Math.round(b.x - 1), Math.round(b.y), 2, i === n - 1 ? 1 : 2); continue; }
        g.fillRect(Math.round(b.x), Math.round(b.y), 1, 1);
        if (t.sp > 1.25) g.fillRect(Math.round((a.x + b.x) / 2), Math.round((a.y + b.y) / 2), 1, 1);
      }
      g.fillStyle = C.spot;
      for (let i = 5; i < n; i += 6) { g.globalAlpha = far ? 0.5 : 0.85; g.fillRect(Math.round(pts[i].x), Math.round(pts[i].y), 1, 1); }
    }
    g.globalAlpha = 1;
  }
  drawArms(g) {
    if (!this.armDisc) return;
    const R = this.P.R, fr = this.P.c.rim; g.globalAlpha = 0.8;
    for (const t of this.tents) if (t.kind === 'a') {
      const n = t.pts.length, pts = t.pts.map((p, i) => ({ x: p.x, y: p.y, r: Math.max(1, R * 0.12 * (1 - i / n * 0.6) * (1 + 0.3 * Math.sin(i * 1.4 + this.t * 2 + t.ph))) }));
      drawChain(this.armDisc, pts.filter((p, i) => p.r < 2.2 || i % 2 === 0 || i === n - 1), g);   // discos grandes se sobrepõem: dá para pular metade
      g.fillStyle = fr;   // babadinhos nas beiradas
      for (let i = 2; i < n - 1; i += 2) { const a = pts[i - 1], b = pts[i + 1], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, o = pts[i].r + 1, sd = (i >> 1) & 1 ? 1 : -1; g.fillRect(Math.round(pts[i].x - dy / l * o * sd), Math.round(pts[i].y + dx / l * o * sd), 1, 1); }
    }
    g.globalAlpha = 1;
  }
  // tentáculos e braços (tudo atrás do sino) numa camada redesenhada a cada 2 quadros nos grandes
  drawBack(g) {
    const every = this.P.R >= 18 ? 2 : 1; this.fN = (this.fN || 0) + 1;
    if (!this.tc || this.fN % every === 0 || g !== ctx || this.state === 'evolve') {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const t of this.tents) for (const p of t.pts) { if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
      const pad = Math.ceil(this.P.R * 0.2) + 4; x0 = Math.floor(x0) - pad; y0 = Math.floor(y0) - pad; const w = Math.ceil(x1) + pad - x0, h = Math.ceil(y1) + pad - y0;
      if (!this.tcv) { this.tcv = makeCanvas(w, h); this.tcg = this.tcv.getContext('2d'); }
      if (this.tcv.width < w || this.tcv.height < h) { this.tcv.width = Math.max(w, this.tcv.width); this.tcv.height = Math.max(h, this.tcv.height); }
      const cg = this.tcg; cg.clearRect(0, 0, w, h); cg.save(); cg.translate(-x0, -y0);
      this.drawTents(cg, true); this.drawArms(cg); this.drawTents(cg, false);
      cg.restore();
      this.tc = { x0, y0, w, h, hx: this.hx, hy: this.hy + this.hop };
    }
    const tc = this.tc; g.drawImage(this.tcv, 0, 0, tc.w, tc.h, Math.round(tc.x0 + this.hx - tc.hx), Math.round(tc.y0 + this.hy + this.hop - tc.hy), tc.w, tc.h);
  }
  capeSecs() {
    const P = this.P, G = this.geo(), R = P.R, n = Math.max(4, Math.round(R * 1.3)), top = this.hy + this.hop - G.ry * 0.62, out = [];
    for (let j = 0; j <= n; j++) {
      const u = j / n, y = top + u * R * 2.3, hw = R * (0.7 + u * 0.38), sway = Math.sin(this.t * 2.2 - u * 3) * u * R * 0.12 - clamp(this.vx, -30, 30) * 0.2 * u;
      out.push([this.hx + sway - hw, y, this.hx + sway + hw, y]);
    }
    return out;
  }
  wearAnchors() {
    const G = this.geo(), sh = this.shake > 0 ? Math.round(Math.sin(this.t * 40) * 1.5) : 0, x = this.hx + sh, y = this.hy + this.hop, er = this.P.eyeH / 2 + 0.6;
    return { hat: { x, y: y - G.ry + Math.max(1, G.R * 0.12), w: G.R * 0.95, dir: this.dir },
      neck: { x, y: y - 1, rx: G.rx * 0.78, ry: Math.max(1.5, G.R * 0.12), orient: 'front', dir: this.dir },
      face: { eyes: [{ x: x - G.eyeX, y: y + G.eyeY, r: er }, { x: x + G.eyeX, y: y + G.eyeY, r: er }], dir: this.dir, side: false } };
  }
  drawBody(g) {
    const sw = sweaterOf(this), bell = jellySheet(this.key, sw), f = this.expr * 3 + this.pf(), w = wearOf(this, 'body');
    const sh = this.shake > 0 ? Math.round(Math.sin(this.t * 40) * 1.5) : 0, x = this.hx + sh, y = this.hy + this.hop;
    if (w && w.id === 'capa') drawCape(this, g, this.capeSecs());
    this.drawBack(g);
    drawSprite(bell, f, x, y, this.dir, g);
    if (this.state === 'evolve') { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 + 0.35 * Math.sin(this.evolveT * 14); drawSprite(bell, f, x, y, this.dir, g); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    if (this.zapT > 0 && this.zapTo) {   // choquinho de luz para espantar o kraken
      const m = this.mouthPos(), n = 12; g.fillStyle = '#c8fcff';
      for (let i = 0; i <= n; i++) { const t = i / n; g.fillRect(Math.round(lerp(m.x, this.zapTo.x, t) + (i % 2 ? 2 : -2) * (i > 0 && i < n)), Math.round(lerp(m.y, this.zapTo.y, t)), 1, 1); }
    }
    drawWearHead(this, g);
  }
  glowBody(a) {
    const P = this.P, sw = sweaterOf(this), bell = jellySheet(this.key, sw), c = this.headCenter(), R = P.R;
    const k = (0.25 + a * 0.75) * (this.state === 'sleep' ? 0.6 : 1), gr = Math.min(40, Math.round(R * 1.2));
    ctx.globalAlpha = k * (P.glow ? 0.55 : 0.3); ctx.drawImage(glowSprite(P.glow ? '#b8a8ff' : '#ffb0e0', gr), Math.round(c.x - gr), Math.round(c.y - gr));
    ctx.globalAlpha = k; drawSpriteGlow(bell, this.expr * 3 + this.pf(), this.hx, this.hy + this.hop, this.dir);
    if (P.glow || a > 0.3) {
      ctx.fillStyle = P.c.light || '#ffd0f0';
      for (const t of this.tents) if (t.kind === 't') for (let i = 5; i < t.pts.length; i += 6) { ctx.globalAlpha = k * (0.4 + 0.4 * Math.sin(this.t * 2 + i * 0.5 + t.ph)); ctx.fillRect(Math.round(t.pts[i].x), Math.round(t.pts[i].y), 1, 1); }
    }
    ctx.globalAlpha = 1;
  }
}
SPECIES.jelly = { name: 'Medusa-lunar', baby: 'medusa-lunar', desc: 'Flutua devagar e brilha no escuro. Vira uma medusa gigante com coroa de luz.', egg: 'petEgg_jelly', eggGlow: '#ffb0e0', shellC: '#ffd0ee', cls: JellyPet };
