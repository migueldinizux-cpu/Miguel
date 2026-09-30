'use strict';
// =====================================================================
//  Motor de arte: sprites procedurais com volume, rampas e contorno
// =====================================================================
const LIGHT = (() => { const v = [-0.38, -0.82, 0.45], l = Math.hypot(...v); return v.map(c => c / l); })();
const HALFV = (() => { const v = [LIGHT[0], LIGHT[1], LIGHT[2] + 1], l = Math.hypot(...v); return v.map(c => c / l); })();
// luz comprimida em ~[0.15, 0.82]; só o brilho especular chega ao topo da rampa
function lit(nx, ny, nz, amb = 0.24, dif = 0.76, spec = 0.2, shin = 16) {
  const d = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
  const s = Math.max(0, nx * HALFV[0] + ny * HALFV[1] + nz * HALFV[2]);
  return 0.1 + 0.72 * (amb + dif * Math.max(0, d)) + spec * Math.pow(s, shin) + 0.05 * Math.max(0, ny);
}
function inPoly(x, y, pts) {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) ins = !ins;
  }
  return ins;
}
// textura de escamas (retorna ajuste de luz)
function scaleTex(x, y, s = 3) {
  const row = Math.floor(y / 2), off = (row & 1) ? Math.floor(s / 2) : 0;
  const cx = ((x + off) % s + s) % s, cy = ((y % 2) + 2) % 2;
  if (cy === 1 && cx !== 0) return -0.07;
  if (cx === 0 && cy === 0) return 0.05;
  return 0;
}

