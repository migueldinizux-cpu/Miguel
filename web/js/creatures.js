'use strict';
// =====================================================================
//  Outros habitantes: tartaruga, manta, baiacu, caranguejo, cavalo-marinho,
//  lontra, moreia, marisco-gigante, baú
// =====================================================================

// ---------------- tartaruga (também base da tartaruga-ilha) ----------------
const SCUTES = [[-9, -8.5], [-3, -10], [3, -10], [9, -8.5], [-13, -3.5], [-7, -5], [0, -5.5], [7, -5], [13, -3.5]];
function turtleFrame(o, f, nF) {
  const sc = o.sc || 1, ph = f / nF * TAU;
  const GW = Math.ceil(64 * sc), GH = Math.ceil((o.island ? 62 : 40) * sc), cx = 26 * sc, cy = (o.island ? 38 : 16) * sc;
  const S = new Spr(GW, GH);
  const M = {
    shell: S.mat(o.shell || '#8c7c3e'), cell: S.mat(o.cell || '#c49c4a'), seam: S.mat('#4e4420'), marg: S.mat(o.marg || '#716632'),
    plast: S.mat('#d6c992'), skin: S.mat(o.skin || '#98a65e'), plate: S.mat(o.plate || '#6c7c3c'), skinD: S.mat(shade(o.skin || '#98a65e', -0.3)), beak: S.mat('#5a5a3a'),
  };
  const P = (x, y) => [cx + x * sc, cy + y * sc];
  const skinFn = a => { const h = hash2(Math.floor(a.x / (1.6 * sc)), Math.floor(a.y / (1.6 * sc)), 3); return h < 0.3 ? { m: M.plate } : undefined; };
  const flip = (sx, sy, len, wid, ang, m, z) => { const [x, y] = P(sx, sy), dx = -Math.cos(ang), dy = Math.sin(ang); S.ellipsoid(x + dx * len * sc * 0.5, y + dy * len * sc * 0.5, len * sc * 0.5, wid * sc, m, { ang: Math.atan2(dy, dx), z, flat: 0.6, fn: skinFn }); };
  const fa = 0.25 + 0.85 * Math.sin(ph), ra = 0.35 + 0.3 * Math.sin(ph + 1.3);
  flip(11, 1, 21, 3.4, fa - 0.5, M.skinD, 0.2);                  // nadadeira dianteira do lado de lá
  flip(-12, 2, 9, 2.6, ra - 0.3, M.skinD, 0.2);
  let [hx, hy] = P(17, 1.8); S.ellipsoid(hx, hy, 4.2 * sc, 3.2 * sc, M.skin, { z: 0.6, fn: skinFn });          // pescoço
  [hx, hy] = P(22, 0.6); S.ellipsoid(hx, hy, 5.2 * sc, 4 * sc, M.skin, { z: 0.7, fn: skinFn });                   // cabeça
  [hx, hy] = P(26.4, 1.6); S.ellipsoid(hx, hy, 1.8 * sc, 1.6 * sc, M.beak, { z: 0.75 });
  // casco com placas (células de Voronoi)
  [hx, hy] = P(0, 0);
  S.ellipsoid(hx, hy, 17 * sc, 12 * sc, M.shell, { z: 1, fn: a => {
    if (a.ly > 0.16) return null;
    const lx = (a.x + 0.5 - cx) / sc, ly = (a.y + 0.5 - cy) / sc;
    if (a.d2 > 0.8) return { m: M.marg, l: a.l - ((Math.floor(lx / 3) & 1) ? 0.08 : 0) };
    let d1 = 1e9, d2 = 1e9, best = null;
    for (const c of SCUTES) { const d = Math.hypot(lx - c[0], ly - c[1]); if (d < d1) { d2 = d1; d1 = d; best = c; } else if (d < d2) d2 = d; }
    if (d2 - d1 < 0.9 / sc + 0.35) return { m: M.seam, l: a.l * 0.8 };
    return { m: d1 < 2.6 ? M.cell : M.shell, l: a.l + (1 - d1 / 6) * 0.08 + (hash2(Math.floor(Math.atan2(ly - best[1], lx - best[0]) * 3), 1) - 0.5) * 0.06 };
  } });
  [hx, hy] = P(0, 2.4); S.ellipsoid(hx, hy, 16 * sc, 3.2 * sc, M.plast, { z: 0.9, fn: a => a.ly < -0.1 ? null : { l: a.l - ((Math.floor((a.x - cx) / (3 * sc)) & 1) ? 0.06 : 0) } });
  flip(10, 3.2, 23, 3.8, fa, M.skin, 2);                          // nadadeira dianteira (perto)
  flip(-12, 3.5, 10, 2.8, ra, M.skin, 2);
  [hx, hy] = P(-17.5, 2.5); S.ellipsoid(hx, hy, 2.5 * sc, 1.2 * sc, M.skin, { z: 0.5 });
  if (o.island) turtleIsland(S, cx, cy, sc);
  const [ex, ey] = P(23, -0.6);
  S.eye(ex - 1, ey - 1, sc > 1.5 ? 3 : 2, '#2a1a0a');
  return { spr: S, meta: { ax: cx + 4 * sc, ay: cy, hh: 10 * sc, hw: 26 * sc } };
}
// ilha nas costas da tartaruga gigante
function turtleIsland(S, cx, cy, sc) {
  const R = S.mat('#7c828c'), MO = S.mat('#5d7d44'), CO = S.mat('#e86a8a'), CO2 = S.mat('#f2a33a'), ST = S.mat('#bdb29a'), WIN = S.mat('#2a2a3a'), KE = S.mat('#6f9a2e');
  const top = cy - 11.5 * sc;
  S.ellipsoid(cx - 4 * sc, top + 1 * sc, 12 * sc, 5 * sc, R, { z: 3, fn: a => a.ny < -0.55 && hash2(a.x, a.y, 2) < 0.6 ? { m: MO } : undefined });
  S.ellipsoid(cx + 7 * sc, top + 2 * sc, 7 * sc, 3.5 * sc, R, { z: 3.1 });
  // torre em ruínas
  const tx = cx - 8 * sc, tw = 5 * sc, th = 14 * sc;
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    const px = tx + x, py = top - 2 * sc - y; if (y > th - 3 * sc && hash2(x, 3) < 0.5) continue;
    const win = (Math.floor(y / (3 * sc)) % 2 === 1) && x > tw * 0.35 && x < tw * 0.65;
    S.put(px, py, win ? WIN : ST, 0.35 + (x / tw) * -0.15 + 0.3 + ((Math.floor(y / (1.5 * sc)) & 1) && (x % Math.ceil(2 * sc) === 0) ? -0.12 : 0), 3.2);
  }
  // corais e algas
  for (let k = 0; k < 5; k++) {
    const bx = cx + (-2 + k * 4) * sc, by = top, m = k % 2 ? CO : CO2;
    S.tube([{ x: bx, y: by, r: 1 * sc }, { x: bx + (k - 2) * sc, y: by - 5 * sc, r: 0.6 * sc }], m, { z: 3.3 });
    S.tube([{ x: bx, y: by - 2 * sc, r: 0.7 * sc }, { x: bx + 2.5 * sc, y: by - 5.5 * sc, r: 0.5 * sc }], m, { z: 3.3 });
  }
  for (let k = 0; k < 4; k++) { const bx = cx + (6 + k * 2.5) * sc; for (let j = 0; j < 9 * sc; j++) S.put(bx + Math.sin(j * 0.3 + k) * sc, top + 1 * sc - j, KE, 0.5 + (j % 3 === 0 ? 0.15 : 0), 3.4); }
}
defSheet('turtle', () => makeSheet(10, (f, n) => turtleFrame({ sc: 1 }, f, n), { outer: OUTER }));

