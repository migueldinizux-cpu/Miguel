'use strict';
// =====================================================================
//  Criaturas mitológicas
// =====================================================================

// ---------------- ruínas do templo (lar da fera) ----------------
// cenário estático; a fera é desenhada em tempo real por cima (pet.js)
const RUIN_G = 180;
// caminho em que a fera grande descansa estirada sobre as ruínas (cabeça primeiro, coords locais)
const PET_DRAPE = [[402, -15], [386, -25], [366, -33], [346, -27], [324, -22], [306, -30], [296, -48], [284, -68], [266, -86], [246, -96], [222, -100],
  [198, -96], [180, -84], [168, -66], [160, -46], [150, -30], [130, -20], [104, -12], [78, -9], [50, -6], [22, -8], [4, -6]];
const NEST_LOCAL = { x: 240, y: -18 };
function buildRuins(fog, fogT) {
  const DW = 470, DH = 214, G = RUIN_G;
  const S = new Spr(DW, DH);
  { const SA = S.mat('#cdb27a'), RK = S.mat('#6a7484'), nm = mkNoise();
    for (let x = 0; x < DW; x++) { const edge = Math.min(x, DW - 1 - x), top = G - 1 + (fbm(nm, x * 0.05, 2) - 0.5) * 4 + Math.max(0, 12 - edge * 0.5); for (let y = Math.floor(top); y < DH; y++) { const rock = hash2(Math.floor(x / 4), Math.floor(y / 3), 13) < 0.12; S.put(x, y, rock ? RK : SA, 0.5 - (y - top) * 0.01 + (y - top < 1 ? 0.15 : 0) + (hash2(x, y, 2) - 0.5) * 0.1, -6); } } }
  const ST = S.mat('#bdb3a0'), STD = S.mat('#958b79'), MOSS = S.mat('#5d8a48'), CP = S.mat('#e8708e'), CO = S.mat('#f2a04a');
  const block = (x0, y0, x1, y1, z) => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const row = Math.floor((y - y0) / 6), seam = ((x + row * 7) % 14 === 0) || ((y - y0) % 6 === 0);
      const h = hash2(Math.floor(x / 3), Math.floor(y / 3), 7);
      let m = seam ? STD : ST, l = 0.55 + (y === y0 ? 0.18 : 0) - (y - y0) * 0.012 + (h - 0.5) * 0.12;
      if (y - y0 < 2 && h < 0.45) m = MOSS;
      S.put(x, y, m, l, z);
    }
  };
  block(150, G - 6, 372, G, -3); block(164, G - 12, 358, G - 6, -3); block(178, G - 18, 344, G - 12, -3);
  const column = (x, top, r, broken, z) => {
    const bot = G - 18;
    S.tube([{ x, y: top, r, z }, { x, y: bot, r, z }], ST, { fn: a => {
      if (broken && a.y < top + 6 && hash2(a.x, 1) * 7 > a.y - top) return null;
      const flute = Math.floor((a.v + 1) * 4.5) & 1, h = hash2(Math.floor(a.x / 2), Math.floor(a.y / 3), 3);
      if (h < 0.1 || (a.y < top + 20 && h < 0.3)) return { m: MOSS };
      return { m: flute ? STD : ST, l: a.l - (flute ? 0.05 : 0) + (h - 0.5) * 0.1 };
    } });
    S.poly([[x - r - 3, bot - 4], [x + r + 3, bot - 4], [x + r + 4, bot], [x - r - 4, bot]], ST, { z: z + 0.05, l: 0.55 });
    if (!broken) { S.poly([[x - r - 5, top - 4], [x + r + 5, top - 4], [x + r + 5, top], [x - r - 5, top]], ST, { z: z + 0.05, l: 0.62 }); S.ellipsoid(x, top + 1.5, r + 2, 2.5, ST, { z: z + 0.04 }); }
  };
  column(196, G - 128, 8, false, 0); column(286, G - 84, 8, true, 0); column(338, G - 118, 7.5, false, -0.2);
  S.tube([{ x: 70, y: G - 7, r: 7, z: -0.5 }, { x: 108, y: G - 6, r: 7, z: -0.5 }], ST, { fn: a => ({ m: (Math.floor(a.s / 3) & 1) ? STD : ST }) });
  // arco caído encostado na coluna da direita
  S.tube([{ x: 350, y: G - 24, r: 4, z: -0.4 }, { x: 392, y: G - 9, r: 4, z: -0.4 }], ST, { fn: a => ({ m: (Math.floor(a.s / 5) & 1) ? STD : ST }) });
  for (const [cx, col] of [[160, CP], [352, CO], [214, CO], [300, CP], [120, CO]]) for (let k = 0; k < 4; k++) S.tube([{ x: cx + k * 2, y: G - (cx > 170 && cx < 345 ? 18 : 6), r: 1.1 }, { x: cx + k * 2 + (k - 1.5) * 2, y: G - (cx > 170 && cx < 345 ? 18 : 6) - 5 - k, r: 0.6 }], col, { z: -2.5 });
  const canvas = S.bake({ fog, fogT, outer: '#07122455' });
  return { c: canvas, w: DW, h: DH, G, nest: { x: NEST_LOCAL.x, y: G + NEST_LOCAL.y } };
}
defSheet('ruins', () => { const d = buildRuins(null, 0); return { r: [d.c], l: [flipH(d.c)], n: 1, w: d.w, h: d.h, ax: 0, ay: 0 }; });