class Spr {
  constructor(w, h) {
    this.w = Math.max(1, Math.ceil(w)); this.h = Math.max(1, Math.ceil(h));
    const n = this.w * this.h;
    this.m = new Int16Array(n).fill(-1); this.l = new Float32Array(n); this.z = new Float32Array(n).fill(-1e9);
    this.ov = null; this.mats = [];
  }
  mat(color, o = {}) {
    this.mats.push({ ramp: o.ramp || makeRamp(color, o.n || 7, { hue: o.hue, dark: o.dark, light: o.light }), alpha: o.alpha ?? 1, dither: o.dither ?? 1, noOutline: !!o.noOutline, glow: o.glow || null, edge: o.edge });
    return this.mats.length - 1;
  }
  put(x, y, m, l, z = 0) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x; if (z < this.z[i]) return;
    this.z[i] = z; this.m[i] = m; this.l[i] = l;
  }
  has(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.m[y * this.w + x] >= 0; }
  addL(x, y, d) { x = Math.floor(x); y = Math.floor(y); if (this.has(x, y)) this.l[y * this.w + x] += d; }
  setM(x, y, m) { x = Math.floor(x); y = Math.floor(y); if (this.has(x, y)) this.m[y * this.w + x] = m; }
  del(x, y) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) { const i = y * this.w + x; this.m[i] = -1; this.z[i] = -1e9; } }
  dot(x, y, color) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; if (!this.ov) this.ov = new Map(); this.ov.set(y * this.w + x, color); }
  _apply(o, args, m, l) {
    if (!o.fn) return [m, l];
    args.l = l;
    const r = o.fn(args); if (r === null) return null;
    if (r === undefined) return [m, l];
    if (typeof r === 'number') return [m, r];
    return [r.m ?? m, r.l ?? l];
  }
  // elipsoide com normal suave
  ellipsoid(cx, cy, rx, ry, m, o = {}) {
    const z = o.z || 0, ang = o.ang || 0, co = Math.cos(ang), si = Math.sin(ang), R = Math.max(rx, ry) + 1, flat = o.flat ?? 0.9;
    for (let y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++) for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, lx = (dx * co + dy * si) / rx, ly = (-dx * si + dy * co) / ry, d2 = lx * lx + ly * ly;
      if (d2 > 1) continue;
      const nz = Math.sqrt(1 - d2), wx = (lx * co - ly * si) * flat, wy = (lx * si + ly * co) * flat;
      const r = this._apply(o, { x, y, lx, ly, nx: wx, ny: wy, nz, d2 }, m, lit(wx, wy, nz, o.amb, o.dif, o.spec, o.shin));
      if (!r) continue;
      this.put(x, y, r[0], r[1], z + nz * (o.zb ?? 0.01));
    }
  }
  // tubo ao longo de uma polilinha [{x,y,r,z}]
  tube(pts, m, o = {}) {
    let sAcc = 0;
    for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[k], b = pts[k + 1], dx = b.x - a.x, dy = b.y - a.y, len2 = dx * dx + dy * dy || 1e-6, len = Math.sqrt(len2);
      const pnx = dy / len, pny = -dx / len;  // normal "dorsal" (à direita do sentido)
      const rM = Math.max(a.r, b.r) + 1;
      for (let y = Math.floor(Math.min(a.y, b.y) - rM); y <= Math.ceil(Math.max(a.y, b.y) + rM); y++)
        for (let x = Math.floor(Math.min(a.x, b.x) - rM); x <= Math.ceil(Math.max(a.x, b.x) + rM); x++) {
          const px = x + 0.5 - a.x, py = y + 0.5 - a.y, t = clamp((px * dx + py * dy) / len2, 0, 1);
          const cx = a.x + dx * t, cy = a.y + dy * t, r = lerp(a.r, b.r, t);
          const ex = x + 0.5 - cx, ey = y + 0.5 - cy, d = Math.hypot(ex, ey);
          if (d > r) continue;
          const q = d / r, nz = Math.sqrt(Math.max(0, 1 - q * q));
          const nx = d > 1e-6 ? ex / d * q : 0, ny = d > 1e-6 ? ey / d * q : 0;
          const v = (ex * pnx + ey * pny) / r;   // +1 = lado dorsal
          const s = sAcc + t * len;
          const res = this._apply(o, { x, y, s, v, q, nx, ny, nz, k, t, r }, m, lit(nx, ny, nz, o.amb, o.dif, o.spec, o.shin));
          if (!res) continue;
          this.put(x, y, res[0], res[1], lerp(a.z || 0, b.z || 0, t) + nz * 0.02);
        }
      sAcc += len;
    }
    return sAcc;
  }
  poly(pts, m, o = {}) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      if (!inPoly(x + 0.5, y + 0.5, pts)) continue;
      const r = this._apply(o, { x, y }, m, o.l ?? 0.55); if (!r) continue;
      this.put(x, y, r[0], r[1], o.z || 0);
    }
  }
  line(x0, y0, x1, y1, m, l = 0.5, z = 0) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (;;) { this.put(x0, y0, m, typeof l === 'function' ? l(x0, y0) : l, z); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  // desenha um olho redondo (sobreposição de cor)
  eye(x, y, size, iris = '#d8a93a', pupil = '#0a0a12') {
    x = Math.round(x); y = Math.round(y);
    if (size <= 1) { this.dot(x, y, pupil); return; }
    if (size === 2) { this.dot(x, y, '#f4fbff'); this.dot(x + 1, y, pupil); this.dot(x, y + 1, pupil); this.dot(x + 1, y + 1, pupil); return; }
    if (size === 3) {
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) this.dot(x + i, y + j, j === 2 ? shade(iris, -0.3) : iris);
      this.dot(x + 1, y + 1, pupil); this.dot(x + 2, y + 1, pupil); this.dot(x, y, '#ffffff'); return;
    }
    const ring = [[1, 0], [2, 0], [0, 1], [3, 1], [0, 2], [3, 2], [1, 3], [2, 3]];
    for (const [i, j] of ring) this.dot(x + i, y + j, j >= 2 ? shade(iris, -0.3) : iris);
    this.dot(x + 1, y + 1, '#ffffff'); this.dot(x + 2, y + 1, pupil); this.dot(x + 1, y + 2, pupil); this.dot(x + 2, y + 2, pupil);
  }
  // converte em canvas: quantiza na rampa com dithering e aplica contorno seletivo
  bake(o = {}) {
    const { w, h } = this, n = w * h, dA = o.dither ?? 0.32, idx = new Int16Array(n).fill(-1);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, m = this.m[i]; if (m < 0) continue;
      const M = this.mats[m], R = M.ramp.length;
      idx[i] = clamp(Math.floor(clamp(this.l[i], 0, 1.05) * (R - 1) + 0.5 + (bayer(x, y) - 0.5) * dA * M.dither), 0, R - 1);
    }
    const out = idx.slice(), zt = o.zt ?? 0.15, ed = o.edgeDark ?? 1;
    if (o.outline !== false) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (idx[i] < 0) continue;
      const M = this.mats[this.m[i]]; if (M.noOutline) continue;
      let k = idx[i];
      const up = this.has(x, y - 1), dn = this.has(x, y + 1), lf = this.has(x - 1, y), rt = this.has(x + 1, y);
      if (!dn || !lf || !rt) k = Math.min(k, M.edge ?? ed);
      else if (!up) k = Math.max(0, k - 1);
      const z = this.z[i];
      if ((x > 0 && this.m[i - 1] >= 0 && this.z[i - 1] > z + zt) || (x < w - 1 && this.m[i + 1] >= 0 && this.z[i + 1] > z + zt) ||
          (y > 0 && this.m[i - w] >= 0 && this.z[i - w] > z + zt) || (y < h - 1 && this.m[i + w] >= 0 && this.z[i + w] > z + zt)) k = Math.max(0, Math.min(k, idx[i] - 2));
      out[i] = k;
    }
    const c = makeCanvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    const F = o.fog ? toRGBA(o.fog) : null, ft = o.fogT || 0;
    let glowPix = null;
    for (let i = 0; i < n; i++) {
      let col;
      if (this.ov && this.ov.has(i)) col = this.ov.get(i);
      else { if (out[i] < 0) continue; const M = this.mats[this.m[i]]; col = M.ramp[out[i]]; if (M.alpha < 1) col = alphaC(col, M.alpha); if (M.glow) (glowPix || (glowPix = [])).push(i, M.glow); }
      const v = toRGBA(col), j = i * 4;
      if (F && ft > 0) { d[j] = lerp(v[0], F[0], ft); d[j + 1] = lerp(v[1], F[1], ft); d[j + 2] = lerp(v[2], F[2], ft); }
      else { d[j] = v[0]; d[j + 1] = v[1]; d[j + 2] = v[2]; }
      d[j + 3] = Math.round(v[3] * 255);
    }
    if (o.outer) {
      const oc = toRGBA(o.outer), a = Math.round(oc[3] * 255), src = new Uint8ClampedArray(d);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const j = (y * w + x) * 4; if (src[j + 3] > 0) continue;
        const nb = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && src[(yy * w + xx) * 4 + 3] > 150;
        if (nb(x - 1, y) || nb(x + 1, y) || nb(x, y - 1) || nb(x, y + 1)) { d[j] = oc[0]; d[j + 1] = oc[1]; d[j + 2] = oc[2]; d[j + 3] = a; }
      }
    }
    g.putImageData(img, 0, 0);
    this.glowCanvas = null;
    if (glowPix) {
      const gc = makeCanvas(w, h), gg = gc.getContext('2d'), gi = gg.createImageData(w, h), gd = gi.data;
      for (let k = 0; k < glowPix.length; k += 2) { const i = glowPix[k], v = toRGBA(glowPix[k + 1]), j = i * 4; gd[j] = v[0]; gd[j + 1] = v[1]; gd[j + 2] = v[2]; gd[j + 3] = Math.round(v[3] * 255); }
      gg.putImageData(gi, 0, 0); this.glowCanvas = gc;
    }
    return c;
  }
}

