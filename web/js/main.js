'use strict';
// =====================================================================
//  Loop principal, desenho, entrada, integração com o app e o Lively
// =====================================================================
let ready = false, rt = 0, last = performance.now();

function buildAll() {
  if (innerWidth < 64 || innerHeight < 64) { ready = false; builtW = innerWidth; builtH = innerHeight; return; }
  const t0 = performance.now();
  computeSize(); buildGround();
  LY.bg = buildWater(); LY.far1 = buildCliffs(); LY.far2 = buildCity();
  LAIR = buildLair(); LY.seabed = buildSeabed(); LY.front = buildFront(); LY.vignette = buildVignette();
  LY.overlay = makeCanvas(W, H); LY.octx = LY.overlay.getContext('2d');
  buildRays(); buildCaustics(); buildLife();
  ready = true;
  if (CFG.demo) demoSetup();
  console.log('[aquario] mundo', W + 'x' + H, 'px=' + S, Math.round(performance.now() - t0) + 'ms');
}
function scheduleRebuild(ms = 300) { clearTimeout(rt); rt = setTimeout(() => { rt = 0; buildAll(); if (ready) render(); }, ms); }

// pré-gera as folhas dos visitantes aos poucos, sem travar a animação
const WARM = ['dolphin', 'turtle', 'calf', 'humpback', 'mermaid', 'mermaidWave', 'barracuda', 'orca', 'boto', 'botoTip', 'manta', 'manatee', 'hippocampus', 'levHead', 'sealion', 'otterWave', 'narwhal', 'sperm', 'zaratan'];
function warmup() { if (!WARM.length || T < 1.5) return; const n = WARM.shift(); try { sheet(n); } catch (e) { console.error(n, e); } }

// ---------------- hora do dia ----------------
function timeTarget() {
  const m = CFG.timeMode;
  if (m === 'day') return { day: 1, warm: 0 };
  if (m === 'dusk') return { day: 0.55, warm: 1 };
  if (m === 'night') return { day: 0, warm: 0 };
  const d = new Date(), h = d.getHours() + d.getMinutes() / 60;
  if (h >= 7.5 && h < 17) return { day: 1, warm: 0 };
  if (h >= 17 && h < 19.5) { const t = (h - 17) / 2.5; return { day: 1 - smooth(t), warm: Math.sin(t * Math.PI) }; }
  if (h >= 5 && h < 7.5) { const t = (h - 5) / 2.5; return { day: smooth(t), warm: Math.sin(t * Math.PI) * 0.8 }; }
  return { day: 0, warm: 0 };
}