// ---------------- sereia (Iara) ----------------
function mermaidFrame(wave, f, nF) {
  const S = new Spr(68, 38), ph = f / nF * TAU, cy = 19;
  const SCL = S.mat('#2aa488'), IRI = S.mat('#6f7fe0'), FIN = S.mat('#86f2dc', { alpha: 0.75, dither: 0.6 }), SK = S.mat('#cf9466'), SKD = S.mat('#a8704a');
  const HAIR = S.mat('#20302c'), HAIRL = S.mat('#3f6e60'), SHELL = S.mat('#c894dc'), LIP = S.mat('#c85a68'), FL = S.mat('#ff5a78'), FLC = S.mat('#ffd24a');
  const tailY = k => cy + 1.9 * Math.sin(ph - k * 0.9) * (k / 4);
  const tail = [{ x: 36, y: cy, r: 5, z: 1 }, { x: 28, y: tailY(1), r: 4.4, z: 1 }, { x: 20, y: tailY(2), r: 3.4, z: 1 }, { x: 13, y: tailY(3), r: 2.3, z: 1 }, { x: 8, y: tailY(4), r: 1.4, z: 1 }];
  const te = tail[4], flap = Math.sin(ph - 3.6) * 2.5;
  S.poly([[te.x + 1, te.y - 1], [te.x - 7, te.y - 9 + flap], [te.x - 4, te.y + flap * 0.3], [te.x - 7, te.y + 9 + flap], [te.x + 1, te.y + 1]], FIN, { z: 0.8, fn: q => ({ l: 0.5 + ((Math.floor(Math.atan2(q.y - te.y, q.x - te.x) * 5) & 1) ? -0.1 : 0.06) }) });
  S.poly([[30, cy + 3], [25, cy + 9 + flap * 0.3], [32, cy + 4]], FIN, { z: 0.8, l: 0.55 });
  S.tube(spline(tail, 1), SCL, { fn: a => { const row = Math.floor((a.v + 1) * 3), c = ((a.s + (row & 1) * 1.5) % 3 + 3) % 3; return { m: c < 0.9 && a.v > -0.3 ? IRI : SCL, l: a.l + (c < 0.9 ? 0.06 : 0) - (c > 2.2 ? 0.07 : 0) }; } });
  // braço de trás
  const arm = (sx, sy, a1, a2, m, z) => { const ex = sx + Math.cos(a1) * 6, ey = sy + Math.sin(a1) * 6, hx = ex + Math.cos(a2) * 6, hy = ey + Math.sin(a2) * 6; S.tube([{ x: sx, y: sy, r: 1.3, z }, { x: ex, y: ey, r: 1.1, z }, { x: hx, y: hy, r: 0.9, z }], m, {}); S.ellipsoid(hx, hy, 1.3, 1.1, m, { z }); };
  arm(46, 16, 2.3 + 0.8 * Math.sin(ph), 2.6 + 0.8 * Math.sin(ph), SKD, 0.5);
  S.tube(spline([{ x: 35, y: cy, r: 4.4 }, { x: 39, y: cy - 0.6, r: 3.3 }, { x: 44, y: cy - 1.4, r: 3.9 }, { x: 47.5, y: cy - 2, r: 3.4 }], 1), SK, { z: 1.2 });
  for (let x = 33; x < 38; x++) for (let y = cy - 5; y < cy + 6; y++) if (S.has(x, y) && x < 34 + Math.abs(y - cy) * 0.5) S.setM(x, y, SCL);
  S.ellipsoid(45, cy + 0.2, 2.4, 1.9, SHELL, { z: 1.4, fn: a => ({ l: a.l - ((Math.floor(a.x) & 1) ? 0.08 : 0) }) });
  S.tube([{ x: 47, y: cy - 3, r: 1.6 }, { x: 49.5, y: cy - 5, r: 1.5 }], SK, { z: 1.3 });
  S.ellipsoid(53, cy - 8, 3.7, 3.9, SK, { z: 1.5 });
  // cabelo longo ao sabor da água
  S.ellipsoid(52, cy - 9.2, 4, 3.4, HAIR, { z: 1.6, fn: a => (a.lx > 0.35 && a.ly > -0.2) ? null : { m: a.ly < -0.5 && a.lx < 0 ? HAIRL : HAIR } });
  for (let i = 0; i < 6; i++) {
    const pts = []; for (let k = 0; k <= 6; k++) pts.push({ x: 50.5 - i * 0.4 - k * (3.4 + i * 0.25), y: cy - 10 + i * 0.9 + k * 0.7 + Math.sin(ph * 1 - k * 0.8 + i) * (k * 0.35), r: 1.4 - k * 0.12, z: i < 3 ? 1.55 : 0.4 });
    S.tube(spline(pts, 1), HAIR, { fn: a => (a.v > 0.3 ? { m: HAIRL } : undefined) });
  }
  S.put(50, cy - 12, FL, 0.6, 1.8); S.put(49, cy - 11, FL, 0.5, 1.8); S.put(51, cy - 11, FL, 0.5, 1.8); S.put(50, cy - 11, FLC, 0.8, 1.81);
  if (wave) arm(47, 17, -1.1, -1.5 + 0.5 * Math.sin(ph * 2), SK, 1.9);
  else arm(47, 17, 2.3 + 0.8 * Math.sin(ph + Math.PI), 2.7 + 0.8 * Math.sin(ph + Math.PI), SK, 1.9);
  S.dot(54, cy - 9, '#1a1216'); S.dot(55, cy - 9, '#2a1a1e'); S.dot(56, cy - 8, shade('#cf9466', 0.25)); S.dot(55, cy - 6, '#c85a68');
  return { spr: S, meta: { ax: 34, ay: cy, hh: 8, hw: 28 } };
}
defSheet('mermaid', () => makeSheet(8, (f, n) => mermaidFrame(false, f, n), { outer: OUTER }));
defSheet('mermaidWave', () => makeSheet(8, (f, n) => mermaidFrame(true, f, n), { outer: OUTER }));

