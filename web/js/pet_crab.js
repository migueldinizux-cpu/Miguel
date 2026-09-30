'use strict';
// =====================================================================
//  Espécie 3 — Ermitão (caranguejo-ermitão): anda pelo fundo com a casa
//  nas costas; a concha cresce até carregar um farol que acende à noite
// =====================================================================
const CRAB = {
  baby: { u: 5, sR: 7.5, shell: 'snail', stalk: 4, legH: 6.5, claw: 3.4, speed: 11, eye: 'cute', eyeW: 4, eyeH: 4, glow: false, antenna: false,
    c: { body: '#ff9a6e', belly: '#ffe2c8', leg: '#ff8e62', claw: '#ff8a5e', tip: '#c8503a', cheek: '#ff6f8e', shell: '#fff0de', swirl: '#ffa4c4' } },
  young: { u: 8, sR: 12.5, shell: 'turban', stalk: 6, legH: 10.5, claw: 5.2, speed: 13, eye: 'cute', eyeW: 5, eyeH: 5, glow: false, antenna: true,
    c: { body: '#ff8a5a', belly: '#ffdcbc', leg: '#f47e50', claw: '#ff7e50', tip: '#b8452e', cheek: '#ff6f8e', shell: '#f4d6a4', swirl: '#c07a48' } },
  teen: { u: 13, sR: 22, shell: 'conch', stalk: 10, legH: 17, claw: 8.6, speed: 14, eye: 'cute', eyeW: 5, eyeH: 6, glow: true, antenna: true,
    c: { body: '#f2764c', belly: '#ffd6b0', leg: '#e06c44', claw: '#f06a40', tip: '#a83a28', cheek: '#ff6f8e', shell: '#ecd2b0', swirl: '#d89a8a', anem: '#ff7fb8', barn: '#d8d4c8' } },
  adult: { u: 22, sR: 38, shell: 'tower', stalk: 15, legH: 28, claw: 15, speed: 13, eye: 'cute', eyeW: 7, eyeH: 7, glow: true, antenna: true,
    c: { body: '#e8603e', belly: '#ffd0a4', leg: '#d4583a', claw: '#e85a38', tip: '#98321f', cheek: '#ff6f8e', shell: '#cdbca0', swirl: '#a89478', moss: '#6a9a4a', coral: '#ff7ab0', coral2: '#ffa04a', tower: '#f4f0e6', stripe: '#e0404a', lamp: '#fff2a0', roof: '#d8404a' } },
};
for (const k in CRAB) { const P = CRAB[k]; P.hr = P.u * 0.55 + P.stalk * 0.8; P.lid = shade(P.c.body, -0.45); }
// pontos do corpo (relativos ao centro do corpo, olhando para a direita)
function crabGeo(P) {
  const u = P.u, sL = P.stalk;
  return { eyeF: [u * 0.02, -u * 0.62 - sL], eyeN: [u * 0.66, -u * 0.52 - sL], stalkF: [u * 0.1, -u * 0.5], stalkN: [u * 0.58, -u * 0.42], mouth: [u * 0.8, u * 0.22],
    shoulderN: [u * 0.55, u * 0.3], shoulderF: [u * 0.72, u * 0.18], clawTip: [u * 0.55 + u * 0.78 + Math.cos(-0.18) * P.claw * 1.1, u * 0.3 + u * 0.06 + Math.sin(-0.18) * P.claw * 1.1], shellC: [-u * 0.55 - P.sR * 0.62, P.legH - Math.max(1, u * 0.1) - P.sR * (P.shell === 'snail' ? 0.9 : 0.82)] };
}
// corpo com pedúnculos, olhos, boca e bochechas (6 expressões)
function crabBodyFrame(key, e, sw) {
  const P = CRAB[key], u = P.u, C = P.c, G = crabGeo(P), eh = P.eyeH;
  const ox = Math.ceil(u * 1.2 + 3), oy = Math.ceil(u * 0.62 + P.stalk + eh + 4);
  const S = new Spr(ox + u * 1.5 + 4, oy + u * 0.95 + 3);
  const M = { b: S.mat(C.body), bel: S.mat(C.belly, { dark: 0.6 }), d: S.mat(shade(C.body, -0.18)), ch: S.mat(C.cheek), s1: sw ? S.mat(sw.c1) : null, s2: sw ? S.mat(sw.c2) : null };
  S.ellipsoid(ox, oy, u, u * 0.78, M.b, { z: 1, fn: q => {
    if (sw && q.lx < 0.52 && q.ly > -0.62) {
      const m = swDetail(sw.pat, q.x, q.y, Math.max(1, Math.round(u * 0.18))) ? M.s2 : M.s1;
      return { m, l: q.l + ((q.x + q.y) & 1 ? 0.03 : -0.03) };
    }
    if (q.ly > 0.42) return { m: M.bel };
    return { l: q.l + (hash2(Math.floor(q.x / 2), Math.floor(q.y / 2), 13) < 0.18 ? 0.07 : 0) };
  } });
  // pedúnculos (o de lá atrás, o de cá na frente) com olhos em cima
  const stalk = (base, eye, m, z) => { S.tube([{ x: ox + base[0], y: oy + base[1], r: Math.max(0.8, u * 0.11), z }, { x: ox + eye[0], y: oy + eye[1] + eh * 0.35, r: Math.max(0.7, u * 0.08), z }], m, {}); S.ellipsoid(ox + eye[0], oy + eye[1], P.eyeW * 0.62, eh * 0.62, m, { z: z + 0.05 }); };
  stalk(G.stalkF, G.eyeF, M.d, 0.4); stalk(G.stalkN, G.eyeN, M.b, 1.6);
  if (P.antenna) for (const s of [0, 1]) { const x0 = ox + u * (0.78 + s * 0.08), y0 = oy - u * 0.3; S.tube([{ x: x0, y: y0, r: 0.6 }, { x: x0 + u * 0.35, y: y0 - u * 0.5, r: 0.5 }, { x: x0 + u * 0.75 + s * 2, y: y0 - u * 0.7 - s, r: 0.5 }], s ? M.b : M.d, { z: s ? 1.7 : 0.3 }); }
  S.ellipsoid(ox + u * 0.52, oy + u * 0.02, Math.max(1, u * 0.16), Math.max(0.8, u * 0.09), M.ch, { z: 1.2, flat: 0.3 });
  petEye(S, P, ox + G.eyeF[0], oy + G.eyeF[1], e); petEye(S, P, ox + G.eyeN[0], oy + G.eyeN[1], e);
  petMouth(S, ox + G.mouth[0], oy + G.mouth[1], e, u >= 8 ? 4 : 3, u >= 12 ? 2 : 1);
  return { spr: S, meta: { ax: ox, ay: oy } };
}
// pernas do lado de cá / de lá: 0-3 andando, 4 sentado, 5 penduradas (boiando)
function crabLegsFrame(key, f, far) {
  const P = CRAB[key], u = P.u, C = P.c, L = P.legH, ox = Math.ceil(u * 1.7 + 3), oy = Math.ceil(u * 0.3 + 3);
  const S = new Spr(ox + u * 1.7 + 4, oy + L + 3), M = S.mat(far ? shade(C.leg, -0.25) : C.leg), T = S.mat(far ? shade(C.tip, -0.2) : C.tip);
  const hips = [[u * 0.32, u * 0.5], [-u * 0.08, u * 0.6], [-u * 0.46, u * 0.52]], sh = far ? -u * 0.22 : 0;
  hips.forEach(([hx, hy], i) => {
    hx += sh; const spread = i === 0 ? 0.55 : i === 1 ? 0.05 : -0.5;
    let tx, ty;
    if (f < 4) { const ph = (f / 4 + (i % 2) * 0.5 + (far ? 0.25 : 0)) * TAU; tx = hx + u * spread + Math.sin(ph) * u * 0.25; ty = L - Math.max(0, Math.cos(ph)) * u * 0.16; }
    else if (f === 4) { tx = hx + u * spread * 0.8; ty = L - u * 0.12; }
    else { tx = hx + u * spread * 0.4 - u * 0.1; ty = L * 0.92; }
    const kx = (hx + tx) / 2 + (i === 0 ? u * 0.28 : i === 2 ? -u * 0.28 : u * 0.05), ky = Math.min(hy, ty) - u * (f === 5 ? 0.05 : 0.2);
    S.tube([{ x: ox + hx, y: oy + hy, r: Math.max(0.8, u * 0.12) }, { x: ox + kx, y: oy + ky, r: Math.max(0.7, u * 0.1) }, { x: ox + tx, y: oy + ty, r: 0.6 }], M, { z: far ? 0 : 2, fn: q => q.k === 1 && q.t > 0.62 ? { m: T } : undefined });
  });
  return { spr: S, meta: { ax: ox, ay: oy } };
}
// garra (âncora no ombro): 0 fechada, 1 aberta, 2 erguida fechada, 3 erguida aberta
function crabClawFrame(key, f, far) {
  const P = CRAB[key], u = P.u, C = P.c, k = far ? 0.74 : 1, cs = P.claw * k, raised = f >= 2, open = f % 2 === 1;
  const pad = Math.ceil(cs * 1.4 + u * 0.4 + 3), S = new Spr(pad * 2 + u * 1.2, pad * 2 + u * 0.4), ox = pad, oy = pad;
  const B = S.mat(far ? shade(C.claw, -0.22) : C.claw), T = S.mat(far ? shade(C.tip, -0.2) : C.tip);
  const el = raised ? [u * 0.4 * k, -u * 0.12 * k] : [u * 0.4 * k, u * 0.22 * k], wr = raised ? [u * 0.66 * k, -u * 0.5 * k] : [u * 0.78 * k, u * 0.06 * k];
  S.tube([{ x: ox, y: oy, r: Math.max(0.9, u * 0.15 * k) }, { x: ox + el[0], y: oy + el[1], r: Math.max(0.8, u * 0.13 * k) }, { x: ox + wr[0], y: oy + wr[1], r: Math.max(0.8, u * 0.13 * k) }], B, { z: 0 });
  const a = raised ? -1.05 : -0.18, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
  const pcx = ox + wr[0] + ca * cs * 0.42, pcy = oy + wr[1] + sa * cs * 0.42;
  S.ellipsoid(pcx, pcy, cs * 0.6, cs * 0.44, B, { ang: a, z: 1, fn: q => ({ l: q.l + (hash2(Math.floor(q.x / 2), Math.floor(q.y / 2), 3) < 0.2 ? 0.06 : 0) }) });
  const fb = [pcx + ca * cs * 0.45, pcy + sa * cs * 0.45];
  // dedo fixo (de baixo) e dedo móvel (de cima)
  S.tube([{ x: fb[0] + px * cs * 0.16, y: fb[1] + py * cs * 0.16, r: Math.max(0.8, cs * 0.2) }, { x: fb[0] + ca * cs * 0.62 + px * cs * 0.06, y: fb[1] + sa * cs * 0.62 + py * cs * 0.06, r: 0.6 }], B, { z: 1.1, fn: q => q.t > 0.55 ? { m: T } : undefined });
  const oa = a - (open ? 0.62 : 0.08), co = Math.cos(oa), so = Math.sin(oa);
  S.tube([{ x: fb[0] - px * cs * 0.2, y: fb[1] - py * cs * 0.2, r: Math.max(0.8, cs * 0.2) }, { x: fb[0] - px * cs * 0.2 + co * cs * 0.62, y: fb[1] - py * cs * 0.2 + so * cs * 0.62, r: 0.6 }], B, { z: 1.2, fn: q => q.t > 0.55 ? { m: T } : undefined });
  return { spr: S, meta: { ax: ox, ay: oy, tip: [wr[0] + ca * cs * 1.1, wr[1] + sa * cs * 1.1] } };
}
// a casa: concha de caracol → turbante → búzio com anêmona → concha-farol
function crabShellFrame(key) {
  const P = CRAB[key], u = P.u, C = P.c, R = P.sR, snail = P.shell === 'snail', ry = R * (snail ? 0.9 : 0.82), G = crabGeo(P);
  const top = P.shell === 'tower' ? R * 1.6 : P.shell === 'conch' ? R * 0.7 : P.shell === 'turban' ? R * 0.5 : 0;
  const pad = 4, W2 = Math.ceil(R * 2.4 + pad * 2), H2 = Math.ceil(ry * 2 + top + pad * 2), scx = Math.ceil(pad + R * 1.1), scy = Math.ceil(pad + top + ry);
  const S = new Spr(W2, H2), glow = P.glow;
  const M = { a: S.mat(C.shell), b: S.mat(C.swirl), d: S.mat(shade(C.shell, -0.3)), hole: S.mat('#2a1624'), mo: C.moss ? S.mat(C.moss) : null };
  const apx = scx - R * 0.14, apy = scy - ry * 0.14, pitch = R * (snail ? 0.38 : 0.3);
  const spiral = q => { const dx = q.x + 0.5 - apx, dy = (q.y + 0.5 - apy) / 0.9, r = Math.hypot(dx, dy), th = Math.atan2(dy, dx); const sp = fract(th / TAU + r / pitch); return { r, sp }; };
  // espira (a pontinha em cima)
  if (!snail) S.tube([{ x: scx - R * 0.05, y: scy - ry * 0.35, r: R * 0.52 }, { x: scx - R * 0.28, y: scy - ry * 0.9, r: R * 0.34 }, { x: scx - R * 0.42, y: scy - ry - top * (P.shell === 'tower' ? 0.28 : 0.75), r: Math.max(0.8, R * 0.1) }], M.a, { z: -0.2, fn: q => {
    const rib = Math.floor(q.s / Math.max(2, R * 0.16)) & 1; if (P.shell === 'turban' && hash2(Math.floor(q.x / 2), Math.floor(q.y / 2), 8) < 0.12) return { m: M.b };
    return { l: q.l + (rib ? -0.07 : 0.04) };
  } });
  // volta principal
  S.ellipsoid(scx, scy, R, ry, M.a, { z: 0, spec: 0.25, fn: q => {
    const { sp } = spiral(q);
    if (sp < 0.09) return { m: M.d, l: q.l - 0.06 };
    if (snail) return sp < 0.52 ? undefined : { m: M.b };
    if (P.shell === 'turban') { if (hash2(Math.floor(q.x / 2.5), Math.floor(q.y / 2.5), 4) < 0.1) return { m: M.b }; return { l: q.l + Math.sin(sp * TAU) * 0.05 }; }
    if (P.shell === 'tower' && q.ly < -0.35 && hash2(Math.floor(q.x / 3), Math.floor(q.y / 2), 6) < 0.45) return { m: M.mo };
    return sp > 0.55 ? { m: M.b, l: q.l - 0.02 } : undefined;
  } });
  // boca da concha (aparece quando ele se esconde)
  S.ellipsoid(scx + R * 0.6, scy + ry * 0.3, R * 0.36, ry * 0.46, M.hole, { z: 0.4, flat: 0.3, fn: q => ({ l: 0.25 + q.ly * 0.1 }) });
  S.ellipsoid(scx + R * 0.6, scy + ry * 0.3, R * 0.42, ry * 0.52, M.d, { z: 0.35, fn: q => ({ l: 0.5 }) });
  let lamp = null;
  if (P.shell === 'conch' || P.shell === 'tower') {
    // espinhos no ombro e cracas
    for (let k = 0; k < 5; k++) { const th = -2.5 + k * 0.42, bx = scx + Math.cos(th) * R * 0.92, by = scy + Math.sin(th) * ry * 0.92; S.tube([{ x: bx, y: by, r: Math.max(1, R * 0.07) }, { x: bx + Math.cos(th) * R * 0.2, y: by + Math.sin(th) * R * 0.2 - R * 0.05, r: 0.6 }], M.a, { z: 0.6 }); }
    const BA = S.mat(C.barn || '#d8d4c8');
    for (let k = 0; k < (P.shell === 'tower' ? 6 : 4); k++) { const bx = scx - R * 0.6 + hash2(k, 1, 9) * R * 1.1, by = scy + ry * (0.1 + hash2(k, 2, 9) * 0.5), r = Math.max(1.2, R * 0.07); S.ellipsoid(bx, by, r, r * 0.8, BA, { z: 0.7 }); S.dot(bx, by - 0.5, '#5a5048'); }
  }
  if (P.shell === 'conch') {   // anêmona amiga morando em cima
    const AN = S.mat(C.anem, glow ? { glow: C.anem + '99' } : {}), ax0 = scx + R * 0.1, ay0 = scy - ry * 0.92;
    sprCyl(S, ax0, ay0 - R * 0.14, ay0 + R * 0.05, R * 0.14, R * 0.18, S.mat(shade(C.anem, -0.2)), { z: 1 });
    for (let k = 0; k < 8; k++) { const th = -Math.PI / 2 + (k - 3.5) * 0.3, L = R * (0.28 + hash2(k, 4, 2) * 0.1); S.tube([{ x: ax0 + (k - 3.5) * R * 0.035, y: ay0 - R * 0.12, r: Math.max(0.7, R * 0.04) }, { x: ax0 + Math.cos(th) * L * 0.6, y: ay0 - R * 0.12 + Math.sin(th) * L * 0.8, r: Math.max(0.6, R * 0.03) }, { x: ax0 + Math.cos(th) * L * 1.05, y: ay0 - R * 0.1 + Math.sin(th) * L * 0.95, r: 0.5 }], AN, { z: 1.1 + k * 0.01 }); }
  }
  if (P.shell === 'tower') {
    // jardim de corais
    const CO = S.mat(C.coral, { glow: C.coral + '66' }), CO2 = S.mat(C.coral2);
    const branch = (x, y, L, a, d) => { const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L; S.tube([{ x, y, r: Math.max(0.8, L * 0.16) }, { x: x2, y: y2, r: 0.7 }], CO, { z: 1.2 }); if (d > 0) { branch(x2, y2, L * 0.7, a - 0.5, d - 1); branch(x2, y2, L * 0.65, a + 0.45, d - 1); } };
    branch(scx + R * 0.5, scy - ry * 0.7, R * 0.2, -1.3, 2); branch(scx - R * 0.75, scy - ry * 0.5, R * 0.16, -1.9, 2);
    S.poly([[scx - R * 0.45, scy - ry * 0.78], [scx - R * 0.72, scy - ry * 1.2], [scx - R * 0.5, scy - ry * 1.28], [scx - R * 0.3, scy - ry * 1.15]], CO2, { z: 1.1, fn: q => (hash2(q.x, q.y, 3) < 0.18 ? null : { l: 0.55 + (q.y % 2 ? -0.08 : 0.04) }) });
    // farol
    const TW = S.mat(C.tower), TR = S.mat(C.stripe), RF = S.mat(C.roof), GL = S.mat(C.lamp, { glow: C.lamp + 'ee' }), DK = S.mat('#3a3040');
    const tx0 = scx + R * 0.05, ty0 = scy - ry * 0.74, hT = R * 1.05, rB = R * 0.2, rT = R * 0.14, lan = Math.max(3, Math.round(R * 0.17));
    sprCyl(S, tx0, ty0 - hT, ty0 + 2, rT, rB, TW, { z: 2, fn: q => (Math.floor((ty0 + 2 - q.y) / (hT / 5)) & 1) ? { m: TR } : undefined });
    for (let k = 1; k <= 3; k++) { const wy = ty0 - hT * (k / 4.2); S.dot(tx0 + 1, wy, '#2a2238'); S.dot(tx0 + 1, wy + 1, '#4a3a58'); }
    S.ellipsoid(tx0 + rB * 0.3, ty0, Math.max(1, rB * 0.28), Math.max(1.5, rB * 0.45), DK, { z: 2.1, fn: q => q.ly > 0.3 ? null : undefined });
    S.ellipsoid(tx0, ty0 - hT, rT * 1.55, Math.max(1.2, R * 0.045), DK, { z: 2.2 });
    sprCyl(S, tx0, ty0 - hT - lan, ty0 - hT, rT * 0.9, rT * 0.9, GL, { z: 2.3, fn: q => (Math.round(q.x - tx0) % 3 === 0) ? { m: DK } : { l: 0.85 } });
    S.ellipsoid(tx0, ty0 - hT - lan, rT * 1.1, rT * 0.95, RF, { z: 2.4, fn: q => q.ly > 0.05 ? null : undefined });
    S.ellipsoid(tx0, ty0 - hT - lan - rT * 0.95, 1.1, 1.1, S.mat('#f2c34a'), { z: 2.5 });
    lamp = [tx0, ty0 - hT - lan / 2];
  }
  const axs = scx - G.shellC[0], ays = scy - G.shellC[1];
  return { spr: S, meta: { ax: axs, ay: ays, lamp: lamp ? [lamp[0] - axs, lamp[1] - ays] : null } };
}
for (const k of ['baby', 'young', 'teen', 'adult']) {
  defSheet('crabShell_' + k, () => makeSheet(1, () => crabShellFrame(k), { outer: '#07122455' }));
  defSheet('crabLegN_' + k, () => makeSheet(6, f => crabLegsFrame(k, f, false), { outer: '#07122444' }));
  defSheet('crabLegF_' + k, () => makeSheet(6, f => crabLegsFrame(k, f, true), { outer: '#07122444' }));
  defSheet('crabClawN_' + k, () => makeSheet(4, f => crabClawFrame(k, f, false), { outer: '#07122455' }));
  defSheet('crabClawF_' + k, () => makeSheet(4, f => crabClawFrame(k, f, true), { outer: '#07122444' }));
}
function crabBodySheet(key, sw) {
  const name = 'crabBody_' + key + (sw ? '_' + sw.pat + sw.c1.slice(1) + sw.c2.slice(1) : '');
  if (!SHEET_DEFS[name]) defSheet(name, () => makeSheet(6, f => crabBodyFrame(key, f, sw), { outer: '#07122455' }));
  return sheet(name);
}
defSheet('petEgg_crab', () => makeSheet(3, f => {
  const S = new Spr(20, 24), E = S.mat('#ffa878', { glow: '#ffb08044' }), SP = S.mat('#fff2dc'), SW = S.mat('#e8704a'), CR = S.mat('#5a2a20');
  S.ellipsoid(10, 13.5, 7, 9.5, E, { z: 1, spec: 0.35, fn: q => { const r = Math.hypot(q.x + 0.5 - 11, q.y + 0.5 - 12), th = Math.atan2(q.y + 0.5 - 12, q.x + 0.5 - 11); if (r < 5 && fract(th / TAU + r / 2.4) < 0.18) return { m: SW }; return hash2(Math.floor(q.x / 2), Math.floor(q.y / 2), 23) < 0.14 ? { m: SP } : undefined; } });
  if (f >= 1) { let x = 5, y = 9; for (let k = 0; k < 9; k++) { S.put(x, y, CR, 0.2, 2); x += 1; y += (k % 2 ? -1 : 1); } }
  if (f >= 2) { let x = 7, y = 16; for (let k = 0; k < 7; k++) { S.put(x, y, CR, 0.2, 2); x += 1; y += (k % 2 ? 1 : -1); } S.put(10, 6, CR, 0.2, 2); S.put(10, 7, CR, 0.2, 2); }
  return { spr: S, meta: { ax: 10, ay: 22 } };
}, { outer: '#07122455' }));