// ---------------- folhas de sprite ----------------
const SHEETS = {}, SHEET_DEFS = {};
function defSheet(name, fn) { SHEET_DEFS[name] = fn; }
function sheet(name) { if (!SHEETS[name]) { const f = SHEET_DEFS[name]; if (!f) throw new Error('sheet ' + name); SHEETS[name] = f(); } return SHEETS[name]; }
function makeSheet(nF, build, bo = {}) {
  const r = [], gr = []; let meta = {};
  for (let f = 0; f < nF; f++) { const res = build(f, nF); const spr = res.spr || res; if (res.meta) meta = res.meta; r.push(spr.bake(bo)); gr.push(spr.glowCanvas); }
  const hasGlow = gr.some(Boolean);
  return Object.assign({ r, l: r.map(flipH), gr: hasGlow ? gr : null, gl: hasGlow ? gr.map(flipH) : null, w: r[0].width, h: r[0].height, n: nF, ax: r[0].width / 2, ay: r[0].height / 2 }, meta);
}
function drawSprite(sh, f, x, y, dir = 1, g = ctx) {
  f = ((f % sh.n) + sh.n) % sh.n;
  const img = dir < 0 ? sh.l[f] : sh.r[f], ax = dir < 0 ? sh.w - sh.ax : sh.ax;
  g.drawImage(img, Math.round(x - ax), Math.round(y - sh.ay));
}
function drawSpriteGlow(sh, f, x, y, dir = 1) {
  if (!sh.gr) return; f = ((f % sh.n) + sh.n) % sh.n;
  const img = dir < 0 ? sh.gl[f] : sh.gr[f]; if (!img) return;
  const ax = dir < 0 ? sh.w - sh.ax : sh.ax;
  ctx.drawImage(img, Math.round(x - ax), Math.round(y - sh.ay));
}