// ---------------- hipocampo (meio cavalo, meio peixe) ----------------
function hippoFrame(f, nF) {
  const S = new Spr(92, 54), ph = f / nF * TAU, cy = 26;
  const BD = S.mat('#4aa894'), BL = S.mat('#cfe6c4'), SCL = S.mat('#2c8676'), GOLD = S.mat('#e8c25a'), MANE = S.mat('#7fe6ee', { alpha: 0.8, dither: 0.6 }), FIN = S.mat('#8ef0e6', { alpha: 0.75, dither: 0.6 }), DK = S.mat('#1e3a3a'), HOOF = S.mat('#9ef2e8', { alpha: 0.85 });
  const ty = k => cy + 2 + 2.6 * Math.sin(ph - k * 0.85) * (k / 5);
  const tail = [{ x: 50, y: cy + 3, r: 7.5, z: 1 }, { x: 40, y: ty(1), r: 6.2, z: 1 }, { x: 30, y: ty(2), r: 4.8, z: 1 }, { x: 21, y: ty(3), r: 3.4, z: 1 }, { x: 13, y: ty(4), r: 2.2, z: 1 }, { x: 7, y: ty(5), r: 1.4, z: 1 }];
  const te = tail[5], flap = Math.sin(ph - 4.2) * 3;
  S.poly([[te.x + 1, te.y - 1], [te.x - 8, te.y - 11 + flap], [te.x - 4, te.y + flap * 0.3], [te.x - 8, te.y + 11 + flap], [te.x + 1, te.y + 1]], FIN, { z: 0.8, fn: q => ({ l: 0.5 + ((Math.floor(Math.atan2(q.y - te.y, q.x - te.x) * 5) & 1) ? -0.1 : 0.06) }) });
  for (let k = 1; k < 4; k++) { const p = tail[k]; S.poly([[p.x + 3, p.y - p.r + 1], [p.x - 1, p.y - p.r - 4], [p.x - 4, p.y - p.r + 1]], FIN, { z: 0.7, l: 0.55 }); }
  // perna de trás (lado de lá)
  const leg = (sx, sy, a1, a2, m, z) => { const kx = sx + Math.cos(a1) * 7, ky = sy + Math.sin(a1) * 7, fx = kx + Math.cos(a2) * 7, fy = ky + Math.sin(a2) * 7; S.tube([{ x: sx, y: sy, r: 2.4, z }, { x: kx, y: ky, r: 1.8, z }, { x: fx, y: fy, r: 1.3, z }], m, {}); S.poly([[fx - 1, fy - 1], [fx + 4, fy + 3], [fx - 3, fy + 4]], HOOF, { z: z + 0.01, l: 0.6 }); };
  leg(56, cy + 4, 1.2 + 0.8 * Math.sin(ph + Math.PI), 1.9 + 0.9 * Math.sin(ph + Math.PI + 0.8), shade('#4aa894', -0.25) && S.mat('#357f70'), 0.5);
  S.tube(spline(tail, 1), SCL, { fn: a => { if (a.v < -0.45) return { m: BL }; const row = Math.floor((a.v + 1) * 3), c = ((a.s + (row & 1) * 1.5) % 3 + 3) % 3; return { m: c < 0.8 ? GOLD : SCL, l: a.l + (c < 0.8 ? 0.02 : c > 2.2 ? -0.08 : 0) }; } });
  S.ellipsoid(56, cy + 1, 10.5, 8.2, BD, { z: 1.2, fn: a => a.ly > 0.45 ? { m: BL } : undefined });
  // crina-barbatana
  const neck = [{ x: 60, y: cy - 3, r: 6, z: 1.3 }, { x: 65, y: cy - 10, r: 4.8, z: 1.3 }, { x: 68, y: cy - 16, r: 4.2, z: 1.3 }];
  for (let k = 0; k < 7; k++) { const t = k / 6, bx = lerp(59, 66, t), by = lerp(cy - 8, cy - 21, t), hgt = 6 + Math.sin(ph * 2 + k) * 1.2; S.poly([[bx + 2, by + 1], [bx - hgt, by - hgt * 0.4], [bx - 1, by + 3]], MANE, { z: 1.25, l: 0.55 + (k & 1 ? 0.1 : 0) }); }
  S.tube(spline(neck, 1), BD, { fn: a => a.v < -0.5 ? { m: BL } : undefined });
  S.ellipsoid(71, cy - 18, 5.2, 4.4, BD, { z: 1.4 });
  S.tube([{ x: 72, y: cy - 17, r: 3.9, z: 1.42 }, { x: 80, y: cy - 13, r: 2.7, z: 1.42 }], BD, { fn: a => a.v < -0.5 ? { m: BL } : undefined });
  S.poly([[68, cy - 26], [70.5, cy - 21], [67, cy - 21]], BD, { z: 1.45, l: 0.6 });
  S.put(80.5, cy - 14, DK, 0.2, 1.5); S.line(76, cy - 11.5, 81, cy - 12.5, DK, 0.25, 1.5);
  leg(58, cy + 5, 1.2 + 0.8 * Math.sin(ph), 1.9 + 0.9 * Math.sin(ph + 0.8), BD, 1.6);
  S.eye(72, cy - 20, 2, '#2a1a0a');
  return { spr: S, meta: { ax: 50, ay: cy, hh: 12, hw: 40 } };
}
defSheet('hippocampus', () => makeSheet(8, (f, n) => hippoFrame(f, n), { outer: OUTER }));

