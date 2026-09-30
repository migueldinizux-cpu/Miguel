'use strict';
// =====================================================================
//  Bichinho virtual — base comum a todas as espécies:
//  necessidades, humor, estados, comida, painel, fala e diálogos.
//  Espécies: pet_serpent.js, pet_jelly.js, pet_crab.js · roupas: pet_wear.js
// =====================================================================
const PET_KEYS = ['egg', 'baby', 'young', 'teen', 'adult'];
const PET_LABEL = ['Ovo', 'Bebê', 'Jovem', 'Adolescente', 'Gigante'];
const PET_GROW = [0, 0, 120, 420, 1000];                 // crescimento acumulado para chegar em cada estágio
const PET_SPEEDS = [1, 4, 30];
const PET_SPEED_LABEL = ['Normal (alguns dias)', 'Rápido (uma tarde)', 'Muito rápido (menos de 1 hora)'];
const RATE = { fome: 100 / (3 * 3600), alegria: 100 / (4 * 3600), tire: 100 / (8 * 3600), rest: 100 / (1.5 * 3600), grow: 1 / 60 };
const FOODS = {
  sardine: { name: 'Sardinha', fome: 22, alegria: 2, energia: 0, grow: 8 },
  shrimp: { name: 'Camarão', fome: 10, alegria: 8, energia: 0, grow: 4 },
  grape: { name: 'Alga doce', fome: 8, alegria: 2, energia: 12, grow: 3 },
  pearl: { name: 'Pérola', fome: 4, alegria: 30, energia: 6, grow: 15 },
  live: { name: 'Peixinho', fome: 18, alegria: 5, energia: 0, grow: 7 },
};
const TRAY = ['sardine', 'shrimp', 'grape', 'pearl'];
const PET_NAMES = ['Maré', 'Coral', 'Bolha', 'Nino', 'Tuca', 'Lumi', 'Azul', 'Cauã', 'Pipoca', 'Brisa'];
const FULL_LINE = 'Buxin chei!';
// cada arquivo de espécie se registra aqui: { name, baby, desc, egg, eggGlow, cls }
const SPECIES = {}, SPECIES_ORDER = ['serpent', 'jelly', 'crab'];

// ---------------- fonte pixel 5x7 (maiúsculas) e 5x9 (minúsculas, nas falas) ----------------
const GLYPHS = {
  A: '01110100011000111111100011000110001', B: '11110100011000111110100011000111110', C: '01110100011000010000100001000101110', D: '11110100011000110001100011000111110',
  E: '11111100001000011110100001000011111', F: '11111100001000011110100001000010000', G: '01110100011000010111100011000101111', H: '10001100011000111111100011000110001',
  I: '01110001000010000100001000010001110', J: '00111000100001000010100101001001100', K: '10001100101010011000101001001010001', L: '10000100001000010000100001000011111',
  M: '10001110111010110101100011000110001', N: '10001110011010110011100011000110001', O: '01110100011000110001100011000101110', P: '11110100011000111110100001000010000',
  Q: '01110100011000110001101011001001101', R: '11110100011000111110101001001010001', S: '01111100001000001110000010000111110', T: '11111001000010000100001000010000100',
  U: '10001100011000110001100011000101110', V: '10001100011000110001100010101000100', W: '10001100011000110101101011010101010', X: '10001100010101000100010101000110001',
  Y: '10001100010101000100001000010000100', Z: '11111000010001000100010001000011111',
  0: '01110100011001110101110011000101110', 1: '00100011000010000100001000010001110', 2: '01110100010000100010001000100011111', 3: '11110000010000101110000010000111110',
  4: '00010001100101010010111110001000010', 5: '11111100001111000001000011000101110', 6: '01110100001000011110100011000101110', 7: '11111000010001000100010000100001000',
  8: '01110100011000101110100011000101110', 9: '01110100011000101111000010000101110',
  '.': '00000000000000000000000000110001100', ',': '00000000000000000000011000010001000', '!': '00100001000010000100001000000000100', '?': '01110100010000100010001000000000100',
  ':': '00000011000110000000011000110000000', '-': '00000000000000011111000000000000000', '+': '00000001000010011111001000010000000', '%': '11001110100001000100010000101110011',
  '/': '00001000100001000100010001000010000', "'": '00100001000100000000000000000000000', '(': '00010001000100001000010000010000010', ')': '01000001000001000010000100010001000',
  '·': '00000000000000001100011000000000000', ' ': '00000000000000000000000000000000000', '~': '00000000000100010101000100000000000',
};
const ACCENT = { 'Á': ['A', [[3, -2], [2, -1]]], 'À': ['A', [[1, -2], [2, -1]]], 'Â': ['A', [[2, -2], [1, -1], [3, -1]]], 'Ã': ['A', [[0, -1], [1, -2], [2, -1], [3, -2]]],
  'É': ['E', [[3, -2], [2, -1]]], 'Ê': ['E', [[2, -2], [1, -1], [3, -1]]], 'Í': ['I', [[3, -2], [2, -1]]], 'Ó': ['O', [[3, -2], [2, -1]]], 'Ô': ['O', [[2, -2], [1, -1], [3, -1]]],
  'Õ': ['O', [[0, -1], [1, -2], [2, -1], [3, -2]]], 'Ú': ['U', [[3, -2], [2, -1]]], 'Ç': ['C', [[2, 7], [1, 8]]] };