// ---------------- gerador de peixes ----------------
// perfil padrão: u=0 (pedúnculo) .. u=1 (focinho)
function fishFrame(o, f, nF) {
  const L = o.len, TL = o.tail, h = o.h, ts = o.tailSpread, ph = f / nF * TAU;
  const dH = o.dorsal ? o.dorsal.h * 1.15 : 0, aH = o.anal ? o.anal.h * 1.15 : 0;
  const padT = Math.ceil(Math.max(dH + 1, ts - h + 2, o.padT || 0)) + 2, padB = Math.ceil(Math.max(aH + 1, ts - h + 2, o.padB || 0)) + 2;
  const cy = padT + h, bx0 = TL + 2 + (o.padL || 0), gw = bx0 + L + 2 + (o.padR || 0), gh = Math.ceil(cy + h + padB);
  const S = new Spr(gw, gh), C = o.c, M = {};
  for (const k in C) if (k !== 'fin' && k !== 'tail') M[k] = S.mat(C[k], { hue: o.hue });
  const fa = o.finAlpha ?? 0.84;
  const MF = S.mat(C.fin || C.body, { alpha: fa, dither: 0.7 }), MT = C.tail ? S.mat(C.tail, { alpha: fa, dither: 0.7 }) : MF;
  const MD = o.dorsal && o.dorsal.c ? S.mat(o.dorsal.c, { alpha: fa, dither: 0.7 }) : MF, MA = o.anal && o.anal.c ? S.mat(o.anal.c, { alpha: fa, dither: 0.7 }) : MF;
  const ME = o.finEdge ? S.mat(o.finEdge, { alpha: Math.min(1, fa + 0.1) }) : null;
  const ped = o.ped ?? 0.32, nose = o.nose ?? 0.3, k = o.k ?? 1.25, p = o.p ?? 0.75;
  const topC = o.top ? curve(o.top) : null, botC = o.bot ? curve(o.bot) : null;
  const base = u => h * (lerp(ped, nose, u) + (1 - lerp(ped, nose, u)) * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, k))), p));
  const hT = u => topC ? topC(u) * h : base(u), hB = u => botC ? botC(u) * h : base(u);
  // nadadeiras dorsal/anal (atrás do corpo)
  const fin = (D, below, MM) => {
    for (let i = 0; i < L; i++) {
      const u = i / (L - 1); if (u < D.s || u > D.e) continue;
      const q = (u - D.s) / (D.e - D.s);
      let fh = D.h * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(q, D.sweep ?? 0.7))), D.pw ?? 0.7);
      if (D.wave) fh *= 1 + D.wave * Math.sin(ph - q * 5);
      const ey = below ? cy + hB(u) : cy - hT(u), x = bx0 + i;
      for (let j = -1; j <= fh; j++) {
        const y = below ? Math.floor(ey + j) : Math.floor(ey - 1 - j);
        const ray = ((i + Math.floor(Math.max(0, j) * (D.slant ?? 0.6))) % (D.ray ?? 3)) === 0, edge = j >= fh - 1;
        S.put(x, y, edge && ME ? ME : MM, 0.52 + (ray ? -0.16 : 0) + (edge ? 0.16 : 0) + (below ? -0.05 : 0.04), 0.9);
      }
      if (D.spines && i % 2 === 0) for (let j = fh; j < fh * D.spines; j++) { const y = below ? Math.floor(ey + j) : Math.floor(ey - 1 - j); S.put(x - Math.floor((j - fh) * 0.3), y, MM, (j & 2) ? 0.25 : 0.75, 0.9); }
    }
  };
  if (o.dorsal) fin(o.dorsal, false, MD);
  if (o.dorsal2) fin(o.dorsal2, false, MD);
  if (o.anal) fin(o.anal, true, MA);
  // cauda
  const pedM = (hT(0) + hB(0)) / 2, sweep = 0.72 + 0.28 * Math.cos(ph), skew = Math.sin(ph) * (o.flap ?? 1.1);
  for (let i = 0; i < TL; i++) {
    const d = (i + 1) / TL, x = bx0 - 1 - i;
    let sp = lerp(pedM, ts, Math.pow(d, o.tailCurve ?? 0.85)) * lerp(1, sweep, d);
    if (o.roundTail && d > 0.55) sp *= 0.62 + 0.38 * Math.sqrt(Math.max(0, 1 - Math.pow((d - 0.55) / 0.45, 2)));
    const yo = skew * Math.pow(d, 1.4);
    for (let y = Math.floor(cy - sp - 3 + yo); y <= Math.ceil(cy + sp + 3 + yo); y++) {
      const dy = y + 0.5 - cy - yo; if (Math.abs(dy) > sp) continue;
      if (o.fork && d > o.fork && Math.abs(dy) < (d - o.fork) / (1 - o.fork) * sp * (o.forkDepth ?? 0.8)) continue;
      const ray = (Math.floor((Math.atan2(dy, i + 2) + 2) * (o.tailRays ?? 5)) & 1) ? -0.13 : 0;
      const edge = (d > 0.86 || Math.abs(dy) > sp - 1) ? 0.14 : 0;
      S.put(x, y, edge && ME && d > 0.86 ? ME : MT, 0.54 + ray + edge + (dy < 0 ? 0.06 : -0.04), 0.9);
    }
  }
  // corpo
  for (let i = 0; i < L; i++) {
    const u = i / (L - 1), ht = hT(u), hb = hB(u), x = bx0 + i;
    const dht = (hT(Math.min(1, u + 0.03)) - hT(Math.max(0, u - 0.03))) / (0.06 * (L - 1));
    for (let y = Math.floor(cy - ht - 1); y <= Math.ceil(cy + hb + 1); y++) {
      const dy = y + 0.5 - cy; if (dy < -ht || dy > hb) continue;
      const v = dy < 0 ? dy / ht : dy / hb;
      let nx = clamp(-dht * Math.sign(v) * 0.7, -0.6, 0.6) + Math.pow(Math.max(0, (u - 0.86) / 0.14), 2) * 0.8;
      let ny = v * 0.92, nz = Math.sqrt(Math.max(0, 1 - v * v));
      const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      let l = lit(nx, ny, nz) + (o.scales ? scaleTex(i, y, o.scales) : 0);
      const vd = v + (bayer(x, y) - 0.5) * 0.08;
      let key = vd < -0.5 && C.back ? 'back' : vd > 0.34 && C.belly ? 'belly' : 'body';
      if (o.pattern) { const r = o.pattern(u, v, i, y, key); if (r) { if (typeof r === 'string') key = r; else { if (r.k) key = r.k; if (r.l) l += r.l; } } }
      S.put(x, y, M[key], l, 1);
    }
  }
  // opérculo, boca, lábios
  if (o.gill !== false && L >= 9) {
    const gu = o.gillU ?? 0.73, gx = bx0 + gu * (L - 1), gh2 = (hT(gu) + hB(gu)) / 2;
    for (let yy = -gh2 * 0.6; yy <= gh2 * 0.6; yy += 1) S.addL(gx - Math.round((yy / gh2) * (yy / gh2) * 1.5), cy + yy, -0.2);
  }
  S.addL(bx0 + L - 1, cy + hB(1) * 0.35, -0.3);
  // nadadeiras peitoral e pélvica (na frente)
  if (o.pect !== false && L >= 7) {
    const pu = o.pectU ?? 0.6, px = bx0 + pu * (L - 1), py = cy + hB(pu) * 0.25, pl = o.pectL ?? Math.max(2.2, L * 0.15), pw = Math.max(1, h * 0.26);
    const ang = Math.PI * 0.86 + 0.32 * Math.sin(ph * 2), MP = o.pectC ? S.mat(o.pectC, { alpha: fa }) : MF;
    S.ellipsoid(px + Math.cos(ang) * pl * 0.5, py + Math.sin(ang) * pl * 0.5, pl * 0.55, pw, MP, { ang, z: 2, fn: a => 0.62 + (Math.floor(a.ly * 2 + 2) & 1 ? -0.1 : 0.05) + (a.lx < -0.5 ? 0.12 : 0) });
  }
  if (o.pelvic) { const pu = o.pelvic, px = bx0 + pu * (L - 1), py = cy + hB(pu); S.poly([[px - 1, py - 1], [px + 1, py - 1], [px - 2, py + Math.max(2, h * 0.45)]], MF, { z: 2, l: 0.5 }); }
  if (o.extra) o.extra(S, f, { bx0, cy, hT, hB, L, ph, M, MF });
  // olho
  const eu = o.eyeU ?? 0.8, es = o.eyeSize ?? (h >= 7 ? 4 : h >= 5 ? 3 : h >= 3 ? 2 : 1);
  S.eye(bx0 + eu * (L - 1) - Math.floor(es / 2), cy - hT(eu) * (o.eyeV ?? 0.3) - Math.floor(es / 2), es, o.iris || '#e2b64a');
  return { spr: S, meta: { ax: bx0 + L * 0.5, ay: cy, hh: h, hw: (L + TL) / 2 } };
}