// ---------------- atualização ----------------
function update(dt) {
  T += dt;
  if (mouse.seen) {
    mouse.vx = lerp(mouse.vx, (mouse.x - mouse.px) / dt, 0.4); mouse.vy = lerp(mouse.vy, (mouse.y - mouse.py) / dt, 0.4);
    mouse.px = mouse.x; mouse.py = mouse.y; mouse.speed = Math.hypot(mouse.vx, mouse.vy);
    const idle = T - mouse.last; mouse.active = idle < 6 ? 1 : Math.max(0, 1 - (idle - 6) / 3);
  }
  const tt = timeTarget(), k = Math.min(1, dt * 0.8);
  curDay = lerp(curDay, tt.day, k); curWarm = lerp(curWarm, tt.warm, k);
  parX = lerp(parX, mouse.seen && mouse.active > 0 ? (mouse.x / W - 0.5) * 2 : 0, Math.min(1, dt * 1.5));
  director(dt);
  for (const p of passers) p.update(dt);
  passers = passers.filter(p => !p.dead);
  updateSchools(dt);
  for (const f of fish) f.update(dt);
  if (puffer) puffer.update(dt);
  crab.update(dt); otter.update(dt); if (pet) pet.update(dt);
  gameUpdate(dt); pediaTick(dt); updateNotes(dt); updateCoinFx(dt);
  if (chest) chest.update(dt); if (clam) clam.update(dt); if (moray) moray.update(dt); if (eels) eels.update(dt);
  for (const a of anemones) a.update(dt);
  for (const s of seahorses) s.update(dt);
  for (const j of jellies) j.update(dt);
  for (const s of strands.back) updateStrand(s, dt);
  for (const s of strands.mid) updateStrand(s, dt);
  for (const s of strands.front) updateStrand(s, dt);
  for (const v of vents) { v.t -= dt; if (v.t < 0) { v.burst = randi(4, 9); v.bt = 0; v.t = rand(5, 12); } if (v.burst > 0 && (v.bt -= dt) < 0) { v.bt = rand(0.08, 0.2); addBubble(v.x + rand(-1, 1), v.y, randi(0, 2)); v.burst--; } }
  for (const b of bubbles) b.update(dt); bubbles = bubbles.filter(b => !b.dead);
  for (const p of pops) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; } pops = pops.filter(p => p.t > 0);
  for (const f of foods) {
    if (!f.rest) { f.vy += (5 - f.vy) * Math.min(1, dt * 2); f.vx *= 1 - Math.min(1, dt * 2); f.x += (f.vx + Math.sin(T * 3 + f.ph) * 1.5) * dt; f.y += f.vy * dt; const g0 = gy(f.x) - 1; if (f.y >= g0) { f.y = g0; f.rest = true; f.life = 8; } }
    else if ((f.life -= dt) < 0) f.dead = true;
  }
  foods = foods.filter(f => !f.dead);
  for (const r of ripples) r.t += dt; ripples = ripples.filter(r => r.t < 0.6);
  for (const p of snow) {
    const damp = 1 - Math.min(1, dt * 1.2); p.vx *= damp; p.vy *= damp;
    if (mouse.seen && mouse.active > 0.05) { const d = Math.hypot(mouse.x - p.x, mouse.y - p.y); if (d < 30) { const f = (1 - d / 30) * mouse.active * dt * 2.5; p.vx = clamp(p.vx + mouse.vx * f, -40, 40); p.vy = clamp(p.vy + mouse.vy * f, -40, 40); } }
    p.x += (Math.sin(T * 0.4 + p.ph) * 1.6 * p.z + p.vx) * dt; p.y += (1 + p.z * 1.8 + p.vy) * dt;
    if (p.y > gy(p.x)) { p.y = waterTop + rand(10); p.x = rand(W); }
    if (p.y < waterTop) p.y = waterTop; if (p.x < 0) p.x += W; else if (p.x > W) p.x -= W;
  }
  const nt = night();
  if (nt > 0.3 && mouse.seen && mouse.speed > 15 && mouse.active > 0.5) { let n = mouse.speed * dt * 0.25 * nt; while (n > 0) { if (RNG() < n) spark(mouse.x + rand(-3, 3), mouse.y + rand(-3, 3)); n -= 1; } }
  for (const s of sparkles) { s.l -= dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.gold) s.vy += 30 * dt; }
  sparkles = sparkles.filter(s => s.l > 0);
  warmup();
}