// linhas 0-8; a linha 6 é a base e 7-8 são as pernas do g, j, p, q, y
const LOWER = {
  a: ['.....', '.....', '.###.', '....#', '.####', '#...#', '.####'], b: ['#....', '#....', '####.', '#...#', '#...#', '#...#', '####.'],
  c: ['.....', '.....', '.###.', '#....', '#....', '#....', '.###.'], d: ['....#', '....#', '.####', '#...#', '#...#', '#...#', '.####'],
  e: ['.....', '.....', '.###.', '#...#', '#####', '#....', '.###.'], f: ['..##.', '.#..#', '.#...', '####.', '.#...', '.#...', '.#...'],
  g: ['.....', '.....', '.####', '#...#', '#...#', '#...#', '.####', '....#', '.###.'], h: ['#....', '#....', '#.##.', '##..#', '#...#', '#...#', '#...#'],
  i: ['..#..', '.....', '.##..', '..#..', '..#..', '..#..', '.###.'], 'ı': ['.....', '.....', '.##..', '..#..', '..#..', '..#..', '.###.'],
  j: ['...#.', '.....', '..##.', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'], k: ['#....', '#....', '#..#.', '#.#..', '##...', '#.#..', '#..#.'],
  l: ['.##..', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'], m: ['.....', '.....', '##.#.', '#.#.#', '#.#.#', '#.#.#', '#.#.#'],
  n: ['.....', '.....', '#.##.', '##..#', '#...#', '#...#', '#...#'], o: ['.....', '.....', '.###.', '#...#', '#...#', '#...#', '.###.'],
  p: ['.....', '.....', '####.', '#...#', '#...#', '#...#', '####.', '#....', '#....'], q: ['.....', '.....', '.####', '#...#', '#...#', '#...#', '.####', '....#', '....#'],
  r: ['.....', '.....', '#.##.', '##..#', '#....', '#....', '#....'], s: ['.....', '.....', '.####', '#....', '.###.', '....#', '####.'],
  t: ['.#...', '.#...', '####.', '.#...', '.#...', '.#..#', '..##.'], u: ['.....', '.....', '#...#', '#...#', '#...#', '#..##', '.##.#'],
  v: ['.....', '.....', '#...#', '#...#', '#...#', '.#.#.', '..#..'], w: ['.....', '.....', '#...#', '#...#', '#.#.#', '#.#.#', '.#.#.'],
  x: ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'], y: ['.....', '.....', '#...#', '#...#', '#...#', '#...#', '.####', '....#', '.###.'],
  z: ['.....', '.....', '#####', '...#.', '..#..', '.#...', '#####'],
};
const LACC = (() => { const AC = [[3, 0], [2, 1]], GR = [[1, 0], [2, 1]], CI = [[2, 0], [1, 1], [3, 1]], TI = [[0, 1], [1, 0], [2, 1], [3, 0]];
  return { 'á': ['a', AC], 'à': ['a', GR], 'â': ['a', CI], 'ã': ['a', TI], 'é': ['e', AC], 'ê': ['e', CI], 'í': ['ı', AC], 'ó': ['o', AC], 'ô': ['o', CI], 'õ': ['o', TI], 'ú': ['u', AC], 'ç': ['c', [[2, 7], [1, 8]]] }; })();
const textCache = new Map();
function textCanvas(str, col = '#eaf8ff', shadow = '#061426', mixed = false) {
  const key = str + '|' + col + '|' + shadow + (mixed ? '|m' : ''); let c = textCache.get(key); if (c) return c;
  const chars = [...(mixed ? String(str) : String(str).toUpperCase())], w = Math.max(1, chars.length * 6) + 1, h = 12, grid = new Uint8Array(w * h);
  const mark = (x, y) => { if (x >= 0 && y >= 0 && x < w && y < h) grid[y * w + x] = 1; };
  chars.forEach((ch, i) => {
    if (mixed && (LOWER[ch] || LACC[ch])) {
      const [base, extra] = LACC[ch] || [ch, []], g = LOWER[base];
      g.forEach((row, y) => { for (let x = 0; x < 5; x++) if (row[x] === '#') mark(i * 6 + x, 2 + y); });
      for (const [x, y] of extra) mark(i * 6 + x, 2 + y);
      return;
    }
    let base = mixed ? ch.toUpperCase() : ch, extra = [];
    if (ACCENT[base]) { extra = ACCENT[base][1]; base = ACCENT[base][0]; }
    const g = GLYPHS[base] || GLYPHS[' '];
    for (let k = 0; k < 35; k++) if (g[k] === '1') mark(i * 6 + (k % 5), 2 + Math.floor(k / 5));
    for (const [x, y] of extra) mark(i * 6 + x, 2 + y);
  });
  c = paint(w, h, (x, y) => grid[y * w + x] ? col : (shadow && x > 0 && y > 0 && grid[(y - 1) * w + x - 1]) ? shadow : null);
  if (textCache.size > 300) textCache.clear();
  textCache.set(key, c); return c;
}
function drawText(str, x, y, col, align = 'left', a = 1) {
  const c = textCanvas(str, col); const X = align === 'center' ? x - c.width / 2 : align === 'right' ? x - c.width : x;
  ctx.globalAlpha = a; ctx.drawImage(c, Math.round(X), Math.round(y) - 2); ctx.globalAlpha = 1;
}
// ícones pixel desenhados à mão
function pixIcon(rows, pal) { return paint(rows[0].length, rows.length, (x, y) => pal[rows[y][x]] || null); }
const ICONS = {};
function buildIcons() {
  ICONS.heart = pixIcon(['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'], { '#': '#ff6fa8' });
  ICONS.heartS = pixIcon(['.#.#.', '#####', '.###.', '..#..'], { '#': '#ff7fb4' });
  ICONS.fish = pixIcon(['.#..###.', '##.#####', '######o#', '##.#####', '.#..###.'], { '#': '#ff9a3a', o: '#1a1020' });
  ICONS.bolt = pixIcon(['..##.', '.##..', '####.', '.####', '..##.', '.##..', '.#...'], { '#': '#ffe04a' });
  ICONS.star = pixIcon(['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '.#...#.'], { '#': '#6ff0ff' });
  ICONS.gear = pixIcon(['.#.#.#.', '#######', '.##.##.', '###.###', '.##.##.', '#######', '.#.#.#.'], { '#': '#9fc8e8' });
  ICONS.hanger = pixIcon(['..##...', '.#..#..', '....#..', '...#...', '..#.#..', '.#...#.', '#######'], { '#': '#ffd98a' });
  ICONS.zz = pixIcon(['####', '..#.', '.#..', '####'], { '#': '#dff4ff' });
}

// ---------------- auxiliares de sprite compartilhados pelas espécies ----------------
// cilindro/tronco de cone vertical com sombreamento de volume
function sprCyl(S, cx, y0, y1, r0, r1, m, o = {}) {
  for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
    const t = clamp((y + 0.5 - y0) / Math.max(0.01, y1 - y0), 0, 1), r = Math.max(0.5, lerp(r0, r1, t));
    for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r); x++) {
      const nx = (x + 0.5 - cx) / r; if (Math.abs(nx) > 1) continue;
      const nz = Math.sqrt(1 - nx * nx), res = S._apply(o, { x, y, t, nx, nz }, m, lit(nx * 0.95, o.ny || 0, nz));
      if (!res) continue;
      S.put(x, y, res[0], res[1], (o.z || 0) + nz * 0.01);
    }
  }
}
// olho fofo ('cute': escuro com brilhos) ou gentil ('kind': anel âmbar); e = expressão
function petEye(S, P, ex, ey, e) {
  const cute = P.eye === 'cute', w = P.eyeW, h = P.eyeH, D = P.eyeDark || '#23133a', X = Math.round(ex - w / 2), Y = Math.round(ey - h / 2), cy = Math.round(ey);
  if (e === 1 || e === 2 || e === 3 || e === 4) {           // fechado: piscando, feliz (^ ^), comendo, dormindo
    for (let i = 0; i < w; i++) { const t = (i - (w - 1) / 2) / ((w - 1) / 2); const yy = e === 1 ? 0 : (e === 4 ? -Math.round(Math.abs(t) * 1.2) + 1 : Math.round(Math.abs(t) * 1.6) - 1); S.dot(X + i, cy + yy, D); }
    if (e === 4 && !cute) { S.dot(X - 1, cy - 1, D); S.dot(X + w, cy - 1, D); }
    return;
  }
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const nx = (i + 0.5 - w / 2) / (w / 2), ny = (j + 0.5 - h / 2) / (h / 2); if (nx * nx + ny * ny > 1.08) continue;
    if (e === 5 && j < Math.ceil(h * 0.35)) continue;
    let c; if (cute) c = j >= h * 0.62 ? (P.eyeLow || '#40629a') : D; else { const d = Math.hypot(nx, ny); c = d < 0.55 ? D : (ny > 0.25 ? '#c8862a' : '#f2b640'); }
    S.dot(X + i, Y + j, c);
  }
  const gy0 = Y + (e === 5 ? Math.ceil(h * 0.35) : 1);
  S.dot(X + 1, gy0, '#ffffff');
  if (cute) { if (w >= 5) { S.dot(X + 2, gy0, '#ffffff'); S.dot(X + 1, gy0 + 1, '#ffffff'); S.dot(X + 2, gy0 + 1, '#ffffff'); } S.dot(X + w - 2, Y + h - 2, '#dff0ff'); }
  else if (w >= 6) { S.dot(X + 2, gy0, '#ffffff'); S.dot(X + 1, gy0 + 1, '#fff6e0'); S.dot(X + w - 2, Y + h - 2, '#ffe8b0'); }
  if (e === 5) { for (let i = 0; i < w; i++) S.dot(X + i, Y + Math.ceil(h * 0.35) - 1, P.lid || shade(P.c.body, -0.45)); S.dot(X + w - 1, Y + h, '#9fe8ff'); }
}
// boquinha fofa: sorriso em "w", aberta para comer, tristinha
function petMouth(S, x, y, e, w = 4, open = 2) {
  x = Math.round(x); y = Math.round(y);
  if (e === 3) { for (let j = 0; j < open + 1; j++) for (let i = -Math.floor(w / 2); i < Math.ceil(w / 2); i++) S.dot(x + i, y + j, j === open && Math.abs(i) < w / 2 - 0.5 ? '#ff7f9e' : '#3a1226'); return; }
  if (e === 5) { for (let i = -1; i <= 1; i++) S.dot(x + i, y + (i === 0 ? 0 : 1), '#3a1a2c'); return; }
  if (w <= 3) { S.dot(x - 1, y, '#3a1a2c'); S.dot(x, y + 1, '#3a1a2c'); S.dot(x + 1, y, '#3a1a2c'); return; }
  for (let i = -2; i <= 1; i++) S.dot(x + i, y + (i === -2 || i === 1 ? -1 : 0), '#3a1a2c'); S.dot(x - 1, y + 1, '#ff8aa8');
}

// ---------------- ninho, comidas ----------------
defSheet('petNest', () => makeSheet(2, f => {
  const S = new Spr(64, 22), cx = 32, cy = 13, K = S.mat('#6b7a3a'), K2 = S.mat('#8a6a3a'), ST = S.mat('#8d95a0'), IN = S.mat('#2e3a2a'), AN = S.mat('#ff8ab8');
  if (f === 0) {
    S.ellipsoid(cx, cy, 27, 8, IN, { z: 0, fn: q => q.ly > 0.2 ? null : undefined });
    S.ellipsoid(cx, cy, 29, 9.5, K, { z: -0.5, fn: q => q.ly > -0.2 ? null : { m: (Math.floor(q.x / 2 + q.y) & 1) ? K : K2 } });
    for (let k = 0; k < 6; k++) { const a = Math.PI + 0.3 + k * 0.5, x = cx + Math.cos(a) * 27, y = cy + Math.sin(a) * 8; S.ellipsoid(x, y - 2, 2, 2.4, AN, { z: 0.2 }); }
  } else {
    S.ellipsoid(cx, cy + 1, 29, 8.5, K, { z: 1, fn: q => q.ly < 0.15 ? null : { m: (Math.floor(q.x / 2 - q.y) & 1) ? K : K2 } });
    for (let k = 0; k < 7; k++) { const a = 0.35 + k * 0.4, x = cx + Math.cos(a) * 26, y = cy + 1 + Math.sin(a) * 8; S.ellipsoid(x, y, 3.2, 2.4, ST, { z: 1.2 }); }
  }
  return { spr: S, meta: { ax: cx, ay: cy } };
}, { outer: '#07122444' }));
defSheet('food_shrimp', () => makeSheet(1, () => {
  const S = new Spr(18, 13), B = S.mat('#ff8a6a'), L = S.mat('#ffc6aa'), A = S.mat('#e8603e');
  const pts = []; for (let k = 0; k <= 8; k++) { const a = -0.3 + k * 0.33; pts.push({ x: 9 + Math.cos(a) * 5 * (1 - k * 0.04), y: 6 + Math.sin(a) * 4, r: 2.4 - k * 0.15 }); }
  S.tube(pts.reverse(), B, { fn: q => ((Math.floor(q.s / 1.6)) & 1) ? { m: L } : undefined });
  S.poly([[5, 9], [2, 12], [6, 11.5]], A, { z: 1, l: 0.6 }); S.line(14, 4, 17, 0, A, 0.5, 1); S.line(13, 4, 17, 2, A, 0.5, 1);
  S.dot(14, 5, '#1a1020');
  return { spr: S, meta: { ax: 9, ay: 6 } };
}, { outer: '#07122466' }));
defSheet('food_grape', () => makeSheet(1, () => {
  const S = new Spr(14, 16), ST = S.mat('#3f7a2e'), G = S.mat('#78d85a');
  S.line(7, 15, 7, 3, ST, 0.4, 0); S.line(7, 8, 3, 5, ST, 0.4, 0); S.line(7, 10, 11, 7, ST, 0.4, 0);
  for (const [x, y] of [[7, 3], [4, 5], [10, 6], [6, 7], [8, 9], [4, 9], [10, 10], [7, 12]]) S.ellipsoid(x, y, 1.8, 1.8, G, { z: 1, spec: 0.5 });
  return { spr: S, meta: { ax: 7, ay: 8 } };
}, { outer: '#07122466' }));
defSheet('food_pearl', () => makeSheet(1, () => {
  const S = new Spr(11, 11), P = S.mat('#f4eefa', { glow: '#fff4ffaa' }), I = S.mat('#d8c8ff');
  S.ellipsoid(5.5, 5.5, 4, 4, P, { spec: 0.7, fn: q => (q.lx + q.ly > 0.9) ? { m: I } : undefined });
  return { spr: S, meta: { ax: 5.5, ay: 5.5 } };
}, { outer: '#07122466' }));
const foodSheet = k => sheet(k === 'sardine' ? 'sardine' : 'food_' + k);