// ---------------- raia-manta (vista de cima) ----------------
function bez(p0, p1, p2, n = 10) { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; out.push([a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]]); } return out; }
function mantaFrame(o, f, nF) {
  const ph = f / nF * TAU, S = new Spr(78, 70), cx = 46, cy = 35;
  const BK = S.mat('#2c4262'), BD = S.mat('#1f3150'), PT = S.mat('#a9bccd'), MO = S.mat('#1a2436');
  const span = 25 + 6 * Math.cos(ph), tipx = cx - 9 - 5 * Math.sin(ph);
  const up = [...bez([cx + 10, cy - 4], [cx + 3, cy - span * 0.95], [tipx, cy - span]), ...bez([tipx - 1, cy - span + 1], [cx - 5, cy - span * 0.42], [cx - 13, cy - 2]).slice(1)];
  const pts = [...up, [cx - 14, cy], ...up.slice().reverse().map(([x, y]) => [x, 2 * cy - y]), [cx + 10, cy + 1.5], [cx + 9, cy], [cx + 10, cy - 1.5]];
  S.line(cx - 13, cy, cx - 40, cy + Math.sin(ph + 1) * 2, BD, 0.4, 0);
  S.line(cx - 13, cy + 1, cx - 24, cy + 1 + Math.sin(ph + 1), BD, 0.4, 0);
  S.poly(pts, BK, { z: 1, fn: a => {
    const dx = a.x + 0.5 - cx, dy = a.y + 0.5 - cy, ady = Math.abs(dy);
    const pr = Math.hypot((dx - 2 + (ady - 7) * 0.6) / 4.2, (ady - 7) / 2.2);
    if (pr < 1) return { m: PT, l: 0.45 + (dy < 0 ? 0.1 : 0) };
    const thick = 1 - clamp(ady / span, 0, 1);
    return { m: ady < 4 ? BD : BK, l: 0.3 + thick * 0.28 + (dy < 0 ? 0.08 : -0.04) };
  } });
  for (const s of [-1, 1]) S.ellipsoid(cx + 12.5, cy + s * 4.3, 3.4, 1.3, BD, { ang: s * 0.5, z: 1.5 });
  S.line(cx + 9, cy - 1, cx + 9, cy + 1, MO, 0.2, 2);
  return { spr: S, meta: { ax: cx, ay: cy, hh: 12, hw: 30 } };
}
defSheet('manta', () => makeSheet(12, (f, n) => mantaFrame({}, f, n), { outer: OUTER }));