// ---------------- desenho ----------------
function drawSurface() {
  const a = lerp(0.25, 1, curDay), sy = x => Math.round(3 + Math.sin(x * 0.07 + T * 1.1) * 1.3 + Math.sin(x * 0.023 - T * 0.6) * 1.1);
  ctx.globalAlpha = 0.35 * a; ctx.fillStyle = '#c6f7f7'; for (let x = 0; x < W; x += 2) ctx.fillRect(x, 0, 2, sy(x) + 1);
  ctx.globalAlpha = 0.7 * a; ctx.fillStyle = '#effffd'; for (let x = 0; x < W; x += 2) if (Math.sin(x * 0.19 + T * 2.1) > 0.1) ctx.fillRect(x, sy(x) + 1, 2, 1);
  ctx.globalAlpha = 1;
}
function drawRays() {
  const k = lerp(0.3, 1, curDay);
  for (const r of rays) { ctx.globalAlpha = k * (0.55 + 0.45 * Math.sin(T * r.sp + r.ph)); ctx.drawImage(r.c, Math.round(r.x + Math.sin(T * 0.11 + r.ph) * 6), 0); }
  ctx.globalAlpha = 1;
}
function applyTimeOverlay() {
  const nt = night(), warm = curWarm, og = LY.octx;
  if (nt > 0.01) {
    og.globalCompositeOperation = 'source-over';
    og.fillStyle = `rgb(${Math.round(lerp(255, 44, nt))},${Math.round(lerp(255, 68, nt))},${Math.round(lerp(255, 132, nt))})`; og.fillRect(0, 0, W, H);
    const lamp = (x, y, R, a, c) => { const gr = og.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(0.45, `rgba(${c},${a * 0.55})`); gr.addColorStop(1, `rgba(${c},0)`); og.fillStyle = gr; og.fillRect(x - R, y - R, R * 2, R * 2); };
    if (nt > 0.15 && mouse.seen && mouse.active > 0.01) lamp(mouse.x, mouse.y, 50, 0.95 * nt * mouse.active, '255,248,230');
    if (chest && chest.open > 0) lamp(chest.x, chest.y - 10, 34, 0.8 * nt * Math.min(1, chest.open), '255,214,120');
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(LY.overlay, 0, 0);
  }
  if (warm > 0.01) {
    ctx.globalCompositeOperation = 'soft-light';
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `rgba(255,120,70,${0.85 * warm})`); gr.addColorStop(0.55, `rgba(220,90,150,${0.4 * warm})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    const g2 = ctx.createLinearGradient(0, 0, 0, H * 0.5); g2.addColorStop(0, `rgba(255,150,110,${0.22 * warm})`); g2.addColorStop(1, 'rgba(255,150,110,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H * 0.5);
  }
  ctx.globalCompositeOperation = 'source-over';
}
function glowPass() {
  const nt = night();
  ctx.globalCompositeOperation = 'lighter';
  if (pet) pet.glow(nt);
  if (nt > 0.05) {
    ctx.fillStyle = '#40ffd0';
    for (const p of snow) { if (!p.glow) continue; const a = nt * (0.25 + 0.75 * Math.max(0, Math.sin(T * 1.7 + p.ph))); if (a < 0.05) continue; ctx.globalAlpha = a * 0.9; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
    for (const j of jellies) j.glow(nt);
    for (const a of anemones) a.glow(nt * 0.7);
    for (const p of passers) if (p.glow) p.glow(nt);
    if (clam) { ctx.globalAlpha = nt * 0.8; clam.glow(); }
  }
  for (const s of sparkles) { ctx.globalAlpha = clamp(s.l / s.m, 0, 1); ctx.fillStyle = s.gold ? '#ffd76a' : '#8ffcff'; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
  if (chest && chest.open > 0) { ctx.globalAlpha = 0.5 * Math.min(1, chest.open); ctx.drawImage(glowSprite('#ffc44a', 16), chest.x - 16, chest.y - 30); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
const OFF = new Set((QS.get('off') || '').split(','));
const on = k => !OFF.has(k);
function render() {
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.drawImage(LY.bg, 0, 0);
  if (on('surface')) drawSurface();
  if (on('far')) { ctx.drawImage(LY.far1, Math.round(-PX.far1 - parX * PX.far1), 0); ctx.drawImage(LY.far2, Math.round(-PX.far2 - parX * PX.far2), 0); }
  if (on('passers')) for (const p of passers) if (p.layer === 'far') p.draw();
  if (on('lair')) ctx.drawImage(LAIR.c, LAIR.x + lairShift(), LAIR.y);
  if (on('passers')) for (const p of passers) if (p.layer === 'mid') p.draw();
  if (on('kelp')) {   // algas do fundo: redesenhadas a ~10 fps num cache
    if (!LY.kelp || LY.kelp.width !== W || LY.kelp.height !== H) { LY.kelp = makeCanvas(W, H); LY.kctx = LY.kelp.getContext('2d'); LY.kelpT = -1; }
    if (T - LY.kelpT > 0.09 || T < LY.kelpT) { LY.kelpT = T; LY.kctx.clearRect(0, 0, W, H); for (const s of strands.back) drawStrand(s, LY.kctx); }
    ctx.drawImage(LY.kelp, 0, 0);
  }
  ctx.drawImage(LY.seabed, 0, 0);
  if (on('caustics')) drawCaustics(0.03 + curDay * 0.22);
  if (on('props')) {
    for (const a of anemones) a.drawBase();
    for (const s of strands.mid) drawStrand(s);
    if (clam) clam.draw(); if (chest) chest.draw(); if (moray) moray.draw(); if (eels) eels.draw(); crab.draw();
  }
  if (pet && on('pet')) pet.draw();
  for (const f of petFoods) f.draw();
  gameDraw();
  if (on('snow')) { ctx.fillStyle = '#e6f7ff'; for (const p of snow) { ctx.globalAlpha = 0.16 + 0.3 * p.z; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); } ctx.globalAlpha = 1; }
  if (on('jelly')) for (const j of jellies) j.draw();
  if (on('fish')) {
    for (const s of seahorses) s.draw();
    for (const p of passers) if (p.layer === 'near') p.draw();
    for (const f of fish) f.draw();
    if (puffer) puffer.draw();
  }
  for (const f of foods) { ctx.fillStyle = f.col; ctx.fillRect(Math.round(f.x), Math.round(f.y), f.big ? 2 : 1, 1); }
  if (on('props')) for (const a of anemones) a.draw();
  if (on('front')) { ctx.drawImage(LY.front, 0, 0); for (const s of strands.front) drawStrand(s); }
  if (on('bubbles')) for (const b of bubbles) b.draw();
  ctx.fillStyle = '#e8fdff'; for (const p of pops) { ctx.globalAlpha = p.t / 0.25; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
  for (const r of ripples) { const rad = 2 + r.t * 18, n = Math.round(rad * 5); ctx.globalAlpha = (1 - r.t / 0.6) * 0.7; for (let k = 0; k < n; k++) { const a = k / n * TAU; ctx.fillRect(Math.round(r.x + Math.cos(a) * rad), Math.round(r.y + Math.sin(a) * rad), 1, 1); } }
  ctx.globalAlpha = 1;
  if (on('otter')) otter.draw();
  if (on('rays')) drawRays();
  if (on('vignette')) ctx.drawImage(LY.vignette, 0, 0);
  applyTimeOverlay();
  if (on('glow')) glowPass();
  if (pet) { pet.drawUI(); drawPetHUD(); }
  gameDrawUI(); drawCoinFx(); drawNotes();
}

function frame(now) {
  requestAnimationFrame(frame);
  if (!rt && (innerWidth !== builtW || innerHeight !== builtH || (window.devicePixelRatio || 1) !== DPR)) scheduleRebuild();
  if (!ready || now - last < 1000 / CFG.fps - 2) return;
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  update(dt); render();
}

// ---------------- entrada ----------------
function setMouse(e) {
  const x = e.clientX * DPR / S, y = e.clientY * DPR / S;
  if (!mouse.seen) { mouse.px = x; mouse.py = y; mouse.seen = true; }
  mouse.x = x; mouse.y = y; mouse.last = T;
}
function onClick() {
  if (!ready) return;
  const x = mouse.x, y = mouse.y;
  if (chest && chest.hit(x, y)) { chest.click(); return; }
  if (clam && clam.hit(x, y)) { clam.click(); return; }
  if (puffer && Math.hypot(puffer.x - x, puffer.y - y) < 12) { puffer.timer = 3.5; return; }
  for (const p of passers) if (p.hit(x, y)) { if (p.click) p.click(); return; }
  let popped = false; for (const b of bubbles) if (Math.hypot(b.x - x, b.y - y) < b.r + 3) { b.pop(); popped = true; }
  if (popped) sfx('pop');
  if (popped) return;
  if (y < gy(x) - 3 && y > waterTop) {
    sfx('plip');
    for (let i = randi(3, 5); i > 0; i--) foods.push({ x: x + rand(-3, 3), y: y + rand(-2, 2), vx: rand(-4, 4), vy: rand(-6, 0), ph: rand(TAU), big: chance(0.3), col: pick(['#e07a2e', '#c9542a', '#d9a441']) });
    if (foods.length > 50) foods.splice(0, foods.length - 50);
  }
  ripples.push({ x, y, t: 0 });
  for (let i = 0; i < 3; i++) addBubble(x + rand(-2, 2), y, randi(0, 2));
  for (const f of fish) if (Math.hypot(f.x - x, f.y - y) < 24) f.scare = 0.45;
}
addEventListener('mousemove', e => { setMouse(e); if (ready) { const c = petCursor(mouse.x, mouse.y); if (document.body.style.cursor !== c) document.body.style.cursor = c; } });
addEventListener('mousedown', e => { if (e.button !== 0) return; if (e.target.closest && e.target.closest('.grab,.grip,.dlg')) return; setMouse(e); if (ready && gameMouseDown(mouse.x, mouse.y)) return; if (ready && petMouseDown(mouse.x, mouse.y)) return; onClick(); });
addEventListener('mouseup', e => { if (e.button !== 0) return; if (e.target.closest && e.target.closest('.dlg')) return; setMouse(e); if (ready) petMouseUp(mouse.x, mouse.y); });
document.addEventListener('mouseleave', () => { mouse.last = T - 6; });
addEventListener('resize', () => scheduleRebuild());

const KEYS = { d: 'dolphins', t: 'turtle', j: 'humpback', s: 'mermaid', b: 'boto', o: 'orca', m: 'manta', p: 'manatee', h: 'hippocampus', v: 'leviathan', l: 'sealion', c: 'sperm', n: 'narwhal', z: 'zaratan', k: 'kraken', a: 'barracuda' };
addEventListener('keydown', e => {
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key === 'Escape' && document.querySelector('.dlg')) { closeDialog(); return; }
  if (e.key === 'F11') { e.preventDefault(); if (IS_APP) hostSend({ t: 'fullscreen' }); else if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); return; }
  if (e.key === 'Escape' && IS_APP) { hostSend({ t: 'escape' }); return; }
  const tm = { '0': 'auto', '1': 'day', '2': 'dusk', '3': 'night' }[e.key];
  if (tm) { CFG.timeMode = tm; toast({ auto: 'Hora do dia: automática', day: 'Dia', dusk: 'Entardecer', night: 'Noite' }[tm]); return; }
  if (!ready) return;
  if (e.key === 'g') { petCommand('call'); return; }
  if (e.key === 'r') { petCommand('wardrobe'); return; }
  if (e.key === 'e') { petCommand('pedia'); return; }
  if (e.key === 'q') { petCommand('games'); return; }
  if (e.key === 'x') { sndToggle(); return; }
  if (e.key === 'G' && pet && pet.s.stage > 0) { pet.s.growth += 60; return; }
  const kind = KEYS[e.key.toLowerCase()]; if (kind) spawnPasser(kind);
});

// ---------------- avisos ----------------
let toastT = 0;
function toast(msg, ms = 1800) { const el = document.getElementById('toast'); if (!el) return; el.textContent = msg; el.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => { el.style.opacity = 0; }, ms); }

// ---------------- app nativo (WebView2) ----------------
function hostSend(o) { if (IS_APP) window.chrome.webview.postMessage(JSON.stringify(o)); }
function setWidget(on) {
  const ui = document.getElementById('ui');
  ui.querySelectorAll('.grab,.grip').forEach(el => el.remove());
  if (!on) return;
  const grab = document.createElement('div'); grab.className = 'grab'; grab.textContent = '⋯  arraste para mover  ⋯';
  grab.addEventListener('mousedown', e => { if (e.button === 0) { e.preventDefault(); hostSend({ t: 'drag' }); } });
  grab.addEventListener('dblclick', () => hostSend({ t: 'maximize' }));
  const grip = document.createElement('div'); grip.className = 'grip';
  grip.addEventListener('mousedown', e => { if (e.button === 0) { e.preventDefault(); hostSend({ t: 'resize' }); } });
  ui.appendChild(grab); ui.appendChild(grip);
}
window.AQ_host = s => {
  if (s.timeMode) CFG.timeMode = s.timeMode;
  if (s.fps) CFG.fps = s.fps;
  if (s.fishCount != null && s.fishCount !== CFG.fishCount) { CFG.fishCount = s.fishCount; if (ready) buildFish(); }
  if (s.widget !== undefined) setWidget(!!s.widget);
  if (s.toast) toast(s.toast, 2600);
  if (s.spawn && ready) spawnPasser(s.spawn);
  if (s.pet && ready) petCommand(s.pet, s.v);
  if (s.wake && ready) petCommand('call');
  if (s.sound != null) sndSetLevel(s.sound, !s.soundToast);
};
if (IS_APP) {
  addEventListener('contextmenu', e => { e.preventDefault(); hostSend({ t: 'menu' }); });
  hostSend({ t: 'ready' });
}

// ---------------- Lively Wallpaper ----------------
window.livelyPropertyListener = (name, val) => {
  if (name === 'timeMode') CFG.timeMode = ['auto', 'day', 'dusk', 'night'][val] || 'auto';
  else if (name === 'fishCount') { CFG.fishCount = +val; if (ready) buildFish(); }
  else if (name === 'pixelSize') { if (CFG.pixelSize !== +val) { CFG.pixelSize = +val; scheduleRebuild(150); } }
  else if (name === 'fps') CFG.fps = [20, 30, 60][val] || 30;
  else if (name === 'volume') sndSetLevel(+val, true);
};

// ---------------- demonstração (miniatura) ----------------
function demoSetup() {
  const put = (k, fx, fy, dir = 1) => { const p = spawnPasser(k); p.dir = dir; p.x = W * fx; if (fy != null) p.y = H * fy; return p; };
  put('humpback', 0.62, 0.16, -1); put('mermaid', 0.3, 0.44, 1); put('dolphins', 0.86, 0.3, -1);
  for (const k in spawnT) spawnT[k] = 1e9;
}

// ---------------- catálogo de sprites (?gallery[&only=a,b][&sc=3]) ----------------
function runGallery() {
  const only = QS.get('only'), sc = +(QS.get('sc') || 2);
  const names = Object.keys(SHEET_DEFS).filter(n => !only || only.split(',').includes(n));
  const maxW = Math.floor(innerWidth / sc), pad = 6, items = [];
  let x = pad, y = pad, rowH = 0;
  for (const n of names) {
    let sh; try { sh = sheet(n); } catch (e) { console.error(n, e); continue; }
    const w = sh.w * 2 + 4, h = sh.h + 10;
    if (x + w > maxW && x > pad) { x = pad; y += rowH + pad; rowH = 0; }
    items.push({ n, sh, x, y }); x += w + pad; rowH = Math.max(rowH, h);
  }
  const GH = y + rowH + pad;
  cvs.width = maxW; cvs.height = GH; cvs.style.width = maxW * sc + 'px'; cvs.style.height = GH * sc + 'px';
  let f = 0;
  const draw = () => {
    ctx.fillStyle = QS.get('bg') || '#1f6aa0'; ctx.fillRect(0, 0, maxW, GH);
    for (const it of items) { const sh = it.sh; ctx.drawImage(sh.r[f % sh.n], it.x, it.y + 9); ctx.drawImage(sh.r[(f + (sh.n >> 1)) % sh.n], it.x + sh.w + 4, it.y + 9); ctx.fillStyle = '#fff'; ctx.font = '7px monospace'; ctx.fillText(it.n, it.x, it.y + 7); }
  };
  draw(); setInterval(() => { f++; draw(); }, 170);
}

// ---------------- início ----------------
if (CFG.gallery) runGallery();
else {
  buildAll();
  { const tt = timeTarget(); curDay = tt.day; curWarm = tt.warm; }
  if (ready) render();
  requestAnimationFrame(frame);
  if (IS_APP) setTimeout(() => toast('Botão direito: opções  •  F11: tela cheia', 3200), 1200);
  const op = QS.get('open');   // prévia/captura: ?open=pedia|games|wardrobe|jogo:bolhas
  if (op) setTimeout(() => { if (op.startsWith('jogo:')) startGame(op.slice(5)); else petCommand(op); }, 1200);
}
window.__aq = { CFG, SHEETS, spawnPasser, get pet() { return pet; }, get passers() { return passers; }, get fish() { return fish; }, mouse };
