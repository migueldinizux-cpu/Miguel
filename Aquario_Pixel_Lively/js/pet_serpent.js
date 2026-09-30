'use strict';
// =====================================================================
//  Espécie 1 — Serpente-marinha: corpo longo desenhado em tempo real,
//  cresce até um dragão do mar que dorme estirado sobre as ruínas
// =====================================================================
const SERP = {
  baby: { hr: 8.5, snout: 0.38, eye: 'cute', eyeW: 6, eyeH: 7, horn: 'nub', frill: 'ear', len: 20, rMax: 5.8, spacing: 1.8, speed: 17, whisk: 0, crest: 'none', legs: 'flip', tail: 'heart', glow: false,
    c: { body: '#7cdcca', belly: '#fff3cf', dorsal: '#62c6ba', spot: '#d2fff6', horn: '#fff4dc', frill: '#aef2ff', cheek: '#ff9fbc' } },
  young: { hr: 10, snout: 0.6, eye: 'cute', eyeW: 6, eyeH: 6, horn: 'small', frill: 'ear2', len: 72, rMax: 8.5, spacing: 2.6, speed: 20, whisk: 12, crest: 'bumps', legs: 'flip', tail: 'fan', glow: false,
    c: { body: '#52c2b4', belly: '#ffe8b4', dorsal: '#3ea69e', spot: '#b4fff2', horn: '#f6ecd2', frill: '#90eaf4', cheek: '#ff9ab4' } },
  teen: { hr: 12.5, snout: 0.85, eye: 'kind', eyeW: 6, eyeH: 5, horn: 'curve', frill: 'fan', len: 150, rMax: 12.5, spacing: 4, speed: 22, whisk: 20, crest: 'spines', legs: 'claw', tail: 'frill', glow: true,
    c: { body: '#38a29a', belly: '#f2d69c', dorsal: '#2a7c80', spot: '#7ff8ff', horn: '#ece0c6', frill: '#6ee0e0', crest: '#236066' } },
  adult: { hr: 19, snout: 1.0, eye: 'kind', eyeW: 8, eyeH: 7, horn: 'antler', frill: 'bigfan', len: 330, rMax: 21, spacing: 7, speed: 19, whisk: 34, crest: 'bigspines', legs: 'claw', tail: 'bigfrill', glow: true,
    c: { body: '#2e8a80', belly: '#e8ca8a', dorsal: '#22646c', spot: '#7ff8ff', horn: '#e8dcc2', frill: '#62d6c8', crest: '#1d4a56' } },
};
const SERP_PROF = {
  baby: curve([[0, 0.92], [0.25, 1], [0.55, 0.86], [0.8, 0.58], [1, 0.32]]),
  young: curve([[0, 0.78], [0.25, 1], [0.6, 0.72], [0.85, 0.36], [1, 0.14]]),
  teen: curve([[0, 0.72], [0.2, 0.95], [0.35, 1], [0.65, 0.72], [0.88, 0.32], [1, 0.1]]),
  adult: curve([[0, 0.72], [0.2, 0.95], [0.35, 1], [0.65, 0.74], [0.88, 0.32], [1, 0.1]]),
};

