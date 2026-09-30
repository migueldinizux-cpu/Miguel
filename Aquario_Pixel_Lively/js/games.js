'use strict';
// =====================================================================
//  Minijogos: rendem moedas para comprar roupas no guarda-roupa.
//  Dois acontecem no próprio aquário (canvas) e dois numa janelinha.
// =====================================================================
let GAME = null;
const GAME_ACTIVE = () => !!(GAME && !GAME.done);
const GAMES = [
  { id: 'bolhas', name: 'Estoura-bolhas', desc: '40 segundos para estourar bolhas. As douradas valem mais; a do baiacu tira pontos!', unit: 'pontos', make: () => new BubbleGame() },
  { id: 'tesouros', name: 'Chuva de tesouros', desc: 'Guie o bichinho com o mouse e pegue o que cai. Desvie dos ouriços e das águas-vivas!', unit: 'pontos', make: () => new TreasureGame(), pet: true },
  { id: 'memoria', name: 'Memória das conchas', desc: 'Ache os pares de bichos escondidos embaixo das conchas. Menos jogadas, mais moedas.', unit: 'jogadas', dom: () => memoryGame(), low: true },
  { id: 'concerto', name: 'Concerto dos mariscos', desc: 'Os mariscos tocam uma melodia; repita na mesma ordem. A cada rodada ela cresce.', unit: 'nível', dom: () => simonGame() },
];
function gameCoins(id, score) {
  if (id === 'bolhas') return Math.min(45, Math.floor(score / 5));
  if (id === 'tesouros') return Math.min(45, Math.floor(score / 2.5));
  if (id === 'memoria') return clamp(42 - (score - 6) * 2, 8, 40);
  return Math.min(45, score * 4);
}
function openGames() {
  if (GAME_ACTIVE()) return;
  const coin = ICONS.coin.toDataURL();
  const cards = GAMES.map(g => { const b = META.best[g.id]; const lock = g.pet && (!pet || pet.s.stage === 0);
    return `<div class="gcard"><b>${g.name}</b><span>${g.desc}</span><em>${b != null ? 'Recorde: ' + b + ' ' + g.unit : 'Ainda não jogado'}</em><button data-g="${g.id}" class="pri" ${lock ? 'disabled title="Precisa de um bichinho chocado"' : ''}>Jogar</button></div>`; }).join('');
  dialog(`<h2>Minijogos</h2><p>Ganhe moedas para comprar roupas. <span class="coins"><img src="${coin}" alt=""> ${META.coins} moedas</span></p><div class="glist">${cards}</div><div class="row"><button id="wr">Guarda-roupa</button><button id="ok" class="pri">Fechar</button></div>`, d => {
    d.querySelectorAll('[data-g]').forEach(b => { b.onclick = () => startGame(b.dataset.g); });
    d.querySelector('#wr').onclick = () => openWardrobe();
    d.querySelector('#ok').onclick = closeDialog;
  }, 'wide');
}
function startGame(id) {
  const def = GAMES.find(g => g.id === id); if (!def) return;
  closeDialog(); drag.item = null; sfx('start');
  if (def.dom) { def.dom(); return; }
  if (pet) { pet.wake(); pet.resting = false; pet.prey = null; }
  GAME = def.make(); GAME.id = id;
}
function endGame(score) { if (!GAME || GAME.done) return; const id = GAME.id; GAME.done = true; GAME = null; finishGame(id, score); }
function finishGame(id, score, note = '') {
  const def = GAMES.find(g => g.id === id), coins = gameCoins(id, score), prev = META.best[id];
  const rec = score > 0 && (prev == null || (def.low ? score < prev : score > prev));
  if (rec) META.best[id] = score;
  saveMeta(); sfx('end'); if (coins) addCoins(coins, W / 2, H / 2); checkAch();
  if (pet && pet.s.stage > 0) { pet.happyT = 2; pet.say(coins >= 25 ? 'Que rico!' : coins ? 'Boa!' : 'Quase!', 2); }
  dialog(`<h2>${def.name}</h2><p>${note || (rec ? 'Novo recorde!' : 'Fim de jogo.')}</p>
    <div class="gsum"><div><b>${def.unit === 'jogadas' ? 'Jogadas' : def.unit === 'nível' ? 'Nível' : 'Pontos'}</b><span>${score}</span></div><div><b>Recorde</b><span>${META.best[id] ?? '-'}</span></div><div><b>Moedas</b><span>+${coins}</span></div></div>
    <div class="row"><button id="wr">Guarda-roupa</button><button id="list">Outros jogos</button><button id="again" class="pri">Jogar de novo</button><button id="ok">Fechar</button></div>`, d => {
    d.querySelector('#again').onclick = () => startGame(id);
    d.querySelector('#list').onclick = openGames;
    d.querySelector('#wr').onclick = () => openWardrobe();
    d.querySelector('#ok').onclick = closeDialog;
  });
}
function gameUpdate(dt) { if (GAME_ACTIVE()) GAME.update(dt); }
function gameDraw() { if (GAME_ACTIVE()) GAME.draw(); }
function gameDrawUI() { if (GAME_ACTIVE()) GAME.drawUI(); }
function gameMouseDown(x, y) { return GAME_ACTIVE() ? GAME.mouseDown(x, y) : false; }
addEventListener('keydown', e => { if (e.key === 'Escape' && GAME_ACTIVE() && !document.querySelector('.dlg')) { e.stopImmediatePropagation(); GAME.quit(); } }, true);