// ---------------- baiacu (5 níveis de inflar x 2 quadros) ----------------
defSheet('puffer', () => makeSheet(10, (f) => {
  const lv = Math.floor(f / 2), fr = f % 2, t = lv / 4, S = new Spr(44, 38), cx = 23, cy = 19;
  const rx = 7.5 + t * 3.5, ry = 5 + t * 6.2;
  const B = S.mat('#e6c056'), BL = S.mat('#f6efd6'), SP = S.mat('#7a5a26'), SK = S.mat('#b8903a'), FN = S.mat('#e8b848', { alpha: 0.85 });
  const tx = cx - rx - 0.5;
  for (let i = 0; i < 5; i++) { const sp = 1.2 + i * 0.75, yo = (fr ? 0.7 : -0.5) * i * 0.4; for (let y = cy - 6; y < cy + 6; y++) if (Math.abs(y + 0.5 - cy - yo) <= sp) S.put(tx - i, y, FN, 0.5 + (i === 4 ? 0.15 : 0) + ((y & 1) ? -0.08 : 0), 0.9); }
  if (t > 0.3) for (let k = 0; k < 22; k++) { const a = k / 22 * TAU, ex = Math.cos(a), ey = Math.sin(a); for (let d = 0; d < (t > 0.7 ? 3 : 1.6); d += 0.7) S.put(cx + ex * (rx + d), cy + ey * (ry + d), SK, 0.4 + d * 0.1, 0.5); }
  S.ellipsoid(cx, cy, rx, ry, B, { z: 1, fn: a => { if (a.ly > 0.28) return { m: BL }; if (a.ly < 0.15 && hash2(Math.floor(a.x / 1.5), Math.floor(a.y / 1.5), 5) < 0.14) return { m: SP }; } });
  if (t < 0.5) S.ellipsoid(cx - 1, cy + 1.5, 2, 1.1, FN, { ang: 2.6 + (fr ? 0.3 : -0.2), z: 2, flat: 0.4 });
  S.addL(cx + rx - 0.6, cy + ry * 0.2, -0.35);
  const es = t > 0.5 ? 4 : 3; S.eye(cx + rx * 0.48 - 1, cy - ry * 0.42 - 1, es, '#d8b040');
  return { spr: S, meta: { ax: cx, ay: cy, hh: 6, hw: 10 } };
}, { outer: OUTER }));