// ---------------- sprites ----------------
function serpHeadFrame(key, e) {
  const P = SERP[key], hr = P.hr, sn = P.snout, C = P.c, cute = P.eye === 'cute';
  const hornUp = { nub: hr * 0.45, small: hr * 0.65, curve: hr * 0.95, antler: hr * 1.35 }[P.horn];
  const back = { ear: hr * 1.05, ear2: hr * 1.25, fan: hr * 1.6, bigfan: hr * 1.9 }[P.frill];
  const cx = Math.ceil(back + 2), cy = Math.ceil(hornUp + hr + 2);
  const snX = cute ? cx + hr * 0.86 : cx + hr * (0.5 + sn * 0.55), snRx = cute ? hr * (0.36 + sn * 0.3) : hr * sn * 0.72 + 2.2, snRy = hr * (cute ? 0.42 : 0.52), tipX = snX + snRx;
  const S = new Spr(Math.ceil(tipX + 3), Math.ceil(cy + hr * 1.3 + 3));
  const M = { b: S.mat(C.body), bel: S.mat(C.belly, { dark: 0.62, hue: 8 }), d: S.mat(C.dorsal), sp: S.mat(C.spot), h: S.mat(C.horn), hd: S.mat(shade(C.horn, -0.28)), f: S.mat(C.frill, { alpha: 0.82, dither: 0.6 }),
    spn: S.mat(C.crest || C.dorsal), mo: S.mat('#3a1226'), tg: S.mat('#ff7f9e'), ch: C.cheek ? S.mat(C.cheek) : null, gl: P.glow ? S.mat(C.spot, { glow: C.spot + 'ee' }) : null };
  const ax = cx - hr * 0.72, ay = cy + hr * 0.28;
  // barbatanas-orelha / leque (atrás)
  const lobes = { ear: 2, ear2: 3, fan: 4, bigfan: 5 }[P.frill], round = P.frill === 'ear' || P.frill === 'ear2';
  for (let k = 0; k < lobes; k++) {
    const off = k - (lobes - 1) / 2, a = Math.PI + off * (round ? 0.8 : 0.42) - 0.1, bx = cx - hr * 0.55, by = cy + hr * 0.05, L = back * (1 - Math.abs(off) * 0.13);
    if (round) S.ellipsoid(bx + Math.cos(a) * L * 0.5, by + Math.sin(a) * L * 0.5, L * 0.52, hr * (cute ? 0.36 : 0.28), M.f, { ang: a, z: 0.3, flat: 0.5, fn: q => ({ l: 0.56 + ((Math.floor((q.ly + 1) * 3)) & 1 ? -0.08 : 0.05) + (q.lx < -0.55 ? 0.12 : 0) }) });
    else {
      const tip = [bx + Math.cos(a) * L, by + Math.sin(a) * L], sd = [Math.cos(a + 1.57) * hr * 0.22, Math.sin(a + 1.57) * hr * 0.22];
      S.poly([[bx + sd[0], by + sd[1]], tip, [bx - sd[0], by - sd[1]]], M.f, { z: 0.3, fn: q => ({ l: 0.5 + ((Math.round(q.x * 2 + q.y) % 4) === 0 ? -0.12 : 0.05) }) });
      S.tube([{ x: bx, y: by, r: Math.max(0.6, hr * 0.05) }, { x: tip[0], y: tip[1], r: 0.5 }], M.spn, { z: 0.31 });
      if (M.gl) S.put(tip[0], tip[1], M.gl, 0.8, 0.32);
    }
  }
  const horn = near => {
    const o = near ? 0 : -hr * 0.3, m = near ? M.h : M.hd, z = near ? 1.4 : 0.2, bx = cx - hr * 0.1 + o, by = cy - hr * 0.72 + (near ? 0 : hr * 0.05);
    if (P.horn === 'nub') { S.ellipsoid(bx, by - hr * 0.08, hr * 0.2, hr * 0.27, m, { z, ang: -0.3 }); return; }
    const pts = P.horn === 'small' ? [[0, 0, 0.17], [-0.35, -0.32, 0.12], [-0.72, -0.4, 0.07]]
      : P.horn === 'curve' ? [[0, 0, 0.18], [-0.5, -0.36, 0.15], [-1.05, -0.5, 0.11], [-1.5, -0.42, 0.07], [-1.75, -0.62, 0.04]]
      : [[0, 0, 0.19], [-0.55, -0.42, 0.16], [-1.15, -0.6, 0.12], [-1.75, -0.55, 0.08], [-2.15, -0.8, 0.04]];
    S.tube(pts.map(p => ({ x: bx + p[0] * hr, y: by + p[1] * hr, r: Math.max(0.6, p[2] * hr), z })), m, { fn: q => ({ l: q.l - (Math.floor(q.s / 2.5) & 1 ? 0.08 : 0) }) });
    const tine = (p, dx, dy, r) => S.tube([{ x: bx + p[0] * hr, y: by + p[1] * hr, r: Math.max(0.6, r * hr), z }, { x: bx + (p[0] + dx) * hr, y: by + (p[1] + dy) * hr, r: 0.5, z }], m, {});
    if (P.horn === 'curve') tine(pts[2], 0.02, -0.32, 0.06);
    if (P.horn === 'antler') { tine(pts[2], 0.05, -0.45, 0.07); tine(pts[3], 0.02, -0.4, 0.05); }
  };
  horn(false);
  S.ellipsoid(ax, ay, hr * 0.62, P.rMax * 0.95, M.b, { z: 0.6, fn: q => q.ly > 0.45 ? { m: M.bel } : undefined });
  S.ellipsoid(cx, cy, hr, hr * (cute ? 1 : 0.92), M.b, { z: 1, fn: q => {
    if (cute) return (hash2(Math.floor(q.x / 2), Math.floor(q.y / 2), 3) < 0.06 && q.ly < 0.2) ? { m: M.sp } : (q.ly > 0.7 ? { l: q.l + 0.08 } : undefined);
    if (q.ly > 0.62) return { m: M.bel };
    return { l: q.l + (hash2(Math.floor(q.x / 2.5), Math.floor(q.y / 2), 9) < 0.25 ? -0.06 : 0) };
  } });
  const open = e === 3;
  S.ellipsoid(snX, cy + hr * (cute ? 0.34 : 0.22), snRx, snRy, M.b, { z: cute ? 1.3 : 1.1, ang: 0.05, fn: q => cute ? (q.ly > 0.35 ? { l: q.l + 0.1 } : undefined) : (q.ly > 0.55 ? { m: M.bel } : undefined) });
  if (open) { S.ellipsoid(snX - 1, cy + hr * 0.64, snRx * 0.82, hr * 0.27, M.mo, { z: 1.08 }); S.ellipsoid(snX - 1, cy + hr * 0.75, snRx * 0.5, hr * 0.12, M.tg, { z: 1.09 }); }
  if (open || !cute) S.ellipsoid(snX - hr * 0.1, cy + hr * (open ? 0.95 : 0.66), snRx * 0.98, hr * (cute ? 0.22 : 0.26), M.bel, { z: 1.07, ang: open ? 0.18 : 0.04 });
  if (!cute) S.ellipsoid(cx + hr * 0.3, cy - hr * 0.44, hr * 0.46, hr * 0.15, M.d, { z: 1.2, ang: -0.1 });
  if (M.ch) S.ellipsoid(cx - hr * 0.08, cy + hr * 0.5, hr * 0.2, hr * 0.11, M.ch, { z: 1.25, flat: 0.3 });
  horn(true);
  S.dot(tipX - 2, cy + hr * 0.02, shade(C.body, -0.5));
  if (!open) {
    if (cute) { const mx = Math.round(snX), my = Math.round(cy + hr * 0.62); for (let i = -2; i <= 1; i++) S.dot(mx + i, my + (i === -2 ? -1 : i === 1 ? -1 : 0), '#3a1a2c'); S.dot(mx - 1, my + 1, '#ff8aa8'); }
    else { const x0 = cx + hr * 0.15, x1 = tipX - 1.5; for (let x = x0; x < x1; x++) { const t = (x - x0) / (x1 - x0); S.dot(x, cy + hr * 0.5 - (t < 0.18 ? (0.18 - t) * hr * 0.5 : 0), '#2a1420'); } S.dot(snX + 1, cy + hr * 0.5 + 1, '#f6f1e6'); }
  }
  const ex = cx + hr * (cute ? 0.28 : 0.3), ey = cy - hr * (cute ? 0.05 : 0.1);
  petEye(S, P, ex, ey, e);
  return { spr: S, meta: { ax, ay, mx: snX + snRx * 0.35, my: cy + hr * 0.6, sx: tipX - 2, sy: cy + hr * 0.3, top: cy - hr - hornUp * 0.4, hitR: hr * 1.2, cx, cy,
    // pontos de encaixe das roupas (coordenadas do sprite, olhando para a direita)
    hatX: cx + hr * (cute ? 0.12 : 0.24), hatY: cy - hr * (cute ? 0.88 : 0.8), hatW: hr * (cute ? 1.3 : 1.1),
    neckX: ax - hr * 0.02, neckY: ay + hr * 0.04, neckR: P.rMax * 0.95 + 0.5,
    eyeX: ex, eyeY: ey, eyeR: Math.max(P.eyeW, P.eyeH) / 2 + 0.6, templeX: cx - hr * 0.42 } };
}
function serpLimbFrame(key, f) {
  const P = SERP[key], r = P.rMax, C = P.c;
  if (P.legs === 'flip') {
    const S = new Spr(r * 2.8, r * 2.4), ax = r * 1.4, ay = r * 0.5, a = f ? 1.95 : 2.55, L = r * 1.15;
    const M = S.mat(mixC(C.body, C.frill, 0.45), { alpha: 0.92 });
    S.ellipsoid(ax + Math.cos(a) * L * 0.5, ay + Math.sin(a) * L * 0.5, L * 0.55, r * 0.34, M, { ang: a, z: 1, flat: 0.5, fn: q => ({ l: 0.55 + (q.lx > 0.5 ? 0.12 : 0) + ((Math.floor((q.ly + 1) * 2.5)) & 1 ? -0.06 : 0) }) });
    return { spr: S, meta: { ax, ay } };
  }
  const S = new Spr(r * 3, r * 2.4), ax = r * 1.6, ay = r * 0.5, B = S.mat(C.body), H = S.mat(C.horn), a1 = f ? 2.05 : 2.45, a2 = f ? 1.55 : 1.95;
  const ex = ax + Math.cos(a1) * r * 0.58, ey = ay + Math.sin(a1) * r * 0.58, wx = ex + Math.cos(a2) * r * 0.46, wy = ey + Math.sin(a2) * r * 0.46;
  S.tube([{ x: ax, y: ay, r: r * 0.34 }, { x: ex, y: ey, r: r * 0.27 }, { x: wx, y: wy, r: r * 0.21 }], B, { fn: q => q.v < -0.4 ? { l: q.l + 0.06 } : undefined });
  for (let k = -1; k <= 1; k++) { const ca = a2 - 0.9 + k * 0.4; S.tube([{ x: wx, y: wy, r: Math.max(0.6, r * 0.07) }, { x: wx + Math.cos(ca) * r * 0.26, y: wy + Math.sin(ca) * r * 0.26, r: 0.5 }], H, { z: 1 }); }
  return { spr: S, meta: { ax, ay } };
}
function serpTailFrame(key, f) {
  const P = SERP[key], r = P.rMax, C = P.c, big = P.tail === 'bigfrill', L = { heart: r * 1.2, fan: r * 1.5, frill: r * 2.1, bigfrill: r * 2.3 }[P.tail];
  const S = new Spr(L + 4, L * 1.6 + 4), ax = L + 2, ay = (L * 1.6 + 4) / 2, M = S.mat(C.frill, { alpha: 0.85, dither: 0.6 }), SP = S.mat(C.crest || C.dorsal), GL = P.glow ? S.mat(C.spot, { glow: C.spot + 'ee' }) : null;
  const flap = f ? 0.14 : -0.14;
  if (P.tail === 'heart') { for (const s of [-1, 1]) { const a = Math.PI + s * 0.55 + flap; S.ellipsoid(ax + Math.cos(a) * L * 0.45, ay + Math.sin(a) * L * 0.45, L * 0.5, L * 0.32, M, { ang: a, z: 1, flat: 0.5, fn: q => ({ l: 0.58 + (q.lx > 0.4 ? 0.1 : 0) }) }); } return { spr: S, meta: { ax, ay } }; }
  const n = P.tail === 'fan' ? 3 : big ? 5 : 4;
  for (let k = 0; k < n; k++) {
    const off = k - (n - 1) / 2, a = Math.PI + off * 0.42 + flap, len = L * (1 - Math.abs(off) * 0.12), tip = [ax + Math.cos(a) * len, ay + Math.sin(a) * len], sd = [Math.cos(a + 1.57) * r * 0.3, Math.sin(a + 1.57) * r * 0.3];
    S.poly([[ax + sd[0], ay + sd[1]], tip, [ax - sd[0], ay - sd[1]]], M, { z: 1, fn: q => ({ l: 0.5 + ((Math.round(q.x * 2 + q.y) % 4) === 0 ? -0.12 : 0.05) }) });
    if (P.tail !== 'fan') S.tube([{ x: ax, y: ay, r: Math.max(0.6, r * 0.06) }, { x: tip[0], y: tip[1], r: 0.5 }], SP, { z: 1.1 });
    if (GL) S.put(tip[0], tip[1], GL, 0.8, 1.2);
  }
  return { spr: S, meta: { ax, ay } };
}
for (const k of ['baby', 'young', 'teen', 'adult']) {
  defSheet('petHead_' + k, () => makeSheet(6, f => serpHeadFrame(k, f), { outer: '#07122455' }));
  defSheet('petLimb_' + k, () => makeSheet(2, f => serpLimbFrame(k, f), { outer: '#07122444' }));
  defSheet('petTail_' + k, () => makeSheet(2, f => serpTailFrame(k, f), { outer: '#07122444' }));
}
defSheet('petEgg_serpent', () => makeSheet(3, f => {
  const S = new Spr(20, 24), E = S.mat('#9ef0e0', { glow: '#9ef0e044' }), SP = S.mat('#fff4d8'), CR = S.mat('#2a3a4a');
  S.ellipsoid(10, 13.5, 7, 9.5, E, { z: 1, spec: 0.35, fn: q => hash2(Math.floor(q.x / 2), Math.floor(q.y / 2), 21) < 0.16 ? { m: SP } : undefined });
  if (f >= 1) { let x = 5, y = 9; for (let k = 0; k < 9; k++) { S.put(x, y, CR, 0.2, 2); x += 1; y += (k % 2 ? -1 : 1); } }
  if (f >= 2) { let x = 7, y = 15; for (let k = 0; k < 7; k++) { S.put(x, y, CR, 0.2, 2); x += 1; y += (k % 2 ? 1 : -1); } S.put(10, 6, CR, 0.2, 2); S.put(10, 7, CR, 0.2, 2); }
  return { spr: S, meta: { ax: 10, ay: 22 } };
}, { outer: '#07122455' }));