// ---------------- peças de desenho ----------------
const GSPR = {};
function gBubble(type, r) {
  const k = type + r; if (GSPR[k]) return GSPR[k];
  const s = r * 2 + 3, c = r + 1;
  return GSPR[k] = paint(s, s, (x, y) => {
    const d = Math.hypot(x - c, y - c); if (d > r + 0.5) return null;
    const rim = d > r - 1.1, hl = d < r * 0.35 && x < c - r * 0.25 && y < c - r * 0.25;
    if (type === 'gold') return rim ? '#ffd76af0' : hl ? '#fff6c0e0' : '#ffe08a38';
    if (type === 'puffer') return rim ? '#ffb0b0e0' : hl ? '#ffffffd0' : '#ffd0d024';
    return rim ? '#cfefffe0' : hl ? '#ffffffe8' : '#bdf2ff20';
  });
}
function gSprites() {
  if (GSPR.urchin) return;
  GSPR.urchin = paint(13, 13, (x, y) => { const dx = x - 6, dy = y - 6, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx); if (d <= 3.4) return d < 1.5 && dx < 0 && dy < 0 ? '#8a6ab0' : '#3a2450'; if (d <= 6.2 && Math.abs(Math.sin(a * 5)) < 0.22) return d > 5.2 ? '#6a4a8a' : '#4a3068'; return null; });
  GSPR.jelly = paint(11, 14, (x, y) => { const dx = x - 5; if (y <= 4) { const w = Math.sqrt(Math.max(0, 1 - ((4 - y) / 4.2) ** 2)) * 5; if (Math.abs(dx) <= w) return y === 4 ? '#b86a2a' : y < 2 ? '#ffd890' : '#f2b050'; return null; } if (y > 4 && (x === 1 || x === 4 || x === 6 || x === 9) && ((y + x) % 3)) return '#e8903a'; return null; });
  GSPR.gem = ['#3ad0ff', '#6af08a', '#ff7ab8'].map(c => pixIcon(['.#####.', '#o#o#o#', '.#ooo#.', '..#o#..', '...#...'], { '#': shade(c, -0.25), o: shade(c, 0.35) }));
  GSPR.coin = pixIcon(['..###..', '.#####.', '##o####', '##o####', '##o####', '.#####.', '..###..'], { '#': '#f2c34a', o: '#fff2a0' });
}
function bigText(str, x, y, col, sc = 3, a = 1) { const c = textCanvas(str, col); ctx.globalAlpha = a; ctx.imageSmoothingEnabled = false; ctx.drawImage(c, Math.round(x - c.width * sc / 2), Math.round(y - c.height * sc / 2), c.width * sc, c.height * sc); ctx.globalAlpha = 1; }
function gameBar(name, t, score, extra) {
  const txt = name + '   ' + Math.max(0, Math.ceil(t)) + 's   ' + score + (extra ? '   ' + extra : ''), c = textCanvas(txt, '#ffffff'), w = c.width + 14, x = Math.round(W / 2 - w / 2), y = 4;
  ctx.globalAlpha = 0.8; ctx.fillStyle = '#071a30'; ctx.fillRect(x, y, w, 14); ctx.globalAlpha = 1;
  ctx.fillStyle = t < 6 && (Math.floor(T * 4) & 1) ? '#ff6a6a' : '#e8b83a'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + 13, w, 1); ctx.fillRect(x, y, 1, 14); ctx.fillRect(x + w - 1, y, 1, 14);
  ctx.drawImage(c, x + 7, y + 3); drawText('Esc: sair', W / 2, y + 17, '#9fc8e8', 'center', 0.7);
}
function countdown(pre, total = 1.8) { if (pre <= 0) return; const n = Math.ceil(pre / (total / 3)); bigText(pre < 0.35 ? 'JÁ!' : String(n), W / 2, H * 0.42, '#fff1a8', 4, clamp(pre * 3, 0, 1)); }
class FloatTexts {
  constructor() { this.a = []; }
  add(x, y, s, c) { this.a.push({ x, y, s, c, t: 0 }); }
  update(dt) { for (const f of this.a) { f.t += dt; f.y -= dt * 14; } this.a = this.a.filter(f => f.t < 0.9); }
  draw() { for (const f of this.a) drawText(f.s, f.x, f.y, f.c, 'center', clamp(1.3 - f.t * 1.4, 0, 1)); }
}