// ---------------- caranguejo ----------------
defSheet('crab', () => makeSheet(2, (f) => {
  const S = new Spr(26, 16), R = S.mat('#e2542e'), D = S.mat('#b43a1e'), CL = S.mat('#f0663a'), E = S.mat('#1a1418');
  const legs = [[8, 10, 3, 15], [9, 11, 5, 15], [10, 11, 7.5, 15]];
  legs.forEach(([ax, ay, fx, fy], k) => { const o = (k + f) % 2; S.tube([{ x: ax, y: ay, r: 1 }, { x: fx - o + 0.5, y: fy - 2 - o, r: 0.8 }, { x: fx - o, y: fy - o, r: 0.5 }], D, { z: 0.5 }); S.tube([{ x: 26 - ax, y: ay, r: 1 }, { x: 26 - fx + o - 0.5, y: fy - 2 - o, r: 0.8 }, { x: 26 - fx + o, y: fy - o, r: 0.5 }], D, { z: 0.5 }); });
  for (const s of [-1, 1]) {
    const bx = 13 + s * 5.5, cxl = 13 + s * 9.5;
    S.tube([{ x: bx, y: 9, r: 1.3 }, { x: 13 + s * 8, y: 6.5, r: 1.2 }], R, { z: 1 });
    S.ellipsoid(cxl, 5, 3, 2.3, CL, { z: 2 });
    S.ellipsoid(cxl + s * 1.5, 2.8, 1.5, 1, CL, { z: 2.1, ang: s * 0.4 });
    S.del(cxl + s * 0.3, 3); S.del(cxl + s * 1, 3.5);
  }
  S.ellipsoid(13, 10, 7, 3.8, R, { z: 1.5, fn: a => a.ly > 0.5 ? { m: D } : undefined });
  for (const s of [-1, 1]) { S.tube([{ x: 13 + s * 1.8, y: 7, r: 0.6 }, { x: 13 + s * 2.2, y: 4.5, r: 0.6 }], R, { z: 2 }); S.ellipsoid(13 + s * 2.2, 4, 1.1, 1.1, E, { z: 2.2 }); }
  return { spr: S, meta: { ax: 13, ay: 15 } };
}, { outer: OUTER }));

