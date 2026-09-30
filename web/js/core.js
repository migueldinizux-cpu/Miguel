'use strict';
// =====================================================================
//  AQUÁRIO PIXEL v2 — núcleo: configuração, matemática, cor, canvas
// =====================================================================
const QS = new URLSearchParams(location.search);
const IS_APP = !!(window.chrome && window.chrome.webview);
const CFG = {
  timeMode: QS.get('time') || 'auto',           // auto | day | dusk | night
  fishCount: QS.has('fish') ? +QS.get('fish') : 30,
  pixelSize: QS.has('px') ? +QS.get('px') : 0,  // 0 = automático
  fps: QS.has('fps') ? +QS.get('fps') : 30,
  demo: QS.get('demo') || '',                   // ex.: demo=thumb
  gallery: QS.has('gallery'),
  seed: QS.has('seed') ? +QS.get('seed') : 0,
};

// ---------------- números ----------------
const TAU = Math.PI * 2;
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let RNG = mulberry32(CFG.seed || (Math.random() * 1e9) | 0);
const rand = (a = 1, b) => b === undefined ? RNG() * a : a + RNG() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(RNG() * arr.length)];
const chance = p => RNG() < p;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const fract = v => v - Math.floor(v);
const hash2 = (x, y, s = 0) => fract(Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

// curva monotônica (Hermite, sem overshoot) a partir de pontos [[x,y],...]
function curve(pts) {
  const n = pts.length, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return x => {
    if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
// Catmull-Rom: amostra pontos {x,y,r,z} a cada ~step px
function spline(ctrl, step = 1.5) {
  const out = [], P = i => ctrl[clamp(i, 0, ctrl.length - 1)];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const segs = Math.max(1, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / step));
    for (let s = 0; s < segs; s++) {
      const t = s / segs, t2 = t * t, t3 = t2 * t;
      const cr = k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push({ x: cr('x'), y: cr('y'), r: lerp(p1.r, p2.r, t), z: lerp(p1.z || 0, p2.z || 0, t) });
    }
  }
  const L = ctrl[ctrl.length - 1]; out.push({ x: L.x, y: L.y, r: L.r, z: L.z || 0 });
  return out;
}

// ---------------- cor ----------------
const rgbCache = new Map();
function toRGBA(c) {
  let v = rgbCache.get(c); if (v) return v;
  let h = c.slice(1); if (h.length === 3) h = h.replace(/./g, '$&$&');
  const n = parseInt(h.slice(0, 6), 16);
  v = [n >> 16 & 255, n >> 8 & 255, n & 255, h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1];
  rgbCache.set(c, v); return v;
}
function hex(r, g, b, a = 1) {
  const f = v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b) + (a < 0.999 ? f(a * 255) : '');
}
const mixCache = new Map();
function mixC(c1, c2, t) {
  t = Math.round(t * 100) / 100;
  const k = c1 + c2 + t; let v = mixCache.get(k);
  if (!v) { const a = toRGBA(c1), b = toRGBA(c2); v = hex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), a[3]); mixCache.set(k, v); }
  return v;
}
const shade = (c, amt) => mixC(c, amt < 0 ? '#1a1030' : '#fff4d6', Math.abs(amt));
const alphaCache = new Map();
function alphaC(c, a) { a = Math.round(a * 50) / 50; const k = c + a; let v = alphaCache.get(k); if (!v) { const r = toRGBA(c); v = hex(r[0], r[1], r[2], a); alphaCache.set(k, v); } return v; }
const css = (c, a) => { const v = toRGBA(c); return `rgba(${v[0]},${v[1]},${v[2]},${a === undefined ? v[3] : a})`; };

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}
function hsl2hex(h, s, l) {
  h = ((h % 360) + 360) % 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return hex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
function hueToward(h, target, amt) { const d = ((target - h + 540) % 360) - 180; return h + Math.min(amt, Math.abs(d)) * Math.sign(d); }
// Rampa de pixel art: sombras puxam pro azul/roxo, luzes pro amarelo
const rampCache = new Map();
function makeRamp(base, n = 7, o = {}) {
  const key = base + n + JSON.stringify(o); const hit = rampCache.get(key); if (hit) return hit;
  const [r, g, b] = toRGBA(base), [h, s, l] = rgb2hsl(r, g, b);
  const bi = o.bi ?? Math.round((n - 1) * 0.58), hs = o.hue ?? 14;
  const Ld = l * (o.dark ?? 0.32), Ll = l + (1 - l) * (o.light ?? 0.5) * clamp(l * 1.6, 0.14, 1);
  const out = [];
  for (let i = 0; i < n; i++) {
    let L, H = s < 0.08 ? 225 : h, Sx = s;
    if (i < bi) { const t = 1 - i / bi; L = lerp(l, Ld, t); H = hueToward(H, 232, t * hs * 1.6); Sx = clamp(s * (1 + 0.12 * t) + 0.12 * t * (1 - s) * (1 - l * 0.5), 0, 1); }
    else if (i > bi) { const t = (i - bi) / (n - 1 - bi); L = lerp(l, Ll, t); H = hueToward(h, 52, t * hs * 1.3); Sx = s * (1 - 0.32 * t); }
    else L = l;
    out.push(hsl2hex(H, Sx, L));
  }
  rampCache.set(key, out); return out;
}

// ---------------- canvas ----------------
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function flipH(src) { if (!src) return null; const c = makeCanvas(src.width, src.height), g = c.getContext('2d'); g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c; }
function paint(w, h, fn) {
  const c = makeCanvas(w, h), g = c.getContext('2d'), img = g.createImageData(c.width, c.height), d = img.data;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    const col = fn(x, y); if (!col) continue;
    const v = toRGBA(col), i = (y * c.width + x) * 4;
    d[i] = v[0]; d[i + 1] = v[1]; d[i + 2] = v[2]; d[i + 3] = Math.round(v[3] * 255);
  }
  g.putImageData(img, 0, 0); return c;
}

// ---------------- ruído ----------------
function mkNoise() { const v = new Float32Array(1024).map(() => RNG()); return x => { const i = Math.floor(x), f = x - i; return lerp(v[i & 1023], v[(i + 1) & 1023], smooth(f)); }; }
function mkNoise2(period = 0) {
  const v = new Float32Array(256 * 256).map(() => RNG());
  const P = period || 256;
  const at = (x, y) => v[((y % P + P) % P & 255) * 256 + ((x % P + P) % P & 255)];
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = smooth(x - xi), fy = smooth(y - yi);
    return lerp(lerp(at(xi, yi), at(xi + 1, yi), fx), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), fx), fy); };
}
function fbm(n, x, o = 4) { let s = 0, a = 1, f = 1, t = 0; for (let k = 0; k < o; k++) { s += n(x * f + k * 31.7) * a; t += a; a *= 0.5; f *= 2.03; } return s / t; }
function fbm2(n, x, y, o = 4) { let s = 0, a = 1, f = 1, t = 0; for (let k = 0; k < o; k++) { s += n(x * f + k * 17.3, y * f - k * 9.1) * a; t += a; a *= 0.5; f *= 2; } return s / t; }

// ---------------- estado global compartilhado ----------------
const cvs = document.getElementById('aq');
const ctx = cvs.getContext('2d');
let W = 0, H = 0, S = 3, DPR = 1, T = 0;
let curDay = 1, curWarm = 0, parX = 0;
const mouse = { x: -999, y: -999, px: 0, py: 0, vx: 0, vy: 0, speed: 0, last: -1e9, active: 0, seen: false, idle: 1e9 };
const night = () => 1 - curDay;