// ---------------- 1. Estoura-bolhas ----------------
class BubbleGame {
  constructor() { this.dur = 40; this.t = this.dur; this.pre = 1.8; this.score = 0; this.combo = 0; this.comboT = 0; this.b = []; this.sp = 0; this.ft = new FloatTexts(); this.parts = []; }
  mult() { return Math.min(5, 1 + Math.floor(this.combo / 5)); }
  quit() { endGame(this.score); }
  update(dt) {
    this.ft.update(dt); for (const p of this.parts) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; } this.parts = this.parts.filter(p => p.t > 0);
    if (this.pre > 0) { this.pre -= dt; return; }
    this.t -= dt; if (this.t <= 0) { endGame(this.score); return; }
    const k = 1 - this.t / this.dur;
    if ((this.sp -= dt) <= 0) { this.sp = rand(0.22, 0.5) * (1 - k * 0.45); this.spawn(k); }
    for (const b of this.b) { b.y += b.vy * dt; b.x += Math.sin(T * 2 + b.ph) * 8 * dt; }
    this.b = this.b.filter(b => !b.dead && b.y > waterTop - b.r);
    if ((this.comboT -= dt) < 0) this.combo = 0;
  }
  spawn(k) {
    const r = Math.random(), type = r < 0.1 ? 'gold' : r < 0.14 ? 'pearl' : r < 0.25 + k * 0.1 ? 'puffer' : 'normal';
    const R = type === 'normal' ? randi(5, 8) : type === 'puffer' ? 8 : type === 'pearl' ? 7 : 6;
    this.b.push({ type, r: R, x: rand(20, W - 20), y: groundTop + 6, vy: -(type === 'gold' ? rand(36, 46) : rand(18, 28) + k * 14), ph: rand(TAU) });
  }
  mouseDown(x, y) {
    if (this.pre > 0) return true;
    let hit = null; for (let i = this.b.length - 1; i >= 0; i--) { const b = this.b[i]; if (Math.hypot(b.x - x, b.y - y) < b.r + 3) { hit = b; break; } }
    if (!hit) { this.combo = 0; sfx('plip'); return true; }
    hit.dead = true;
    for (let k = 0; k < 6 + hit.r; k++) { const a = rand(TAU), v = rand(10, 24); this.parts.push({ x: hit.x, y: hit.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.3, c: hit.type === 'gold' ? '#ffd76a' : hit.type === 'puffer' ? '#ff9a9a' : '#e8fdff' }); }
    if (hit.type === 'puffer') { this.score = Math.max(0, this.score - 5); this.combo = 0; sfx('hit', { gap: 0 }); this.ft.add(hit.x, hit.y - 6, '-5', '#ff6a6a'); return true; }
    this.combo++; this.comboT = 2;
    const v = (hit.type === 'gold' ? 5 : hit.type === 'pearl' ? 10 : 1) * this.mult(); this.score += v;
    this.ft.add(hit.x, hit.y - 6, '+' + v, hit.type === 'normal' ? '#e8fdff' : '#ffe28a');
    sfx(hit.type === 'normal' ? 'pop' : 'coin', { gap: 0 }); if (hit.type === 'pearl') sfx('pearl', { v: 0.6 });
    if (pet && pet.s.stage > 0 && this.combo % 10 === 0) { pet.happyT = 1; pet.say(pick(['Isso!', 'Uhuu!', 'Demais!']), 1.3); }
    return true;
  }
  draw() {
    for (const b of this.b) {
      const im = gBubble(b.type, b.r); ctx.drawImage(im, Math.round(b.x - im.width / 2), Math.round(b.y - im.height / 2));
      if (b.type === 'pearl') drawSprite(foodSheet('pearl'), 0, b.x, b.y, 1);
      else if (b.type === 'puffer') drawSprite(sheet('puffer'), 0, b.x, b.y, 1);
      else if (b.type === 'gold') { ctx.drawImage(ICONS.coin, Math.round(b.x - 3), Math.round(b.y - 3)); }
    }
    for (const p of this.parts) { ctx.globalAlpha = clamp(p.t / 0.3, 0, 1); ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
    ctx.globalAlpha = 1; this.ft.draw();
  }
  drawUI() { gameBar('Estoura-bolhas', this.t, this.score, this.mult() > 1 ? 'x' + this.mult() : ''); countdown(this.pre); }
}