// ---------------- cavalo-marinho (4 quadros, 2 cores) ----------------
function seahorseFrame(col, f, nF) {
  const S = new Spr(20, 34), ph = f / nF * TAU;
  const B = S.mat(col), BD = S.mat(shade(col, -0.25)), FN = S.mat(shade(col, 0.35), { alpha: 0.75 });
  const path = spline([{ x: 9, y: 9, r: 2.2 }, { x: 10.5, y: 14, r: 3.2 }, { x: 11, y: 19, r: 3.6 }, { x: 9.5, y: 24, r: 2.5 }, { x: 7, y: 27.5, r: 1.8 }, { x: 6.5, y: 31, r: 1.3 }, { x: 9, y: 32.5, r: 1 }, { x: 10.5, y: 30.5, r: 0.8 }, { x: 9, y: 29, r: 0.6 }], 1);
  S.tube(path, B, { z: 1, fn: a => ({ l: a.l - (Math.floor(a.s / 2) % 2 ? 0.1 : 0) + (a.v > 0.5 ? 0.06 : 0) }) });
  // nadadeira dorsal vibrando
  for (let j = 0; j < 5; j++) for (let i = 0; i < 3 + (j % 2); i++) S.put(5 - i + Math.round(Math.sin(ph * 2 + j) * 0.6), 17 + j, FN, 0.6 + (i === 2 ? 0.15 : 0), 0.5);
  S.ellipsoid(9.5, 7, 3.4, 2.8, B, { z: 2 });
  S.tube([{ x: 11, y: 7.5, r: 1.2 }, { x: 16, y: 8.5, r: 1 }], B, { z: 2.1 });
  for (let k = 0; k < 3; k++) S.put(8 + k, 3.8 - (k === 1 ? 1 : 0), BD, 0.5, 2.2);
  S.addL(16, 8.5, -0.3);
  S.eye(10, 6, 2, '#2a1a0a');
  return { spr: S, meta: { ax: 10, ay: 18 } };
}
defSheet('seahorseY', () => makeSheet(4, (f, n) => seahorseFrame('#f2a93a', f, n), { outer: OUTER }));
defSheet('seahorseP', () => makeSheet(4, (f, n) => seahorseFrame('#e8708a', f, n), { outer: OUTER }));

// ---------------- lontra-marinha boiando de costas ----------------
function otterFrame(wave, f, nF) {
  const S = new Spr(46, 22), ph = f / nF * TAU;
  const FUR = S.mat('#6e4b30'), BEL = S.mat('#9c7650'), FACE = S.mat('#e2cfae'), NOSE = S.mat('#1e1614'), SH = S.mat('#8a5aa8'), PAW = S.mat('#4e3422');
  S.ellipsoid(4, 13, 4, 2, FUR, { z: 0.5, ang: -0.3 });                                        // cauda
  S.ellipsoid(8 + Math.sin(ph) * 0.5, 6, 2, 3.4, PAW, { z: 0.6, ang: 0.3 });                   // pés traseiros
  S.ellipsoid(11 + Math.cos(ph) * 0.5, 6.5, 1.8, 3, PAW, { z: 0.6, ang: -0.2 });
  S.ellipsoid(22, 12, 14, 5.2, FUR, { z: 1, fn: a => a.ly < -0.2 ? { m: BEL } : undefined });
  S.ellipsoid(36, 10, 5.2, 4.8, FUR, { z: 1.2 });
  S.ellipsoid(37.5, 9.5, 3.8, 3.4, FACE, { z: 1.3 });
  S.ellipsoid(34, 6, 1.2, 1, FUR, { z: 1.25 });
  S.ellipsoid(41, 9.5, 1.1, 0.9, NOSE, { z: 1.4 });
  S.dot(38, 8, '#1e1614'); S.dot(39, 8, '#1e1614');
  const tap = Math.round(Math.sin(ph) * 0.8);
  S.ellipsoid(28, 5 + tap, 2.8, 2.4, SH, { z: 2, fn: a => (Math.floor((a.x + 2) / 2) & 1) ? { l: a.l - 0.1 } : undefined });
  if (wave) { const a = Math.sin(ph) * 0.4; S.tube([{ x: 31, y: 8, r: 1.3 }, { x: 33 + a * 2, y: 1, r: 1.1 }], PAW, { z: 2.2 }); S.tube([{ x: 25, y: 8, r: 1.3 }, { x: 27, y: 6 + tap, r: 1.1 }], PAW, { z: 2.2 }); }
  else { S.tube([{ x: 31, y: 8, r: 1.3 }, { x: 29.5, y: 6 + tap, r: 1.1 }], PAW, { z: 2.2 }); S.tube([{ x: 25, y: 8, r: 1.3 }, { x: 26.5, y: 6 + tap, r: 1.1 }], PAW, { z: 2.2 }); }
  return { spr: S, meta: { ax: 23, ay: 11 } };
}
defSheet('otter', () => makeSheet(4, (f, n) => otterFrame(false, f, n), { outer: OUTER }));
defSheet('otterWave', () => makeSheet(4, (f, n) => otterFrame(true, f, n), { outer: OUTER }));

