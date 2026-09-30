'use strict';
// =====================================================================
//  Cenário: água, penhascos, cidade afundada, covil do dragão, recife
// =====================================================================
const WATER = ['#9ae8e6', '#6ed4e0', '#46b8d8', '#2f9acb', '#2480ba', '#1d68a4', '#17538c', '#124274', '#0e335e', '#0b2750'];
const PX = { far1: 10, far2: 7, lair: 4, mid: 3 };
let ground = null, groundTop = 0, waterTop = 6;
const LY = {};          // camadas estáticas
let LAYOUT = {};        // posições de adereços com partes animadas
let LAIR = null;        // covil do dragão
let rays = [], CAUS = null;

const gy = x => ground[clamp(Math.round(x), 0, W - 1)];
function waterPos(y) { return clamp(y / (H - 1), 0, 1) * (WATER.length - 1); }
function waterAt(x, y) { const p = waterPos(y), i = Math.floor(p), f = p - i; return (f > bayer(x, y) && i + 1 < WATER.length) ? WATER[i + 1] : WATER[i]; }
function waterSmooth(y) { const p = waterPos(y), i = Math.floor(p); return mixC(WATER[i], WATER[Math.min(i + 1, WATER.length - 1)], Math.round((p - i) * 20) / 20); }

let builtW = 0, builtH = 0;
function computeSize() {
  DPR = window.devicePixelRatio || 1; builtW = innerWidth; builtH = innerHeight;
  const dw = Math.round(innerWidth * DPR), dh = Math.round(innerHeight * DPR);
  S = CFG.pixelSize > 0 ? CFG.pixelSize : Math.max(2, Math.round(dh / 330));
  W = Math.ceil(dw / S); H = Math.ceil(dh / S);
  cvs.width = W; cvs.height = H;
  cvs.style.width = (W * S / DPR) + 'px'; cvs.style.height = (H * S / DPR) + 'px';
  ctx.imageSmoothingEnabled = false;
}

// ---------------- água ----------------
function buildGround() {
  const n = mkNoise(); ground = new Float32Array(W);
  const base = H - Math.round(H * 0.125);
  for (let x = 0; x < W; x++) ground[x] = base + (fbm(n, x * 0.014, 3) - 0.5) * 18 + Math.sin(x * 0.045) * 1.5;
  groundTop = Math.min(...ground);
}
function buildWater() {
  const sx = W * 0.52;
  return paint(W, H, (x, y) => {
    let col = waterAt(x, y);
    const d = Math.hypot((x - sx) / (W * 0.55), (y + H * 0.1) / (H * 0.55));
    if (d < 1) { const a = (1 - d) * 0.35; if (a > bayer(x + 1, y + 2) * 0.6) col = mixC(col, '#d8fff4', Math.round(a * 10) / 10 * 0.5); }
    return col;
  });
}

// ---------------- penhascos distantes ----------------
function buildCliffs() {
  const n = mkNoise(), w = W + PX.far1 * 2, hts = new Float32Array(w);
  for (let x = 0; x < w; x++) hts[x] = H * 0.46 + (fbm(n, x * 0.009, 4) - 0.5) * H * 0.3;
  for (let k = 0; k < 3; k++) { const px = rand(w), pw = rand(10, 22), ph = rand(H * 0.1, H * 0.2); for (let x = Math.floor(px - pw); x <= px + pw; x++) if (x >= 0 && x < w) hts[x] -= ph * Math.pow(Math.max(0, 1 - Math.abs(x - px) / pw), 0.7); }
  return paint(w, H, (x, y) => {
    if (y < hts[x]) return null;
    const rim = y - hts[x] < 1.5 && (hts[x - 1] || 1e9) >= hts[x];
    const streak = hash2(Math.floor(x / 3), 0, 4) < 0.3 && y - hts[x] > 4 ? 0.04 : 0;
    return mixC(waterAt(x, y), rim ? '#bff0ff' : '#0a2a4c', rim ? 0.18 : 0.16 + streak);
  });
}