// ---------------- estado salvo ----------------
const PET_STORE = 'aquario.pet.v1';
const PET_DEBUG = QS.get('pet'), POSE_X = QS.has('pose') ? clamp(+QS.get('pose') || 0.5, 0.1, 0.9) : 0.3;     // ?pet=egg|baby|young|teen|adult[&sp=serpent|jelly|crab][&wear=hat:cartola:4,neck:borboleta] → prévia sem salvar
let pet = null, petFoods = [], respawnQ = [];
const drag = { item: null };
function newPetState(species) { return { v: 1, species: species || null, stage: 0, growth: 0, fome: 75, alegria: 80, energia: 90, name: '', born: Date.now(), last: Date.now(), speed: 0, pearls: 1, hud: true, hudMin: false, taps: 0, meals: 0, hints: 0, pearlT: 0, wear: {}, wcol: {}, hunt: false }; }
function loadPetState() {
  if (PET_DEBUG) {
    const sp = QS.get('sp'), s = newPetState(sp === 'none' ? null : SPECIES[sp] ? sp : 'serpent');
    s.stage = Math.max(0, PET_KEYS.indexOf(PET_DEBUG)); s.growth = PET_GROW[s.stage] + 1; s.name = s.stage ? 'Maré' : ''; s.debug = true; s.hints = 7;
    for (const kv of (QS.get('wear') || '').split(',')) { const [slot, id, c] = kv.split(':'); if (slot && id) { s.wear[slot] = id; if (c) s.wcol[slot] = +c; } }
    return s;
  }
  let s = null; try { s = JSON.parse(localStorage.getItem(PET_STORE) || 'null'); } catch (e) { }
  if (!s || s.v !== 1) return newPetState();
  if (!('species' in s)) s.species = (s.stage > 0 || s.taps > 0) ? 'serpent' : null;   // saves da v3 eram sempre serpente
  if (s.species && !SPECIES[s.species]) s.species = 'serpent';
  if (!s.wear) s.wear = {}; if (!s.wcol) s.wcol = {};
  const el = clamp((Date.now() - (s.last || Date.now())) / 1000, 0, 12 * 3600) * PET_SPEEDS[s.speed || 0];
  if (s.stage > 0 && el > 5) {
    const good = Math.min(el, Math.max(0, (s.fome - 35) / RATE.fome));
    s.growth += good * RATE.grow * 0.5;
    s.fome = Math.max(5, s.fome - el * RATE.fome); s.alegria = Math.max(12, s.alegria - el * RATE.alegria); s.energia = Math.min(100, s.energia + el * 0.004);
  }
  return s;
}
function savePetState() { if (!pet || pet.s.debug || pet.s.preview) return; pet.s.last = Date.now(); try { localStorage.setItem(PET_STORE, JSON.stringify(pet.s)); } catch (e) { } }
addEventListener('beforeunload', savePetState);
function petNight() { if (CFG.timeMode === 'night') return true; if (CFG.timeMode !== 'auto') return false; const h = new Date().getHours(); return h >= 22 || h < 6; }
const petName = () => (pet && pet.s.name) || 'Seu bichinho';
function makePet(s) { const sp = SPECIES[s.species]; return sp ? new sp.cls(s) : new Pet(s); }

