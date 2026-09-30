'use strict';
// =====================================================================
//  Som: ambiente de hidrofone e efeitos, tudo sintetizado na hora (Web Audio).
//  Sem arquivos: funciona igual no app (file://), no Lively e no navegador.
// =====================================================================
const SND_LEVELS = [0, 0.2, 0.42, 0.72];
const SND_LABEL = ['Desligado', 'Baixo', 'Médio', 'Alto'];
const SND_STORE = 'aquario.som.v1';
const SND = { ctx: null, level: 1, master: null, sfx: null, amb: null, wet: null, noise: null, last: {}, purr: null, ambOn: false, hidden: false };
try { const v = localStorage.getItem(SND_STORE); if (v !== null && SND_LEVELS[+v] !== undefined) SND.level = +v; } catch (e) { }
if (QS.has('mute')) SND.level = 0;

function sndInit() {
  if (SND.ctx) { if (SND.ctx.state === 'suspended') SND.ctx.resume().catch(() => { }); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  let c; try { c = new AC(); } catch (e) { return; }
  SND.ctx = c;
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; comp.connect(c.destination);
  SND.master = c.createGain(); SND.master.gain.value = SND_LEVELS[SND.level]; SND.master.connect(comp);
  SND.sfx = c.createGain(); SND.sfx.gain.value = 1; SND.sfx.connect(SND.master);
  // "sala" submarina: eco escuro e comprido
  const len = Math.round(c.sampleRate * 2.4), ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { lp += ((Math.random() * 2 - 1) - lp) * 0.35; d[i] = lp * Math.pow(1 - i / len, 3.2); } }
  const conv = c.createConvolver(); conv.buffer = ir; SND.wet = c.createGain(); SND.wet.gain.value = 0.9; SND.wet.connect(conv); conv.connect(SND.master);
  // ruído branco reaproveitado pelos efeitos
  const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; SND.noise = nb;
  if (c.state === 'suspended') c.resume().catch(() => { });
  sndAmbient();
}
// o navegador só libera o som depois de um gesto: o primeiro clique ou tecla acende tudo
for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => sndInit(), { capture: true });
if (IS_APP) setTimeout(sndInit, 600);   // no app o som é liberado de saída
document.addEventListener('visibilitychange', () => { SND.hidden = document.hidden; sndApplyLevel(); });
function sndApplyLevel(ramp = 0.4) {
  if (!SND.ctx) return; const t = SND.ctx.currentTime, v = SND.hidden ? 0 : SND_LEVELS[SND.level];
  SND.master.gain.cancelScheduledValues(t); SND.master.gain.setTargetAtTime(v, t, ramp / 3);
}
function sndSetLevel(l, quiet) {
  SND.level = clamp(l | 0, 0, 3); try { localStorage.setItem(SND_STORE, String(SND.level)); } catch (e) { }
  sndInit(); sndApplyLevel(); if (!quiet) { toast('Som: ' + SND_LABEL[SND.level], 1600); if (SND.level) sfx('tick'); }
  if (typeof hostSend === 'function') hostSend({ t: 'sound', v: SND.level });
}
function sndToggle() { if (SND.level) { SND.prev = SND.level; sndSetLevel(0); } else sndSetLevel(SND.prev || 1); }