// ---------------- moreia saindo da toca (6 extensões x boca aberta/fechada) ----------------
defSheet('moray', () => makeSheet(12, (f) => {
  const ext = Math.floor(f / 2), open = f % 2, S = new Spr(46, 30), hx = 8, hy = 20;
  const HOLE = S.mat('#0e1418', { noOutline: true }), LIP = S.mat('#5c6878'), B = S.mat('#6f8a3a'), SPOT = S.mat('#3c5020'), MOUTH = S.mat('#3a1a1a');
  S.ellipsoid(hx, hy, 6.5, 5, HOLE, { z: -1 });
  if (ext > 0) {
    const len = ext * 5.5, ang = -0.35, ex = hx + Math.cos(ang) * len, ey = hy + Math.sin(ang) * len;
    S.tube([{ x: hx - 1, y: hy + 1, r: 4 }, { x: lerp(hx, ex, 0.6), y: lerp(hy, ey, 0.6) - 0.5, r: 3.8 }, { x: ex, y: ey, r: 3.4 }], B, { z: 0.5, fn: a => hash2(Math.floor(a.x / 2), Math.floor(a.y / 2), 4) < 0.25 ? { m: SPOT } : undefined });
    S.ellipsoid(ex + 3.5, ey - 0.8, 5, 3.2, B, { z: 1, ang, fn: a => hash2(Math.floor(a.x / 2), Math.floor(a.y / 2), 4) < 0.22 ? { m: SPOT } : undefined });
    const jx = ex + 3.5 + Math.cos(ang) * 3, jy = ey + Math.sin(ang) * 3;
    if (open) { S.ellipsoid(jx + 1, jy + 2.4, 4, 1.6, B, { z: 1.1, ang: ang + 0.35 }); S.ellipsoid(jx + 1.5, jy + 1, 3, 0.9, MOUTH, { z: 1.2, ang: ang + 0.15 }); S.dot(jx + 2, jy + 0.3, '#f4f0e8'); S.dot(jx + 4, jy, '#f4f0e8'); }
    else S.line(jx - 1, jy + 1, jx + 4, jy - 0.5, MOUTH, 0.3, 1.2);
    S.eye(ex + 4.5, ey - 3, 2, '#e8d040');
  } else { S.dot(hx + 1, hy - 1, '#f2e060'); S.dot(hx + 3, hy - 1, '#f2e060'); }
  S.ellipsoid(hx, hy + 3.5, 7.5, 2.8, LIP, { z: 3, fn: a => a.ly < 0 ? null : undefined });
  return { spr: S, meta: { ax: hx, ay: hy } };
}, { outer: OUTER }));