// ---------------- cidade afundada ----------------
function buildCity() {
  const w = W + PX.far2 * 2, S2 = new Spr(w, H), n = mkNoise();
  const ST = S2.mat('#bcb6a6'), STD = S2.mat('#8e887a'), MOSS = S2.mat('#6a8c58'), RK = S2.mat('#5a6070');
  const base = x => H * 0.73 + (fbm(n, x * 0.02, 3) - 0.5) * H * 0.08;
  for (let x = 0; x < w; x++) { const b = base(x); for (let y = Math.floor(b); y < H; y++) S2.put(x, y, RK, 0.45 - (y - b) * 0.004 + (y - b < 1 ? 0.2 : 0), 0); }
  const colT = (x, top, r, broken) => { const bot = base(x) + 2; S2.tube([{ x, y: top, r }, { x, y: bot, r }], ST, { fn: a => { if (broken && a.y < top + 4 && hash2(a.x, 2) * 5 > a.y - top) return null; return { m: (Math.floor((a.v + 1) * 3) & 1) ? STD : ST }; } }); if (!broken) S2.poly([[x - r - 2, top - 3], [x + r + 2, top - 3], [x + r + 2, top], [x - r - 2, top]], ST, { l: 0.6, z: 0.1 }); };
  let x = rand(10, 40);
  while (x < w - 20) {
    const t = rand(), b = base(x);
    if (t < 0.34) {                      // colunata
      const nC = randi(3, 6), sp = rand(11, 15), hgt = rand(34, 52);
      for (let i = 0; i < nC; i++) colT(x + i * sp, b - hgt, 3.2, chance(0.35));
      if (chance(0.6)) S2.poly([[x - 5, b - hgt - 8], [x + sp * (nC - 1) * rand(0.4, 1) + 5, b - hgt - 8], [x + sp * (nC - 1) * 0.5 + 5, b - hgt - 3], [x - 5, b - hgt - 3]], ST, { l: 0.58, z: 0.2 });
      x += nC * sp + rand(18, 40);
    } else if (t < 0.55) {               // aqueduto
      const nA = randi(2, 4), aw = rand(16, 22), ah = rand(26, 36);
      for (let i = 0; i <= nA; i++) S2.poly([[x + i * aw - 3, b - ah], [x + i * aw + 3, b - ah], [x + i * aw + 3, b + 2], [x + i * aw - 3, b + 2]], ST, { l: 0.55, fn: a => ({ m: (a.y % 5 === 0) ? STD : ST }) });
      for (let i = 0; i < nA; i++) { const cx = x + i * aw + aw / 2; for (let a = 0; a <= Math.PI; a += 0.05) for (let rr = aw / 2 - 3; rr < aw / 2 + 1; rr += 0.5) S2.put(cx + Math.cos(a) * rr, b - ah + 8 - Math.sin(a) * rr, (Math.floor(a * 6) & 1) ? STD : ST, 0.55 + Math.sin(a) * 0.1, 0.1); }
      S2.poly([[x - 3, b - ah - 8], [x + nA * aw + 3, b - ah - 8], [x + nA * aw + 3, b - ah - 3], [x - 3, b - ah - 3]], ST, { l: 0.6, z: 0.2 });
      x += nA * aw + rand(20, 44);
    } else if (t < 0.75) {               // templo com cúpula
      const tw = rand(30, 40), th = rand(20, 26);
      S2.poly([[x, b - th], [x + tw, b - th], [x + tw, b + 2], [x, b + 2]], ST, { fn: a => ({ m: (a.x - x) % 6 < 1 ? STD : ST, l: 0.5 + (a.x - x) / tw * -0.15 + 0.1 }) });
      S2.ellipsoid(x + tw / 2, b - th, tw * 0.46, tw * 0.38, ST, { z: 0.3, fn: a => a.ly > 0 ? null : (hash2(a.x, a.y, 3) < 0.2 ? { m: MOSS } : undefined) });
      S2.tube([{ x: x + tw / 2, y: b - th - tw * 0.38, r: 2 }, { x: x + tw / 2, y: b - th - tw * 0.38 - 5, r: 1 }], ST, { z: 0.4 });
      x += tw + rand(22, 46);
    } else {                             // cabeça colossal meio enterrada
      // perfil de um deus barbado, tombado de lado
      const fl = chance(0.5) ? 1 : -1, sc = rand(1.1, 1.4), tilt = rand(-0.5, -0.25) * fl, hx = x + 26, hy = b - 18 * sc;
      const prof = [[-14, -20], [-6, -24], [4, -22], [10, -16], [11, -10], [9, -8], [14, -3], [10, -1], [11, 2], [9, 4], [11, 6], [8, 10], [12, 16], [6, 22], [-4, 20], [-10, 12], [-16, 0], [-16, -12]];
      const tf = ([px, py]) => { const X = px * fl * sc, Y = py * sc; return [hx + X * Math.cos(tilt) - Y * Math.sin(tilt), hy + X * Math.sin(tilt) + Y * Math.cos(tilt)]; };
      S2.poly(prof.map(tf), ST, { z: 0.3, fn: a => { const h = hash2(Math.floor(a.x / 2), Math.floor(a.y / 2), 5); const beard = (a.y - hy) > 8 * sc; return { m: h < 0.1 ? MOSS : beard && ((Math.floor(a.x + a.y * 0.5) % 3) === 0) ? STD : ST, l: 0.5 + ((a.x - hx) * fl) * 0.01 }; } });
      for (let k = 0; k < 4; k++) S2.poly([tf([-12 + k * 5, -21]), tf([-10 + k * 5, -31]), tf([-8 + k * 5, -22])], ST, { z: 0.32, l: 0.62 });
      const [ex, ey] = tf([4, -9]); S2.ellipsoid(ex, ey, 2.2, 1.4, S2.mat('#46464e'), { z: 0.4, ang: tilt });
      for (let xx = hx - 26; xx < hx + 30; xx++) { const bb = base(xx) - 7 * Math.max(0, 1 - Math.abs(xx - hx) / 30); for (let y = Math.floor(bb); y < base(xx) + 2; y++) S2.put(xx, y, RK, 0.5, 1); }
      x += 64 + rand(20, 40);
    }
  }
  return S2.bake({ fog: waterSmooth(H * 0.6), fogT: 0.6, outline: true });
}