// ---------------- ambiente: ruído grave que "respira", zumbido e cantos distantes ----------------
function sndAmbient() {
  const c = SND.ctx; if (!c || SND.ambOn) return; SND.ambOn = true;
  SND.amb = c.createGain(); SND.amb.gain.value = 0; SND.amb.connect(SND.master);
  const secs = 6, buf = c.createBuffer(2, c.sampleRate * secs, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); let b = 0; for (let i = 0; i < d.length; i++) { b = (b + (Math.random() * 2 - 1) * 0.02) * 0.995; d[i] = b * 3.2; } }
  const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300; lp.Q.value = 0.6;
  const lfo = c.createOscillator(), lfoG = c.createGain(); lfo.frequency.value = 0.06; lfoG.gain.value = 130; lfo.connect(lfoG); lfoG.connect(lp.frequency);
  const swell = c.createGain(); swell.gain.value = 0.75; const lfo2 = c.createOscillator(), lfo2G = c.createGain(); lfo2.frequency.value = 0.11; lfo2G.gain.value = 0.25; lfo2.connect(lfo2G); lfo2G.connect(swell.gain);
  src.connect(lp); lp.connect(swell); swell.connect(SND.amb);
  const hum = c.createOscillator(), humG = c.createGain(); hum.type = 'sine'; hum.frequency.value = 46; humG.gain.value = 0.05; hum.connect(humG); humG.connect(SND.amb);
  src.start(); lfo.start(); lfo2.start(); hum.start();
  SND.amb.gain.setTargetAtTime(0.55, c.currentTime + 0.2, 1.4);   // entra devagar
  const event = () => {
    setTimeout(event, 7000 + Math.random() * 12000);
    if (!SND.level || SND.hidden) return;
    const r = Math.random();
    if (r < 0.22) sndWhale(); else if (r < 0.7) { const n = 2 + (Math.random() * 4 | 0); for (let i = 0; i < n; i++) setTimeout(() => sfx('bubble', { v: 0.25, far: true }), i * (60 + Math.random() * 90)); }
  };
  setTimeout(event, 5000);
}
// canto de baleia bem ao longe (só eco)
function sndWhale() {
  const c = SND.ctx, t = c.currentTime + 0.05, dur = 2.6 + Math.random() * 1.6, f0 = 150 + Math.random() * 90;
  const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
  o.type = 'sine'; o2.type = 'triangle'; lp.type = 'lowpass'; lp.frequency.value = 900;
  o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * 1.45, t + dur * 0.4); o.frequency.linearRampToValueAtTime(f0 * 0.8, t + dur);
  o2.frequency.setValueAtTime(f0 * 2.01, t); o2.frequency.linearRampToValueAtTime(f0 * 2.9, t + dur * 0.4); o2.frequency.linearRampToValueAtTime(f0 * 1.6, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); o2.connect(g); g.connect(lp); lp.connect(SND.wet); o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
}

