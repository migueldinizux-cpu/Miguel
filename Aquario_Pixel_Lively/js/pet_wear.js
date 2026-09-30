'use strict';
// =====================================================================
//  Guarda-roupa: chapéus, pescoço, óculos e roupas para o bichinho.
//  Cada espécie informa onde fica a cabeça, o pescoço e os olhos (wearAnchors);
//  as peças são desenhadas no tamanho certo para cada estágio.
// =====================================================================
const WEAR_COLORS = [
  { n: 'Vermelho', c: '#e23e4e' }, { n: 'Laranja', c: '#f08a2c' }, { n: 'Amarelo', c: '#f2cc3a' }, { n: 'Verde', c: '#46b85a' }, { n: 'Azul', c: '#3a78dc' },
  { n: 'Roxo', c: '#8656d6' }, { n: 'Rosa', c: '#f070aa' }, { n: 'Branco', c: '#eef0f4' }, { n: 'Preto', c: '#34304a' },
];
// tint = cor padrão (índice) quando a peça aceita cor; null = cor fixa. dx/dy = ajuste de posição (fração da largura da cabeça)
// price = moedas (0 = já vem liberada) · ach = só sai com a conquista indicada
const WEAR = {
  hat: [
    { id: 'gorro', name: 'Gorro', tint: 4, price: 0 }, { id: 'laco', name: 'Laço', tint: 6, dx: -0.12, dy: 0.12, price: 0 },
    { id: 'festa', name: 'Chapéu de festa', tint: 6, price: 40 }, { id: 'flor', name: 'Flor', tint: 0, dx: -0.28, dy: 0.18, price: 40 },
    { id: 'touca', name: 'Touca de dormir', tint: 4, price: 50 }, { id: 'cartola', name: 'Cartola', tint: 0, price: 70 },
    { id: 'pirata', name: 'Pirata', tint: null, price: 80 }, { id: 'capitao', name: 'Capitão', tint: 8, price: 90 },
    { id: 'mago', name: 'Mago', tint: 5, price: 110 }, { id: 'coroa', name: 'Coroa', tint: 0, price: 160 },
    { id: 'polvo', name: 'Chapéu de polvinho', tint: 5, ach: 'kraken3' }, { id: 'estrela', name: 'Tiara de estrela-do-mar', tint: 1, ach: 'pedia25' },
    { id: 'coral', name: 'Coroa de coral', tint: null, ach: 'pediaAll' },
  ],
  neck: [
    { id: 'borboleta', name: 'Gravata-borboleta', tint: 0, price: 0 }, { id: 'gravata', name: 'Gravata', tint: 4, price: 50 },
    { id: 'cachecol', name: 'Cachecol', tint: 0, price: 60 }, { id: 'sininho', name: 'Coleira com sino', tint: 0, price: 70 },
    { id: 'perolas', name: 'Colar de pérolas', tint: null, price: 130 }, { id: 'medalha', name: 'Medalha de ouro', tint: 4, ach: 'giant' },
  ],
  face: [
    { id: 'redondo', name: 'Óculos redondos', tint: null, price: 0 }, { id: 'escuro', name: 'Óculos escuros', tint: null, price: 60 },
    { id: 'coracao', name: 'Óculos de coração', tint: null, price: 80 }, { id: 'monoculo', name: 'Monóculo', tint: null, price: 90 },
    { id: 'mascara', name: 'Máscara de mergulho', tint: 2, ach: 'dive' },
  ],
  body: [
    { id: 'sueter', name: 'Suéter listrado', tint: 0, price: 0 }, { id: 'pijama', name: 'Pijama de estrelas', tint: 4, price: 60 },
    { id: 'capa', name: 'Capa de herói', tint: 0, price: 120 }, { id: 'ouro', name: 'Escamas douradas', tint: null, ach: 'three' },
  ],
};
const WEAR_SLOTS = [['hat', 'Chapéu'], ['neck', 'Pescoço'], ['face', 'Óculos'], ['body', 'Roupa']];
const WEAR_LINES = ['Tô chique!', 'Gostei!', 'Ficou bom?', 'Que tal?', 'Uau!'];
const wearItem = (slot, id) => (WEAR[slot] || []).find(i => i.id === id) || null;
// 'own' = pode usar · 'buy' = à venda · 'ach' = só por conquista
function wearState(slot, id) { const it = wearItem(slot, id); if (!it || (!it.price && !it.ach)) return 'own'; if (META && META.owned[slot + ':' + id]) return 'own'; return it.ach ? 'ach' : 'buy'; }
function wearCI(s, slot) { const it = wearItem(slot, s.wear[slot]); if (!it || it.tint == null) return -1; const v = s.wcol[slot]; return v != null && WEAR_COLORS[v] ? v : it.tint; }
function wearColor(s, slot) { const i = wearCI(s, slot); return i >= 0 ? WEAR_COLORS[i].c : '#e23e4e'; }
function wearOf(p, slot) { const id = p.s.wear && p.s.wear[slot]; if (!id || !wearItem(slot, id)) return null; return { id, ci: wearCI(p.s, slot), c: wearColor(p.s, slot) }; }
// suéter/pijama/escamas: cor principal e de detalhe (usado pelo corpo de cada espécie)
function sweaterOf(p) {
  const w = wearOf(p, 'body'); if (!w || w.id === 'capa') return null;
  if (w.id === 'pijama') return { pat: 'star', c1: w.c, c2: w.ci === 2 ? '#fffaf0' : '#ffe27a' };
  if (w.id === 'ouro') return { pat: 'scale', c1: '#e0a82e', c2: '#fff0a8' };
  return { pat: 'stripe', c1: w.c, c2: w.ci === 7 ? '#e23e4e' : '#f6f2ea' };
}
// desenho do tecido em coordenadas de pixel da peça: true = cor de detalhe
function swDetail(pat, gx, gy, st = 2) {
  if (pat === 'star') return hash2(Math.floor(gx / 3), Math.floor(gy / 3), 5) < 0.35 && ((gx % 3) + 3) % 3 === 1 && ((gy % 3) + 3) % 3 === 1;
  if (pat === 'scale') { const row = Math.floor(gy / 3), xx = (((gx + (row & 1) * 2) % 4) + 4) % 4, yy = ((gy % 3) + 3) % 3; return (yy === 2 && (xx === 1 || xx === 2)) || (yy === 1 && (xx === 0 || xx === 3)); }
  return (Math.floor(gy / st) & 1) === 1;
}