// ---------------- a base de todo bichinho ----------------
// As espécies sobrescrevem os "ganchos": setupStage, mouthOff, headOff, restHead, wanderTarget, move, updateBody, drawBody, glowBody, wearAnchors...
class Pet {
  constructor(s) {
    this.s = s; this.t = 0; this.state = 'idle'; this.st = 0; this.saveT = 10;
    this.hx = 0; this.hy = 0; this.vx = 0; this.vy = 0; this.dir = 1; this.tx = 0; this.ty = 0; this.wt = 0; this.face = 0; this.spMul = 1;
    this.expr = 0; this.blinkT = 3; this.happyT = 0; this.eatT = 0; this.petting = 0; this.heartT = 0; this.bubbleT = 4; this.bubbleShow = 0; this.boopT = 0; this.wakeT = 0; this.peekT = 0; this.peekCD = rand(20, 40);
    this.restW = 0; this.restTarget = false; this.restT = rand(25, 50); this.resting = false; this.evolveT = 0; this.banner = null; this.bannerT = 0; this.shake = 0; this.hop = 0; this.eggWob = 0;
    this.fx = []; this.hint = null; this.hintT = 0; this.defendCD = 0; this.speech = null; this.speechT = 0; this.posing = 0; this.fullSay = false;
    this.prey = null; this.huntT = 0; this.huntCD = 2; this.huntNow = 0; this.purring = false;
    this.setupStage(true);
    if (s.preview) return;
    if (s.debug && QS.has('pose') && s.stage > 0) { this.posing = 1; const q = this.posePos(); this.placeAt(q.x, q.y); }   // prévia: já começa posando no lugar (para capturas)
    if (!s.species) setTimeout(() => { if (pet === this && !this.s.species && !document.querySelector('.dlg')) askSpecies(); }, 1400);
    else if (s.stage > 0 && !s.name) setTimeout(() => askPetName(), 900);
    else if (s.stage === 0 && !(s.hints & 1)) this.showHint('Toque 3 vezes no ovo para chocar', 1);
  }
  get key() { return PET_KEYS[this.s.stage]; }
  get spec() { return SPECIES[this.s.species] || null; }
  nestPos() { return { x: LAIR.x + LAIR.nest.x + lairShift(), y: LAIR.y + LAIR.nest.y }; }
  showHint(txt, bit) { this.hint = txt; this.hintT = 9; if (bit) this.s.hints |= bit; }
  say(txt, t = 2.8) { this.speech = txt; this.speechT = t; this.bubbleShow = 0; }
  // ---- ganchos (cada espécie sobrescreve o que precisar) ----
  setupStage() { const n = this.nestPos(); this.hx = n.x; this.hy = n.y; this.P = null; }
  mouthOff() { return { x: 0, y: 0 }; }                // posição da boca em relação a (hx, hy), olhando para a direita
  headOff() { return { x: 0, y: 0 }; }
  hitRadius() { return this.P ? this.P.hr * 1.2 : 0; }
  restHead() { const n = this.nestPos(); return { x: n.x, y: n.y - 10 }; }
  posePos() { return { x: Math.round(W * POSE_X), y: Math.round(H * 0.5) }; }
  playTarget() { const a = this.t * 1.6, P = this.P; return { x: mouse.x + Math.cos(a) * P.hr * 2.2, y: mouse.y + Math.sin(a) * P.hr * 1.2 }; }
  wanderTarget() {
    const k = this.key, P = this.P, n = this.nestPos(), rad = k === 'baby' ? 80 : k === 'young' ? 170 : 1e9;
    return { x: clamp(n.x + rand(-rad, rad), P.hr * 3, W - P.hr * 3),
      y: clamp(k === 'baby' ? n.y - rand(12, 90) : rand(waterTop + P.hr * 2 + 10, groundTop - P.rMax - 8), waterTop + P.hr * 2, groundTop - P.rMax) };
  }
  reach(x, y) { const m = this.mouthPos(); return Math.hypot(x - m.x, y - m.y) < this.P.hr * 1.1 + 8 || this.headHit(x, y); }
  eatReach(x, y) { const m = this.mouthPos(); return Math.hypot(m.x - x, m.y - y) < this.P.hr * 0.9 + 4; }
  defendFx(m) { for (let i = 0; i < 12; i++) addBubble(m.x + rand(-6, 6), m.y + rand(-4, 4), randi(0, 3)); sfx('splash', { gap: 0 }); }
  sparkPoint() { const c = this.headCenter(), r = this.P.hr * 1.5; return { x: c.x + rand(-r, r), y: c.y + rand(-r, r) }; }
  // ---- caça: só com o modo caçador ligado (ou quando mandam caçar) ----
  canHunt() { return (!!this.s.hunt || this.huntNow > 0) && !GAME_ACTIVE(); }
  isPrey(f) { if (!f || !fish.includes(f)) return false; if (f.school) return true; return this.s.stage >= 3 && !['lionfish', 'parrot', 'snapper'].includes(f.key); }
  preyOk() { return true; }
  scaresPrey() { return this.s.stage >= 2; }
  pickPrey() {
    const R = { baby: 110, young: 170, teen: 320, adult: 420 }[this.key] || 200; let best = null, bd = R;
    for (const f of fish) { if (f.x < 0 || f.x > W || !this.isPrey(f) || !this.preyOk(f)) continue; const d = Math.hypot(f.x - this.hx, f.y - this.hy); if (d < bd) { bd = d; best = f; } }
    return best;
  }
  huntCatch(f) { const m = this.mouthPos(); return Math.hypot(f.x - m.x, f.y - m.y) < this.P.hr * 0.9 + 5; }
  huntFx() { sfx('bite'); }
  eatPrey(f) {
    fish = fish.filter(o => o !== f); if (f.school) f.school.members = f.school.members.filter(o => o !== f);
    respawnQ.push({ key: f.key, school: f.school, t: rand(20, 35) });
    const s = this.s, F = FOODS.live; s.fome = Math.min(100, s.fome + F.fome); s.alegria = Math.min(100, s.alegria + 3); s.growth += F.grow; s.meals++;
    this.state = 'eat'; this.eatT = 0.9; this.fullSay = s.fome >= 97;
    const m = this.mouthPos(); for (let k = 0; k < 6; k++) addBubble(m.x + rand(-4, 4), m.y + rand(-3, 3), randi(0, 2));
    this.huntFx(m); statInc('hunts'); statInc('meals'); if (this.fullSay) statInc('full'); if (chance(0.35)) this.say('Nham!', 1.4);
  }
  updateBody() { }
  drawBody() { }
  glowBody() { }
  wearAnchors() { return {}; }
  placeAt(x, y) { const dx = x - this.hx, dy = y - this.hy; this.hx = x; this.hy = y; if (this.pts) for (const p of this.pts) { p.x += dx; p.y += dy; } if (this.hangTents) this.hangTents(); }
  inNest() { return this.s.stage === 0 || ((this.key === 'baby' || this.key === 'young') && this.restW > 0.6); }
  // ---- posições derivadas ----
  mouthPos() { const o = this.mouthOff(); return { x: this.hx + o.x * this.dir, y: this.hy + this.hop + o.y }; }
  headCenter() { const o = this.headOff(); return { x: this.hx + o.x * this.dir, y: this.hy + this.hop + o.y }; }
  headHit(x, y) { if (!this.P) return false; const c = this.headCenter(), m = this.mouthPos(); return Math.hypot(x - c.x, y - c.y) < this.hitRadius() || Math.hypot(x - m.x, y - m.y) < this.P.hr * 0.8; }
  eggHit(x, y) { const n = this.nestPos(); return Math.abs(x - n.x) < (this.spec ? 12 : 28) && y > n.y - 24 && y < n.y + 6; }
  canReachMouth(x, y) { if (!this.P || this.state === 'evolve') return false; return this.reach(x, y); }
  asleep() { return this.state === 'sleep'; }
  wake() { if (this.state === 'sleep') { this.state = 'idle'; this.restTarget = false; } this.wakeT = 25; }
  // ---- interações ----
  tapEgg() {
    if (this.state === 'hatch') return;
    this.s.taps++; this.eggWob = 0.6; sfx('crack', { gap: 0 });
    for (let k = 0; k < 5; k++) spark(this.hx + rand(-6, 6), this.hy - rand(4, 16), { vy: rand(-14, -4), l: 0.7, m: 0.7, gold: true });
    if (this.s.taps >= 3) { this.state = 'hatch'; this.st = 1.3; }
  }
  hatch() {
    const n = this.nestPos(), sp = this.spec;
    for (let k = 0; k < 14; k++) this.fx.push({ k: 'shell', x: n.x + rand(-5, 5), y: n.y - 10 + rand(-5, 5), vx: rand(-30, 30), vy: rand(-45, -15), l: 1.4, c: sp.shellC });
    for (let k = 0; k < 24; k++) spark(n.x + rand(-8, 8), n.y - 10, { vx: rand(-25, 25), vy: rand(-35, -5), l: rand(0.6, 1.3), m: 1.3, gold: true });
    this.s.stage = 1; this.s.growth = 0; this.s.fome = 70; this.s.alegria = 90; this.s.energia = 90;
    this.setupStage(true); this.state = 'idle'; this.happyT = 2.5; this.hop = -6;
    this.banner = ['Nasceu!', 'Um bebê ' + sp.baby]; this.bannerT = 4; sfx('hatch');
    if (META) { META.stats.hatched[this.s.species] = 1; META.stats.maxStage = Math.max(META.stats.maxStage, 1); saveMeta(); pediaFind('pet_' + this.s.species); checkAch(); }
    setTimeout(() => { if (pet === this) this.say('Oi!', 2); }, 900);
    savePetState();
    setTimeout(() => askPetName(), 1500);
    if (!(this.s.hints & 2)) setTimeout(() => this.showHint('Arraste comida da bandeja até a boca', 2), 6000);
  }
  boop() {
    if (this.boopT > 0) return; this.boopT = 0.7;
    if (this.state === 'sleep') { this.wake(); this.expr = 1; this.happyT = 0.6; return; }
    this.wakeT = 25; this.happyT = 1.2; this.hop = -Math.min(8, this.P.hr * 0.5); this.s.alegria = Math.min(100, this.s.alegria + 2); sfx('boop');
    const c = this.headCenter(); for (let k = 0; k < 2; k++) this.fx.push({ k: 'heart', x: c.x + rand(-4, 4), y: c.y - this.P.hr, vx: rand(-4, 4), vy: -12, l: 1.4 });
  }
  refuse() { this.state = 'refuse'; this.st = 1.5; this.shake = 1.2; this.say(FULL_LINE, 2.6); sfx('full'); }
  feed(kind) {
    const s = this.s, F = FOODS[kind];
    if (this.state === 'sleep') this.wake();
    if (s.fome >= 97 && kind !== 'pearl') { this.refuse(); return false; }
    s.fome = Math.min(100, s.fome + F.fome); s.alegria = Math.min(100, s.alegria + F.alegria); s.energia = Math.min(100, s.energia + F.energia);
    s.growth += F.grow; s.meals++;
    this.state = 'eat'; this.eatT = 1.1; this.wakeT = 25; this.fullSay = s.fome >= 97;
    sfx(kind === 'pearl' ? 'pearl' : 'bite', { gap: 0 }); statInc('meals'); if (kind === 'pearl') statInc('pearls'); if (this.fullSay) statInc('full');
    const m = this.mouthPos();
    for (let k = 0; k < 5; k++) this.fx.push({ k: 'crumb', x: m.x, y: m.y, vx: rand(-10, 10), vy: rand(-8, 4), l: 0.8, c: kind === 'grape' ? '#78d85a' : kind === 'pearl' ? '#f4eefa' : '#e8a070' });
    if (kind === 'shrimp' || kind === 'pearl' || s.alegria > 85) for (let k = 0; k < (kind === 'pearl' ? 5 : 2); k++) this.fx.push({ k: 'heart', x: m.x + rand(-6, 6), y: m.y - 6, vx: rand(-6, 6), vy: rand(-16, -8), l: 1.6 });
    if (kind === 'pearl') for (let k = 0; k < 16; k++) spark(m.x + rand(-8, 8), m.y + rand(-8, 8), { vx: rand(-20, 20), vy: rand(-20, 10), l: 1.2, m: 1.2 });
    if (s.meals >= 3 && !(s.hints & 8)) setTimeout(() => { if (pet === this && !(this.s.hints & 8)) this.showHint('Clique no cabide do painel para vestir ' + petName(), 8); }, 3000);
    savePetState();
    return true;
  }
  bubble(kind) { this.bubbleKind = kind; this.bubbleShow = 2.6; }
  startEvolve() { this.state = 'evolve'; this.evolveT = 0; this.swapped = false; sfx('evolve'); }
  // ---- ciclo ----
  update(dt) {
    const s = this.s, spd = PET_SPEEDS[s.speed || 0];
    this.t += dt; this.boopT -= dt; this.happyT -= dt; this.wakeT -= dt; this.bannerT -= dt; this.hintT -= dt; this.speechT -= dt; this.shake = Math.max(0, this.shake - dt); this.eggWob = Math.max(0, this.eggWob - dt); this.defendCD -= dt;
    this.hop *= Math.pow(0.02, dt);
    for (const f of this.fx) { f.l -= dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.k === 'shell' || f.k === 'crumb') f.vy += 60 * dt; if (f.k === 'heart' || f.k === 'z') f.vx *= 0.98; }
    this.fx = this.fx.filter(f => f.l > 0);
    for (const r of respawnQ) r.t -= dt;
    const due = respawnQ.filter(r => r.t <= 0); respawnQ = respawnQ.filter(r => r.t > 0);
    for (const r of due) { const f = new Fish(r.key, r.school); f.x = chance(0.5) ? -20 : W + 20; f.y = r.school ? (r.school.cy || H * 0.4) : rand(waterTop + 30, groundTop - 30); if (r.school) r.school.members.push(f); fish.unshift(f); }
    for (const f of petFoods) f.update(dt);
    petFoods = petFoods.filter(f => !f.dead);
    if (s.stage === 0) {
      if (this.state === 'hatch') { this.st -= dt; this.eggWob = 0.3; if (this.st <= 0) this.hatch(); }
      const n = this.nestPos(); this.hx = n.x; this.hy = n.y; return;
    }
    // necessidades
    const sleeping = this.state === 'sleep';
    s.fome = clamp(s.fome - RATE.fome * dt * spd, 0, 100);
    s.alegria = clamp(s.alegria - RATE.alegria * dt * spd * (s.fome < 20 ? 2 : 1), 0, 100);
    s.energia = clamp(s.energia + (sleeping ? RATE.rest : -RATE.tire * (this.state === 'play' ? 3 : 1)) * dt * spd, 0, 100);
    if (s.fome > 35 && s.alegria > 30) s.growth += RATE.grow * dt * spd * (sleeping ? 0.6 : 1);
    if (s.stage < 4 && s.growth >= PET_GROW[s.stage + 1] && this.state !== 'evolve' && this.state !== 'eat' && !drag.item && !this.posing && !GAME_ACTIVE()) this.startEvolve();
    if ((this.saveT -= dt) < 0) { this.saveT = 12; savePetState(); }
    this.think(dt);
    this.move(dt);
    this.updateBody(dt);
    // carinho
    const over = mouse.seen && mouse.active > 0.5 && this.headHit(mouse.x, mouse.y) && !drag.item;
    if (over && mouse.speed > 2 && mouse.speed < 70 && this.state !== 'sleep') {
      this.petting += dt; if (this.petting > 0.25) { this.happyT = 0.4; s.alegria = Math.min(100, s.alegria + dt * 4); this.wakeT = 25; if ((this.heartT -= dt) < 0) { this.heartT = 0.35; const c = this.headCenter(); this.fx.push({ k: 'heart', x: c.x + rand(-6, 6), y: c.y - this.P.hr * 0.8, vx: rand(-5, 5), vy: rand(-16, -8), l: 1.3 }); } }
      if (!(s.hints & 4) && this.petting > 1.5) this.s.hints |= 4;
      if (this.petting > 0.25 && !this.purring) { this.purring = true; sndPurr(true, this.s.species); if (META && !META.ach.owl) { const h = new Date().getHours(); if (h < 5) statInc('owl'); } }
    } else this.petting = 0;
    if (this.purring && this.petting <= 0.25) { this.purring = false; sndPurr(false); }
    // pensamentos (balão com ícone) — só quando não está falando
    if ((this.bubbleT -= dt) < 0 && this.state !== 'sleep' && this.state !== 'eat' && this.speechT <= 0) { this.bubbleT = rand(7, 12); if (s.fome < 30) this.bubble('food'); else if (s.alegria < 25) this.bubble('love'); else if (s.energia < 15) this.bubble('sleep'); }
    this.bubbleShow = (this.bubbleShow || 0) - dt;
    if (this.state === 'sleep' && Math.random() < dt * 0.9) { const c = this.headCenter(); this.fx.push({ k: 'z', x: c.x + this.dir * this.P.hr * 0.6, y: c.y - this.P.hr * 0.6, vx: this.dir * 3, vy: -7, l: 2.2 }); }
    if (this.state === 'sleep' && (this.peekCD -= dt) < 0) { this.peekCD = rand(30, 60); this.peekT = 3; }
    this.peekT -= dt;
    // expressão
    let e = 0;
    const m = this.mouthPos(), dragNear = drag.item && Math.hypot(mouse.x - m.x, mouse.y - m.y) < this.P.hr * 3 + 20;
    if (this.state === 'sleep') e = this.peekT > 0 ? 0 : 4;
    else if (this.state === 'eat') e = (Math.floor(this.t * 8) % 2) ? 3 : 2;
    else if (this.state === 'refuse') e = 2;
    else if (this.state === 'evolve') e = 2;
    else if (this.happyT > 0) e = 2;
    else if (dragNear && s.fome < 97) e = 3;
    else if (s.fome < 15 || s.alegria < 22) e = 5;
    else { this.blinkT -= dt; if (this.blinkT < 0) this.blinkT = rand(2.5, 5); if (this.blinkT < 0.14 || (s.energia < 18 && Math.sin(this.t * 0.8) > 0.4)) e = 1; }
    this.expr = e;
  }
  think(dt) {
    const s = this.s, P = this.P, k = this.key;
    this.face = 0; this.spMul = 1; this.restTarget = false;
    const hold = () => { this.tx = this.hx; this.ty = this.hy; };
    if (this.state === 'evolve') {
      hold(); this.evolveT += dt;
      if (Math.random() < dt * 30) { const p = this.sparkPoint(); spark(p.x, p.y, { vx: rand(-10, 10), vy: rand(-20, -5), l: 1, m: 1, gold: chance(0.4) }); }
      if (this.evolveT > 1.7 && !this.swapped) { this.swapped = true; s.stage++; this.setupStage(false); this.banner = [petName() + ' cresceu!', 'Agora: ' + PET_LABEL[s.stage]]; this.bannerT = 4.5; savePetState(); if (META) { META.stats.maxStage = Math.max(META.stats.maxStage, s.stage); saveMeta(); checkAch(); } }
      if (this.evolveT > 3.2) { this.state = 'idle'; this.happyT = 2; this.say('Cresci!', 2.2); }
      return;
    }
    if (this.state === 'eat') { hold(); this.eatT -= dt; if (this.eatT <= 0) { this.state = 'idle'; if (this.fullSay) { this.fullSay = false; this.happyT = 2; this.say(FULL_LINE, 2.6); sfx('full'); } } return; }
    if (this.state === 'refuse') { hold(); this.st -= dt; if (this.st <= 0) this.state = 'idle'; return; }
    const userActive = mouse.seen && (T - mouse.last) < 20;
    // minijogo que controla o bichinho (Chuva de tesouros)
    if (GAME_ACTIVE() && GAME.ctl) { const c = GAME.ctl(this); this.tx = c.x; this.ty = c.y; this.spMul = c.sp || 2.2; this.face = c.face || 0; this.wakeT = 25; if (this.state === 'sleep' || this.state === 'hunt') this.state = 'idle'; return; }
    // posando para o guarda-roupa
    if (this.posing > 0) {
      const p = this.posePos(); this.wakeT = 25; this.state = 'idle';
      if (Math.hypot(p.x - this.hx, p.y - this.hy) < 14) { this.face = this.dir; this.spMul = 0.4; this.tx = p.x; this.ty = p.y + Math.sin(this.t * 1.3) * 3; }
      else { this.tx = p.x; this.ty = p.y; this.spMul = 1.5; }
      return;
    }
    // dormir
    if (this.state === 'sleep') {
      this.restTarget = true; const rp = this.restHead(); this.tx = rp.x; this.ty = rp.y; this.face = rp.face || 1; this.spMul = 0.6;
      if (s.energia >= 99 && !petNight()) this.state = 'idle';
      return;
    }
    if (s.energia < 10 || (petNight() && !userActive && this.wakeT <= 0 && s.energia < 92)) { this.state = 'sleep'; return; }
    // defender o aquário do kraken (adolescente em diante)
    if (s.stage >= 3) {
      const kr = passers.find(p => p.kind === 'kraken' && p.arms.some(a => a.p > 0.3 && !a.sink));
      if (kr) {
        const arm = kr.arms.filter(a => a.p > 0.3 && !a.sink).sort((a, b) => b.p - a.p)[0], tip = arm.pts[Math.floor(arm.pts.length * 0.7)];
        const o = this.mouthOff(), d = tip.x >= this.hx ? 1 : -1;
        this.tx = tip.x - o.x * d; this.ty = tip.y - o.y; this.spMul = 2; this.state = 'defend';
        const m = this.mouthPos();
        if (Math.hypot(m.x - tip.x, m.y - tip.y) < P.hr * 2.5 + 6 && this.defendCD <= 0) {
          this.defendCD = 1.5; arm.sink = true; this.happyT = 1; s.alegria = Math.min(100, s.alegria + 6);
          this.defendFx(m, tip);
          if (kr.arms.every(a => a.sink || a.p < 0.2) && !kr.counted) { kr.counted = true; toast(petName() + ' espantou o kraken!', 2600); statInc('kraken'); }
        }
        return;
      }
    }
    if (this.state === 'defend') this.state = 'idle';
    // comida sendo arrastada
    if (drag.item && (s.fome < 97 || drag.item.kind === 'pearl')) {
      const d = this.dir = mouse.x >= this.hx ? 1 : -1, o = this.mouthOff();
      this.tx = mouse.x - o.x * d - d * 3; this.ty = mouse.y - o.y; this.face = d; this.spMul = 1.4; this.wakeT = 25; this.state = 'idle';
      return;
    }
    if (drag.item && s.fome >= 97) { const m = this.mouthPos(); if (Math.hypot(mouse.x - m.x, mouse.y - m.y) < P.hr * 2 + 10 && this.state !== 'refuse') this.refuse(); }
    // comida boiando
    if (petFoods.length && s.fome < 90) {
      let best = null, bd = 260; for (const f of petFoods) { const d = Math.hypot(f.x - this.hx, f.y - this.hy); if (d < bd) { bd = d; best = f; } }
      if (best) {
        const o = this.mouthOff(); this.face = best.x >= this.hx ? 1 : -1; this.tx = best.x - o.x * this.face; this.ty = best.y - o.y; this.spMul = 1.3;
        if (this.eatReach(best.x, best.y)) { best.dead = true; this.feed(best.kind); }
        return;
      }
    }
    // caçar peixinhos (só com o modo caçador ligado, ou quando mandam)
    if (this.canHunt() && s.energia > 12) {
      this.huntCD -= dt;
      if (this.huntNow > 0 && s.fome >= 97) { this.huntNow = 0; this.refuse(); return; }
      if (this.prey && !this.isPrey(this.prey)) this.prey = null;
      if ((this.huntNow > 0 || s.fome < 75) && this.huntCD <= 0) {
        if (!this.prey) { this.prey = this.pickPrey(); this.huntT = 0; if (!this.prey && this.huntNow > 0) { this.huntNow = 0; this.say('Nenhum peixinho...', 1.8); } }
        const f = this.prey;
        if (f) {
          this.huntT += dt; if (this.scaresPrey()) f.pred = { x: this.hx, y: this.hy, t: 0.5 };   // bebês ninguém leva a sério
          const o = this.mouthOff(), d = f.x >= this.hx ? 1 : -1;
          this.tx = f.x + f.vx * 0.25 - o.x * d; this.ty = f.y + f.vy * 0.25 - o.y; this.face = d; this.spMul = this.key === 'baby' ? 1.7 : 2.2; this.state = 'hunt'; this.wakeT = 25;
          if (this.huntCatch(f)) { this.eatPrey(f); this.prey = null; this.huntCD = rand(3, 7); this.huntNow = 0; return; }
          if (this.huntT > 10) { this.prey = null; this.huntCD = rand(10, 16); this.huntNow = 0; this.huntMiss = (this.huntMiss || 0) + 1; if (chance(0.6)) this.say('Escapou...', 1.6); }
          return;
        }
      }
    }
    if (this.state === 'hunt') this.state = 'idle';
    // carinho: fica paradinha curtindo
    if (this.petting > 0.25) { hold(); return; }
    // brincar: segue o cursor em volta
    const md = Math.hypot(mouse.x - this.hx, mouse.y - this.hy);
    if (mouse.seen && mouse.active > 0.8 && (T - mouse.last) < 1.2 && mouse.speed > 14 && md < 150 + P.hr * 2 && s.energia > 20 && s.fome > 12) {
      const p = this.playTarget(); this.tx = p.x; this.ty = p.y; this.spMul = 1.4; this.state = 'play';
      s.alegria = Math.min(100, s.alegria + dt * 0.9); this.wakeT = 25; return;
    }
    if (this.state === 'play') this.state = 'idle';
    // grandes descansam de tempos em tempos
    if (k === 'teen' || k === 'adult') {
      this.restT -= dt;
      if (this.restT < 0) { this.resting = !this.resting; this.restT = this.resting ? rand(k === 'adult' ? 50 : 25, k === 'adult' ? 90 : 45) : rand(35, 65); }
      if (this.resting) { this.restTarget = true; const rp = this.restHead(); this.tx = rp.x; this.ty = rp.y; this.face = rp.face || 1; this.spMul = 0.6; return; }
    }
    // passeio
    this.wt -= dt;
    if (this.wt < 0 || Math.hypot(this.tx - this.hx, this.ty - this.hy) < 6) { this.wt = rand(4, 9); const w = this.wanderTarget(); this.tx = w.x; this.ty = w.y; }
  }
  // nado livre (a serpente usa este; medusa e ermitão têm o seu)
  move(dt) {
    const P = this.P, dx = this.tx - this.hx, dy = this.ty - this.hy, d = Math.hypot(dx, dy) || 1;
    const ds = Math.min(P.speed * this.spMul, d * 2.2), k = Math.min(1, dt * 3);
    this.vx += (dx / d * ds - this.vx) * k; this.vy += (dy / d * ds - this.vy) * k;
    if (this.shake > 0) this.vx += Math.sin(this.t * 30) * 20 * dt * 10;
    this.hx += this.vx * dt; this.hy += this.vy * dt;
    this.hx = clamp(this.hx, -30, W + 30); this.hy = clamp(this.hy, waterTop + P.hr + 4, groundTop + 2);
    if (this.face) this.dir = this.face; else if (this.vx > 3) this.dir = 1; else if (this.vx < -3) this.dir = -1;
  }
  // ---- desenho ----
  draw() {
    const n = this.nestPos(), nest = sheet('petNest');
    drawSprite(nest, 0, n.x, n.y, 1);
    if (this.s.stage === 0) {
      const sp = this.spec;
      if (sp && (this.state !== 'hatch' || this.st > 0.1)) { const wob = Math.sin(this.t * 18) * (this.eggWob > 0 ? 1.5 : 0) + Math.sin(this.t * 1.2) * 0.3; drawSprite(sheet(sp.egg), Math.min(2, this.s.taps), n.x + wob, n.y + 1, 1); }
      drawSprite(nest, 1, n.x, n.y, 1);
      if (!sp) drawText('?', n.x + 1, n.y - 20 + Math.round(Math.sin(this.t * 2.5) * 1.5), '#fff1a8', 'center', 0.55 + 0.35 * Math.sin(this.t * 3));
      this.drawFx(); return;
    }
    if (!this.inNest()) drawSprite(nest, 1, n.x, n.y, 1);
    this.drawBody(ctx);
    if (this.inNest()) drawSprite(nest, 1, n.x, n.y, 1);
    this.drawFx();
  }
  drawFx() {
    for (const f of this.fx) {
      const a = clamp(f.l, 0, 1);
      if (f.k === 'heart') { ctx.globalAlpha = a; ctx.drawImage(ICONS.heartS, Math.round(f.x - 2), Math.round(f.y - 2)); }
      else if (f.k === 'crumb') { ctx.globalAlpha = a; ctx.fillStyle = f.c; ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1); }
      else if (f.k === 'shell') { ctx.globalAlpha = a; ctx.fillStyle = f.c || '#bff6ea'; ctx.fillRect(Math.round(f.x), Math.round(f.y), 2, 2); ctx.fillStyle = '#fff4d8'; ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1); }
    }
    ctx.globalAlpha = 1;
  }
  glow(a) {
    if (this.s.stage === 0) { if (!this.spec) return; const n = this.nestPos(); ctx.globalAlpha = 0.25 + a * 0.5; ctx.drawImage(glowSprite(this.spec.eggGlow, 16), n.x - 16, n.y - 12 - 16); ctx.globalAlpha = 1; return; }
    this.glowBody(a);
  }
  drawUI() {
    // letrinhas de sono
    for (const f of this.fx) if (f.k === 'z') drawText('z', f.x, f.y, '#dff4ff', 'left', clamp(f.l / 2.2, 0, 1) * 0.9);
    if (this.s.stage > 0 && this.speechT > 0 && this.speech) this.drawSpeech();
    else if (this.s.stage > 0 && this.bubbleShow > 0) {   // balão de pensamento
      const c = this.headCenter(), bx = Math.round(c.x + this.dir * this.P.hr * 0.4), by = Math.round(c.y - this.P.hr - 16);
      ctx.fillStyle = '#f4fbff'; ctx.fillRect(bx - 8, by - 6, 16, 12); ctx.fillRect(bx - 9, by - 5, 18, 10); ctx.fillRect(bx - 1, by + 7, 2, 2); ctx.fillRect(bx - 3 * this.dir, by + 10, 1, 1);
      ctx.fillStyle = '#9ab8d0'; ctx.fillRect(bx - 8, by + 6, 16, 1);
      const ic = this.bubbleKind === 'food' ? ICONS.fish : this.bubbleKind === 'love' ? ICONS.heart : this.bubbleKind === 'sleep' ? ICONS.zz : null;
      if (ic) ctx.drawImage(ic, bx - Math.floor(ic.width / 2), by - Math.floor(ic.height / 2));
    }
    if (this.bannerT > 0 && this.banner) {
      const a = clamp(Math.min(this.bannerT, 4.5 - this.bannerT) * 2, 0, 1);
      const by = Math.round(H * 0.3);
      ctx.globalAlpha = a * 0.55; ctx.fillStyle = '#06182e'; ctx.fillRect(Math.round(W / 2 - 90), by - 6, 180, 30); ctx.globalAlpha = 1;
      drawText(this.banner[0], W / 2, by, '#fff1a8', 'center', a); drawText(this.banner[1], W / 2, by + 11, '#9ff4ff', 'center', a);
    }
    if (this.hintT > 0 && this.hint) {
      const a = clamp(Math.min(this.hintT, 9 - this.hintT), 0, 1), y = H - 38;
      const tw = this.hint.length * 6 + 10; ctx.globalAlpha = a * 0.7; ctx.fillStyle = '#06182e'; ctx.fillRect(Math.round(W / 2 - tw / 2), y - 3, tw, 12); ctx.globalAlpha = 1;
      drawText(this.hint, W / 2, y, '#fff1a8', 'center', a);
    }
  }
  // balão de fala com texto (ex.: "Buxin chei!")
  drawSpeech() {
    const a = clamp(this.speechT * 4, 0, 1), tc = textCanvas(this.speech, '#23304a', null, true), c = this.headCenter();
    const w = tc.width + 7, h = 15, pop = this.speechT > 2.4 ? 1 : 0;
    const bx = Math.round(clamp(c.x + this.dir * this.P.hr * 0.3 - w / 2, 2, W - w - 2)), by = Math.round(Math.max(waterTop + 3, c.y - this.P.hr - 9 - h) - pop);
    const tx = Math.round(clamp(c.x + this.dir * this.P.hr * 0.2, bx + 4, bx + w - 5));
    ctx.globalAlpha = a;
    ctx.fillStyle = '#1a2a44'; ctx.fillRect(bx, by - 1, w, h + 2); ctx.fillRect(bx - 1, by, w + 2, h); ctx.fillRect(tx - 3, by + h, 6, 2); ctx.fillRect(tx - 2, by + h + 2, 4, 1); ctx.fillRect(tx - 1, by + h + 3, 2, 1);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, w, h); ctx.fillRect(tx - 2, by + h, 4, 1); ctx.fillRect(tx - 1, by + h + 1, 2, 2);
    ctx.fillStyle = '#d8ecfa'; ctx.fillRect(bx, by + h - 1, w, 1);
    ctx.drawImage(tc, bx + 4, by + 1);
    ctx.globalAlpha = 1;
  }
}