// ---------------- corpo desenhado em tempo real ----------------
function packRamp(col, alpha = 1, o = {}) { return Uint32Array.from(makeRamp(col, 7, o).map(c => { const v = toRGBA(c); return ((Math.round(alpha * 255) << 24) | (v[2] << 16) | (v[1] << 8) | v[0]) >>> 0; })); }
// materiais: 1 corpo, 2 barriga, 3 dorso, 4 pintas, 5 crista, 6 membrana, 7-8 suéter (se vestir)
function serpPalette(k, sw) { const C = SERP[k].c, p = [null, packRamp(C.body), packRamp(C.belly, 1, { dark: 0.62, hue: 8 }), packRamp(C.dorsal), packRamp(C.spot), packRamp(C.crest || C.dorsal), packRamp(C.frill, 0.86)]; if (sw) p.push(packRamp(sw.c1), packRamp(sw.c2)); return p; }
class SerpentRenderer {
  constructor() { this.cv = makeCanvas(4, 4); this.g = this.cv.getContext('2d'); this.W = 0; this.H = 0; this.glow = []; }
  alloc(w, h) {
    if (w <= this.W && h <= this.H) return;
    this.W = Math.max(w, this.W) + 24; this.H = Math.max(h, this.H) + 24;
    this.cv.width = this.W; this.cv.height = this.H; this.img = this.g.createImageData(this.W, this.H);
    this.buf = new Uint32Array(this.img.data.buffer); this.mat = new Uint8Array(this.W * this.H); this.ri = new Uint8Array(this.W * this.H); this.z = new Float32Array(this.W * this.H);
  }
  render(pts, P, pal, ds, key, sw) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { const m = p.r * 2 + 2; x0 = Math.min(x0, p.x - m); x1 = Math.max(x1, p.x + m); y0 = Math.min(y0, p.y - m); y1 = Math.max(y1, p.y + m); }
    x0 = Math.floor(x0); y0 = Math.floor(y0); const w = Math.ceil(x1) - x0, h = Math.ceil(y1) - y0;
    this.alloc(w, h); const WW = this.W, mat = this.mat, z = this.z, ri = this.ri, buf = this.buf;
    for (let y = 0; y < h; y++) { const s = y * WW; mat.fill(0, s, s + w); z.fill(-1e9, s, s + w); buf.fill(0, s, s + w); }
    const N = pts.length, sArr = [0];
    for (let i = 1; i < N; i++) sArr.push(sArr[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    this.glow = []; this.sw = sw || null;
    // crista dorsal (atrás do corpo)
    if (P.crest !== 'none') {
      const big = P.crest === 'bigspines', bumps = P.crest === 'bumps', step = bumps ? 2 : 1;
      let prev = null;
      for (let i = 1; i < N * (bumps ? 0.8 : 0.9); i += step) {
        const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, tx = dx / l, ty = dy / l, nx = -ty * ds, ny = tx * ds;
        const hgt = b.r * (bumps ? 0.4 : big ? 0.85 : 0.72) * (1 - i / N * 0.5);
        const base = [b.x + nx * b.r * 0.72, b.y + ny * b.r * 0.72], tip = [base[0] + nx * hgt + tx * hgt * 0.55, base[1] + ny * hgt + ty * hgt * 0.55];
        const zb = (1000 - i) - 5;
        if (!bumps && prev) { this.tri(prev.base, prev.tip, tip, 6, zb - 0.5, x0, y0, w, h, 0.5); this.tri(prev.base, tip, base, 6, zb - 0.5, x0, y0, w, h, 0.5); }
        this.tri([base[0] - tx * b.r * 0.22, base[1] - ty * b.r * 0.22], tip, [base[0] + tx * b.r * 0.22, base[1] + ty * b.r * 0.22], bumps ? 3 : 5, zb, x0, y0, w, h, 0.5);
        if (P.glow && i % 3 === 0) this.glow.push(tip);
        prev = { base, tip };
      }
    }
    for (let k = N - 2; k >= 0; k--) this.seg(pts[k], pts[k + 1], k, sArr[k], sArr[k + 1], ds, x0, y0, w, h, P, key, k === 0, k === N - 2);
    // contorno seletivo e cor final
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * WW + x, m = mat[i]; if (!m) continue;
      let r = ri[i];
      const up = y > 0 ? mat[i - WW] : 0, dn = y < h - 1 ? mat[i + WW] : 0, lf = x > 0 ? mat[i - 1] : 0, rt = x < w - 1 ? mat[i + 1] : 0;
      if (!dn || !lf || !rt) r = Math.min(r, 1); else if (!up) r = Math.max(0, r - 1);
      const zi = z[i];
      if ((lf && z[i - 1] > zi + 3) || (rt && z[i + 1] > zi + 3) || (up && z[i - WW] > zi + 3) || (dn && z[i + WW] > zi + 3)) r = Math.max(0, Math.min(r, ri[i] - 2));
      buf[i] = pal[m][r];
    }
    this.g.putImageData(this.img, 0, 0, 0, 0, w, h);
    return { x0, y0, w, h };
  }
  tri(a, b, c, m, zz, x0, y0, w, h, lum) {
    const minx = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]) - x0)), maxx = Math.min(w - 1, Math.ceil(Math.max(a[0], b[0], c[0]) - x0));
    const miny = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]) - y0)), maxy = Math.min(h - 1, Math.ceil(Math.max(a[1], b[1], c[1]) - y0));
    const e = (p, q, x, y) => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]);
    const area = e(a, b, c[0], c[1]); if (Math.abs(area) < 0.01) return;
    for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
      const px = x + x0 + 0.5, py = y + y0 + 0.5, w0 = e(b, c, px, py) / area, w1 = e(c, a, px, py) / area, w2 = e(a, b, px, py) / area;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      const i = y * this.W + x; if (zz <= this.z[i]) continue;
      this.z[i] = zz; this.mat[i] = m; this.ri[i] = clamp(Math.floor((lum + (m === 6 ? ((x + y) % 3 === 0 ? -0.12 : 0.05) : w1 * 0.3)) * 6 + 0.5), 0, 6);
    }
  }
  seg(a, b, k, sa, sb, ds, x0, y0, w, h, P, key, first, last) {
    const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1e-6, L = Math.sqrt(L2), iL2 = 1 / L2, dnx = -dy / L * ds, dny = dx / L * ds;
    const rM = Math.max(a.r, b.r) + 1, WW = this.W, cute = key === 'baby' || key === 'young', sw = this.sw;
    // gomos internos só cobrem um pouco além das próprias pontas (as juntas ficam com o vizinho)
    const tLo = first ? -1e9 : -Math.min(1.2, (a.r * 0.55) / L), tHi = last ? 1e9 : 1 + Math.min(1.2, (b.r * 0.55) / L);
    const bx0 = Math.max(0, Math.floor(Math.min(a.x, b.x) - rM - x0)), bx1 = Math.min(w - 1, Math.ceil(Math.max(a.x, b.x) + rM - x0));
    const by0 = Math.max(0, Math.floor(Math.min(a.y, b.y) - rM - y0)), by1 = Math.min(h - 1, Math.ceil(Math.max(a.y, b.y) + rM - y0));
    const L0 = LIGHT[0], L1 = LIGHT[1], L2l = LIGHT[2];
    for (let y = by0; y <= by1; y++) {
      const py = y + y0 + 0.5 - a.y;
      for (let x = bx0; x <= bx1; x++) {
        const px = x + x0 + 0.5 - a.x; let t = (px * dx + py * dy) * iL2;
        if (t < tLo || t > tHi) continue;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = px - dx * t, ey = py - dy * t, d2 = ex * ex + ey * ey, r = a.r + (b.r - a.r) * t;
        if (d2 > r * r) continue;
        const d = Math.sqrt(d2), q = d / r, nz = Math.sqrt(1 - q * q), zz = (1000 - k) + nz * 0.6, i = y * WW + x;
        if (zz <= this.z[i]) continue;
        const nx = d > 1e-6 ? ex / d * q : 0, ny = d > 1e-6 ? ey / d * q : 0;
        let l = 0.1 + 0.72 * (0.24 + 0.76 * Math.max(0, nx * L0 + ny * L1 + nz * L2l)) + 0.05 * Math.max(0, ny);
        const v = (ex * dnx + ey * dny) / r, s = sa + (sb - sa) * t;
        let m = 1;
        if (sw && s < sw.len) {          // suéter: listras ou estrelinhas de pijama, com punho no fim
          if (s > sw.len - 1.8) m = 8;
          else if (sw.pat === 'stripe') m = (((s / sw.st) | 0) & 1) ? 8 : 7;
          else m = swDetail(sw.pat, Math.floor(s), Math.floor((v + 1) * r)) ? 8 : 7;
          l += ((x + y) & 1) ? 0.025 : -0.025;
        } else {
          if (v < -0.42) { m = 2; if (!cute && ((s / 3) | 0) & 1 && v > -0.92) l -= 0.07; }
          else if (v > 0.62 && !cute) m = 3;
          if (m === 1) {
            if (cute) { if (hash2(Math.floor(s / 2.6), Math.floor((v + 1) * 2.2), 7) < 0.1) m = 4; }
            else {
              const row = ((v + 1) * 3.2) | 0, cell = ((s + (row & 1) * 1.5) % 3 + 3) % 3; l += cell < 0.8 ? 0.06 : cell > 2.2 ? -0.07 : 0;
              if (P.glow && Math.abs((s % 10) - 5) < 0.9 && Math.abs(v - 0.22) < 0.12) { m = 4; if (nz > 0.6 && (Math.abs((s % 10) - 5) < 0.5)) this.glow.push([x + x0, y + y0]); }
            }
          }
        }
        this.z[i] = zz; this.mat[i] = m;
        this.ri[i] = clamp(Math.floor(l * 6 + 0.5 + (BAYER[(y & 3) * 4 + (x & 3)] - 0.5) * 0.4), 0, 6);
      }
    }
  }
}