// ---------------- blocos de síntese ----------------
function sTone(type, f0, f1, t, dur, vol, o = {}) {
  const c = SND.ctx, os = c.createOscillator(), g = c.createGain(); os.type = type;
  os.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) os.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib; lg.gain.value = o.vibD || f0 * 0.03; l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + dur + 0.05); }
  const a = o.a ?? 0.005; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = g; os.connect(g);
  if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; g.connect(f); node = f; }
  node.connect(SND.sfx); if (o.wet) { const w = c.createGain(); w.gain.value = o.wet; node.connect(w); w.connect(SND.wet); }
  os.start(t); os.stop(t + dur + 0.05); return os;
}
function sNoise(t, dur, vol, type, f0, f1, o = {}) {
  const c = SND.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = SND.noise; f.type = type; f.Q.value = o.q ?? 1; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (o.a ?? 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(SND.sfx); if (o.wet) { const w = c.createGain(); w.gain.value = o.wet; g.connect(w); w.connect(SND.wet); }
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
// ---------------- efeitos ----------------
const SFX = {
  bubble: (t, o) => { const f = 320 + Math.random() * 380; sTone('sine', f, f * 2.6, t, 0.07, 0.22 * (o.v ?? 1), { wet: o.far ? 0.9 : 0.25 }); },
  pop: t => { sTone('sine', 700, 1700, t, 0.05, 0.25, { wet: 0.2 }); sNoise(t, 0.025, 0.12, 'highpass', 3000); },
  splash: (t, o) => { const v = o.v ?? 1; sNoise(t, 0.32, 0.32 * v, 'bandpass', 1800, 450, { q: 0.8, wet: 0.3 }); sTone('sine', 400, 1100, t + 0.05, 0.06, 0.1 * v); sTone('sine', 500, 1300, t + 0.12, 0.05, 0.08 * v); },
  plip: t => { sTone('sine', 600, 1200, t, 0.06, 0.12, { wet: 0.4 }); },
  bite: t => { sNoise(t, 0.045, 0.3, 'lowpass', 900); sNoise(t + 0.09, 0.045, 0.26, 'lowpass', 800); sTone('square', 190, 90, t, 0.07, 0.05); },
  boop: t => { sTone('sine', 520, 990, t, 0.11, 0.28); sTone('triangle', 1040, 1980, t, 0.08, 0.06); },
  crack: t => { sNoise(t, 0.03, 0.35, 'highpass', 2200); sTone('square', 1300, 500, t, 0.04, 0.05); },
  hatch: t => { [72, 76, 79, 84].forEach((n, i) => sTone('triangle', NOTE(n), NOTE(n), t + i * 0.08, 0.28, 0.16, { wet: 0.4 })); sTone('sine', NOTE(96), NOTE(96), t + 0.34, 0.5, 0.06, { wet: 0.6 }); },
  chest: t => { sTone('sawtooth', 150, 85, t, 0.4, 0.08, { lp: 700, vib: 13, vibD: 8 }); SFX.pearl(t + 0.32, { v: 0.8 }); },
  clam: t => { sNoise(t, 0.05, 0.22, 'bandpass', 700, 300, { q: 2 }); sTone('sine', 240, 150, t, 0.08, 0.12); },
  pearl: (t, o) => { const v = o.v ?? 1; for (const [f, a] of [[1568, 0.16], [2352, 0.08], [3136, 0.05]]) sTone('sine', f, f, t, 1.3, a * v, { wet: 0.7, a: 0.004 }); },
  kraken: t => { sTone('sawtooth', 44, 38, t, 2.4, 0.22, { lp: 260, a: 0.6 }); sTone('sawtooth', 46.5, 40, t, 2.4, 0.18, { lp: 220, a: 0.7 }); sNoise(t, 2.2, 0.2, 'lowpass', 180, 90, { a: 0.5, wet: 0.5 }); },
  achievement: t => { [79, 83, 86, 91].forEach((n, i) => sTone('square', NOTE(n), NOTE(n), t + i * 0.09, i === 3 ? 0.55 : 0.12, 0.07, { lp: 3000, vib: i === 3 ? 6 : 0, vibD: 8, wet: 0.35 })); [67, 71, 74].forEach((n, i) => sTone('triangle', NOTE(n), NOTE(n), t + i * 0.09, 0.2, 0.08)); },
  discover: t => { sTone('sine', NOTE(84), NOTE(84), t, 0.5, 0.1, { wet: 0.6 }); sTone('sine', NOTE(91), NOTE(91), t + 0.1, 0.6, 0.08, { wet: 0.7 }); },
  coin: t => { sTone('square', 988, 988, t, 0.06, 0.07, { lp: 4000 }); sTone('square', 1319, 1319, t + 0.06, 0.2, 0.07, { lp: 4000 }); },
  buy: t => { SFX.coin(t); SFX.coin(t + 0.1); SFX.pearl(t + 0.2, { v: 0.7 }); },
  full: t => { sTone('sawtooth', 150, 92, t, 0.3, 0.12, { lp: 650, vib: 17, vibD: 14 }); sTone('sine', 600, 900, t + 0.34, 0.08, 0.08); },
  zap: t => { sNoise(t, 0.18, 0.22, 'highpass', 2600, 5000, { q: 3 }); sTone('sawtooth', 1800, 300, t, 0.16, 0.06, { lp: 3000 }); },
  snip: t => { for (const d of [0, 0.08]) { sNoise(t + d, 0.018, 0.3, 'highpass', 3500); sTone('square', 2100, 1500, t + d, 0.025, 0.05); } },
  evolve: t => { sTone('sine', 300, 1500, t, 1.5, 0.1, { vib: 9, vibD: 30, wet: 0.6, a: 0.4 }); [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => sTone('triangle', NOTE(n), NOTE(n), t + 1.2 + i * 0.06, 0.3, 0.07, { wet: 0.4 })); },
  hit: t => { sTone('square', 200, 110, t, 0.18, 0.07, { lp: 1200 }); },
  tick: t => { sTone('sine', 1500, 1500, t, 0.03, 0.06); },
  whoosh: t => { sNoise(t, 0.45, 0.12, 'bandpass', 380, 1600, { q: 1.2, a: 0.12 }); },
  flip: t => { sNoise(t, 0.03, 0.12, 'highpass', 2500); sTone('sine', 700, 900, t, 0.04, 0.06); },
  match: t => { sTone('triangle', NOTE(79), NOTE(79), t, 0.15, 0.1); sTone('triangle', NOTE(84), NOTE(84), t + 0.08, 0.3, 0.1, { wet: 0.4 }); },
  miss: t => { sTone('triangle', NOTE(64), NOTE(60), t, 0.25, 0.08); },
  start: t => { [60, 64, 67, 72].forEach((n, i) => sTone('square', NOTE(n), NOTE(n), t + i * 0.1, 0.12, 0.06, { lp: 2500 })); },
  end: t => { [72, 67, 64, 72].forEach((n, i) => sTone('triangle', NOTE(n), NOTE(n), t + i * 0.13, i === 3 ? 0.5 : 0.15, 0.09, { wet: 0.3 })); },
  note: (t, o) => { const f = NOTE(o.n); sTone('sine', f, f, t, 0.5, 0.18, { wet: 0.35 }); sTone('triangle', f * 2, f * 2, t, 0.18, 0.05); },
};
// toca um efeito (com um intervalo mínimo por tipo, para não virar barulho)
function sfx(name, o = {}) {
  if (!SND.ctx || !SND.level || SND.hidden) return;
  const now = performance.now(), gap = o.gap ?? (name === 'bubble' ? 55 : name === 'pop' ? 35 : 25);
  if (now - (SND.last[name] || 0) < gap) return; SND.last[name] = now;
  try { SFX[name](SND.ctx.currentTime + 0.01, o); } catch (e) { }
}
// ronrom contínuo enquanto recebe carinho (muda de timbre por espécie)
function sndPurr(on, kind = 'serpent') {
  const c = SND.ctx; if (!c) return;
  if (on && !SND.purr && SND.level) {
    const t = c.currentTime, o = c.createOscillator(), am = c.createOscillator(), amG = c.createGain(), g = c.createGain(), out = c.createGain(), lp = c.createBiquadFilter();
    const P = kind === 'jelly' ? { type: 'sine', f: 392, am: 6, lp: 2000, v: 0.05 } : kind === 'crab' ? { type: 'square', f: 95, am: 13, lp: 900, v: 0.035 } : { type: 'sawtooth', f: 58, am: 23, lp: 420, v: 0.1 };
    o.type = P.type; o.frequency.value = P.f; am.frequency.value = P.am; amG.gain.value = 0.5; g.gain.value = 0.5; lp.type = 'lowpass'; lp.frequency.value = P.lp;
    am.connect(amG); amG.connect(g.gain); o.connect(g); g.connect(lp); lp.connect(out); out.connect(SND.sfx);
    out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(P.v, t + 0.25);
    o.start(t); am.start(t); SND.purr = { o, am, out };
  } else if (!on && SND.purr) {
    const p = SND.purr, t = c.currentTime; SND.purr = null;
    p.out.gain.cancelScheduledValues(t); p.out.gain.setTargetAtTime(0.0001, t, 0.08); p.o.stop(t + 0.4); p.am.stop(t + 0.4);
  }
}