// ---------------- chapéus (sprites com volume, no tamanho da cabeça) ----------------
function buildHat(id, c, w) {
  const pad = 3, white = '#f4f3ee';
  if (id === 'cartola') {
    const ch = Math.max(4, Math.round(w * 0.78)), W2 = Math.ceil(w * 1.35) + pad * 2, H2 = ch + 7, cx = W2 / 2, by = H2 - 3;
    const S = new Spr(W2, H2), BK = S.mat('#3c3752'), RB = S.mat(c);
    S.ellipsoid(cx, by, w * 0.64, Math.max(1.3, w * 0.1), BK, { flat: 0.5 });
    sprCyl(S, cx, by - ch, by - 0.2, w * 0.34, w * 0.37, BK, { z: 1, fn: q => (by - q.y < Math.max(2, ch * 0.3) && by - q.y > 0.6) ? { m: RB } : undefined });
    S.ellipsoid(cx, by - ch, w * 0.34, Math.max(0.8, w * 0.07), BK, { z: 1.1, fn: q => ({ l: q.l + 0.1 }) });
    return { spr: S, meta: { ax: cx, ay: by + Math.max(1.3, w * 0.1) - 0.5 } };
  }
  if (id === 'coroa') {
    const bh = Math.max(2, Math.round(w * 0.2)), ph = Math.max(3, Math.round(w * 0.36)), W2 = Math.ceil(w) + pad * 2, H2 = bh + ph + 5, cx = W2 / 2, by = H2 - 2;
    const S = new Spr(W2, H2), G = S.mat('#f2c34a', { hue: 12 }), n = w >= 12 ? 5 : 3, half = w * 0.42;
    for (let k = 0; k < n; k++) {
      const px = cx - half + (k / (n - 1)) * half * 2, th = ph * (k % 2 === 0 ? 1 : 0.7), bw = half * 2 / (n - 1) * 0.55;
      S.poly([[px - bw, by - bh + 0.5], [px, by - bh - th], [px + bw, by - bh + 0.5]], G, { z: 0.5, fn: q => ({ l: 0.52 + (q.x + 0.5 < px ? 0.14 : -0.05) }) });
      if (w >= 10) S.ellipsoid(px, by - bh - th, 0.9, 0.9, G, { z: 0.6, spec: 0.6 });
    }
    sprCyl(S, cx, by - bh, by, half + 0.5, half + 0.8, G, { z: 1 });
    const gem = (x, y, col) => { x = Math.round(x); y = Math.round(y); S.dot(x, y, shade(col, 0.45)); S.dot(x + 1, y, col); if (w >= 14) { S.dot(x, y + 1, col); S.dot(x + 1, y + 1, shade(col, -0.35)); } };
    const gy = by - bh / 2 - (w >= 14 ? 1 : 0.5); gem(cx - 1, gy, c); if (w >= 12) { gem(cx - half * 0.66 - 0.5, gy, c === '#3a78dc' ? '#46b85a' : '#3a78dc'); gem(cx + half * 0.5, gy, c === '#46b85a' ? '#f070aa' : '#46b85a'); }
    return { spr: S, meta: { ax: cx, ay: by } };
  }
  if (id === 'gorro') {
    const dh = w * 0.55, pr = Math.max(1.5, w * 0.17), W2 = Math.ceil(w * 1.1) + pad * 2, H2 = Math.ceil(dh + pr * 2 + 4), cx = W2 / 2, by = H2 - 2;
    const S = new Spr(W2, H2), M = S.mat(c), CU = S.mat(shade(c, -0.1)), PO = S.mat(c === '#eef0f4' ? '#ffb8d4' : white);
    S.ellipsoid(cx, by - 1, w * 0.5, dh, M, { fn: q => q.ly > 0 ? null : { l: q.l + ((Math.floor(q.x) & 1) ? -0.06 : 0.03) } });
    const cuf = Math.max(2, Math.round(w * 0.2));
    sprCyl(S, cx, by - cuf, by + 0.5, w * 0.53, w * 0.53, CU, { z: 1, fn: q => ({ l: q.l + ((Math.floor(q.x) & 1) ? -0.08 : 0.04) }) });
    S.ellipsoid(cx, by - dh - pr * 0.4, pr, pr, PO, { z: 2, fn: q => ({ l: q.l + (hash2(q.x, q.y, 4) - 0.5) * 0.25 }) });
    return { spr: S, meta: { ax: cx, ay: by } };
  }
  if (id === 'pirata') {
    const W2 = Math.ceil(w * 1.7) + pad * 2, H2 = Math.ceil(w * 0.8) + 5, cx = W2 / 2, by = H2 - 2;
    const S = new Spr(W2, H2), BK = S.mat('#302b3e'), TR = S.mat('#e8c050');
    S.ellipsoid(cx, by - w * 0.18, w * 0.4, w * 0.5, BK, { fn: q => q.ly > 0.2 ? null : undefined });
    const brim = s => [[-0.82, -0.52], [-0.55, -0.1], [-0.2, 0.02], [0.2, 0.02], [0.55, -0.1], [0.82, -0.52], [0.6, -0.3], [0.25, -0.18], [-0.25, -0.18], [-0.6, -0.3]].map(([x, y]) => [cx + x * w * s, by - 0.2 * w + (y + 0.2) * w * s]);
    S.poly(brim(1.07), TR, { z: 0.9, l: 0.6 });
    S.poly(brim(1), BK, { z: 1, fn: q => ({ l: 0.42 + (q.y < by - w * 0.15 ? 0.1 : 0) }) });
    const sx = Math.round(cx) - 2, sy = Math.round(by - w * 0.3);
    const sk = w >= 12 ? ['.###.', '#.#.#', '.###.', '.#.#.'] : ['.#.', '###'];
    sk.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') S.dot(sx + i + (w >= 12 ? 0 : 1), sy + j, '#f4f0e6'); else if (w >= 12 && j === 1) S.dot(sx + i, sy + j, '#15121e'); });
    return { spr: S, meta: { ax: cx, ay: by } };
  }
  if (id === 'festa') {
    const hgt = w * 1.05, pr = Math.max(1.2, w * 0.13), W2 = Math.ceil(w * 0.9) + pad * 2, H2 = Math.ceil(hgt + pr * 2 + 3), cx = W2 / 2, by = H2 - 1.5;
    const S = new Spr(W2, H2), A = S.mat(c), B = S.mat(c === '#f2cc3a' ? white : '#ffe27a'), PO = S.mat(c === '#eef0f4' ? '#f070aa' : white);
    const apx = cx + w * 0.08, apy = by - hgt, hb = w * 0.36;
    S.poly([[cx - hb, by], [apx, apy], [cx + hb, by]], A, { fn: q => {
      const tt = clamp((by - q.y - 0.5) / hgt, 0, 1), axis = lerp(cx, apx, tt), half = hb * (1 - tt) + 0.2, nx = clamp((q.x + 0.5 - axis) / half, -1, 1);
      const stripe = Math.floor(((by - q.y) + (q.x - axis) * 0.7) / Math.max(2, w * 0.2)) & 1;
      return { m: stripe ? B : A, l: lit(nx * 0.9, -0.1, Math.sqrt(Math.max(0, 1 - nx * nx * 0.81))) };
    } });
    S.ellipsoid(apx, apy, pr, pr, PO, { z: 1 });
    return { spr: S, meta: { ax: cx, ay: by } };
  }
  if (id === 'capitao') {
    const W2 = Math.ceil(w * 1.4) + pad * 2, H2 = Math.ceil(w * 0.72) + 6, cx = W2 / 2 - w * 0.1, by = H2 - 3;
    const S = new Spr(W2, H2), WH = S.mat('#f2f2ee'), BD = S.mat(c), VI = S.mat('#1e1c2a');
    const bandH = Math.max(2, Math.round(w * 0.2)), top = by - w * 0.56;
    sprCyl(S, cx, top + w * 0.1, by - bandH + 0.5, w * 0.5, w * 0.42, WH, { z: 0.5 });
    S.ellipsoid(cx, top + w * 0.12, w * 0.56, Math.max(1, w * 0.15), WH, { z: 0.6, fn: q => ({ l: q.l + 0.06 }) });
    sprCyl(S, cx, by - bandH, by, w * 0.42, w * 0.42, BD, { z: 1 });
    S.poly([[cx + w * 0.08, by - 1], [cx + w * 0.7, by + 0.4], [cx + w * 0.6, by + 1.8], [cx, by + 1]], VI, { z: 2, fn: q => ({ l: 0.32 + (q.y < by ? 0.28 : 0) }) });
    const bx = Math.round(cx + w * 0.12), byy = Math.round(by - bandH - (w >= 14 ? 3 : 1.5));
    if (w >= 14) for (const [i, j] of [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [0, 3], [1, 3], [2, 3]]) S.dot(bx + i - 1, byy + j - 1, j === 3 && i !== 1 ? '#c8962a' : '#f2c34a');
    else { S.dot(bx, byy, '#f2c34a'); S.dot(bx, byy + 1, '#c8962a'); }
    return { spr: S, meta: { ax: cx, ay: by + 1 } };
  }
  if (id === 'mago') {
    const hgt = w * 1.25, W2 = Math.ceil(w * 1.5) + pad * 2, H2 = Math.ceil(hgt + 5), cx = W2 / 2, by = H2 - 2.5;
    const S = new Spr(W2, H2), M = S.mat(c), BR = S.mat(shade(c, -0.15)), BD = S.mat('#f2c34a');
    S.ellipsoid(cx, by, w * 0.72, Math.max(1.2, w * 0.12), BR, { flat: 0.5 });
    const pts = [[cx - w * 0.36, by - 0.5], [cx - w * 0.2, by - hgt * 0.5], [cx - w * 0.28, by - hgt * 0.8], [cx - w * 0.58, by - hgt], [cx - w * 0.06, by - hgt * 0.76], [cx + w * 0.12, by - hgt * 0.42], [cx + w * 0.36, by - 0.5]];
    S.poly(pts, M, { z: 1, fn: q => ({ l: 0.62 - clamp((q.x - cx + w * 0.05) / (w * 0.36), -1, 1) * 0.16 }) });
    const bh = Math.max(1.5, w * 0.12);
    S.poly([[cx - w * 0.37, by - 0.3], [cx - w * 0.33, by - bh - 0.5], [cx + w * 0.33, by - bh - 0.5], [cx + w * 0.37, by - 0.3]], BD, { z: 1.1, l: 0.6 });
    for (let k = 0; k < 7; k++) {
      const tt = 0.25 + hash2(k, 3, 7) * 0.6, x = lerp(cx - w * 0.2, cx - w * 0.3, tt) + (hash2(k, 5, 7) - 0.5) * w * 0.4 * (1 - tt), y = by - hgt * tt;
      if (!S.has(Math.floor(x), Math.floor(y))) continue;
      S.dot(x, y, '#fff0a0'); if (w >= 16 && k % 2 === 0) { S.dot(x - 1, y, '#ffe070'); S.dot(x + 1, y, '#ffe070'); S.dot(x, y - 1, '#ffe070'); S.dot(x, y + 1, '#ffe070'); }
    }
    return { spr: S, meta: { ax: cx, ay: by + Math.max(1.2, w * 0.12) - 0.5 } };
  }
  if (id === 'touca') {
    const W2 = Math.ceil(w * 1.75) + pad * 2, H2 = Math.ceil(w * 0.9) + 5, cx = W2 - pad - w * 0.55, by = H2 - 2;
    const S = new Spr(W2, H2), A = S.mat(c), B = S.mat(c === '#eef0f4' ? '#9fc8f0' : white), CU = S.mat(white);
    const ptsT = [{ x: cx, y: by - w * 0.22, r: w * 0.46 }, { x: cx - w * 0.1, y: by - w * 0.5, r: w * 0.33 }, { x: cx - w * 0.42, y: by - w * 0.68, r: w * 0.21 }, { x: cx - w * 0.74, y: by - w * 0.52, r: w * 0.12 }, { x: cx - w * 0.9, y: by - w * 0.26, r: Math.max(0.6, w * 0.06) }];
    S.tube(ptsT, A, { fn: q => (Math.floor(q.s / Math.max(2, w * 0.22)) & 1) ? { m: B } : undefined });
    sprCyl(S, cx, by - Math.max(2, w * 0.22), by + 0.5, w * 0.5, w * 0.5, CU, { z: 1, fn: q => ({ l: q.l + ((Math.floor(q.x) & 1) ? -0.05 : 0.03) }) });
    S.ellipsoid(cx - w * 0.9, by - w * 0.22 + 1, Math.max(1.3, w * 0.15), Math.max(1.3, w * 0.15), CU, { z: 2 });
    return { spr: S, meta: { ax: cx, ay: by } };
  }
  if (id === 'laco') {
    const W2 = Math.ceil(w * 1.05) + pad * 2, H2 = Math.ceil(w * 0.62) + 5, cx = W2 / 2, cy = H2 / 2 - 0.5;
    const S = new Spr(W2, H2), M = S.mat(c), K = S.mat(shade(c, -0.1));
    for (const sd of [-1, 1]) {
      S.poly([[cx, cy], [cx + sd * w * 0.26, cy + w * 0.34], [cx + sd * w * 0.08, cy + w * 0.3]], M, { z: 0.3, l: 0.42 });
      S.ellipsoid(cx + sd * w * 0.26, cy - w * 0.02, w * 0.28, w * 0.2, M, { ang: sd * 0.35, z: 0.5, fn: q => ({ l: q.l + (Math.abs(q.lx) < 0.35 ? -0.1 : 0) + (sd * q.lx > 0.55 ? 0.05 : 0) }) });
    }
    S.ellipsoid(cx, cy, Math.max(1, w * 0.11), Math.max(1.2, w * 0.14), K, { z: 1 });
    return { spr: S, meta: { ax: cx, ay: cy + w * 0.2 } };
  }
  if (id === 'polvo') {   // polvinho sentado na cabeça
    const W2 = Math.ceil(w * 1.3) + pad * 2, H2 = Math.ceil(w * 0.95) + 5, cx = W2 / 2, by = H2 - 2;
    const S = new Spr(W2, H2), M = S.mat(c), SK = S.mat(shade(c, 0.35));
    for (const sd of [-1, 1]) for (const k of [0, 1]) {   // perninhas enroladas dos lados
      const x0 = cx + sd * w * (0.22 + k * 0.14), pts = [];
      for (let j = 0; j <= 6; j++) { const q = j / 6, a = q * 2.6; pts.push({ x: x0 + sd * (Math.sin(a) * w * 0.14 + q * w * 0.12), y: by - w * 0.18 + (1 - Math.cos(a)) * w * 0.12 + q * w * 0.05, r: Math.max(0.6, w * 0.07 * (1 - q * 0.6)) }); }
      S.tube(pts, M, { fn: q2 => (q2.v < -0.3 && Math.floor(q2.s) % 2 === 0) ? { m: SK } : undefined });
    }
    S.ellipsoid(cx, by - w * 0.42, w * 0.42, w * 0.38, M, { z: 1, fn: q2 => q2.ly > 0.55 ? null : (hash2(Math.floor(q2.x / 2), Math.floor(q2.y / 2), 8) < 0.12 ? { m: SK } : undefined) });
    for (const sd of [-1, 1]) { const ex = Math.round(cx + sd * w * 0.15), ey = Math.round(by - w * 0.4); S.dot(ex, ey, '#ffffff'); S.dot(ex, ey + 1, '#23133a'); if (w >= 14) { S.dot(ex + 1, ey, '#ffffff'); S.dot(ex + 1, ey + 1, '#23133a'); } }
    S.dot(cx, by - w * 0.3, '#3a1a2c'); S.dot(cx - 1, by - w * 0.31, '#3a1a2c');
    return { spr: S, meta: { ax: cx, ay: by - w * 0.08 } };
  }
  if (id === 'estrela') {   // tiara com uma estrela-do-mar
    const W2 = Math.ceil(w * 1.05) + pad * 2, H2 = Math.ceil(w * 0.75) + 5, cx = W2 / 2, by = H2 - 2;
    const S = new Spr(W2, H2), B = S.mat('#f4d8e8'), ST = S.mat(c), DT = shade(c, 0.45);
    sprCyl(S, cx, by - Math.max(1.5, w * 0.1), by + 0.5, w * 0.45, w * 0.46, B, { z: 0.5 });
    const sy = by - w * 0.36, R = w * 0.32;
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * TAU / 5; S.tube([{ x: cx, y: sy, r: Math.max(1, w * 0.1) }, { x: cx + Math.cos(a) * R, y: sy + Math.sin(a) * R, r: 0.6 }], ST, { z: 1 }); }
    S.ellipsoid(cx, sy, Math.max(1, w * 0.12), Math.max(1, w * 0.12), ST, { z: 1.1 });
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * TAU / 5; S.dot(cx + Math.cos(a) * R * 0.5, sy + Math.sin(a) * R * 0.5, DT); }
    for (const sd of [-1, 1]) S.ellipsoid(cx + sd * w * 0.36, by - w * 0.12, Math.max(1, w * 0.07), Math.max(1, w * 0.07), S.mat('#fff4fa'), { z: 1, spec: 0.6 });
    return { spr: S, meta: { ax: cx, ay: by } };
  }
  if (id === 'coral') {   // coroa de galhos de coral com pérolas
    const W2 = Math.ceil(w * 1.1) + pad * 2, H2 = Math.ceil(w * 0.8) + 5, cx = W2 / 2, by = H2 - 2;
    const S = new Spr(W2, H2), CO = S.mat('#ff6f9a'), CO2 = S.mat('#ffa04a'), PE = S.mat('#f4eefa', { glow: '#fff4ff88' });
    sprCyl(S, cx, by - Math.max(2, w * 0.14), by + 0.5, w * 0.46, w * 0.47, CO, { z: 0.8, fn: q2 => ({ l: q2.l + ((Math.floor(q2.x) & 1) ? -0.04 : 0.04) }) });
    const br = (x, y, L, a, d, m) => { const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L; S.tube([{ x, y, r: Math.max(0.7, L * 0.2) }, { x: x2, y: y2, r: 0.6 }], m, { z: 0.6 }); if (d > 0) { br(x2, y2, L * 0.7, a - 0.5, d - 1, m); br(x2, y2, L * 0.65, a + 0.5, d - 1, m); } };
    for (let k = -2; k <= 2; k++) br(cx + k * w * 0.2, by - w * 0.12, w * (k === 0 ? 0.3 : 0.22), -Math.PI / 2 + k * 0.18, w >= 12 ? 1 : 0, k % 2 ? CO2 : CO);
    for (const k of [-1, 1]) S.ellipsoid(cx + k * w * 0.22, by - w * 0.08, Math.max(1, w * 0.07), Math.max(1, w * 0.07), PE, { z: 1, spec: 0.7 });
    S.ellipsoid(cx, by - w * 0.1, Math.max(1.2, w * 0.09), Math.max(1.2, w * 0.09), PE, { z: 1.1, spec: 0.7 });
    return { spr: S, meta: { ax: cx, ay: by } };
  }
  // flor (hibisco)
  const W2 = Math.ceil(w * 0.95) + pad * 2, cx = W2 / 2, cy = W2 / 2;
  const S = new Spr(W2, W2), M = S.mat(c), CE = S.mat('#ffe070');
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * TAU / 5, r = w * 0.2; S.ellipsoid(cx + Math.cos(a) * r, cy + Math.sin(a) * r, w * 0.2, w * 0.15, M, { ang: a, z: 0.5, fn: q => ({ l: q.l + (q.lx < -0.3 ? -0.12 : 0) }) }); }
  S.ellipsoid(cx, cy, Math.max(1, w * 0.1), Math.max(1, w * 0.1), CE, { z: 1 });
  if (w >= 12) { S.dot(cx + 1, cy - 2, '#fff6c0'); S.dot(cx + 2, cy - 3, '#fff6c0'); }
  return { spr: S, meta: { ax: cx, ay: cy + w * 0.28 } };
}
function hatSheet(id, ci, w) {
  w = Math.max(6, Math.round(w)); const col = ci >= 0 ? WEAR_COLORS[ci].c : '#e23e4e', name = 'wear_' + id + '_' + ci + '_' + w;
  if (!SHEET_DEFS[name]) defSheet(name, () => makeSheet(1, () => buildHat(id, col, w), { outer: '#07122455' }));
  return sheet(name);
}
// ---------------- pescoço ----------------
function buildBowtie(c, bw) {
  const W2 = bw + 4, H2 = Math.ceil(bw * 0.7) + 4, cx = W2 / 2, cy = H2 / 2, hw = bw / 2, hh = bw * 0.32;
  const S = new Spr(W2, H2), M = S.mat(c), K = S.mat(shade(c, -0.08));
  for (const sd of [-1, 1]) S.poly([[cx, cy], [cx + sd * hw, cy - hh], [cx + sd * hw, cy + hh]], M, { z: 0.5, fn: q => ({ l: 0.52 + (q.y + 0.5 < cy ? 0.12 : -0.06) - (Math.abs(q.x + 0.5 - cx) < hw * 0.4 ? 0.08 : 0) }) });
  S.ellipsoid(cx, cy, Math.max(1, bw * 0.12), Math.max(1, bw * 0.17), K, { z: 1 });
  return { spr: S, meta: { ax: cx, ay: cy } };
}
function buildTie(c, ry) {
  const tw = Math.max(3, ry * 0.6), tl = Math.max(6, ry * 1.8), W2 = Math.ceil(tw * 1.4) + 4, H2 = Math.ceil(tl) + 5, cx = W2 / 2, top = 1.5;
  const S = new Spr(W2, H2), M = S.mat(c), SR = S.mat(shade(c, -0.28)), K = S.mat(c);
  S.poly([[cx - tw * 0.3, top + tw * 0.45], [cx + tw * 0.3, top + tw * 0.45], [cx + tw * 0.55, top + tl * 0.8], [cx, top + tl], [cx - tw * 0.55, top + tl * 0.8]], M, { z: 0.5, fn: q => ({ m: (((Math.floor(q.y - q.x * 0.9) % 4) + 4) % 4 === 0) ? SR : M, l: 0.5 + (q.x + 0.5 < cx ? 0.1 : -0.05) }) });
  S.poly([[cx - tw * 0.48, top - 0.5], [cx + tw * 0.48, top - 0.5], [cx + tw * 0.3, top + tw * 0.6], [cx - tw * 0.3, top + tw * 0.6]], K, { z: 1, l: 0.66 });
  return { spr: S, meta: { ax: cx, ay: top } };
}
function buildBell(bs) {
  const W2 = Math.ceil(bs * 2) + 4, H2 = Math.ceil(bs * 2) + 5, cx = W2 / 2, top = 2;
  const S = new Spr(W2, H2), G = S.mat('#f2c34a', { hue: 12 });
  S.ellipsoid(cx, top + bs, bs, bs, G, { spec: 0.6, fn: q => (q.ly > 0.3 && Math.abs(q.lx) < 0.2) ? { l: 0.12 } : (Math.abs(q.ly) < 0.12 ? { l: q.l - 0.1 } : undefined) });
  S.put(cx, top - 1, G, 0.7, 1); S.put(cx - 1, top - 0.5, G, 0.5, 1);
  return { spr: S, meta: { ax: cx, ay: top } };
}
function buildMedal(r) {
  const W2 = Math.ceil(r * 2) + 4, H2 = Math.ceil(r * 2) + 6, cx = W2 / 2, top = 2, cy = top + r + 1;
  const S = new Spr(W2, H2), G = S.mat('#f2c34a', { hue: 12, glow: '#ffe07a44' }), GD = S.mat('#c8902a');
  S.ellipsoid(cx, cy, r + 0.6, r + 0.6, GD, { z: 0 }); S.ellipsoid(cx, cy, r, r, G, { z: 1, spec: 0.7 });
  if (r >= 3) for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * TAU / 5; S.dot(cx + Math.cos(a) * r * 0.45, cy + Math.sin(a) * r * 0.45, '#fff2a0'); }
  S.dot(cx, cy, '#fff8d0');
  return { spr: S, meta: { ax: cx, ay: top } };
}
function neckSheet(id, ci, size) {
  size = Math.max(3, Math.round(size)); const col = ci >= 0 ? WEAR_COLORS[ci].c : '#e23e4e', name = 'wearN_' + id + '_' + ci + '_' + size;
  if (!SHEET_DEFS[name]) defSheet(name, () => makeSheet(1, () => id === 'borboleta' ? buildBowtie(col, size) : id === 'gravata' ? buildTie(col, size) : id === 'medalha' ? buildMedal(size) : buildBell(size), { outer: '#07122455' }));
  return sheet(name);
}
// "anel" do pescoço: de perfil é uma faixa atravessando o corpo (do dorso até a garganta, a.bel);
// de frente é o arco de baixo de uma elipse. A espessura da faixa segue a.tan.
function ringPts(a, step = 0.8) {
  const out = [], n = Math.max(4, Math.ceil(Math.PI * Math.max(a.rx, a.ry) / step));
  if (a.orient === 'side') { const [bx, by] = a.bel || [0, 1]; for (let i = 0; i <= n; i++) { const s = -1 + 2 * i / n; out.push([a.x + bx * a.ry * s, a.y + by * a.ry * s]); } }
  else for (let i = 0; i <= n; i++) { const th = Math.PI * i / n; out.push([a.x + a.rx * Math.cos(th), a.y + a.ry * Math.sin(th)]); }
  return out;
}
function knotOf(a) { if (a.orient === 'side') { const [bx, by] = a.bel || [0, 1]; return [a.x + bx * a.ry, a.y + by * a.ry]; } return [a.x, a.y + a.ry]; }
function drawCollar(g, a, col, striped) {
  const R = makeRamp(col, 7), bw = a.ry < 5 ? 2 : 3, pts = ringPts(a), [tx, ty] = a.orient === 'side' ? (a.tan || [1, 0]) : [0, 1];
  pts.forEach(([x, y], i) => {
    const alt = striped && (Math.floor(i / 3) & 1);
    for (let k = 0; k < bw; k++) {
      g.fillStyle = alt ? (k === 0 ? '#ffffff' : k === bw - 1 ? '#c8c4d0' : '#f2f0ea') : R[k === 0 ? 5 : k === bw - 1 ? 2 : 4];
      const o = k - (bw - 1) / 2; g.fillRect(Math.round(x + tx * o), Math.round(y + ty * o), 1, 1);
    }
  });
}
function drawNeckwear(g, a, id, ci, t = 0) {
  const col = ci >= 0 ? WEAR_COLORS[ci].c : '#e23e4e', [kx, ky] = knotOf(a);
  if (id === 'borboleta') { drawSprite(neckSheet('borboleta', ci, Math.max(5, a.ry * 1.25)), 0, kx, ky - 0.5, a.dir, g); return; }
  if (id === 'gravata') { drawCollar(g, a, col, false); drawSprite(neckSheet('gravata', ci, a.ry), 0, kx, ky - 1, a.dir, g); return; }
  if (id === 'sininho') { drawCollar(g, a, col, false); drawSprite(neckSheet('sino', -1, Math.max(2, a.ry * 0.42)), 0, kx, ky, a.dir, g); return; }
  if (id === 'medalha') { drawCollar(g, a, col, true); drawSprite(neckSheet('medalha', -1, Math.max(2.5, a.ry * 0.5)), 0, kx, ky, a.dir, g); return; }
  if (id === 'perolas') {
    const pts = ringPts(a, 0.5); let acc = 99, prev = null;
    for (const p of pts) { if (prev) acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; if (acc < (a.ry < 5 ? 1.8 : 2.4)) continue; acc = 0; pearl(g, p[0], p[1], a.ry >= 5); }
    pearl(g, kx, ky + 1.5, true); return;
  }
  // cachecol: volta listrada, nó e duas pontas balançando
  drawCollar(g, a, col, true);
  const R = makeRamp(col, 7), len = Math.max(4, a.ry * 0.95), wd = a.ry < 5 ? 2 : 3;
  for (let k = 0; k < 2; k++) for (let j = 0; j < len - k * 1.5; j++) {
    const x = kx + (k ? 1 : -1) * 0.8 - a.dir * (j * 0.3 + Math.sin(t * 4 + j * 0.45 + k * 1.3) * j * 0.08), y = ky + 1 + j * 0.95, alt = Math.floor(j / 2) & 1;
    for (let q = 0; q < wd; q++) { g.fillStyle = alt ? (q === wd - 1 ? '#c8c4d0' : '#f4f2ec') : R[q === 0 ? 5 : q === wd - 1 ? 2 : 4]; g.fillRect(Math.round(x - wd / 2 + q), Math.round(y), 1, 1); }
    if (j >= len - k * 1.5 - 1) { g.fillStyle = R[5]; g.fillRect(Math.round(x - wd / 2), Math.round(y + 1), 1, 1); g.fillRect(Math.round(x + wd / 2 - 1), Math.round(y + 1), 1, 1); }
  }
  g.fillStyle = R[2]; g.fillRect(Math.round(kx - 1), Math.round(ky - 0.5), 3, 2); g.fillStyle = R[4]; g.fillRect(Math.round(kx - 1), Math.round(ky - 0.5), 2, 1);
}
function pearl(g, x, y, big) {
  x = Math.round(x - (big ? 1 : 0.5)); y = Math.round(y - (big ? 1 : 0.5));
  if (!big) { g.fillStyle = '#f4eefa'; g.fillRect(x, y, 1, 1); return; }
  g.fillStyle = '#ffffff'; g.fillRect(x, y, 1, 1); g.fillStyle = '#ece4f4'; g.fillRect(x + 1, y, 1, 1); g.fillRect(x, y + 1, 1, 1); g.fillStyle = '#b4a4ca'; g.fillRect(x + 1, y + 1, 1, 1);
}
// ---------------- óculos (desenhados pixel a pixel sobre os olhos) ----------------
function heartIn(i, j, r) { const X = i / r * 1.12, Y = -j / r * 1.12 + 0.25, v = X * X + Y * Y - 1; return v * v * v - X * X * Y * Y * Y <= 0; }
function lensAt(g, x, y, r, id) {
  const cx = Math.round(x), cy = Math.round(y), R = Math.ceil(r + 1.5), heart = id === 'coracao';
  const frame = id === 'monoculo' ? '#e8c050' : heart ? '#c82a62' : id === 'escuro' ? '#15121e' : '#2e2440';
  const lens = id === 'escuro' ? 'rgba(22,18,40,0.94)' : heart ? 'rgba(255,86,150,0.9)' : 'rgba(200,236,255,0.3)';
  for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
    let inL, inF;
    if (heart) { inL = heartIn(i, j, r - 0.6); inF = heartIn(i, j, r + 0.6); }
    else { const d = Math.hypot(i, j); inL = d <= r - 0.55; inF = d <= r + 0.5; }
    if (inL) { g.fillStyle = lens; g.fillRect(cx + i, cy + j, 1, 1); }
    else if (inF) { g.fillStyle = frame; g.fillRect(cx + i, cy + j, 1, 1); }
  }
  const s = Math.max(1, Math.round(r * 0.45));
  g.fillStyle = id === 'escuro' ? '#8e8cc0' : '#ffffff';
  g.fillRect(cx - s, cy - s, 1, 1); if (r >= 4 && id !== 'redondo' && id !== 'monoculo') g.fillRect(cx - s + 1, cy - s - 1 + (heart ? 1 : 0), 1, 1);
}
function drawGlasses(g, a, id) {
  if (id === 'mascara') {   // máscara de mergulho com snorkel
    const eyes = a.eyes.slice().sort((p, q) => p.x - q.x), l = eyes[0], r = eyes[eyes.length - 1], R = a.side ? l.r * 1.35 : Math.max(l.r, (r.x - l.x) / 2 + l.r * 0.9);
    const cx = (l.x + r.x) / 2, cy = (l.y + r.y) / 2, fr = WEAR_COLORS[a.ci >= 0 ? a.ci : 2].c, ry = a.side ? R : l.r * 1.3;
    for (let j = -Math.ceil(ry + 1); j <= Math.ceil(ry + 1); j++) for (let i = -Math.ceil(R + 1); i <= Math.ceil(R + 1); i++) {
      const d = Math.hypot(i / (R + 0.5), j / (ry + 0.5)); if (d > 1) continue;
      g.fillStyle = d > 0.78 ? fr : 'rgba(170,230,255,0.35)'; g.fillRect(Math.round(cx + i), Math.round(cy + j), 1, 1);
    }
    g.fillStyle = '#ffffff'; g.fillRect(Math.round(cx - R * 0.45), Math.round(cy - ry * 0.4), 1, 1);
    if (a.side && a.back) { g.fillStyle = '#2e2440'; const bx = Math.round(cx - a.dir * (R + 1)), xb = Math.round(a.back.x); g.fillRect(Math.min(bx, xb), Math.round(cy), Math.abs(bx - xb) + 1, 1); }
    const sx = Math.round(cx - a.dir * R * 0.7), top = Math.round(cy - ry - 7); g.fillStyle = fr;   // snorkel
    g.fillRect(sx, top, 2, Math.round(ry + 6)); g.fillStyle = '#ff6a4a'; g.fillRect(sx, top - 1, 2, 2);
    return;
  }
  const eyes = a.eyes.slice().sort((p, q) => p.x - q.x), frame = id === 'coracao' ? '#c82a62' : id === 'escuro' ? '#15121e' : '#2e2440';
  if (id === 'monoculo') {
    const e = a.side ? eyes[0] : (a.dir > 0 ? eyes[eyes.length - 1] : eyes[0]); lensAt(g, e.x, e.y, e.r, id);
    g.fillStyle = '#d8b040'; const n = Math.round(e.r * 1.6 + 4);
    for (let k = 0; k < n; k += 2) g.fillRect(Math.round(e.x - a.dir * (e.r * 0.6 + k * 0.35)), Math.round(e.y + e.r * 0.7 + k * 0.8), 1, 1);
    return;
  }
  for (const e of eyes) lensAt(g, e.x, e.y, e.r, id);
  g.fillStyle = frame;
  if (eyes.length >= 2) { const l = eyes[0], r = eyes[eyes.length - 1], y = Math.round(Math.min(l.y, r.y) - Math.min(l.r, r.r) * 0.25), x0 = Math.round(l.x + l.r), x1 = Math.round(r.x - r.r); if (x1 > x0) g.fillRect(x0, y, x1 - x0, 1); }
  if (a.side && a.back) { const e = eyes[0], y = Math.round(e.y - e.r * 0.15), xe = Math.round(e.x - a.dir * e.r), xb = Math.round(a.back.x); g.fillRect(Math.min(xe, xb), y, Math.abs(xe - xb) + 1, 1); }
}
// ---------------- capa (tecido que acompanha o corpo) ----------------
function fillPolyPix(g, pts, col) {
  let y0 = Infinity, y1 = -Infinity; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  g.fillStyle = col;
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const yc = y + 0.5, xs = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > yc) !== (yj > yc)) xs.push(xi + (yc - yi) * (xj - xi) / (yj - yi)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) { const a = Math.round(xs[k]), b = Math.round(xs[k + 1]); if (b > a) g.fillRect(a, y, b - a, 1); }
  }
}
function pixLine(g, x0, y0, x1, y1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
  for (let n = 0; n < 400; n++) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
// secs = [[xInterno, yInterno, xExterno, yExterno], ...] do ponto de amarrar até a ponta
function drawCape(p, g, secs) {
  if (!secs || secs.length < 2) return;
  const R = makeRamp(wearColor(p.s, 'body'), 7);
  for (let i = 0; i < secs.length - 1; i++) { const a = secs[i], b = secs[i + 1]; fillPolyPix(g, [[a[0], a[1]], [a[2], a[3]], [b[2], b[3]], [b[0], b[1]]], R[(Math.floor(i / 2) & 1) ? 3 : 4]); }
  g.fillStyle = R[1]; for (let i = 0; i < secs.length - 1; i++) pixLine(g, secs[i][2], secs[i][3], secs[i + 1][2], secs[i + 1][3]);
  const e = secs[secs.length - 1]; pixLine(g, e[0], e[1], e[2], e[3]);
  g.fillStyle = R[5]; for (let i = 0; i < Math.min(3, secs.length - 1); i++) pixLine(g, secs[i][0], secs[i][1], secs[i + 1][0], secs[i + 1][1]);
  g.fillStyle = '#f2c34a'; g.fillRect(Math.round(secs[0][0]), Math.round(secs[0][1]), 2, 2);
}
// chapéu, pescoço e óculos de uma vez (a espécie chama depois de desenhar a cabeça)
function drawWearHead(p, g, parts = 'nfh') {
  const s = p.s; if (!s.wear) return;
  const A = p.wearAnchors();
  if (parts.includes('n') && A.neck && wearOf(p, 'neck')) drawNeckwear(g, A.neck, s.wear.neck, wearCI(s, 'neck'), p.t);
  if (parts.includes('f') && A.face && wearOf(p, 'face')) { A.face.ci = wearCI(s, 'face'); drawGlasses(g, A.face, s.wear.face); }
  if (parts.includes('h') && A.hat && wearOf(p, 'hat')) drawHat(g, A.hat, s.wear.hat, wearCI(s, 'hat'));
}
function drawHat(g, a, id, ci) {
  const it = wearItem('hat', id), w = a.w * (id === 'flor' ? 0.85 : 1), sh = hatSheet(id, ci, w);
  drawSprite(sh, 0, a.x + (it.dx || 0) * a.w * a.dir, a.y + (it.dy || 0) * a.w, a.dir, g);
}

// ---------------- ícones do guarda-roupa ----------------
const wearIconCache = {};
function wearIcon(slot, id, ci) {
  const key = slot + id + ci; if (wearIconCache[key]) return wearIconCache[key];
  const c = makeCanvas(26, 22), g = c.getContext('2d'), col = ci >= 0 ? WEAR_COLORS[ci].c : '#e23e4e';
  if (!id) { g.fillStyle = '#6f93b0'; for (let k = -5; k <= 5; k++) { g.fillRect(13 + k, 11 + k, 1, 1); g.fillRect(13 + k, 11 - k, 1, 1); } }
  else if (slot === 'hat') { const sh = hatSheet(id, ci, id === 'pirata' ? 12 : 14), f = sh.r[0], s = Math.min(1, 24 / f.width, 21 / f.height); g.drawImage(f, Math.round(13 - f.width * s / 2), Math.round(11 - f.height * s / 2), Math.round(f.width * s), Math.round(f.height * s)); }
  else if (slot === 'neck') { if (id === 'borboleta') drawSprite(neckSheet('borboleta', ci, 13), 0, 13, 11, 1, g); else drawNeckwear(g, { x: 13, y: 5, rx: 7, ry: 5, orient: 'front', dir: 1 }, id, ci, 0); }
  else if (slot === 'face') drawGlasses(g, { eyes: [{ x: 7, y: 12, r: 4 }, { x: 19, y: 12, r: 4 }], dir: 1, ci }, id);
  else {
    const rows = id === 'capa' ? ['....####....', '...######...', '..########..', '..########..', '.##########.', '.##########.', '############', '############', '############', '#.##.##.##.#']
      : ['...#....#...', '.####..####.', '############', '############', '############', '##.######.##', '##.######.##', '...######...', '...######...', '...######...'];
    const alt = id === 'pijama' ? '#ffe27a' : '#f6f2ea';
    const ic = paint(12, 10, (x, y) => rows[y][x] !== '#' ? null : id === 'capa' ? (y === 0 && (x === 5 || x === 6) ? '#f2c34a' : (x < 6 ? shade(col, 0.1) : shade(col, -0.1))) : id === 'ouro' ? (swDetail('scale', x, y + 1) ? '#fff0a8' : '#e0a82e') : id === 'pijama' ? ((x + y * 3) % 7 === 0 ? alt : col) : (y % 3 === 2 ? alt : col));
    g.drawImage(ic, 7, 6);
  }
  return wearIconCache[key] = c.toDataURL();
}

// ---------------- janela do guarda-roupa (com loja) ----------------
let wardTab = 'hat', wardTry = null, wardBusy = false;   // wardTry = peça que está sendo provada (ainda não é sua)
function openWardrobe() {
  if (!pet || pet.s.stage === 0) { toast('O guarda-roupa abre quando o ovo chocar', 2200); return; }
  pet.wake(); pet.resting = false; renderWardrobe();
}
// devolve a peça provada ao fechar a janela
function wardRevert() {
  if (wardBusy || !wardTry || !pet) return; const t = wardTry; wardTry = null;
  if (t.prev) pet.s.wear[t.slot] = t.prev; else delete pet.s.wear[t.slot]; savePetState();
}
function wearChanged(msg) {
  savePetState(); if (!pet) return;
  pet.happyT = 1.3; pet.hop = -Math.min(5, pet.P.hr * 0.4); sfx('pearl', { v: 0.45 });
  const c = pet.headCenter(); for (let k = 0; k < 10; k++) spark(c.x + rand(-pet.P.hr, pet.P.hr), c.y + rand(-pet.P.hr, pet.P.hr * 0.6), { vx: rand(-12, 12), vy: rand(-18, -4), l: rand(0.5, 1), m: 1, gold: chance(0.5) });
  if (msg && chance(0.55)) pet.say(pick(WEAR_LINES), 2);
  const w = pet.s.wear; if (META && !META.ach.dress && ['hat', 'neck', 'face', 'body'].every(k => w[k] && wearState(k, w[k]) === 'own')) statInc('dressed');
}
function renderWardrobe() {
  if (!pet) return;
  const s = pet.s, cur = s.wear[wardTab] || null, it = cur && wearItem(wardTab, cur), ci = wearCI(s, wardTab), coin = ICONS.coin.toDataURL(), lock = ICONS.lock.toDataURL();
  const tabs = WEAR_SLOTS.map(([k, n]) => `<button data-tab="${k}" class="${k === wardTab ? 'on' : ''}">${n}</button>`).join('');
  const items = [{ id: null, name: 'Nada' }].concat(WEAR[wardTab]).map(o => {
    const oci = o.id ? (o.id === cur ? ci : (o.tint == null ? -1 : (s.wcol[wardTab] != null ? s.wcol[wardTab] : o.tint))) : -1, st = o.id ? wearState(wardTab, o.id) : 'own';
    const badge = st === 'buy' ? `<em class="price"><img src="${coin}" alt="">${o.price}</em>` : st === 'ach' ? `<em class="lock"><img src="${lock}" alt="">conquista</em>` : '';
    return `<button class="item ${o.id === cur ? 'on' : ''} ${st !== 'own' ? 'locked' : ''}" data-id="${o.id || ''}" title="${esc(o.name)}"><img src="${wearIcon(wardTab, o.id, oci)}" alt=""><span>${esc(o.name)}</span>${badge}</button>`;
  }).join('');
  let bar = '';
  if (wardTry && wardTry.slot === wardTab) {
    const ti = wearItem(wardTab, wardTry.id), a = ti.ach ? ACH.find(x => x.id === ti.ach) : null;
    bar = ti.ach ? `<div class="trybar">Provando <b>${esc(ti.name)}</b>: sai com a conquista <b>${esc(a ? a.name : '')}</b> (${esc(a ? a.desc.toLowerCase() : '')}). <button id="back">Devolver</button></div>`
      : `<div class="trybar">Provando <b>${esc(ti.name)}</b>. <button id="buy" class="pri">Comprar por <img src="${coin}" alt=""> ${ti.price}</button><button id="back">Devolver</button>${META.coins < ti.price ? '<button id="earn">Ganhar moedas</button>' : ''}</div>`;
  }
  const sw = it && it.tint != null ? `<label>Cor</label><div class="swatches">${WEAR_COLORS.map((c, i) => `<button class="sw ${i === ci ? 'on' : ''}" data-c="${i}" title="${c.n}" style="background:${c.c}"></button>`).join('')}</div>` : '';
  wardBusy = true;
  dialog(`<h2>Guarda-roupa</h2><p>${esc(petName())} está posando para você. <span class="coins"><img src="${coin}" alt=""> ${META.coins} moedas</span></p><div class="tabs">${tabs}</div><div class="items">${items}</div>${bar}${sw}<div class="row"><button id="games">Minijogos</button><button id="off">Tirar tudo</button><button id="ok" class="pri">Pronto</button></div>`, d => {
    d.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { wardTab = b.dataset.tab; sfx('tick'); renderWardrobe(); }; });
    d.querySelectorAll('.item').forEach(b => { b.onclick = () => {
      const id = b.dataset.id;
      if (!id) { if (wardTry && wardTry.slot === wardTab) wardTry = null; delete s.wear[wardTab]; wearChanged(false); renderWardrobe(); return; }
      if (wearState(wardTab, id) === 'own') { if (wardTry && wardTry.slot === wardTab) wardTry = null; s.wear[wardTab] = id; wearChanged(true); renderWardrobe(); return; }
      // ainda não é sua: prova primeiro
      let prev = s.wear[wardTab] && wearState(wardTab, s.wear[wardTab]) === 'own' ? s.wear[wardTab] : null;
      if (wardTry) { if (wardTry.slot === wardTab) prev = wardTry.prev; else { wardBusy = false; wardRevert(); } }
      wardTry = { slot: wardTab, id, prev }; s.wear[wardTab] = id; sfx('tick'); pet.happyT = 0.8; renderWardrobe();
    }; });
    d.querySelectorAll('.sw').forEach(b => { b.onclick = () => { s.wcol[wardTab] = +b.dataset.c; wearChanged(false); renderWardrobe(); }; });
    const q = sel => d.querySelector(sel);
    if (q('#buy')) q('#buy').onclick = () => {
      const ti = wearItem(wardTry.slot, wardTry.id);
      if (!spendCoins(ti.price)) { sfx('hit'); toast('Faltam ' + (ti.price - META.coins) + ' moedas. Os minijogos dão moedas!', 2600); return; }
      META.owned[wardTry.slot + ':' + wardTry.id] = true; saveMeta(); wardTry = null; sfx('buy', { gap: 0 }); toast('Comprou: ' + ti.name + '!', 2000); wearChanged(true); checkAch(); renderWardrobe();
    };
    if (q('#back')) q('#back').onclick = () => { wardBusy = false; wardRevert(); renderWardrobe(); };
    if (q('#earn')) q('#earn').onclick = () => { wardBusy = false; closeDialog(); openGames(); };
    q('#games').onclick = () => { wardBusy = false; closeDialog(); openGames(); };
    q('#off').onclick = () => { wardTry = null; s.wear = {}; wearChanged(false); renderWardrobe(); };
    q('#ok').onclick = () => { wardBusy = false; closeDialog(); if (pet && Object.keys(pet.s.wear).length) pet.say(pick(WEAR_LINES), 2.2); };
  }, 'side');
  wardBusy = false;
  pet.posing = 1;
}