// ---------------- covil do dragão ----------------
function buildLair() {
  const d = buildRuins(waterSmooth(H * 0.7), 0.24);
  d.x = Math.round(W * 0.66 - 300);
  d.y = Math.round(groundTop - 12 - d.G);
  return d;
}
const lairShift = () => Math.round(-parX * PX.lair);

// ---------------- recife (camada da frente) ----------------
function rockSpr(w, h) {
  w = Math.round(w); h = Math.round(h);
  const S2 = new Spr(w + 2, h + 1), R = S2.mat('#6d7a8c'), RD = S2.mat('#566274'), MO = S2.mat('#5e8c4c'), MO2 = S2.mat('#7aa65a'), BAR = S2.mat('#d6d0c0'), SP = S2.mat(pick(['#e8703a', '#d84a8a', '#f2c23a', '#8a5ad8']));
  const blobs = [{ x: w / 2, y: h, rx: w * 0.44, ry: h * 0.95 }];
  for (let k = randi(3, 5); k > 0; k--) blobs.push({ x: rand(w * 0.2, w * 0.8), y: h - rand(h * 0.1, h * 0.45), rx: rand(w * 0.14, w * 0.3), ry: rand(h * 0.3, h * 0.6) });
  const nz = mkNoise2();
  for (const b of blobs) S2.ellipsoid(b.x + 1, b.y, b.rx, b.ry, R, { z: rand(0, 0.5), fn: a => {
    const tex = (fbm2(nz, a.x * 0.25, a.y * 0.25, 3) - 0.5) * 0.35, h2 = hash2(a.x, a.y, 11);
    if (a.ny < -0.55 && fbm2(nz, a.x * 0.15 + 40, a.y * 0.15, 2) > 0.48) return { m: h2 < 0.35 ? MO2 : MO, l: a.l + tex * 0.5 };
    if (h2 < 0.025) return { m: BAR, l: 0.7 };
    if (h2 > 0.992) return { m: SP, l: 0.6 };
    return { m: tex < -0.08 ? RD : R, l: a.l + tex };
  } });
  return S2;
}
function coralStag(col) {
  const S2 = new Spr(44, 42), M = S2.mat(col), TIP = S2.mat(shade(col, 0.45));
  const br = (x, y, a, len, r, dep) => {
    const x2 = x + Math.sin(a) * len, y2 = y - Math.cos(a) * len;
    S2.tube([{ x, y, r, z: dep * 0.01 }, { x: x2, y: y2, r: Math.max(0.6, r * 0.75), z: dep * 0.01 }], M, { fn: q => ({ l: q.l + ((Math.floor(q.s) % 3 === 0) ? 0.05 : 0) }) });
    if (dep <= 0 || r < 0.8) { S2.ellipsoid(x2, y2, 0.9, 0.9, TIP, { z: 1 }); return; }
    const nb = chance(0.35) ? 3 : 2;
    for (let k = 0; k < nb; k++) br(x2, y2, a + (nb === 2 ? (k ? 1 : -1) * rand(0.3, 0.6) : (k - 1) * rand(0.4, 0.6)), len * rand(0.62, 0.82), r * 0.76, dep - 1);
  };
  br(22, 41, rand(-0.2, 0.2), rand(8, 11), 2.2, 3);
  return S2;
}
function coralTable(col) {
  const S2 = new Spr(34, 16), M = S2.mat(col), D = S2.mat(shade(col, -0.2)), P = S2.mat(shade(col, 0.4));
  S2.tube([{ x: 17, y: 15, r: 2.2 }, { x: 17, y: 7, r: 1.6 }], D, {});
  S2.ellipsoid(17, 6, 15, 3.2, M, { z: 1, fn: a => (a.ly < -0.3 && hash2(a.x, a.y, 4) < 0.25) ? { m: P } : (a.ly > 0.4 ? { m: D } : undefined) });
  return S2;
}
function coralBrain(col) {
  const rx = rand(8, 12), ry = rand(6, 9), w = Math.ceil(rx * 2) + 2, h = Math.ceil(ry) + 2, S2 = new Spr(w, h), M = S2.mat(col), G = S2.mat(shade(col, -0.3)), sd = rand(10);
  S2.ellipsoid(w / 2, h, rx, ry + 1, M, { fn: a => Math.sin(a.x * 1.15 + Math.sin(a.y * 0.9 + sd) * 2.4 + sd) > 0.5 ? { m: G, l: a.l * 0.85 } : undefined });
  return S2;
}
function coralFan(col) {
  const S2 = new Spr(32, 28), M = S2.mat(col), bx = 16, by = 27, n = 11, tips = [];
  for (let k = 0; k < n; k++) { const a = (k / (n - 1) - 0.5) * 2.1, r = rand(18, 25); tips.push([bx + Math.sin(a) * r, by - Math.cos(a) * r * 0.95]); S2.line(bx, by, tips[k][0], tips[k][1], M, 0.55, 1); }
  for (const t of [0.35, 0.55, 0.72, 0.88]) for (let k = 0; k < n - 1; k++) S2.line(lerp(bx, tips[k][0], t), lerp(by, tips[k][1], t), lerp(bx, tips[k + 1][0], t), lerp(by, tips[k + 1][1], t), M, 0.42, 0.5);
  for (const [x, y] of tips) S2.put(x, y, M, 0.8, 1.5);
  return S2;
}
function spongeTubes(col) {
  const n = randi(2, 4), S2 = new Spr(n * 6 + 6, 28), M = S2.mat(col), HOLE = S2.mat(shade(col, -0.6));
  for (let k = 0; k < n; k++) { const x = 4 + k * 5.5 + rand(-1, 1), th = rand(10, 24), r = rand(2, 2.8); S2.tube([{ x, y: 27, r: r + 0.4, z: k * 0.1 }, { x: x + rand(-1.5, 1.5), y: 27 - th, r, z: k * 0.1 }], M, { fn: q => ({ l: q.l + (hash2(q.x, q.y, 3) < 0.15 ? -0.1 : 0) }) }); S2.ellipsoid(x, 27 - th, r * 0.7, 0.8, HOLE, { z: k * 0.1 + 0.5 }); }
  return S2;
}
function softCoral(col) {
  const S2 = new Spr(26, 22), M = S2.mat(col), P = S2.mat(shade(col, 0.45));
  for (let k = 0; k < 6; k++) { const x = rand(6, 20), y = rand(6, 16), r = rand(3, 5); S2.ellipsoid(x, y, r, r * 0.85, M, { z: rand(1), fn: a => hash2(a.x, a.y, 7) < 0.2 ? { m: P, l: 0.75 } : undefined }); }
  S2.tube([{ x: 13, y: 21, r: 3 }, { x: 13, y: 14, r: 3.5 }], M, { z: -1 });
  return S2;
}
function urchinSpr() { const S2 = new Spr(15, 10), M = S2.mat('#3b2350'), SP = S2.mat('#5a3a78'); for (let k = 0; k < 15; k++) { const a = -Math.PI + k / 14 * Math.PI; S2.line(7.5, 7.5, 7.5 + Math.cos(a) * 7, 7.5 + Math.sin(a) * 6, SP, 0.45); } S2.ellipsoid(7.5, 8, 3.8, 3.2, M, { z: 1 }); return S2; }
function starSpr() { const S2 = new Spr(11, 11), M = S2.mat(pick(['#ff7a33', '#ff5a6a', '#f2b33a', '#c85ae8'])); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k / 5 * TAU; S2.tube([{ x: 5.5, y: 5.5, r: 1.6 }, { x: 5.5 + Math.cos(a) * 4.5, y: 5.5 + Math.sin(a) * 4.5, r: 0.7 }], M, { fn: q => hash2(q.x, q.y, 2) < 0.2 ? { l: q.l + 0.2 } : undefined }); } return S2; }
function shellSpr() { const S2 = new Spr(7, 5), M = S2.mat(pick(['#f7e6d0', '#f2c4c4', '#e8d2f0'])); S2.ellipsoid(3.5, 5, 3.4, 4.2, M, { fn: a => ({ l: a.l - ((Math.floor(a.x) & 1) ? 0.1 : 0) }) }); return S2; }

