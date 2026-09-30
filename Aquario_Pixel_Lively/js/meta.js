'use strict';
// =====================================================================
//  Progresso que não depende do bichinho: moedas, peças compradas,
//  conquistas, Aquapédia e estatísticas. Continua mesmo se recomeçar do ovo.
// =====================================================================
const META_STORE = 'aquario.meta.v1';
let META = null;
const nKeys = o => Object.keys(o || {}).length;
function newMeta() { return { v: 1, coins: 60, owned: {}, pedia: {}, ach: {}, best: {}, stats: { meals: 0, pearls: 0, kraken: 0, hunts: 0, chest: 0, full: 0, owl: 0, dressed: 0, maxStage: 0, hatched: {}, stages: {} } }; }
function metaInit() {
  if (META) return;
  const debug = QS.has('pet');
  let m = null; try { m = JSON.parse(localStorage.getItem(META_STORE) || 'null'); } catch (e) { }
  if (!m || m.v !== 1) m = newMeta();
  const d = newMeta(); for (const k in d) if (m[k] === undefined) m[k] = d[k]; for (const k in d.stats) if (m.stats[k] === undefined) m.stats[k] = d.stats[k];
  if (debug) { m = JSON.parse(JSON.stringify(m)); m.debug = true; if (QS.has('coins')) m.coins = +QS.get('coins'); }
  META = m;
}
function saveMeta() { if (!META || META.debug) return; try { localStorage.setItem(META_STORE, JSON.stringify(META)); } catch (e) { } }
// peças que já estavam no corpo do bichinho continuam dele (saves da v4)
function metaAdopt(s) { if (!s || !s.wear) return; for (const slot in s.wear) META.owned[slot + ':' + s.wear[slot]] = true; if (s.stage > 0 && s.species) { META.stats.hatched[s.species] = 1; META.stats.maxStage = Math.max(META.stats.maxStage, s.stage); } saveMeta(); }

// ---------------- moedas ----------------
const coinFx = [];
function addCoins(n, x, y) {
  if (!n) return; META.coins += n; saveMeta(); sfx('coin');
  if (x != null) { const b = coinBoxRect(); for (let k = 0; k < Math.min(12, 3 + n / 3); k++) coinFx.push({ x: x + rand(-4, 4), y: y + rand(-4, 4), tx: b.x + 6, ty: b.y + 6, t: -k * 0.05, d: rand(0.6, 0.9) }); }
  checkAch();
}
function spendCoins(n) { if (META.coins < n) return false; META.coins -= n; saveMeta(); return true; }
function statInc(k, n = 1) { if (!META) return; META.stats[k] = (META.stats[k] || 0) + n; saveMeta(); checkAch(); }
function coinBoxRect() { const t = trayRect(); return { x: t.x + t.w + 4, y: t.y + 5, w: 44, h: 13 }; }
function drawCoinBox(a) {
  if (!META) return; const b = coinBoxRect();
  ctx.globalAlpha = 0.72 * a; ctx.fillStyle = '#071a30'; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.globalAlpha = a;
  ctx.fillStyle = '#c8962a'; ctx.fillRect(b.x, b.y, b.w, 1); ctx.fillRect(b.x, b.y + b.h - 1, b.w, 1); ctx.fillRect(b.x, b.y, 1, b.h); ctx.fillRect(b.x + b.w - 1, b.y, 1, b.h);
  ctx.drawImage(ICONS.coin, b.x + 3, b.y + 3); drawText(String(META.coins), b.x + 12, b.y + 4, '#ffe28a', 'left', a);
  ctx.globalAlpha = 1;
}
function updateCoinFx(dt) { for (const c of coinFx) c.t += dt; for (let i = coinFx.length - 1; i >= 0; i--) if (coinFx[i].t > coinFx[i].d) coinFx.splice(i, 1); }
function drawCoinFx() { for (const c of coinFx) { if (c.t < 0) continue; const k = smooth(clamp(c.t / c.d, 0, 1)), x = lerp(c.x, c.tx, k), y = lerp(c.y, c.ty, k) - Math.sin(k * Math.PI) * 18; ctx.drawImage(ICONS.coinS, Math.round(x - 2), Math.round(y - 2)); } }