// ---------------- 2. Chuva de tesouros ----------------
const TREASURE = { coin: { v: 1, w: 50 }, gem: { v: 3, w: 14 }, pearl: { v: 6, w: 5 }, food: { v: 1, w: 10 }, urchin: { v: -3, w: 14, bad: true }, jelly: { v: -2, w: 7, bad: true } };
class TreasureGame {
  constructor() { gSprites(); this.dur = 45; this.t = this.dur; this.pre = 1.8; this.score = 0; this.items = []; this.sp = 0.3; this.stun = 0; this.combo = 0; this.ft = new FloatTexts(); this.ctl = p => this.control(p); }
  quit() { endGame(this.score); }
  control(p) {
    if (this.stun > 0 || this.pre > 0) return { x: p.hx, y: p.hy, sp: 0.3 };
    const o = p.mouthOff(), d = mouse.x >= p.hx ? 1 : -1;
    return { x: mouse.x - o.x * d, y: mouse.y - o.y, sp: 3.1 };
  }
  pick(k) {
    const wts = Object.assign({}, ...Object.keys(TREASURE).map(n => ({ [n]: TREASURE[n].w + (TREASURE[n].bad ? k * (n === 'urchin' ? 10 : 5) : 0) })));
    let r = Math.random() * Object.values(wts).reduce((a, b) => a + b, 0); for (const n in wts) { r -= wts[n]; if (r <= 0) return n; } return 'coin';
  }
  update(dt) {
    this.ft.update(dt); if (this.pre > 0) { this.pre -= dt; return; }
    this.t -= dt; this.stun -= dt; if (this.t <= 0) { endGame(this.score); return; }
    const k = 1 - this.t / this.dur;
    if ((this.sp -= dt) <= 0) { this.sp = rand(0.3, 0.65) * (1 - k * 0.4); const kind = this.pick(k); this.items.push({ kind, x: rand(16, W - 16), y: waterTop - 6, vy: rand(15, 23) + k * 14, ph: rand(TAU), sw: kind === 'jelly' ? 14 : rand(3, 8), g: randi(0, 2), f: pick(['sardine', 'shrimp']) }); }
    if (!pet || !pet.P) return;
    const m = pet.mouthPos(), R = pet.P.hr * 0.9 + 8, ct = pet.clawTip ? pet.clawTip() : null;
    for (const it of this.items) {
      it.y += it.vy * dt; it.x += Math.sin(T * 1.5 + it.ph) * it.sw * dt;
      if (it.y > gy(it.x) - 2) { it.dead = true; continue; }
      const near = Math.hypot(it.x - m.x, it.y - m.y) < R + 3 || (ct && Math.hypot(it.x - ct.x, it.y - ct.y) < pet.P.claw + 4);
      if (!near) continue;
      it.dead = true; const D = TREASURE[it.kind];
      if (D.bad) {
        if (this.stun > 0) continue;
        this.stun = 1.2; this.combo = 0; this.score = Math.max(0, this.score + D.v); pet.shake = 1; pet.happyT = 0; sfx(it.kind === 'jelly' ? 'zap' : 'hit', { gap: 0 }); this.ft.add(it.x, it.y - 6, String(D.v), '#ff6a6a'); pet.say('Ai!', 1);
        continue;
      }
      this.combo++; const mult = 1 + Math.floor(this.combo / 8), v = D.v * mult; this.score += v; this.ft.add(it.x, it.y - 6, '+' + v, '#ffe28a');
      if (it.kind === 'food') { sfx('bite', { gap: 0 }); pet.s.fome = Math.min(100, pet.s.fome + 5); pet.s.alegria = Math.min(100, pet.s.alegria + 2); }
      else { sfx('coin', { gap: 0 }); if (it.kind === 'pearl') sfx('pearl', { v: 0.6 }); }
      if (this.combo % 12 === 0) { pet.happyT = 1; pet.say(pick(['Uhuu!', 'Mais!', 'Oba!']), 1.2); }
    }
    this.items = this.items.filter(i => !i.dead);
  }
  mouseDown() { return true; }
  draw() {
    for (const it of this.items) {
      if (it.kind === 'coin') { ctx.drawImage(GSPR.coin, Math.round(it.x - 3), Math.round(it.y - 3)); if ((Math.floor(T * 6 + it.ph) % 4) === 0) { ctx.fillStyle = '#fff8d0'; ctx.fillRect(Math.round(it.x - 1), Math.round(it.y - 2), 1, 1); } }
      else if (it.kind === 'gem') ctx.drawImage(GSPR.gem[it.g], Math.round(it.x - 3), Math.round(it.y - 2));
      else if (it.kind === 'pearl') drawSprite(foodSheet('pearl'), 0, it.x, it.y, 1);
      else if (it.kind === 'food') drawSprite(foodSheet(it.f), it.f === 'sardine' ? Math.floor(T * 10) : 0, it.x, it.y, 1);
      else if (it.kind === 'urchin') ctx.drawImage(GSPR.urchin, Math.round(it.x - 6), Math.round(it.y - 6));
      else ctx.drawImage(GSPR.jelly, Math.round(it.x - 5), Math.round(it.y - 6));
    }
    this.ft.draw();
  }
  drawUI() { gameBar('Chuva de tesouros', this.t, this.score, this.combo >= 8 ? 'x' + (1 + Math.floor(this.combo / 8)) : ''); countdown(this.pre); if (this.stun > 0) drawText('tonto!', W / 2, H * 0.3, '#ff9a9a', 'center', 0.9); }
}