const SAND = ['#f3e2b0', '#e4ca92', '#d4b77c', '#c4a46a', '#b09058', '#957848'];
function buildSeabed() {
  const c = paint(W, H, (x, y) => {
    const g0 = Math.round(ground[x]); if (y < g0) return null;
    const d = y - g0; if (d === 0) return SAND[0];
    const p = clamp((d - 1) / Math.max(1, H - g0 - 1), 0, 1) * (SAND.length - 2) + 1, i = Math.floor(p), f = p - i;
    let col = (f > bayer(x, y) && i + 1 < SAND.length) ? SAND[i + 1] : SAND[i];
    const rp = (y + Math.round(Math.sin(x * 0.12 + y * 0.4) * 1.4)) % 5;
    if (d > 2 && rp === 0) col = shade(col, -0.1); else if (d > 2 && rp === 1) col = shade(col, 0.07);
    const hh = hash2(x, y, 3.1); if (hh < 0.04) col = shade(col, -0.16); else if (hh > 0.97) col = shade(col, 0.2);
    return col;
  });
  const g = c.getContext('2d');
  const put = (spr, x, sink = 2) => { const cv = spr.bake(); g.drawImage(cv, Math.round(x - spr.w / 2), Math.round(gy(x) - spr.h + sink)); return cv; };
  // reservas para adereços animados
  const slots = [], used = [];
  const free = (x, w) => used.every(([a, b]) => x + w / 2 < a || x - w / 2 > b);
  const take = (w, lo = 0.05, hi = 0.95) => { for (let t = 0; t < 40; t++) { const x = rand(W * lo + w / 2, W * hi - w / 2); if (free(x, w)) { used.push([x - w / 2, x + w / 2]); return x; } } return null; };
  LAYOUT = { anemones: [], seagrass: [], eels: null, clam: null, chest: null, moray: null, vents: [], kelp: [] };
  if (LAIR) { const nx = LAIR.x + LAIR.nest.x, hx = LAIR.x + PET_DRAPE[0][0]; used.push([nx - 34, nx + 34]); used.push([hx - 30, hx + 46]); }   // ninho e cabeça da fera à vista
  LAYOUT.chest = take(34, 0.1, 0.9);
  LAYOUT.clam = take(34, 0.1, 0.9);
  const ex = take(46, 0.1, 0.9); if (ex !== null) LAYOUT.eels = { x: ex, w: 40 };
  for (let k = 0; k < 2; k++) { const ax = take(26, 0.08, 0.92); if (ax !== null) LAYOUT.anemones.push({ x: ax, col: k === 0 ? 'magenta' : pick(['green', 'orange']) }); }
  // aglomerados de recife: rocha + corais + detalhes
  const nC = Math.max(3, Math.round(W / 130));
  for (let k = 0; k < nC; k++) {
    const rw = rand(40, 70), rx = take(rw * 0.9); if (rx === null) continue;
    const rh = rand(22, 38), rs = rockSpr(rw, rh);
    const cols = ['#ff6f91', '#ff8c42', '#c86bff', '#ff5e5e', '#f7c548', '#4fd1c5', '#6f8cff'];
    // corais atrás da rocha
    for (let j = 0; j < randi(1, 3); j++) put(pick([coralStag, coralFan, softCoral])(pick(cols)), rx + rand(-rw * 0.4, rw * 0.4), 3);
    put(rs, rx, 4);
    if (!LAYOUT.moray && chance(0.6)) LAYOUT.moray = { x: Math.round(rx - rw * 0.15), y: Math.round(gy(rx) - rh * 0.45) };
    if (LAYOUT.vents.length < 2) LAYOUT.vents.push({ x: rx + rand(-rw / 5, rw / 5), y: gy(rx) - rh + 6 });
    // corais na frente/lados
    for (let j = 0; j < randi(2, 4); j++) { const f = pick([coralStag, coralBrain, spongeTubes, coralTable, softCoral, coralBrain]); put(f(pick(cols)), rx + rand(-rw * 0.7, rw * 0.7), 2); }
    if (chance(0.7)) put(urchinSpr(), rx + rand(-rw * 0.6, rw * 0.6), 3);
  }
  // corais soltos e detalhes na areia
  for (let k = 0; k < Math.round(W / 60); k++) { const x = take(18); if (x !== null) put(pick([coralBrain, spongeTubes, softCoral, coralStag])(pick(['#ff6f91', '#f7c548', '#4fd1c5', '#c86bff'])), x, 2); }
  for (let k = 0; k < Math.round(W / 110) + 1; k++) put(starSpr(), rand(10, W - 10), 4);
  for (let k = 0; k < Math.round(W / 45) + 1; k++) put(shellSpr(), rand(6, W - 6), 2);
  for (let k = 0; k < Math.round(W / 70); k++) { const x = rand(8, W - 8); if (free(x, 8)) LAYOUT.seagrass.push(x); }
  if (!LAYOUT.moray) LAYOUT.moray = null;
  // tinta de profundidade
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(40,120,180,0.12)'; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, groundTop - 30, 0, H); gr.addColorStop(0, 'rgba(5,30,60,0)'); gr.addColorStop(1, 'rgba(5,30,60,0.32)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  return c;
}