class CrabPet extends Pet {
  setupStage(fresh) {
    const k = this.key;
    if (k === 'egg') { const n = this.nestPos(); this.hx = n.x; this.hy = n.y; this.P = null; return; }
    const P = CRAB[k]; this.P = P; this.G = crabGeo(P); this.walk = this.walk || 0; this.hide = 0; this.air = false; this.snapT = 0; this.clawCD = rand(3, 6);
    this.shell = sheet('crabShell_' + k); this.legN = sheet('crabLegN_' + k); this.legF = sheet('crabLegF_' + k); this.clawN = sheet('crabClawN_' + k); this.clawF = sheet('crabClawF_' + k);
    if (fresh) { const n = this.nestPos(); this.hx = n.x; this.hy = n.y + 2 - P.legH; if (k === 'teen' || k === 'adult') { this.hx = clamp(n.x + 60, 20, W - 20); this.hy = this.floorY(this.hx); } }
    const nk = PET_KEYS[this.s.stage + 1];
    if (nk && !this.s.preview) setTimeout(() => { try { for (const s of ['crabShell_', 'crabLegN_', 'crabLegF_', 'crabClawN_', 'crabClawF_']) sheet(s + nk); crabBodySheet(nk, null); } catch (e) { console.error(e); } }, 5000);
  }
  floorY(x) { return gy(x) - this.P.legH + 1; }
  mouthOff() { return { x: this.G.mouth[0], y: this.G.mouth[1] }; }
  headOff() { return { x: this.P.u * 0.4, y: -this.P.u * 0.25 }; }
  hitRadius() { return this.P.u * 1.25; }
  headHit(x, y) {
    if (!this.P) return false;
    if (this.hide > 0.7) { const c = this.bpt(0, 0), sc = this.G.shellC; return Math.hypot(x - (this.hx + sc[0] * this.dir), y - (this.hy + sc[1])) < this.P.sR || Math.hypot(x - c.x, y - c.y) < this.P.u; }
    if (super.headHit(x, y)) return true;
    const e = this.bpt(this.G.eyeN[0], this.G.eyeN[1]); return Math.hypot(x - e.x, y - e.y) < this.P.eyeW + 2;
  }
  clawTip() { const t = this.G.clawTip; return this.bpt(t[0], t[1]); }
  reach(x, y) { if (super.reach(x, y)) return true; const c = this.clawTip(); return Math.hypot(x - c.x, y - c.y) < this.P.claw * 1.2 + 6; }
  eatReach(x, y) { if (super.eatReach(x, y)) return true; const c = this.clawTip(); return Math.hypot(x - c.x, y - c.y) < this.P.claw + 4; }
  restHead() {
    const k = this.key;
    if (k === 'baby' || k === 'young') { const n = this.nestPos(); return { x: n.x + 2, y: n.y + 3 - this.P.legH, face: 1 }; }
    const P = this.P, x = clamp(LAIR.x + lairShift() + 418, P.u * 2 + 10, W - P.sR * 2 - P.u - 6); return { x, y: this.floorY(x), face: -1 };   // ao lado das ruínas, na areia
  }
  posePos() { const x = Math.round(W * POSE_X); return { x, y: this.floorY(x) }; }
  playTarget() { return { x: clamp(mouse.x + Math.sin(this.t * 2.2) * this.P.u * 2, 10, W - 10), y: this.floorY(mouse.x) }; }
  wanderTarget() { const k = this.key, n = this.nestPos(), rad = k === 'baby' ? 90 : k === 'young' ? 180 : 1e9, x = clamp(n.x + rand(-rad, rad), this.P.sR + 10, W - this.P.u * 2 - 10); return { x, y: this.floorY(x) }; }
  sparkPoint() { const u = this.P.u, R = this.P.sR; return chance(0.5) ? this.bpt(rand(-u, u), rand(-u, u)) : this.bpt(this.G.shellC[0] + rand(-R, R), this.G.shellC[1] + rand(-R, R)); }
  // caça perto do fundo, beliscando com a garra
  preyOk(f) { return f.y > groundTop - (this.P.u * 3 + this.P.stalk + 75); }
  huntCatch(f) { if (super.huntCatch(f)) return true; const c = this.clawTip(); return Math.hypot(f.x - c.x, f.y - c.y) < this.P.claw + 8; }
  scaresPrey() { return this.s.stage >= 3; }
  huntFx() { sfx('snip'); this.snapT = 0.4; }
  defendFx(m) { sfx('snip', { gap: 0 }); this.snapT = 0.6; for (let i = 0; i < 10; i++) addBubble(m.x + rand(-5, 5), m.y + rand(-4, 4), randi(0, 3)); }
  // anda na areia; só sobe (boiando, com as perninhas penduradas) quando o alvo está bem acima
  move(dt) {
    const P = this.P, dx = this.tx - this.hx, sp = P.speed * this.spMul;
    const vxT = Math.abs(dx) < 1.5 ? 0 : clamp(dx * 2.5, -sp, sp);
    this.vx += (vxT - this.vx) * Math.min(1, dt * 5);
    if (this.shake > 0) this.vx += Math.sin(this.t * 30) * 20 * dt * 10;
    this.hx = clamp(this.hx + this.vx * dt, 8, W - 8); this.walk += Math.abs(this.vx * dt);
    let floor = this.floorY(this.hx);
    if (this.restTarget && Math.abs(this.tx - this.hx) < 8) floor = Math.min(floor, this.ty);
    const want = this.ty < Math.min(floor, this.floorY(clamp(this.tx, 0, W - 1))) - 4 ? Math.max(this.ty, waterTop + P.stalk + P.u * 2 + 6) : floor;
    this.vy += (clamp((want - this.hy) * 3, -P.speed * (this.state === 'hunt' ? 2.2 : 1.3), 50) - this.vy) * Math.min(1, dt * 3);
    this.hy += this.vy * dt;
    if (this.hy > floor) { this.hy = floor; if (this.vy > 0) this.vy = 0; }
    const air = floor - this.hy > 2.5;
    if (air && !this.air && Math.random() < 0.5) for (let i = 0; i < 4; i++) addBubble(this.hx + rand(-P.u, P.u), this.hy + P.legH, randi(0, 1));
    this.air = air;
    if (this.face) this.dir = this.face; else if (this.vx > 2) this.dir = 1; else if (this.vx < -2) this.dir = -1;
  }
  updateBody(dt) {
    this.restW += ((this.restTarget ? 1 : 0) - this.restW) * Math.min(1, dt * 1.1);
    const want = this.state === 'sleep' ? (this.peekT > 0 ? 0.45 : 1) : 0;
    this.hide += (want - this.hide) * Math.min(1, dt * (want > this.hide ? 2.5 : 4));
    this.snapT -= dt; this.clawCD -= dt; if (this.clawCD < -0.35) this.clawCD = rand(3, 7);
  }
  previewPose(x, y) { this.hx = x - 2; this.hy = y + 6; this.dir = 1; this.hide = 0; }
  // coordenada do corpo → mundo (inclui recolher na concha)
  bpt(lx, ly) {
    const u = this.P.u, h = this.hide, sh = this.shake > 0 ? Math.round(Math.sin(this.t * 40) * 1.5) : 0;
    const bob = (!this.air && Math.abs(this.vx) > 2 && u >= 8 && (Math.floor(this.walk / (u * 0.35)) & 1)) ? -1 : 0;
    return { x: this.hx + (lx - u * 0.85 * h) * this.dir + sh, y: this.hy + this.hop + ly + u * 0.2 * h + bob };
  }
  wearAnchors() {
    const P = this.P, u = P.u, G = this.G, hat = this.bpt((G.eyeF[0] + G.eyeN[0]) / 2, Math.min(G.eyeF[1], G.eyeN[1]) - P.eyeH * 0.5 + 1), nk = this.bpt(u * 0.7, -u * 0.08), eF = this.bpt(G.eyeF[0], G.eyeF[1]), eN = this.bpt(G.eyeN[0], G.eyeN[1]), er = P.eyeH / 2 + 0.6;
    return { hat: { x: hat.x, y: hat.y, w: (G.eyeN[0] - G.eyeF[0]) + P.eyeW + 1, dir: this.dir },
      neck: { x: nk.x, y: nk.y, rx: 1, ry: u * 0.5, orient: 'side', tan: [1, 0], bel: [0, 1], dir: this.dir },
      face: { eyes: [{ x: eF.x, y: eF.y, r: er }, { x: eN.x, y: eN.y, r: er }], dir: this.dir, side: false } };
  }
  capeSecs() {
    const P = this.P, u = P.u, R = P.sR, n = Math.max(4, Math.round(R * 0.9)), out = [];
    for (let j = 0; j <= n; j++) {
      const v = j / n, lx = -u * 0.25 - v * R * 1.5, ly = -u * 0.5 - Math.sin(v * Math.PI * 0.8) * R * 0.55 + v * R * 0.2, w = u * 0.45 + v * R * 0.55 + Math.sin(this.t * 4 - v * 5) * v * u * 0.25;
      const a = this.bpt(lx, ly), b = this.bpt(lx - v * u * 0.3, ly + w); out.push([a.x, a.y, b.x, b.y]);
    }
    return out;
  }
  drawBody(g) {
    const P = this.P, u = P.u, G = this.G, dir = this.dir, h = this.hide, sw = sweaterOf(this), body = crabBodySheet(this.key, sw);
    const moving = Math.abs(this.vx) > 2, lf = this.air ? 5 : moving ? Math.floor(this.walk / (u * 0.35)) % 4 : this.restW > 0.6 ? 4 : 0;
    const o = this.bpt(0, 0), shellX = this.hx + (this.shake > 0 ? Math.round(Math.sin(this.t * 40) * 1.5) : 0), shellY = this.hy + this.hop;
    // garras: comendo, feliz, defendendo, alcançando comida...
    const m = this.mouthPos(), dragNear = drag.item && Math.hypot(mouse.x - m.x, mouse.y - m.y) < u * 3 + 20, fast = Math.floor(this.t * 8) & 1, slow = Math.floor(this.t * 3) & 1;
    let cN = 0, cF = 0;
    if (this.snapT > 0) { cN = fast ? 3 : 2; cF = fast ? 2 : 3; }
    else if (this.state === 'eat') { cN = fast ? 3 : 2; }
    else if (this.state === 'evolve' || this.happyT > 0 || this.state === 'play') { cN = slow ? 3 : 2; cF = slow ? 2 : 3; }
    else if (dragNear && this.s.fome < 97) cN = 3;
    else if (this.clawCD < 0) cN = 1;
    const cape = wearOf(this, 'body') && wearOf(this, 'body').id === 'capa' && h < 0.5;
    const sF = this.bpt(G.shoulderF[0], G.shoulderF[1]), sN = this.bpt(G.shoulderN[0], G.shoulderN[1]);
    drawSprite(this.legF, lf, o.x, o.y, dir, g);
    drawSprite(this.clawF, cF, sF.x, sF.y, dir, g);
    if (h < 0.5) drawSprite(this.shell, 0, shellX, shellY, dir, g);
    if (cape) drawCape(this, g, this.capeSecs());
    drawSprite(body, this.expr, o.x, o.y, dir, g);
    drawSprite(this.legN, lf, o.x, o.y, dir, g);
    drawSprite(this.clawN, cN, sN.x, sN.y, dir, g);
    if (h >= 0.5) drawSprite(this.shell, 0, shellX, shellY, dir, g);
    if (this.state === 'evolve') { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 + 0.35 * Math.sin(this.evolveT * 14); drawSprite(this.shell, 0, shellX, shellY, dir, g); drawSprite(body, this.expr, o.x, o.y, dir, g); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    if (h < 0.5) drawWearHead(this, g);
  }
  glowBody(a) {
    const P = this.P, sh = this.shell;
    ctx.globalAlpha = 0.3 + a * 0.7; drawSpriteGlow(sh, 0, this.hx, this.hy + this.hop, this.dir);
    if (sh.lamp && a > 0.05) {   // o farol acende e o facho gira devagar
      const lx = this.hx + sh.lamp[0] * this.dir, ly = this.hy + this.hop + sh.lamp[1], th = this.t * 0.7, cs = Math.cos(th), L = 115;
      ctx.globalAlpha = a * 0.8; ctx.drawImage(glowSprite('#fff2a0', 12), Math.round(lx - 12), Math.round(ly - 12));
      ctx.globalAlpha = a * (cs > 0 ? 0.32 : 0.14) * Math.abs(Math.sin(th));
      const ex = lx + Math.sin(th) * L, spread = 7 + Math.abs(Math.sin(th)) * 5;
      fillPolyPix(ctx, [[lx, ly - 1], [ex, ly - spread], [ex, ly + spread], [lx, ly + 1]], '#fff6c8');
    }
    ctx.globalAlpha = 1;
  }
}
SPECIES.crab = { name: 'Ermitão', baby: 'ermitão', desc: 'Anda pelo fundo com a casinha nas costas. A concha cresce até virar um farol.', egg: 'petEgg_crab', eggGlow: '#ffb080', shellC: '#ffc8a0', cls: CrabPet };