// ---------------- 3. Memória das conchas ----------------
let SHELL_URL = null;
function shellCard() {
  if (SHELL_URL) return SHELL_URL;
  const c = paint(26, 22, (x, y) => { const cx = 13, cy = 19, dx = x - cx, dy = cy - y, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx); if (dy < -1 || r > 12 || a < 0.1 || a > Math.PI - 0.1) { if (y >= 18 && y <= 20 && Math.abs(dx) <= 3) return '#e8a0b8'; return null; } const rib = Math.abs(Math.sin(a * 7)) < 0.25; return r > 11 ? '#c86a8a' : rib ? '#f0a8c0' : r < 4 ? '#ffe0ea' : '#ffc8d8'; });
  return SHELL_URL = c.toDataURL();
}
function memoryGame() {
  const pool = PEDIA.filter(e => e.cat !== 'bichinhos' && e.id !== 'plankton'), seen = pool.filter(e => pediaFound(e.id));
  const src = (seen.length >= 6 ? seen : pool).slice().sort(() => Math.random() - 0.5).slice(0, 6);
  const cards = src.concat(src).sort(() => Math.random() - 0.5).map(e => ({ e, up: false, done: false }));
  let first = null, lock = false, moves = 0, found = 0; const t0 = Date.now();
  const html = `<h2>Memória das conchas</h2><p id="mst">Jogadas: 0 · pares: 0/6</p><div class="mgrid">${cards.map((c, i) => `<button class="mcard" data-i="${i}"><img class="back" src="${shellCard()}" alt=""><img class="face" src="${pediaThumb(c.e, false)}" alt=""></button>`).join('')}</div><div class="row"><button id="quit">Desistir</button></div>`;
  dialog(html, d => {
    const st = d.querySelector('#mst'), btn = i => d.querySelector(`.mcard[data-i="${i}"]`);
    const upd = () => { st.textContent = 'Jogadas: ' + moves + ' · pares: ' + found + '/6'; };
    d.querySelectorAll('.mcard').forEach(b => { b.onclick = () => {
      const i = +b.dataset.i, c = cards[i]; if (lock || c.up || c.done) return;
      c.up = true; b.classList.add('up'); sfx('flip', { gap: 0 });
      if (first === null) { first = i; return; }
      moves++; const a = cards[first];
      if (a.e.id === c.e.id) { a.done = c.done = true; btn(first).classList.add('done'); b.classList.add('done'); first = null; found++; sfx('match', { gap: 0 }); upd();
        if (found === 6) setTimeout(() => { if (document.body.contains(b)) finishGame('memoria', moves, 'Achou todos os pares em ' + Math.round((Date.now() - t0) / 1000) + ' segundos!'); }, 700);
        return; }
      lock = true; upd(); const j = first; first = null;
      setTimeout(() => { sfx('miss'); a.up = c.up = false; if (btn(j)) btn(j).classList.remove('up'); b.classList.remove('up'); lock = false; }, 850);
    }; });
    d.querySelector('#quit').onclick = closeDialog;
  });
}