// comida solta na água (o bichinho vai buscar)
class PetFood {
  constructor(kind, x, y) { this.kind = kind; this.x = x; this.y = y; this.vy = 2; this.l = 30; this.dead = false; this.ph = rand(TAU); }
  update(dt) { this.vy += (5 - this.vy) * Math.min(1, dt); this.y = Math.min(this.y + this.vy * dt, gy(this.x) - 3); this.x += Math.sin(T * 2 + this.ph) * dt * 3; if ((this.l -= dt) < 0) this.dead = true; }
  draw() { drawSprite(foodSheet(this.kind), 0, this.x, this.y, 1); }
}

// ---------------- painel (HUD) e bandeja ----------------
function hudAlpha() { if (!pet) return 0; const s = pet.s, need = s.stage > 0 && (s.fome < 30 || s.alegria < 25 || s.energia < 15); const act = mouse.seen && (T - mouse.last) < 6; return act || need || drag.item || !s.species ? 1 : 0.4; }
const HUD = { x: 4, y: 4, w: 128 };
function hudRect() { const min = pet.s.hudMin || pet.s.stage === 0; return { x: HUD.x, y: HUD.y, w: HUD.w, h: min ? 22 : 54 }; }
function trayRect() { const w = 4 * 22 + 6; return { x: Math.round(W / 2 - w / 2), y: H - 26, w, h: 23 }; }
function trayHit(x, y) { if (!pet || pet.s.stage === 0 || !pet.s.hud || GAME_ACTIVE()) return -1; const r = trayRect(); if (y < r.y || y > r.y + r.h || x < r.x || x > r.x + r.w) return -1; const i = Math.floor((x - r.x - 3) / 22); return i >= 0 && i < 4 ? i : -1; }
function hudHit(x, y) { if (!pet || !pet.s.hud) return false; const r = hudRect(); return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
function bar(x, y, w, v, col, icon) {
  ctx.drawImage(icon, x, y - Math.floor((icon.height - 5) / 2));
  const bx = x + 10; ctx.fillStyle = '#04101e'; ctx.fillRect(bx - 1, y - 1, w + 2, 7); ctx.fillStyle = '#16304a'; ctx.fillRect(bx, y, w, 5);
  const f = Math.round(w * clamp(v, 0, 100) / 100); ctx.fillStyle = col; ctx.fillRect(bx, y, f, 5); ctx.fillStyle = '#ffffff55'; ctx.fillRect(bx, y, f, 1);
  if (v < 25) { ctx.fillStyle = (Math.floor(T * 3) & 1) ? '#ff4a5a' : col; ctx.fillRect(bx, y, Math.max(1, f), 5); }
}
function drawPetHUD() {
  if (!pet || !pet.s.hud) { if (pet) drawDragItem(); return; }
  const s = pet.s, a = hudAlpha(), r = hudRect();
  ctx.globalAlpha = 0.72 * a; ctx.fillStyle = '#071a30'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.globalAlpha = a;
  ctx.fillStyle = '#4f9cc4'; ctx.fillRect(r.x, r.y, r.w, 1); ctx.fillRect(r.x, r.y + r.h - 1, r.w, 1); ctx.fillRect(r.x, r.y, 1, r.h); ctx.fillRect(r.x + r.w - 1, r.y, 1, r.h);
  drawText(!s.species ? 'Ninho vazio' : s.stage === 0 ? 'Ovo misterioso' : (s.name || '...'), r.x + 4, r.y + 3, '#ffffff', 'left', a);
  ctx.drawImage(ICONS.gear, r.x + r.w - 10, r.y + 3);
  if (s.stage > 0) ctx.drawImage(ICONS.hanger, r.x + r.w - 20, r.y + 3);
  ctx.drawImage(ICONS.book, r.x + r.w - 30, r.y + 3); ctx.drawImage(ICONS.pad, r.x + r.w - 41, r.y + 4); ctx.drawImage(SND.level ? ICONS.sndOn : ICONS.sndOff, r.x + r.w - 50, r.y + 3);
  if (s.hunt && s.stage > 0) ctx.drawImage(ICONS.hunt, r.x + r.w - 10, r.y + 12);
  if (!s.species) drawText('Escolha a espécie', r.x + 4, r.y + 12, (Math.floor(T * 2) & 1) ? '#fff1a8' : '#9ff4ff', 'left', a);
  else if (s.stage === 0) drawText('Toques: ' + s.taps + '/3', r.x + 4, r.y + 12, '#9ff4ff', 'left', a);
  else {
    const next = s.stage < 4 ? clamp((s.growth - PET_GROW[s.stage]) / (PET_GROW[s.stage + 1] - PET_GROW[s.stage]), 0, 1) : 1;
    drawText(PET_LABEL[s.stage] + (s.stage < 4 ? ' ' + Math.floor(next * 100) + '%' : ''), r.x + 4, r.y + 12, '#9ff4ff', 'left', a);
    if (!s.hudMin) {
      bar(r.x + 4, r.y + 22, 58, s.fome, '#ff9a3a', ICONS.fish);
      bar(r.x + 4, r.y + 30, 58, s.alegria, '#ff6fa8', ICONS.heart);
      bar(r.x + 4, r.y + 38, 58, s.energia, '#ffe04a', ICONS.bolt);
      bar(r.x + 4, r.y + 46, 58, next * 100, '#6ff0ff', ICONS.star);
      drawText(pet.state === 'sleep' ? 'dormindo' : s.fome >= 97 ? 'cheinho' : s.fome < 30 ? 'com fome' : s.alegria < 25 ? 'carente' : s.energia < 15 ? 'cansado' : 'contente', r.x + 76, r.y + 30, '#cfe6f6', 'left', a * 0.9);
    }
  }
  ctx.globalAlpha = 1;
  drawCoinBox(a);
  // bandeja de comida
  if (s.stage > 0 && !GAME_ACTIVE()) {
    const t = trayRect(), hov = trayHit(mouse.x, mouse.y);
    ctx.globalAlpha = 0.72 * a; ctx.fillStyle = '#071a30'; ctx.fillRect(t.x, t.y, t.w, t.h); ctx.globalAlpha = a;
    ctx.fillStyle = '#4f9cc4'; ctx.fillRect(t.x, t.y, t.w, 1); ctx.fillRect(t.x, t.y + t.h - 1, t.w, 1); ctx.fillRect(t.x, t.y, 1, t.h); ctx.fillRect(t.x + t.w - 1, t.y, 1, t.h);
    TRAY.forEach((k, i) => {
      const sx = t.x + 3 + i * 22, sy = t.y + 2;
      ctx.fillStyle = i === hov ? '#24507a' : '#102a46'; ctx.fillRect(sx, sy, 20, 19);
      const sh = foodSheet(k), empty = k === 'pearl' && s.pearls <= 0;
      ctx.globalAlpha = a * (empty ? 0.3 : 1); drawSprite(sh, 0, sx + 10, sy + 9.5, 1); ctx.globalAlpha = a;
      if (k === 'pearl') drawText(String(s.pearls), sx + 15, sy + 12, '#ffffff', 'left', a);
    });
    if (hov >= 0) { const k = TRAY[hov], label = FOODS[k].name + (k === 'pearl' ? ' (' + s.pearls + ')' : ''); drawText(label, t.x + t.w / 2, t.y - 10, '#fff1a8', 'center', 1); }
    ctx.globalAlpha = 1;
  }
  drawDragItem();
}
function drawDragItem() {
  const it = drag.item; if (!it) return;
  const bob = Math.sin(T * 8) * 1;
  if (it.kind === 'live') drawSprite(it.sh, Math.floor(T * 14), mouse.x, mouse.y + bob, pet && pet.hx < mouse.x ? -1 : 1);
  else drawSprite(foodSheet(it.kind), 0, mouse.x, mouse.y + bob, 1);
}

// ---------------- mouse: arrastar comida, tocar no ovo, carinho ----------------
function petMouseDown(x, y) {
  if (!pet) return false;
  if (hudHit(x, y)) {
    const r = hudRect();
    const bx = x - (r.x + r.w);
    if (y < r.y + 12 && bx > -13) petOptions();
    else if (y < r.y + 12 && bx > -23 && pet.s.stage > 0) openWardrobe();
    else if (y < r.y + 12 && bx > -33 && bx <= -23) openPedia();
    else if (y < r.y + 12 && bx > -43 && bx <= -33) openGames();
    else if (y < r.y + 12 && bx > -53 && bx <= -43) sndToggle();
    else if (!pet.s.species) askSpecies();
    else if (pet.s.stage > 0) pet.s.hudMin = !pet.s.hudMin;
    return true;
  }
  if (pet.s.hud) { const b = coinBoxRect(); if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { openGames(); return true; } }
  const ti = trayHit(x, y);
  if (ti >= 0) { const k = TRAY[ti]; if (k === 'pearl' && pet.s.pearls <= 0) { toast('Sem pérolas: toque no marisco-gigante para ganhar uma', 2600); return true; } drag.item = { kind: k }; return true; }
  if (pet.s.stage === 0) { if (pet.eggHit(x, y)) { if (pet.s.species) pet.tapEgg(); else askSpecies(); return true; } return false; }
  if (pet.headHit(x, y)) { pet.boop(); return true; }
  for (const f of fish) if (f.school && Math.abs(f.x - x) < f.sh.hw * 0.9 + 1.5 && Math.abs(f.y - y) < f.sh.hh + 2.5) {
    drag.item = { kind: 'live', key: f.key, school: f.school, sh: f.sh };
    fish = fish.filter(o => o !== f); f.school.members = f.school.members.filter(o => o !== f);
    return true;
  }
  return false;
}
function petMouseUp(x, y) {
  const it = drag.item; if (!it || !pet) return; drag.item = null;
  if (pet.s.stage > 0 && pet.canReachMouth(x, y)) {
    if (pet.feed(it.kind)) { if (it.kind === 'pearl') pet.s.pearls--; if (it.kind === 'live') respawnQ.push({ key: it.key, school: it.school, t: 25 }); return; }
  }
  if (it.kind === 'live') { const f = new Fish(it.key, it.school); f.x = x; f.y = y; f.scare = 1; it.school.members.push(f); fish.unshift(f); return; }
  if (it.kind === 'pearl') return;
  if (y < gy(x) - 4) petFoods.push(new PetFood(it.kind, x, y));
}
function petCursor(x, y) {
  if (drag.item) return 'grabbing';
  if (!pet) return '';
  if (trayHit(x, y) >= 0 || hudHit(x, y)) return 'pointer';
  if (pet.s.hud) { const b = coinBoxRect(); if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return 'pointer'; }
  if (pet.s.stage === 0 ? pet.eggHit(x, y) : pet.headHit(x, y)) return 'pointer';
  for (const f of fish) if (f.school && Math.abs(f.x - x) < f.sh.hw * 0.9 + 1.5 && Math.abs(f.y - y) < f.sh.hh + 2.5) return 'grab';
  return '';
}
function petGivePearl(x, y) {
  if (!pet || pet.s.stage === 0) return;
  const now = Date.now(); if (pet.s.pearls >= 3 || now - (pet.s.pearlT || 0) < 4 * 60 * 1000) return;
  pet.s.pearls++; pet.s.pearlT = now; savePetState();
  const t = trayRect(); for (let k = 0; k < 10; k++) spark(x + rand(-3, 3), y + rand(-3, 3), { vx: (t.x + t.w - 12 - x) * rand(0.6, 1), vy: (t.y - y) * rand(0.6, 1), l: 1, m: 1 });
  toast('Pérola guardada na bandeja!', 2200);
}

// ---------------- diálogos ----------------
function closeDialog() { if (typeof wardRevert === 'function') wardRevert(); document.querySelectorAll('.dlg').forEach(d => d.remove()); if (pet) pet.posing = 0; }
function dialog(html, wire, cls = '') {
  closeDialog(); const d = document.createElement('div'); d.className = 'dlg' + (cls === 'side' ? ' side' : '');
  d.innerHTML = '<div class="box' + (cls === 'wide' ? ' wide' : '') + '">' + html + '</div>'; document.body.appendChild(d); wire(d); return d;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function askPetName() {
  if (!pet || pet.s.stage === 0) return;
  const sug = pet.s.name || pick(PET_NAMES), sp = pet.spec;
  dialog(`<h2>Que nome vai ter?</h2><p>Seu bebê ${esc(sp ? sp.baby : 'bichinho')} acabou de nascer.</p><input id="pn" maxlength="12" value="${esc(sug)}"><div class="row"><button id="pr">Sortear</button><button id="ok" class="pri">Pronto</button></div>`, d => {
    const inp = d.querySelector('#pn'); setTimeout(() => { inp.focus(); inp.select(); }, 50);
    d.querySelector('#pr').onclick = () => { inp.value = pick(PET_NAMES); };
    const ok = () => { pet.s.name = (inp.value.trim() || sug).slice(0, 12); savePetState(); closeDialog(); toast('Olá, ' + pet.s.name + '!', 2200); };
    d.querySelector('#ok').onclick = ok; inp.onkeydown = e => { if (e.key === 'Enter') ok(); };
  });
}
// retrato do filhote de cada espécie (para a escolha no começo)
const portraitCache = {}, portraitCanvas = {};
function speciesPortrait(k) {
  if (portraitCache[k]) return portraitCache[k];
  const c = makeCanvas(64, 44), g = c.getContext('2d');
  try {
    const s = newPetState(k); s.preview = true;
    drawSprite(sheet(SPECIES[k].egg), 0, 14, 38, 1, g);
    s.stage = 1; const p = makePet(s); p.previewPose(40, 26); p.expr = 2; p.drawBody(g);
  } catch (e) { console.error('retrato', k, e); }
  portraitCanvas[k] = c; return portraitCache[k] = c.toDataURL();
}
function askSpecies() {
  if (!pet || pet.s.stage > 0 || !LAIR) return;
  const cards = SPECIES_ORDER.filter(k => SPECIES[k]).map(k => { const sp = SPECIES[k]; return `<button class="card" data-k="${k}"><img src="${speciesPortrait(k)}" alt=""><b>${esc(sp.name)}</b><span>${esc(sp.desc)}</span></button>`; }).join('');
  dialog(`<h2>Escolha seu bichinho</h2><p>Cada um nasce de um ovo diferente, cresce do seu jeito e vira um gigante do bem.</p><div class="cards">${cards}</div>`, d => {
    d.querySelectorAll('.card').forEach(b => { b.onclick = () => chooseSpecies(b.dataset.k); });
  }, 'wide');
}
function chooseSpecies(k) {
  if (!pet || !SPECIES[k]) return;
  const s = pet.s; s.species = k; s.taps = 0; s.stage = 0;
  closeDialog(); pet = makePet(s); savePetState();
  const n = pet.nestPos(); for (let i = 0; i < 18; i++) spark(n.x + rand(-10, 10), n.y - rand(4, 20), { vx: rand(-15, 15), vy: rand(-25, -5), l: rand(0.6, 1.2), m: 1.2, gold: true });
  pet.showHint('Toque 3 vezes no ovo para chocar', 1);
}
function petOptions() {
  if (!pet) return;
  const s = pet.s, sp = pet.spec;
  const info = !sp ? 'Escolha a espécie clicando no ninho.' : s.stage ? esc(sp.name) + ' · ' + PET_LABEL[s.stage] + ' · ' + s.meals + ' refeições · ' + Math.max(1, Math.round((Date.now() - s.born) / 86400000)) + ' dia(s) de vida' : esc(sp.name) + ' · toque 3 vezes no ovo para chocar.';
  dialog(`<h2>${esc(s.stage ? s.name || 'Bichinho' : !sp ? 'Ninho vazio' : 'Ovo misterioso')}</h2>
    <p>${info}</p>
    <label>Ritmo de crescimento</label>
    <select id="sp">${PET_SPEED_LABEL.map((l, i) => `<option value="${i}" ${i === (s.speed || 0) ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <label class="chk"><input type="checkbox" id="hud" ${s.hud ? 'checked' : ''}> Mostrar painel e bandeja</label>
    <label class="chk"><input type="checkbox" id="hunt" ${s.hunt ? 'checked' : ''} ${s.stage ? '' : 'disabled'}> Modo caçador: caça peixinhos sozinho quando sentir fome</label>
    <label>Som</label>
    <select id="snd">${SND_LABEL.map((l, i) => `<option value="${i}" ${i === SND.level ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <div class="row"><button id="wr" ${s.stage ? '' : 'disabled'}>Guarda-roupa</button><button id="rn" ${s.stage ? '' : 'disabled'}>Renomear</button><button id="rs" class="warn">Recomeçar do ovo</button><button id="ok" class="pri">Fechar</button></div>`, d => {
    d.querySelector('#sp').onchange = e => { s.speed = +e.target.value; savePetState(); };
    d.querySelector('#hud').onchange = e => { s.hud = e.target.checked; savePetState(); };
    d.querySelector('#hunt').onchange = e => { s.hunt = e.target.checked; savePetState(); toast(s.hunt ? 'Modo caçador ligado: ' + petName() + ' vai caçar peixinhos quando tiver fome' : 'Modo caçador desligado', 2600); };
    d.querySelector('#snd').onchange = e => sndSetLevel(+e.target.value);
    d.querySelector('#wr').onclick = () => openWardrobe();
    d.querySelector('#rn').onclick = () => askPetName();
    d.querySelector('#rs').onclick = () => confirmReset();
    d.querySelector('#ok').onclick = closeDialog;
  });
}
function confirmReset() {
  dialog(`<h2>Recomeçar?</h2><p>${esc(petName())} vai virar um ovo novo, você escolhe a espécie de novo e todo o crescimento se perde. As roupas continuam guardadas. Não dá para desfazer.</p><div class="row"><button id="no" class="pri">Cancelar</button><button id="yes" class="warn">Recomeçar</button></div>`, d => {
    d.querySelector('#no').onclick = closeDialog;
    d.querySelector('#yes').onclick = () => {
      const o = pet.s, keep = { speed: o.speed, hud: o.hud, wear: o.wear || {}, wcol: o.wcol || {}, hints: 1 };
      try { localStorage.removeItem(PET_STORE); } catch (e) { }
      pet = makePet(Object.assign(newPetState(), keep)); savePetState(); closeDialog(); petFoods = [];
      toast('O ninho está pronto para um ovo novo', 2400); setTimeout(askSpecies, 500);
    };
  });
}
// comandos vindos do app nativo
function petCommand(c, v) {
  if (!pet) return;
  if (c === 'options') petOptions();
  else if (c === 'wardrobe') openWardrobe();
  else if (c === 'pedia') openPedia();
  else if (c === 'games') openGames();
  else if (c === 'hunt') { if (pet.s.stage > 0) { pet.s.hunt = !pet.s.hunt; savePetState(); toast(pet.s.hunt ? 'Modo caçador ligado' : 'Modo caçador desligado', 2200); } }
  else if (c === 'huntNow') { if (pet.s.stage > 0) { pet.wake(); pet.huntNow = 1; pet.huntCD = 0; pet.prey = null; pet.resting = false; } }
  else if (c === 'hud') { pet.s.hud = !pet.s.hud; savePetState(); }
  else if (c === 'speed') { pet.s.speed = clamp(+v | 0, 0, 2); savePetState(); toast('Ritmo: ' + PET_SPEED_LABEL[pet.s.speed], 2400); }
  else if (c === 'rename') askPetName();
  else if (c === 'reset') confirmReset();
  else if (c === 'call') { if (pet.s.stage > 0) { pet.wake(); pet.tx = W / 2; pet.ty = H * 0.45; pet.wt = 6; pet.resting = false; pet.restT = 40; } }
}
function buildPet() {
  if (!ICONS.heart) { buildIcons(); metaIcons(); }
  if (pet) savePetState();
  metaInit(); const s = loadPetState();
  if (!META.adopted) { metaAdopt(s); META.adopted = 1; saveMeta(); }
  if (!s.debug) for (const slot in s.wear) if (wearState(slot, s.wear[slot]) !== 'own') delete s.wear[slot];   // peça provada e não comprada
  pet = makePet(s); petFoods = []; respawnQ = []; drag.item = null; checkAch();
}