// ---------------- conquistas ----------------
const ACH = [
  { id: 'hatch', name: 'Olá, mundo!', desc: 'Chocar o primeiro ovo', coins: 20, test: m => nKeys(m.stats.hatched) >= 1 },
  { id: 'full', name: 'Buxin chei!', desc: 'Encher a barriga do bichinho até não caber mais', coins: 10, test: m => m.stats.full >= 1 },
  { id: 'meals50', name: 'Barriguinha feliz', desc: 'Dar 50 refeições', coins: 30, test: m => m.stats.meals >= 50 },
  { id: 'pearls', name: 'Presente de rei', desc: 'Dar 10 pérolas de presente', coins: 25, test: m => m.stats.pearls >= 10 },
  { id: 'teen', name: 'Crescendo', desc: 'Chegar à fase Adolescente', coins: 25, test: m => m.stats.maxStage >= 3 },
  { id: 'giant', name: 'Gigante do bem', desc: 'Chegar à fase Gigante', coins: 40, item: 'neck:medalha', test: m => m.stats.maxStage >= 4 },
  { id: 'three', name: 'Criador de lendas', desc: 'Chocar as três espécies', coins: 30, item: 'body:ouro', test: m => nKeys(m.stats.hatched) >= 3 },
  { id: 'kraken3', name: 'Guardião do recife', desc: 'Espantar o kraken 3 vezes', coins: 30, item: 'hat:polvo', test: m => m.stats.kraken >= 3 },
  { id: 'dress', name: 'Tô chique!', desc: 'Vestir chapéu, pescoço, óculos e roupa ao mesmo tempo', coins: 15, test: m => m.stats.dressed >= 1 },
  { id: 'hunt10', name: 'Instinto de caçador', desc: 'Caçar 10 peixinhos no modo caçador', coins: 20, test: m => m.stats.hunts >= 10 },
  { id: 'pedia10', name: 'Curioso', desc: 'Descobrir 10 seres na Aquapédia', coins: 20, test: m => nKeys(m.pedia) >= 10 },
  { id: 'pedia25', name: 'Naturalista', desc: 'Descobrir 25 seres na Aquapédia', coins: 30, item: 'hat:estrela', test: m => nKeys(m.pedia) >= 25 },
  { id: 'legends', name: 'Caçador de lendas', desc: 'Ver todas as criaturas lendárias', coins: 50, test: m => PEDIA.filter(p => p.cat === 'lendas').every(p => m.pedia[p.id]) },
  { id: 'pediaAll', name: 'Enciclopédia viva', desc: 'Completar a Aquapédia', coins: 80, item: 'hat:coral', test: m => PEDIA.every(p => m.pedia[p.id]) },
  { id: 'dive', name: 'Mergulhador', desc: 'Fazer 80 pontos na Chuva de tesouros', coins: 20, item: 'face:mascara', test: m => (m.best.tesouros || 0) >= 80 },
  { id: 'bubbles', name: 'Estoura-tudo', desc: 'Fazer 150 pontos no Estoura-bolhas', coins: 25, test: m => (m.best.bolhas || 0) >= 150 },
  { id: 'memory', name: 'Memória de elefante-marinho', desc: 'Terminar a Memória das conchas em até 10 jogadas', coins: 25, test: m => m.best.memoria > 0 && m.best.memoria <= 10 },
  { id: 'simon', name: 'Maestro dos mariscos', desc: 'Chegar ao nível 8 no Concerto dos mariscos', coins: 25, test: m => (m.best.concerto || 0) >= 8 },
  { id: 'chest', name: 'Abre-te, baú', desc: 'Abrir o baú do tesouro 10 vezes', coins: 10, test: m => m.stats.chest >= 10 },
  { id: 'owl', name: 'Coruja do mar', desc: 'Fazer carinho de madrugada (entre 0h e 5h)', coins: 10, test: m => m.stats.owl >= 1 },
  { id: 'rich', name: 'Tesouro pirata', desc: 'Ter 500 moedas guardadas', coins: 0, test: m => m.coins >= 500 },
];
function checkAch() {
  if (!META || typeof PEDIA === 'undefined') return;
  for (const a of ACH) {
    if (META.ach[a.id]) continue;
    let ok = false; try { ok = a.test(META); } catch (e) { }
    if (!ok) continue;
    META.ach[a.id] = Date.now();
    if (a.coins) META.coins += a.coins;
    let got = a.coins ? '+' + a.coins + ' moedas' : '';
    if (a.item) { META.owned[a.item] = true; const [sl, id] = a.item.split(':'), it = wearItem(sl, id); if (it) got = 'ganhou: ' + it.name + (a.coins ? ' e ' + a.coins + ' moedas' : ''); }
    saveMeta(); notify('Conquista: ' + a.name, got, 'ach'); sfx('achievement', { gap: 0 });
  }
}
// ---------------- avisos no topo da tela ----------------
const NOTES = [];
let noteCur = null;
function notify(title, sub, kind = 'info', icon = null) {
  if (kind === 'disc') { const pend = NOTES.filter(n => n.kind === 'disc'); if (pend.length >= 2) { const m = pend[pend.length - 1]; m.count = (m.count || 1) + 1; m.title = m.count + ' novas descobertas!'; m.sub = 'Veja na Aquapédia'; m.icon = null; return; } }
  NOTES.push({ title, sub, kind, icon });
}
function updateNotes(dt) {
  if (GAME_ACTIVE()) return;
  if (noteCur) { noteCur.t += dt; if (noteCur.t > 4.2) noteCur = null; }
  if (!noteCur && NOTES.length) { noteCur = NOTES.shift(); noteCur.t = 0; if (noteCur.kind === 'disc') sfx('discover'); }
}
function drawNotes() {
  const n = noteCur; if (!n || GAME_ACTIVE()) return;
  const a = clamp(Math.min(n.t * 4, (4.2 - n.t) * 3), 0, 1), slide = Math.round((1 - a) * -14);
  const tw = Math.max(textCanvas(n.title).width, n.sub ? textCanvas(n.sub, '#cfe6f6', '#061426', true).width : 0), ic = n.icon, iw = ic ? Math.min(28, ic.width) + 6 : 12;
  const w = tw + iw + 10, h = n.sub ? 24 : 15, x = Math.round(W / 2 - w / 2), y = 4 + slide;
  ctx.globalAlpha = 0.86 * a; ctx.fillStyle = '#071a30'; ctx.fillRect(x, y, w, h); ctx.globalAlpha = a;
  ctx.fillStyle = n.kind === 'ach' ? '#e8b83a' : '#6fd0ff'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
  if (ic) { const s = Math.min(1, 28 / ic.width, (h - 4) / ic.height); ctx.drawImage(ic, x + 4, Math.round(y + h / 2 - ic.height * s / 2), Math.round(ic.width * s), Math.round(ic.height * s)); }
  else ctx.drawImage(n.kind === 'ach' ? ICONS.trophy : ICONS.book, x + 4, y + 4);
  drawText(n.title, x + iw + 2, y + 4, n.kind === 'ach' ? '#ffe28a' : '#ffffff', 'left', a);
  if (n.sub) { ctx.globalAlpha = a; ctx.drawImage(textCanvas(n.sub, '#cfe6f6', '#061426', true), x + iw + 2, y + 12); }
  ctx.globalAlpha = 1;
}
function metaIcons() {
  ICONS.coin = pixIcon(['..###..', '.#####.', '##o####', '##o####', '##o####', '.#####.', '..###..'], { '#': '#f2c34a', o: '#fff2a0' });
  ICONS.coinS = pixIcon(['.##.', '#o##', '#o##', '.##.'], { '#': '#f2c34a', o: '#fff2a0' });
  ICONS.book = pixIcon(['###.###', '#oo#oo#', '#oo#oo#', '#oo#oo#', '###.###', '...#...'], { '#': '#6fb8e8', o: '#eef6ff' });
  ICONS.pad = pixIcon(['.######.', '##.###o#', '#...#o#o', '##.###o#', '.##..##.'], { '#': '#c8a8ff', o: '#ff6fa8' });
  ICONS.sndOn = pixIcon(['..#....', '.##.#..', '###..#.', '###..#.', '.##.#..', '..#....'], { '#': '#9fe8c8' });
  ICONS.sndOff = pixIcon(['..#....', '.##.#.#', '###..#.', '###.#.#', '.##....', '..#....'], { '#': '#8a9ab0' });
  ICONS.hunt = pixIcon(['...#...', '..###..', '.#.#.#.', '###.###', '.#.#.#.', '..###..', '...#...'], { '#': '#ff6a6a' });
  ICONS.trophy = pixIcon(['#######', '#.###.#', '.#####.', '..###..', '...#...', '..###..'], { '#': '#f2c34a' });
  ICONS.lock = pixIcon(['.###.', '#...#', '#####', '##.##', '#####'], { '#': '#c8d4e0' });
}