// ---------------- 4. Concerto dos mariscos ----------------
let CLAM_URL = null;
function simonGame() {
  if (!CLAM_URL) { const sh = sheet('clam'), f = sh.r[3], c = makeCanvas(f.width, f.height); c.getContext('2d').drawImage(f, 0, 0); CLAM_URL = c.toDataURL(); }
  const cols = ['#ff7fb0', '#6fd0ff', '#8ee06a', '#ffd24a'], notes = [72, 76, 79, 84], seq = [];
  let idx = 0, turn = false, alive = true;
  dialog(`<h2>Concerto dos mariscos</h2><p id="sst">Escute a melodia...</p><div class="sgrid">${cols.map((c, i) => `<button class="sclam" data-k="${i}" style="--c:${c}"><img src="${CLAM_URL}" alt=""></button>`).join('')}</div><div class="row"><button id="quit">Parar</button></div>`, d => {
    const st = d.querySelector('#sst'), bs = [...d.querySelectorAll('.sclam')];
    const light = (k, ms = 300) => { const b = bs[k]; if (!b) return; b.classList.add('lit'); sfx('note', { n: notes[k], gap: 0 }); setTimeout(() => b.classList.remove('lit'), ms); };
    const play = () => {
      turn = false; idx = 0; st.textContent = 'Nível ' + seq.length + ' · escute...';
      const sp = Math.max(300, 640 - seq.length * 28);
      seq.forEach((k, i) => setTimeout(() => { if (alive && document.body.contains(st)) light(k, sp * 0.6); }, 500 + i * sp));
      setTimeout(() => { if (alive && document.body.contains(st)) { turn = true; st.textContent = 'Nível ' + seq.length + ' · sua vez!'; } }, 500 + seq.length * sp);
    };
    const next = () => { seq.push(randi(0, 3)); play(); };
    bs.forEach(b => { b.onclick = () => {
      if (!turn) return; const k = +b.dataset.k; light(k, 220);
      if (k !== seq[idx]) { turn = false; alive = false; sfx('miss'); const lvl = seq.length - 1; setTimeout(() => { if (document.body.contains(st)) finishGame('concerto', lvl, lvl ? 'Você repetiu ' + lvl + ' melodia(s) certinho!' : 'Errou a primeira nota. Tente de novo!'); }, 500); return; }
      if (++idx >= seq.length) { turn = false; st.textContent = 'Isso! Próxima...'; setTimeout(() => { if (alive && document.body.contains(st)) next(); }, 750); }
    }; });
    d.querySelector('#quit').onclick = () => { alive = false; closeDialog(); };
    next();
  });
}
