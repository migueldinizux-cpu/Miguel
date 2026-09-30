'use strict';
// =====================================================================
//  Aquapédia: enciclopédia dos seres do aquário. Cada um é descoberto ao ser
//  visto (os que nadam) ou tocado com o mouse (os do fundo). Os não vistos
//  aparecem como silhuetas misteriosas.
// =====================================================================
const PEDIA_CATS = [['recife', 'Recife'], ['cardume', 'Cardumes'], ['mamiferos', 'Mamíferos'], ['fundo', 'Fundo do mar'], ['lendas', 'Lendas'], ['bichinhos', 'Bichinhos'], ['segredos', 'Segredos']];
// how: 'sight' (basta ver) · 'touch' (passar o mouse perto) · 'pet' (chocar) · 'secret'
const PEDIA = [
  { id: 'clown', cat: 'recife', name: 'Peixe-palhaço', fact: 'Mora entre os tentáculos da anêmona, protegido por um muco que evita as queimaduras. Todos nascem machos; o maior do grupo vira fêmea.' },
  { id: 'tang', cat: 'recife', name: 'Cirurgião-patela', fact: 'Tem uma pequena "lâmina" afiada perto da cauda — é daí que vem o nome de peixe-cirurgião.' },
  { id: 'yellowTang', cat: 'recife', name: 'Cirurgião-amarelo', fact: 'À noite o amarelo fica apagado e aparece uma faixa clara no corpo, que ajuda a se esconder no escuro.' },
  { id: 'idol', cat: 'recife', name: 'Ídolo-mouro', fact: 'Primo dos peixes-cirurgiões, carrega uma nadadeira dorsal comprida como uma bandeira.' },
  { id: 'queenAngel', cat: 'recife', name: 'Peixe-anjo-rainha', fact: 'Tem uma "coroa" azul pintada na testa. Quando jovem, trabalha de faxineiro, tirando parasitas de peixes maiores.' },
  { id: 'butterfly', cat: 'recife', name: 'Peixe-borboleta', fact: 'Muitos têm uma mancha escura perto da cauda que parece um olho e confunde os predadores sobre qual lado é a cabeça.' },
  { id: 'lionfish', cat: 'recife', name: 'Peixe-leão', fact: 'Os espinhos das nadadeiras são venenosos. Por isso nenhum bichinho do aquário tenta caçar ele.' },
  { id: 'parrot', cat: 'recife', name: 'Peixe-papagaio', fact: 'Rói o coral com o "bico" e devolve areia fininha: boa parte da areia branca das praias tropicais já passou por um. Alguns dormem dentro de um casulo de muco.' },
  { id: 'gramma', cat: 'recife', name: 'Grama-real', fact: 'Metade roxo, metade amarelo. Costuma nadar de barriga para cima, colado no teto das tocas.' },
  { id: 'snapper', cat: 'recife', name: 'Vermelho', fact: 'Os vermelhos (luthianídeos) caçam perto do fundo e têm dentinhos parecidos com caninos.' },
  { id: 'chromis', cat: 'cardume', name: 'Cromis-azul', fact: 'Nadam em nuvens azuis sobre o coral e mergulham todos juntos entre os galhos quando algo assusta.' },
  { id: 'anthias', cat: 'cardume', name: 'Anthias', fact: 'Vivem em grupos com um macho e várias fêmeas. Se o macho some, uma das fêmeas vira macho.' },
  { id: 'sardine', cat: 'cardume', name: 'Sardinha', fact: 'Formam cardumes enormes que se mexem como um corpo só, para confundir quem quer comer uma delas.' },
  { id: 'barracuda', cat: 'cardume', name: 'Barracuda', fact: 'Passa dos 40 km/h numa arrancada. Tem cara de brava, mas quase nunca incomoda gente.' },
  { id: 'dolphin', cat: 'mamiferos', name: 'Golfinho-nariz-de-garrafa', kinds: ['dolphins'], fact: 'Cada golfinho tem um assobio só dele, que funciona como um nome. Clique neles para ganharem velocidade.' },
  { id: 'orca', cat: 'mamiferos', name: 'Orca', fact: 'Na verdade é o maior dos golfinhos. Vive em família, e quem lidera costuma ser a avó.' },
  { id: 'humpback', cat: 'mamiferos', name: 'Baleia-jubarte', fact: 'Os machos cantam músicas que duram até 20 minutos e mudam de um ano para o outro. O filhote nada colado na mãe.' },
  { id: 'sperm', cat: 'mamiferos', name: 'Cachalote', fact: 'Tem o maior cérebro do planeta e mergulha mais de mil metros atrás de lulas-gigantes.' },
  { id: 'narwhal', cat: 'mamiferos', name: 'Narval', fact: 'O "chifre" é um dente que cresce em espiral e pode passar de 2,5 metros.' },
  { id: 'sealion', cat: 'mamiferos', name: 'Leão-marinho', fact: 'Diferente das focas, tem orelhinhas por fora e consegue andar "de quatro" em terra com as nadadeiras.' },
  { id: 'manatee', cat: 'mamiferos', name: 'Peixe-boi', fact: 'Parente distante do elefante, passa o dia comendo plantas aquáticas. No Brasil vive na Amazônia e no litoral do Nordeste.' },
  { id: 'otter', cat: 'mamiferos', name: 'Lontra-marinha', fact: 'Dorme boiando de barriga para cima e às vezes de mãos dadas com outras lontras, para não se separar. Passe o mouse perto e ela acena.' },
  { id: 'turtle', cat: 'fundo', name: 'Tartaruga-marinha', fact: 'A fêmea volta para a mesma praia onde nasceu para botar os ovos, às vezes décadas depois.' },
  { id: 'manta', cat: 'fundo', name: 'Raia-manta', fact: 'Pode ter 7 metros de uma ponta da "asa" à outra e se alimenta só de plâncton.' },
  { id: 'puffer', cat: 'fundo', name: 'Baiacu', how: 'touch', fact: 'Quando se assusta, engole água e vira uma bola, bem mais difícil de engolir.' },
  { id: 'crabNpc', cat: 'fundo', name: 'Caranguejo', how: 'touch', fact: 'Anda de lado porque as pernas dobram melhor para os lados. Chegue rápido perto e ele se enterra.' },
  { id: 'seahorse', cat: 'fundo', name: 'Cavalo-marinho', how: 'touch', fact: 'Quem fica grávido é o pai: ele carrega os ovos numa bolsa na barriga até os filhotes nascerem.' },
  { id: 'moray', cat: 'fundo', name: 'Moreia', how: 'touch', fact: 'Tem uma segunda mandíbula escondida na garganta, que puxa a comida para dentro.' },
  { id: 'eels', cat: 'fundo', name: 'Enguia-de-jardim', how: 'touch', fact: 'Vivem em colônias com meio corpo enterrado na areia e somem na toca quando algo chega perto.' },
  { id: 'clam', cat: 'fundo', name: 'Marisco-gigante', how: 'touch', fact: 'Pode viver mais de 100 anos e pesar mais de 200 kg. Toque nele de vez em quando para ganhar pérolas.' },
  { id: 'anemone', cat: 'fundo', name: 'Anêmona-do-mar', how: 'touch', fact: 'Parece planta, mas é um animal: os tentáculos têm células que dão ferroadas minúsculas.' },
  { id: 'moon', cat: 'fundo', name: 'Água-viva-da-lua', fact: 'Não tem cérebro nem coração e mesmo assim as águas-vivas existem há mais de 500 milhões de anos.' },
  { id: 'nettle', cat: 'fundo', name: 'Água-viva-urtiga', fact: 'Os tentáculos compridos queimam como urtiga. Bonita, mas é melhor olhar de longe.' },
  { id: 'mermaid', cat: 'lendas', name: 'Iara, a sereia', fact: 'Na lenda indígena brasileira, a Iara vive nos rios e encanta quem ouve o seu canto. Aqui ela acena para quem chega perto.' },
  { id: 'boto', cat: 'lendas', name: 'Boto encantado', fact: 'Lenda amazônica: em noites de festa, o boto-cor-de-rosa vira um moço de chapéu. O boto de verdade é um golfinho de rio.' },
  { id: 'hippocampus', cat: 'lendas', name: 'Hipocampo', fact: 'Cavalo com cauda de peixe da mitologia grega, que puxava a carruagem de Poseidon.' },
  { id: 'leviathan', cat: 'lendas', name: 'Leviatã', fact: 'Serpente marinha colossal das lendas antigas. Aqui ela só passa ao longe, sem pressa.' },
  { id: 'kraken', cat: 'lendas', name: 'Kraken', fact: 'Monstro das lendas nórdicas, provavelmente inspirado na lula-gigante, que existe de verdade. Clique nos tentáculos para ele recuar.' },
  { id: 'zaratan', cat: 'lendas', name: 'Tartaruga-ilha', fact: 'Nas histórias de marinheiros, era tão grande que as pessoas achavam que era uma ilha e desembarcavam nela.' },
  { id: 'pet_serpent', cat: 'bichinhos', name: 'Serpente-marinha', how: 'pet', fact: 'Comprida e brincalhona. Cresce até virar um dragão do mar que dorme estirado sobre as ruínas.' },
  { id: 'pet_jelly', cat: 'bichinhos', name: 'Medusa-lunar', how: 'pet', fact: 'Flutua pulsando e tem um coraçãozinho que brilha por dentro. Gigante, ganha uma coroa de luz.' },
  { id: 'pet_crab', cat: 'bichinhos', name: 'Ermitão', how: 'pet', fact: 'Troca de casa conforme cresce: concha de caracol, turbante, búzio com anêmona e, no fim, uma concha com farol.' },
  { id: 'chest', cat: 'segredos', name: 'Baú do tesouro', how: 'touch', fact: 'Dizem que veio de um navio pirata que afundou por aqui. Clique para abrir e ver as moedas.' },
  { id: 'plankton', cat: 'segredos', name: 'Plâncton brilhante', how: 'secret', hint: 'Mexa o mouse depressa numa noite escura.', fact: 'Alguns seres minúsculos acendem luz quando a água se mexe — é a bioluminescência. À noite o cursor deixa um rastro deles.' },
];
const PEDIA_BY = {}; for (const p of PEDIA) PEDIA_BY[p.id] = p;
const PASS_ID = { dolphins: 'dolphin' };
const pediaFound = id => !!(META && META.pedia[id]);
function pediaFind(id) {
  if (!META || META.pedia[id] || !PEDIA_BY[id]) return;
  META.pedia[id] = Date.now(); saveMeta();
  let ic = null; try { ic = pediaCanvas(PEDIA_BY[id], 0, false, 40, 26); } catch (e) { }
  notify('Nova descoberta!', PEDIA_BY[id].name, 'disc', ic); checkAch();
}
// ---------------- detecção ----------------
const PSEEN = {}; let pediaAcc = 0;
function pediaTick(dt) {
  if (!META || GAME_ACTIVE()) return;
  pediaAcc += dt; if (pediaAcc < 0.25) return; const st = pediaAcc; pediaAcc = 0;
  const see = (id, x, y) => { if (META.pedia[id] || x < 4 || x > W - 4 || y < waterTop - 4 || y > H) return; PSEEN[id] = (PSEEN[id] || 0) + st; if (PSEEN[id] > 1.5) pediaFind(id); };
  const touch = (id, x, y, r) => { if (!META.pedia[id] && mouseNear(x, y, r)) pediaFind(id); };
  for (const f of fish) see(f.key, f.x, f.y);
  for (const p of passers) {
    if (p.kind === 'distant') continue;
    const id = PASS_ID[p.kind] || p.kind;
    if (p.kind === 'kraken') { if (p.arms.some(a => a.p > 0.35)) see(id, W / 2, H / 2); continue; }
    if (p.kind === 'leviathan') { const h = p.trail[0]; if (h) see(id, h.x, h.y); continue; }
    if (p.m) { const q = p.pos(p.m[0]); see(id, q.x, q.y); }
  }
  for (const j of jellies) see(j.type === 'moon' ? 'moon' : 'nettle', j.x, j.y);
  if (otter && otter.away <= 0) see('otter', otter.x, waterTop + 6);
  if (puffer) touch('puffer', puffer.x, puffer.y, 28);
  if (crab) touch('crabNpc', crab.x, gy(crab.x) - 5, 26);
  for (const s of seahorses) touch('seahorse', s.x, s.y, 22);
  if (moray) touch('moray', moray.x + 14, moray.y - 6, 32);
  if (eels) for (const e of eels.list) touch('eels', e.x, gy(e.x) - 8, 24);
  if (clam) touch('clam', clam.x, clam.y - 6, 20);
  if (chest) touch('chest', chest.x, chest.y - 10, 22);
  for (const a of anemones) touch('anemone', a.x, gy(a.x) - 8, 20);
  if (!META.pedia.plankton && night() > 0.3 && mouse.seen && mouse.speed > 15 && mouse.active > 0.5) { PSEEN.plankton = (PSEEN.plankton || 0) + st; if (PSEEN.plankton > 2.5) pediaFind('plankton'); }
}
// ---------------- desenhos das fichas ----------------
const PEDIA_SHEET = { dolphin: 'dolphin', seahorse: 'seahorseY', crabNpc: 'crab', leviathan: 'levHead', otter: 'otterWave' };
function pediaSheet(e) { if (e.cat === 'bichinhos' || ['eels', 'anemone', 'moon', 'nettle', 'kraken', 'plankton'].includes(e.id)) return null; try { return sheet(PEDIA_SHEET[e.id] || e.id); } catch (err) { return null; } }
function miniJelly(g, cx, cy, moon, t) {
  const c = moon ? { b: '#dfe8ff', l: '#f4f8ff', d: '#a8b8e8', go: '#c890e8' } : { b: '#f2b050', l: '#ffd890', d: '#b86a2a', go: '#8a2a30' }, rx = moon ? 9 : 7, ry = rx * 0.72, pc = Math.max(0, Math.sin(t * 3));
  g.fillStyle = c.d; const nt = moon ? 11 : 6, tl = moon ? 9 : 22;
  for (let i = 0; i < nt; i++) { const bx = cx + (i / (nt - 1) - 0.5) * rx * 1.9; for (let k = 1; k < tl; k++) { g.globalAlpha = 0.55 * (1 - k / tl) + 0.1; g.fillRect(Math.round(bx + Math.sin(t * 2 + i + k * 0.3) * k * 0.08), Math.round(cy + k), 1, 1); } }
  for (let dy = Math.ceil(-ry * (1 + pc * 0.12)); dy <= 0; dy++) { const hw = rx * (1 - pc * 0.12) * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2)), w = Math.max(1, Math.round(hw * 2)); g.globalAlpha = dy === 0 ? 0.9 : 0.72; g.fillStyle = dy === 0 ? c.d : dy < -ry * 0.6 ? c.l : c.b; g.fillRect(Math.round(cx - w / 2), Math.round(cy + dy), w, 1); }
  g.globalAlpha = 0.85; g.fillStyle = c.go; for (const ox of [-0.4, 0.4]) g.fillRect(Math.round(cx + ox * rx - 1), Math.round(cy - ry * 0.45), 3, 1); g.globalAlpha = 1;
}
function miniEels(g, w, h, t) {
  const base = h - 4; g.fillStyle = '#c8b48a'; g.fillRect(0, base, w, 4);
  [[0.3, 13, 0, false], [0.5, 17, 1.3, true], [0.7, 11, 2.2, false]].forEach(([fx, L, ph, sp]) => {
    const x0 = Math.round(w * fx), lean = Math.sin(t * 0.9 + ph) * 2;
    for (let j = 0; j < L; j++) { const q = j / L, x = Math.round(x0 + lean * q * q + (j > L - 3 ? (j - L + 3) * 0.8 : 0)); g.fillStyle = sp ? (hash2(x0, j, 3) < 0.25 ? '#1a1a22' : '#ece6d8') : (j % 5 < 1 ? '#f4f0e8' : '#f08a3a'); g.fillRect(x, base - j, 2, 1); }
    g.fillStyle = '#0a0a12'; g.fillRect(Math.round(x0 + lean + 3), base - L + 1, 1, 1);
  });
}
function miniAnemone(g, cx, by, t) {
  g.fillStyle = '#86306d'; g.fillRect(cx - 5, by - 3, 11, 3);
  for (let k = 0; k < 11; k++) { const a = -Math.PI / 2 + (k - 5) * 0.2, L = 9 + (k % 3); for (let j = 0; j < L; j++) { const q = j / L, x = cx + Math.cos(a) * j * 0.9 + Math.sin(t * 1.5 + k * 0.7 + j * 0.3) * q * 1.5, y = by - 3 + Math.sin(a) * j; g.fillStyle = j > L - 2 ? '#ffb8ea' : k % 2 ? '#cf4ea3' : '#a83d88'; g.fillRect(Math.round(x), Math.round(y), 1, 1); } }
}
let PEDIA_KR = null;
function miniKraken(g, w, h, t) {
  if (!PEDIA_KR) PEDIA_KR = discSet('#8a3050', 6, { hue: 18 });
  const pts = []; let x = w * 0.45, y = h + 4, ang = -Math.PI / 2;
  for (let s = 0; s <= 26; s++) { const q = s / 26; pts.push({ x, y, r: lerp(6, 1, Math.pow(q, 0.8)) }); ang += Math.sin(t * 0.9 + q * 3) * 0.05 + Math.pow(q, 3) * 0.35; x += Math.cos(ang) * 1.6; y += Math.sin(ang) * 1.6; }
  drawChain(PEDIA_KR, pts, g);
  g.fillStyle = '#f2c8d0'; for (let i = 3; i < pts.length - 3; i += 3) g.fillRect(Math.round(pts[i].x + 2), Math.round(pts[i].y), 1, 1);
}
function miniPlankton(g, w, h, t) { g.fillStyle = '#40ffd0'; for (let k = 0; k < 26; k++) { const x = (hash2(k, 1, 4) * w) | 0, y = (hash2(k, 2, 4) * h) | 0; g.globalAlpha = 0.25 + 0.75 * Math.max(0, Math.sin(t * 2 + k)); g.fillRect(x, y, 1, 1); } g.globalAlpha = 1; }
// desenha a ficha (quadro f) num canvas pequeno; sil = silhueta misteriosa
function pediaCanvas(e, f, sil, w = 56, h = 36, t = 0) {
  const c = makeCanvas(w, h), g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const sh = pediaSheet(e);
  if (sh) {
    const fr = e.id === 'clam' ? 3 : e.id === 'chest' ? 1 : e.id === 'moray' ? 8 + (f & 1) : f, img = sh.r[((fr % sh.n) + sh.n) % sh.n], fit = Math.min((w - 2) / img.width, (h - 2) / img.height), s = fit >= 2 && w > 80 ? Math.min(3, Math.floor(fit)) : Math.min(1, fit);
    const dw = Math.max(1, Math.round(img.width * s)), dh = Math.max(1, Math.round(img.height * s)); g.drawImage(img, Math.round((w - dw) / 2), Math.round((h - dh) / 2), dw, dh);
  } else if (e.id === 'moon' || e.id === 'nettle') miniJelly(g, w / 2, h * 0.45, e.id === 'moon', t);
  else if (e.id === 'eels') miniEels(g, w, h, t);
  else if (e.id === 'anemone') miniAnemone(g, Math.round(w / 2), h - 2, t);
  else if (e.id === 'kraken') miniKraken(g, w, h, t);
  else if (e.id === 'plankton') miniPlankton(g, w, h, t);
  else if (e.cat === 'bichinhos') { const k = e.id.slice(4); speciesPortrait(k); const pc = portraitCanvas[k]; if (pc) { const s = Math.min(1, w / 64, h / 44); g.drawImage(pc, Math.round((w - 64 * s) / 2), Math.round((h - 44 * s) / 2), Math.round(64 * s), Math.round(44 * s)); } }
  if (sil) { g.globalCompositeOperation = 'source-in'; g.fillStyle = '#14304e'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; }
  return c;
}
const pediaThumbCache = {};
function pediaThumb(e, sil) { const k = e.id + (sil ? '?' : ''); return pediaThumbCache[k] || (pediaThumbCache[k] = pediaCanvas(e, 0, sil).toDataURL()); }
// ---------------- janela ----------------
let pediaTab = 'seres', pediaCat = 'todos', pediaSel = null, pediaAnim = 0;
function openPedia(tab) { if (tab) pediaTab = tab; renderPedia(); }
function pediaHint(e) {
  if (e.hint) return e.hint;
  if (e.how === 'pet') return 'Choque um ovo desta espécie.';
  if (e.how === 'touch') return 'Mora no fundo: passe o mouse bem pertinho para conhecer.';
  if (e.cat === 'lendas') return 'Aparece raramente. Fique de olho no aquário.';
  if (e.cat === 'mamiferos') return 'Passa de vez em quando, nadando de um lado ao outro.';
  return 'Nada por aí; basta ver por alguns segundos.';
}
function renderPedia() {
  clearInterval(pediaAnim);
  const n = nKeys(META.pedia), total = PEDIA.length, nA = ACH.filter(a => META.ach[a.id]).length;
  const tabs = `<div class="tabs"><button data-t="seres" class="${pediaTab === 'seres' ? 'on' : ''}">Seres (${n}/${total})</button><button data-t="conq" class="${pediaTab === 'conq' ? 'on' : ''}">Conquistas (${nA}/${ACH.length})</button></div>`;
  let body = '';
  if (pediaTab === 'seres') {
    const chips = `<div class="chips">${[['todos', 'Todos']].concat(PEDIA_CATS).map(([k, l]) => `<button data-c="${k}" class="${pediaCat === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const list = PEDIA.filter(e => pediaCat === 'todos' || e.cat === pediaCat);
    const sel = pediaSel && PEDIA_BY[pediaSel], selF = sel && pediaFound(sel.id);
    const det = sel ? `<div class="pdet"><canvas id="pcv" width="112" height="72"></canvas><div><b>${selF ? esc(sel.name) : '???'}</b><span>${selF ? esc(sel.fact) : 'Ainda não descoberto. ' + esc(pediaHint(sel))}</span>${selF ? `<i>Descoberto em ${new Date(META.pedia[sel.id]).toLocaleDateString('pt-BR')}</i>` : ''}</div></div>` : `<div class="pdet empty">Clique numa ficha para ler sobre o bicho.</div>`;
    body = chips + det + `<div class="pgrid">${list.map(e => { const f = pediaFound(e.id); return `<button class="pcard ${f ? '' : 'sil'} ${e.id === pediaSel ? 'on' : ''}" data-id="${e.id}"><img src="${pediaThumb(e, !f)}" alt=""><span>${f ? esc(e.name) : '???'}</span></button>`; }).join('')}</div>`;
  } else {
    body = `<div class="alist">${ACH.map(a => { const d = META.ach[a.id], it = a.item ? wearItem(...a.item.split(':')) : null, rw = [a.coins ? a.coins + ' moedas' : '', it ? it.name : ''].filter(Boolean).join(' + ');
      return `<div class="arow ${d ? 'done' : ''}"><img src="${(d ? ICONS.trophy : ICONS.lock).toDataURL()}" alt=""><div><b>${esc(a.name)}</b><span>${esc(a.desc)}</span></div><em>${rw ? 'Prêmio: ' + esc(rw) : ''}${d ? '<br>✓ ' + new Date(d).toLocaleDateString('pt-BR') : ''}</em></div>`; }).join('')}</div>`;
  }
  dialog(`<h2>Aquapédia</h2>${tabs}${body}<div class="row"><button id="ok" class="pri">Fechar</button></div>`, d => {
    d.querySelectorAll('[data-t]').forEach(b => { b.onclick = () => { pediaTab = b.dataset.t; sfx('tick'); renderPedia(); }; });
    d.querySelectorAll('[data-c]').forEach(b => { b.onclick = () => { pediaCat = b.dataset.c; sfx('tick'); renderPedia(); }; });
    d.querySelectorAll('.pcard').forEach(b => { b.onclick = () => { pediaSel = b.dataset.id; sfx('flip'); renderPedia(); }; });
    d.querySelector('#ok').onclick = closeDialog;
    const cv = d.querySelector('#pcv');
    if (cv && pediaSel) {
      const e = PEDIA_BY[pediaSel], f0 = pediaFound(e.id); let fr = 0; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
      const step = () => { if (!document.body.contains(cv)) { clearInterval(pediaAnim); return; } g.clearRect(0, 0, 112, 72); g.drawImage(pediaCanvas(e, fr++, !f0, 112, 72, fr * 0.14), 0, 0); };
      step(); pediaAnim = setInterval(step, 140);
    }
  }, 'wide');
}