// ---------------- boto encantado (de chapéu!) ----------------
function botoHat(lift) {
  return (S, f, o) => {
    const WH = S.mat('#f2eee2'), BAND = S.mat('#2a2432');
    const hx = o.X(0.8), ty = o.topY(0.8) - 1 - lift, tilt = lift ? -0.25 : -0.08;
    S.ellipsoid(hx, ty, 7, 1.4, WH, { z: 3, ang: tilt });
    S.ellipsoid(hx - 0.5, ty - 2.5, 3.8, 3.2, WH, { z: 3.1, ang: tilt, fn: a => a.ly > 0.55 ? null : undefined });
    for (let i = -3; i <= 3; i++) S.put(hx + i - 0.5, ty - 1.2 + i * tilt, BAND, 0.3, 3.2);
  };
}
defSheet('boto', () => makeSheet(8, (f, n) => cetFrame(Object.assign({}, MAMMALS.boto, { extra: botoHat(0) }), f, n), { outer: OUTER }));
defSheet('botoTip', () => makeSheet(8, (f, n) => cetFrame(Object.assign({}, MAMMALS.boto, { extra: botoHat(4) }), f, n), { outer: OUTER }));

// ---------------- tartaruga-ilha (Aspidochelone) ----------------
defSheet('zaratan', () => makeSheet(8, (f, n) => turtleFrame({ sc: 2.5, island: true }, f, n), { fog: '#2a78ac', fogT: 0.45, outer: '#0a1a2a44' }));

// ---------------- cabeça do leviatã (o corpo é desenhado em tempo real) ----------------
defSheet('levHead', () => makeSheet(2, (f) => {
  const S = new Spr(44, 30), B = S.mat('#3a5c6e'), BL = S.mat('#9fb8b0'), H = S.mat('#c8c0a8'), E = S.mat('#fff27a', { glow: '#fff27aff' }), M = S.mat('#1a1418');
  S.tube([{ x: 10, y: 14, r: 2, z: 1 }, { x: 2, y: 6, r: 1.4, z: 1 }, { x: -1, y: 4, r: 0.6, z: 1 }], H, {});
  S.ellipsoid(14, 15, 9, 7, B, { z: 1.2 });
  S.ellipsoid(26, 17, 11, 4.5, B, { z: 1.25 });
  S.ellipsoid(24, 21.5 + f * 2, 11, 2.6, BL, { z: 1.22, ang: f * 0.12 });
  if (f) S.ellipsoid(27, 20, 8, 1.4, M, { z: 1.23 });
  S.ellipsoid(18, 12, 2.2, 1.6, E, { z: 1.3 });
  return { spr: S, meta: { ax: 6, ay: 16 } };
}, { fog: '#2a78ac', fogT: 0.5 }));