// rochas escuras nos cantos (moldura em primeiro plano)
function buildFront() {
  const S2 = new Spr(W, H), R = S2.mat('#132436'), C1 = S2.mat('#2a1f3a'), C2 = S2.mat('#16303a');
  const corner = (cx, sgn) => {
    for (let k = 0; k < 4; k++) S2.ellipsoid(cx + sgn * rand(-10, 30), H + rand(-4, 6), rand(22, 40), rand(18, 34), R, { z: rand(1), fn: a => ({ l: a.l * 0.8 }) });
    for (let k = 0; k < 3; k++) { const bx = cx + sgn * rand(5, 40), by = H - rand(16, 30); S2.tube([{ x: bx, y: by + 10, r: 2 }, { x: bx + rand(-6, 6), y: by - rand(6, 14), r: 1 }], k & 1 ? C1 : C2, { z: 2 }); }
  };
  corner(-8, 1); corner(W + 8, -1);
  return S2.bake({ outline: true });
}

function buildVignette() {
  return paint(W, H, (x, y) => {
    const dx = (x / W - 0.5) * 1.1, dy = (y / H - 0.42) * 1.25, d = Math.sqrt(dx * dx + dy * dy);
    const a = clamp((d - 0.34) / 0.45, 0, 1), lv = Math.floor(a * a * 6 + bayer(x, y));
    return lv <= 0 ? null : alphaC('#03122a', Math.min(0.48, lv * 0.075));
  });
}