// ---------------- gerador de mamíferos marinhos ----------------
// u=0 (base da cauda) .. u=1 (ponta do rosto); top/bot = perfis (fração de h)
function cetFrame(o, f, nF) {
  const L = o.len, h = o.h, FL = o.fluke ?? Math.round(L * 0.17), ph = f / nF * TAU;
  const top = curve(o.top), bot = curve(o.bot), amp = (o.amp ?? 0.45) * h;
  const wave = u => amp * Math.sin(ph - u * 2.4) * Math.pow(Math.max(0, 1 - u / 0.8), 2) - amp * 0.18 * Math.sin(ph + 0.6);
  let mt = 0, mb = 0; for (let u = 0; u <= 1.001; u += 0.05) { mt = Math.max(mt, top(u)); mb = Math.max(mb, bot(u)); }
  const dh = o.dorsal ? o.dorsal.h : 0, fl = o.flipper ? o.flipper.len : 0;
  const padT = Math.ceil(mt * h + dh + amp + 3 + (o.padT || 0)), padB = Math.ceil(mb * h + fl * 0.8 + amp + 3 + (o.padB || 0));
  const cy = padT, bx0 = FL + 2 + (o.padL || 0), gw = bx0 + L + 3 + (o.padR || 0), gh = padT + padB;
  const S = new Spr(gw, gh), C = o.c, M = {};
  for (const k in C) M[k] = S.mat(C[k], { hue: o.hue ?? 18, glow: o.glowMats && o.glowMats[k] });
  const X = u => bx0 + u * (L - 1), Yc = u => cy + wave(u);
  const topY = u => Yc(u) - top(u) * h, botY = u => Yc(u) + bot(u) * h;
  // barbatana dorsal
  if (o.dorsal) {
    const D = o.dorsal, u0 = D.s, u1 = D.e, xs = X(u0), xe = X(u1), sw = D.sweep ?? (xe - xs) * 0.6;
    const pts = [[xe, topY(u1) + 1], [lerp(xs, xe, 0.55), topY(lerp(u0, u1, 0.55)) - D.h * 0.7], [xs - sw * 0.5, topY(u0) - D.h], [xs - sw * 0.2, topY(u0) - D.h * 0.55], [xs, topY(u0) + 1]];
    S.poly(pts, M[D.m || 'back'], { z: 0.5, fn: a => 0.42 + clamp((topY(u0) - a.y) / D.h, 0, 1) * 0.18 });
  }
  // cauda
  const tailAng = Math.atan2(wave(0.02) - wave(0), (L - 1) * 0.02) * 1.5, ca = Math.cos(tailAng), sa = Math.sin(tailAng);
  const x0 = X(0), y0 = Yc(0), pedH = (top(0) + bot(0)) * h * 0.5;
  const tailM = M[o.tailM || 'back'];
  if ((o.tail || 'fluke') === 'fluke') {
    const open = (o.flukeOpen ?? 1.6) * Math.abs(Math.sin(ph + 0.5));
    for (let d = 0; d <= FL; d += 0.5) {
      const q = d / FL, th = Math.max(0.6, pedH * (1 - q) + Math.sin(Math.PI * Math.pow(q, 0.8)) * (1.2 + open) - q * q * 0.8);
      const cxp = x0 - ca * d, cyp = y0 - sa * d;
      for (let t = -th; t <= th; t += 0.5) S.put(cxp - sa * t, cyp + ca * t, tailM, 0.4 + (t < 0 ? 0.15 : -0.05) + (q > 0.9 ? 0.1 : 0), 0.8);
    }
  } else if (o.tail === 'paddle') {
    S.ellipsoid(x0 - ca * FL * 0.55, y0 - sa * FL * 0.55, FL * 0.55, pedH * 1.25 + 0.6 * Math.abs(Math.sin(ph)), tailM, { ang: tailAng, z: 0.8, flat: 0.5 });
  } else if (o.tail === 'hind') {
    for (const s of [-1, 1]) { const a = tailAng + s * (0.25 + 0.2 * Math.sin(ph + (s > 0 ? 0 : Math.PI))); S.ellipsoid(x0 - Math.cos(a) * FL * 0.5, y0 - Math.sin(a) * FL * 0.5 + s * 0.5, FL * 0.55, Math.max(1.2, pedH * 0.8), tailM, { ang: a, z: s > 0 ? 0.8 : 0.4, flat: 0.5 }); }
  }
  // corpo
  for (let i = 0; i < L; i++) {
    const u = i / (L - 1), x = bx0 + i, yc = Yc(u), ht = top(u) * h, hb = bot(u) * h;
    const slope = (wave(Math.min(1, u + 0.02)) - wave(Math.max(0, u - 0.02))) / (0.04 * (L - 1)), th = Math.atan(slope), cs = Math.cos(th), sn = Math.sin(th);
    const dht = (top(Math.min(1, u + 0.02)) - top(Math.max(0, u - 0.02))) * h / (0.04 * (L - 1));
    for (let y = Math.floor(yc - ht - 1); y <= Math.ceil(yc + hb + 1); y++) {
      const dy = y + 0.5 - yc; if (dy < -ht || dy > hb) continue;
      const v = dy < 0 ? dy / ht : dy / hb;
      let nx = -v * sn + clamp(-dht * (v < 0 ? 1 : -0.3) * 0.6, -0.6, 0.6) + Math.pow(Math.max(0, (u - (o.noseU ?? 0.9)) / (1 - (o.noseU ?? 0.9))), 2) * 0.9, ny = v * cs * 0.94, nz = Math.sqrt(Math.max(0, 1 - v * v));
      const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      let l = lit(nx, ny, nz, 0.26, 0.74, o.spec ?? 0.28, 14);
      const vd = v + (bayer(x, y) - 0.5) * 0.18;
      let key = o.zone ? o.zone(u, vd, i, y) : (vd < 0.05 ? 'back' : vd > 0.45 ? 'belly' : 'body');
      if (typeof key === 'object') { l += key.l || 0; key = key.k; }
      S.put(x, y, M[key] ?? M.body, l, 1);
    }
  }
  // nadadeira peitoral
  if (o.flipper) {
    const F = o.flipper, pu = F.u, px = X(pu), py = Yc(pu) + bot(pu) * h * (F.v ?? 0.55);
    const ang = (F.ang ?? 2.2) + (F.swing ?? 0.18) * Math.sin(ph + 0.8), len = F.len, w = F.w;
    S.ellipsoid(px + Math.cos(ang) * len * 0.45, py + Math.sin(ang) * len * 0.45, len * 0.52, w, M[F.m || 'back'], { ang, z: 2, flat: 0.55, fn: F.fn });
  }
  if (o.extra) o.extra(S, f, { X, Yc, topY, botY, top, bot, L, h, ph, M, cy, bx0, wave });
  const eu = o.eyeU ?? 0.84, ev = o.eyeV ?? 0.05;
  S.eye(X(eu), Yc(eu) + ev * h, o.eyeSize ?? (h > 16 ? 2 : 1), o.iris || '#3a2a1a');
  return { spr: S, meta: { ax: bx0 + L * 0.5, ay: cy, hh: h, hw: (L + FL) / 2 } };
}