// ---------------- marisco-gigante (4 níveis de abertura) ----------------
defSheet('clam', () => makeSheet(4, (f) => {
  const op = f / 3, S = new Spr(30, 20), cx = 15, base = 18;
  const SHL = S.mat('#cfc6b4'), SHD = S.mat('#8e8676'), MAN = S.mat('#2f7fd0', { glow: '#3fa0ff55' }), MAN2 = S.mat('#9a4fd8'), SPOT = S.mat('#8ff0ff', { glow: '#8ff0ff88' }), PEARL = S.mat('#f4f0f8');
  const gap = op * 5;
  if (op > 0) S.ellipsoid(cx, base - 5 - gap * 0.3, 11, 1 + gap * 0.9, MAN, { z: 1, fn: a => hash2(Math.floor(a.x / 2), Math.floor(a.y), 6) < 0.18 ? { m: SPOT } : (Math.abs(a.lx) > 0.7 ? { m: MAN2 } : undefined) });
  if (op === 1) S.ellipsoid(cx, base - 6.5, 1.6, 1.6, PEARL, { z: 1.5, spec: 0.5 });
  const shell = (top) => { for (let x = -12; x <= 12; x++) { const zig = (x & 1) ? 1 : 0, hgt = 5.5 * Math.sqrt(1 - (x / 13) ** 2); for (let j = 0; j < hgt; j++) { const y = top ? base - 5 - gap - j - zig * (j > hgt - 1.5 ? 1 : 0) : base - 5 + j + 1; S.put(cx + x, y, (Math.abs(x) % 4 < 2) ? SHL : SHD, 0.35 + (top ? 0.25 : 0.05) + (j / hgt) * (top ? 0.2 : -0.1), top ? 2 : 0.5); } } };
  shell(false); shell(true);
  return { spr: S, meta: { ax: cx, ay: base } };
}, { outer: OUTER }));

// ---------------- baú do tesouro ----------------
function chestSpr(open) {
  const S = new Spr(30, 26), WD = S.mat('#8a5530'), WDD = S.mat('#5e3618'), MT = S.mat('#9aa0a8'), GD = S.mat('#e8b53a'), GL = S.mat('#ffe27a', { glow: '#ffd76a99' }), IN = S.mat('#2e1a0e'), GEM = S.mat('#ff4a6a', { glow: '#ff6a8a88' }), GEM2 = S.mat('#4ae0ff', { glow: '#6af0ff88' });
  const plank = a => ({ l: a.l - ((a.y % 4 === 0) ? 0.15 : 0) + (hash2(a.x, Math.floor(a.y / 4), 2) - 0.5) * 0.08 });
  if (open) {
    S.poly([[3, 2], [27, 2], [26, 11], [4, 11]], IN, { z: 0, l: 0.3 });
    S.poly([[2, 0], [28, 0], [28, 3], [2, 3]], WD, { z: 0.2, l: 0.5 });
    for (let i = 0; i < 22; i++) { const hh = 1 + Math.round(3 * Math.sin((i + 0.5) / 22 * Math.PI)); for (let j = 0; j < hh; j++) S.put(4 + i, 12 - j, ((i * 7 + j * 3) % 5 === 0) ? GL : GD, 0.5 + ((i + j) & 1) * 0.15, 0.5); }
    S.ellipsoid(10, 9, 1.4, 1.2, GEM, { z: 0.8, spec: 0.5 }); S.ellipsoid(19, 9.5, 1.3, 1.1, GEM2, { z: 0.8, spec: 0.5 });
  }
  S.poly([[2, 12], [28, 12], [28, 25], [2, 25]], WD, { z: 1, fn: plank });
  if (!open) { S.ellipsoid(15, 12, 13.5, 7, WD, { z: 1.1, fn: a => a.ly > 0 ? null : plank(a) }); }
  for (const bx of [5, 23]) { S.poly([[bx, open ? 12 : 5.5], [bx + 2.5, open ? 12 : 5.5], [bx + 2.5, 25], [bx, 25]], MT, { z: 1.3, l: 0.55 }); for (let y = 14; y < 25; y += 4) S.dot(bx + 1, y, '#d8dde2'); }
  S.poly([[13, 11], [17, 11], [17, 17], [13, 17]], GD, { z: 1.4, l: 0.6 }); S.dot(15, 14, '#2a1a0a'); S.dot(15, 15, '#2a1a0a');
  return S;
}
defSheet('chest', () => makeSheet(2, (f) => ({ spr: chestSpr(f === 1), meta: { ax: 15, ay: 24 } }), { outer: OUTER }));