// ---------------- a serpente ----------------
class SerpentPet extends Pet {
  constructor(s) { super(s); }
  setupStage(fresh) {
    const k = this.key;
    if (!this.renderer) { this.renderer = new SerpentRenderer(); this.bodyDir = 1; this.bodyBox = null; }
    if (k === 'egg') { const n = this.nestPos(); this.hx = n.x; this.hy = n.y; this.P = null; return; }
    const P = SERP[k]; this.P = P; this.prof = SERP_PROF[k];
    this.head = sheet('petHead_' + k); this.limb = sheet('petLimb_' + k); this.tail = sheet('petTail_' + k); this.wk = null; this.bodyBox = null;
    const N = Math.max(6, Math.ceil(P.len / P.spacing) + 1), old = this.pts;
    if (fresh || !old) { const n = this.nestPos(); this.hx = n.x + 8; this.hy = n.y - P.rMax - 4; }
    // reamostra o corpo antigo no novo espaçamento e estica o resto em linha reta
    const src = (!fresh && old && old.length > 1) ? old : [{ x: this.hx, y: this.hy }, { x: this.hx - this.dir * 10, y: this.hy + 1 }];
    this.pts = [{ x: src[0].x, y: src[0].y, r: 1 }];
    let seg = 0, t = 0;
    for (let i = 1; i < N; i++) {
      let need = P.spacing;
      while (seg < src.length - 1) { const a = src[seg], b = src[seg + 1], L = Math.hypot(b.x - a.x, b.y - a.y) || 0.001, rem = L * (1 - t); if (rem >= need) { t += need / L; break; } need -= rem; seg++; t = 0; }
      if (seg >= src.length - 1) { const a = src[src.length - 2], b = src[src.length - 1], L = Math.hypot(b.x - a.x, b.y - a.y) || 1, pr = this.pts[i - 1]; this.pts.push({ x: pr.x + (b.x - a.x) / L * P.spacing, y: pr.y + (b.y - a.y) / L * P.spacing, r: 1 }); }
      else { const a = src[seg], b = src[seg + 1]; this.pts.push({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), r: 1 }); }
    }
    for (let i = 0; i < N; i++) this.pts[i].r = Math.max(1, P.rMax * this.prof(i / (N - 1)));
    this.hm = this.head;
    const nk = PET_KEYS[this.s.stage + 1];   // já prepara os sprites do próximo estágio
    if (nk && !this.s.preview) setTimeout(() => { try { sheet('petHead_' + nk); sheet('petLimb_' + nk); sheet('petTail_' + nk); } catch (e) { console.error(e); } }, 5000);
  }
  // pose de descanso: enrolada no ninho (pequenos) ou estirada nas ruínas (grandes)
  restPose() {
    const k = this.key, P = this.P, N = this.pts.length, out = [];
    if (k === 'baby' || k === 'young') {
      const n = this.nestPos(), Rc = Math.max(P.rMax * 1.6, P.len / 5.2), cx = n.x - 2, cy = n.y - P.rMax * 0.55;
      let a = 0.5; for (let i = 0; i < N; i++) { out.push({ x: cx + Math.cos(a) * Rc, y: cy + Math.sin(a) * Rc * 0.42 }); a -= P.spacing / Rc * 1.15; }
      return out;
    }
    const sx = LAIR.x + lairShift(), sy = LAIR.y + RUIN_G, path = PET_DRAPE.map(([x, y]) => ({ x: sx + x, y: sy + y }));
    let seg = 0, t = 0; out.push({ x: path[0].x, y: path[0].y });
    for (let i = 1; i < N; i++) {
      let need = P.spacing;
      while (seg < path.length - 1) {
        const a = path[seg], b = path[seg + 1], L = Math.hypot(b.x - a.x, b.y - a.y), rem = L * (1 - t);
        if (rem >= need) { t += need / L; break; }
        need -= rem; seg++; t = 0;
      }
      const a = path[Math.min(seg, path.length - 1)], b = path[Math.min(seg + 1, path.length - 1)];
      out.push({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
    }
    return out;
  }
  restHead() { const p = this.restPose()[0]; return { x: p.x, y: p.y, face: 1 }; }
  mouthOff() { const m = this.hm; return { x: m.mx - m.ax, y: m.my - m.ay }; }
  headOff() { const m = this.hm; return { x: m.cx - m.ax, y: m.cy - m.ay }; }
  hitRadius() { return this.hm.hitR; }
  sparkPoint() { const p = this.pts[randi(0, this.pts.length - 1)]; return { x: p.x + rand(-p.r, p.r), y: p.y + rand(-p.r, p.r) }; }
  updateBody(dt) {
    const P = this.P, pts = this.pts, N = pts.length, sp = P.spacing;
    pts[0].x = this.hx; pts[0].y = this.hy + this.hop;
    this.restW += ((this.restTarget ? 1 : 0) - this.restW) * Math.min(1, dt * 1.1);
    if (this.restW > 0.02) { const rp = this.restPose(), kk = Math.min(1, dt * 3 * this.restW); for (let i = 1; i < N; i++) { pts[i].x += (rp[i].x - pts[i].x) * kk; pts[i].y += (rp[i].y - pts[i].y) * kk; } }
    for (let i = 1; i < N; i++) {
      const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
      if (d > sp) { b.x = a.x + dx / d * sp; b.y = a.y + dy / d * sp; } else if (d < sp * 0.5) { b.x = a.x + dx / d * sp * 0.5; b.y = a.y + dy / d * sp * 0.5; }
      if (b.y > groundTop + 8) b.y = groundTop + 8; if (b.y < waterTop + 2) b.y = waterTop + 2;
    }
    const mid = pts[Math.min(3, N - 1)].x - pts[0].x; if (mid < -1.5) this.bodyDir = 1; else if (mid > 1.5) this.bodyDir = -1;
  }
  renderPts() {
    const pts = this.pts, N = pts.length, mv = clamp(Math.hypot(this.vx, this.vy) / this.P.speed, 0.12, 1), amp = this.P.rMax * 0.32 * mv * (1 - this.restW * 0.85), br = 1 + 0.035 * Math.sin(this.t * 1.3), out = [];
    for (let i = 0; i < N; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, w = Math.sin(this.t * (this.key === 'baby' ? 7 : 4.5) - i * 0.55) * amp * Math.pow(i / (N - 1), 0.8);
      out.push({ x: pts[i].x - dy / l * w, y: pts[i].y + dx / l * w, r: pts[i].r * br });
    }
    return out;
  }
  // retrato para a escolha de espécie
  previewPose(x, y) {
    const P = this.P; this.hx = x + 8; this.hy = y - 2; this.dir = 1; this.bodyDir = 1;
    this.pts.forEach((p, i) => { p.x = this.hx - i * P.spacing * 0.85; p.y = this.hy + 3 + Math.sin(i * 0.55) * 2; });
  }
  // coordenada do sprite da cabeça → mundo
  hpt(lx, ly) { const m = this.hm, sh = this.shake > 0 ? Math.round(Math.sin(this.t * 40) * 1.5) : 0; return { x: this.hx + (lx - m.ax) * this.dir + sh, y: this.hy + this.hop + (ly - m.ay) }; }
  // colarinho logo atrás da cabeça, atravessando o pescoço na direção em que ele está (a garganta é o lado da barriga)
  neckRing() {
    const rp = this.lastRp || this.pts, want = this.P.hr * 0.3 + 1.5, ds = this.bodyDir;
    let acc = 0, i = 1;
    for (; i < rp.length - 2; i++) { acc += Math.hypot(rp[i].x - rp[i - 1].x, rp[i].y - rp[i - 1].y); if (acc >= want) break; }
    const a = rp[i - 1], b = rp[i + 1], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, tx = dx / l, ty = dy / l, p = rp[i];
    return { x: p.x, y: p.y, rx: 1, ry: p.r * 0.95 + 0.5, orient: 'side', tan: [tx, ty], bel: [ty * ds, -tx * ds], dir: this.dir };
  }
  wearAnchors() {
    const m = this.hm, hat = this.hpt(m.hatX, m.hatY), e = this.hpt(m.eyeX, m.eyeY), tb = this.hpt(m.templeX, m.eyeY);
    return { hat: { x: hat.x, y: hat.y, w: m.hatW, dir: this.dir }, neck: this.neckRing(),
      face: { eyes: [{ x: e.x, y: e.y, r: m.eyeR }], back: tb, dir: this.dir, side: true } };
  }
  // faixas da capa sobre as costas (do pescoço para trás)
  capeSecs(rp) {
    const N = rp.length, P = this.P, ds = this.bodyDir, L = Math.min(N - 2, Math.max(4, Math.round(Math.min(P.len * 0.5, 90) / P.spacing))), out = [];
    for (let i = 1; i <= L; i++) {
      const a = rp[i - 1], b = rp[i], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l * ds, ny = dx / l * ds, u = (i - 1) / Math.max(1, L - 1), r = b.r;
      const wave = Math.sin(this.t * 6 - u * 5) * r * 0.3 * u, o1 = r * 0.15, o2 = r * (1.05 + u * 0.8) + wave;
      out.push([b.x + nx * o1, b.y + ny * o1, b.x + nx * o2 - dx / l * u * r * 0.3, b.y + ny * o2 - dy / l * u * r * 0.3]);
    }
    return out;
  }
  drawBody(g) {
    const P = this.P, rp = this.lastRp = this.renderPts(), N = rp.length, ds = this.bodyDir, sw = sweaterOf(this), wk = sw ? sw.pat + sw.c1 + sw.c2 : '-';
    if (wk !== this.wk) { this.wk = wk; this.pal = serpPalette(this.key, sw); this.bodyBox = null; }
    // pata do lado de lá e cauda (atrás)
    const legI = Math.max(1, Math.round(N * (P.legs === 'flip' ? 0.3 : 0.16))), limb = (i, near) => {
      const a = rp[Math.max(0, i - 1)], b = rp[Math.min(N - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, nx = dy / l * ds, ny = -dx / l * ds, p = rp[i];
      const f = Math.floor(this.t * (Math.hypot(this.vx, this.vy) > 4 ? 5 : 1.5) + (near ? 0 : 1)) % 2;
      drawSprite(this.limb, f, p.x + nx * p.r * (near ? 0.55 : 0.2) + (near ? 0 : -ds * 2), p.y + ny * p.r * (near ? 0.55 : 0.2) - (near ? 0 : 1), ds, g);
    };
    limb(legI, false); if (this.key === 'adult') limb(Math.round(N * 0.52), false);
    const tl = rp[N - 1], tp = rp[N - 2], tdir = tl.x <= tp.x ? 1 : -1;
    drawSprite(this.tail, Math.floor(this.t * 3) % 2, tl.x, tl.y, tdir, g);
    // corpos grandes e lentos são redesenhados a cada 2-3 quadros (movem < 1 px por quadro)
    const every = this.key === 'adult' ? (this.restW > 0.8 ? 3 : 2) : this.key === 'teen' && this.restW > 0.8 ? 2 : 1;
    this.frameN = (this.frameN || 0) + 1;
    if (!this.bodyBox || this.frameN % every === 0 || this.state === 'evolve') {
      const cute = this.key === 'baby' || this.key === 'young';
      this.bodyBox = this.renderer.render(rp, P, this.pal, ds, this.key, sw ? { len: P.len * (cute ? 0.5 : 0.3), st: Math.max(2, Math.round(P.rMax * 0.45)), pat: sw.pat } : null);
    }
    const bb = this.bodyBox;
    g.drawImage(this.renderer.cv, 0, 0, bb.w, bb.h, bb.x0, bb.y0, bb.w, bb.h);
    if (this.state === 'evolve') { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 + 0.35 * Math.sin(this.evolveT * 14); g.drawImage(this.renderer.cv, 0, 0, bb.w, bb.h, bb.x0, bb.y0, bb.w, bb.h); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    if (wearOf(this, 'body') && wearOf(this, 'body').id === 'capa') drawCape(this, g, this.capeSecs(rp));
    limb(legI, true); if (this.key === 'adult') limb(Math.round(N * 0.52), true);
    // cabeça
    const sh = this.shake > 0 ? Math.round(Math.sin(this.t * 40) * 1.5) : 0;
    drawSprite(this.head, this.expr, this.hx + sh, this.hy + this.hop, this.dir, g);
    // bigodes
    if (P.whisk) {
      const m = this.hm, sx = this.hx + (m.sx - m.ax) * this.dir, sy = this.hy + this.hop + (m.sy - m.ay);
      g.fillStyle = '#e8ddb0';
      for (const s2 of [0, 1]) for (let k = 0; k < P.whisk; k++) { const x = sx - this.dir * k * 1.05 + (s2 ? 1 : 0), y = sy + 1 + k * 0.32 + Math.sin(this.t * 1.1 - k * 0.3 + s2 * 2) * k * 0.1; g.globalAlpha = 0.9 - k / P.whisk * 0.6; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
      g.globalAlpha = 1;
    }
    drawWearHead(this, g);
  }
  glowBody(a) {
    if (!this.P.glow || !this.bodyBox) return;
    ctx.fillStyle = '#9ffcff';
    for (const p of this.renderer.glow) { ctx.globalAlpha = (0.25 + a * 0.75) * (0.6 + 0.4 * Math.sin(this.t * 1.5 + p[0] * 0.3)); ctx.fillRect(Math.round(p[0]), Math.round(p[1]), 1, 1); }
    if (a > 0.3) { ctx.globalAlpha = a * 0.35; const c = this.headCenter(); ctx.drawImage(glowSprite('#7ff8ff', 14), Math.round(c.x - 14), Math.round(c.y - 14)); }
    ctx.globalAlpha = 1;
  }
}
SPECIES.serpent = { name: 'Serpente-marinha', baby: 'serpente-marinha', desc: 'Comprida e brincalhona. Vira um dragão do mar que dorme estirado nas ruínas.', egg: 'petEgg_serpent', eggGlow: '#9ef0e0', shellC: '#bff6ea', cls: SerpentPet };