// ---------------- discos para corpos longos (serpentes, tentáculos) ----------------
function discSet(color, maxR, o = {}) {
  const fill = [], out = [], ramp = makeRamp(color, 7, { hue: o.hue ?? 22 }), oc = o.outline || shade(ramp[0], -0.2);
  for (let r = 1; r <= maxR; r++) {
    const s = r * 2 + 1, c = r;
    const f = paint(s, s, (x, y) => {
      const dx = (x + 0.5 - c - 0.5) / r, dy = (y + 0.5 - c - 0.5) / r, d2 = dx * dx + dy * dy; if (d2 > 1) return null;
      const l = lit(dx * 0.9, dy * 0.9, Math.sqrt(1 - d2)) + (o.tex ? o.tex(x, y, dx, dy) : 0);
      let col = ramp[clamp(Math.floor(l * 6 + 0.5 + (bayer(x, y) - 0.5) * 0.5), 0, 6)];
      if (o.fog) col = mixC(col, o.fog, o.fogT);
      return col;
    });
    const s2 = s + 2, g = paint(s2, s2, (x, y) => { const dx = (x + 0.5 - c - 1.5) / (r + 1), dy = (y + 0.5 - c - 1.5) / (r + 1); return dx * dx + dy * dy <= 1 ? (o.fog ? mixC(oc, o.fog, o.fogT) : oc) : null; });
    fill.push(f); out.push(g);
  }
  return { fill, out, maxR };
}
function drawChain(ds, pts, g = ctx) {
  for (const p of pts) { const r = clamp(Math.round(p.r), 1, ds.maxR); g.drawImage(ds.out[r - 1], Math.round(p.x) - r - 1, Math.round(p.y) - r - 1); }
  for (const p of pts) { const r = clamp(Math.round(p.r), 1, ds.maxR); g.drawImage(ds.fill[r - 1], Math.round(p.x) - r, Math.round(p.y) - r); }
}

// brilho pontilhado (auréolas)
const glowCache = {};
function glowSprite(col, r) {
  const k = col + r; if (glowCache[k]) return glowCache[k];
  const s = r * 2 + 1;
  return glowCache[k] = paint(s, s, (x, y) => { const d = Math.hypot(x - r, y - r) / r; if (d > 1) return null; const a = Math.pow(1 - d, 1.6); return a > bayer(x, y) * 0.85 ? alphaC(col, 0.16 + 0.32 * a) : null; });
}