// ---------------- raios de luz ----------------
function buildRays() {
  rays = [];
  const nR = Math.max(4, Math.round(W / 80));
  for (let i = 0; i < nR; i++) {
    const thin = i % 3 === 2, len = Math.round(H * rand(0.5, 0.82)), w0 = thin ? rand(3, 5) : rand(6, 13), w1 = w0 + (thin ? rand(6, 10) : rand(12, 26)), slope = 0.26;
    const col = thin ? '#f0ffff2a' : '#e4ffff30';
    const c = paint(Math.ceil(w1 + len * slope) + 2, len, (x, y) => {
      const t = y / len, w = lerp(w0, w1, t), x0 = y * slope; if (x < x0 || x > x0 + w) return null;
      const e = Math.min(x - x0, x0 + w - x) / (w * 0.5), a = Math.pow(1 - t, 1.3) * Math.min(1, e * 2.2);
      return a > bayer(x, y) * 0.9 + 0.05 ? col : null;
    });
    rays.push({ c, x: (i + 0.5) / nR * W - len * slope * 0.4 + rand(-20, 20), ph: rand(TAU), sp: rand(0.1, 0.25) });
  }
}

// ---------------- cáusticas animadas ----------------
function buildCaustics() {
  const TW = 128, TH = 64, NF = 16, frames = [];
  const K = [[2, 1], [-1, 2], [3, -1], [1, 3]].map(([a, b]) => [a * TAU / TW, b * TAU / TH]);
  for (let f = 0; f < NF; f++) {
    const t = f / NF * TAU;
    frames.push(paint(TW, TH, (x, y) => {
      let w = 0; K.forEach(([kx, ky], i) => { w += Math.cos(kx * x + ky * y + t * (i % 2 ? 1 : -1) + Math.sin(ky * x * 2 + kx * y * 2 + t) * 1.1); });
      const c = Math.pow(Math.max(0, 1 - Math.abs(w) / 1.2), 3);
      return c > 0.72 ? '#e8fffa' : c > 0.55 && bayer(x, y) < 0.3 ? '#e8fffa' : null;
    }));
  }
  const band = H - groundTop + 50;
  CAUS = { frames, TW, TH, buf: makeCanvas(W, band), y0: Math.max(0, Math.floor(groundTop - 44)) };
  CAUS.bctx = CAUS.buf.getContext('2d');
}
function drawCaustics(alpha) {
  if (!CAUS || alpha <= 0.01) return;
  const { frames, TW, TH, buf, bctx, y0 } = CAUS, f = Math.floor(T * 5) % frames.length;
  const ox = Math.floor(T * 3) % TW, oy = Math.floor(T * 1.5) % TH, key = f + ':' + ox + ':' + oy;
  if (CAUS.key === key) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha; ctx.drawImage(buf, 0, y0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; return; }
  CAUS.key = key;   // só recompõe quando o quadro da animação muda (~5x por segundo)
  bctx.globalCompositeOperation = 'source-over'; bctx.clearRect(0, 0, buf.width, buf.height);
  for (let y = -oy; y < buf.height; y += TH) for (let x = -ox; x < buf.width; x += TW) bctx.drawImage(frames[f], x, y);
  bctx.globalCompositeOperation = 'destination-in';
  bctx.drawImage(LY.seabed, 0, -y0);
  if (!CAUS.fade) { const gr = bctx.createLinearGradient(0, 0, 0, buf.height); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); CAUS.fade = gr; }
  bctx.fillStyle = CAUS.fade; bctx.fillRect(0, 0, buf.width, buf.height);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha;
  ctx.drawImage(buf, 0, y0);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}
