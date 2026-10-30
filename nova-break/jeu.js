// =====================================================
//  NOVA BREAK — jeu.js
//  Le moteur du jeu : physique, briques, boosters,
//  modes de jeu et effets visuels.
// =====================================================

const W = 400, H = 720;          // taille "logique" du jeu (adaptée à l'écran ensuite)
const HAUT = 60;                 // hauteur du bandeau du haut (score, vies…)
const COLS = 8, MARGE = 12, ESP = 5, BH = 22;
const BL = (W - MARGE * 2 - ESP * (COLS - 1)) / COLS;   // largeur d'une brique
const Y_BRIQUES = HAUT + 34;     // où commence le mur de briques
const POLICE = 'Orbitron, "Segoe UI", system-ui, sans-serif';
const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
let echelle = 1;

function redimensionner() {
  echelle = Math.min(window.innerWidth / W, window.innerHeight / H);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);  // max 2 : plus fluide sur téléphone
  canvas.style.width = W * echelle + 'px';
  canvas.style.height = H * echelle + 'px';
  canvas.width = Math.round(W * echelle * dpr);
  canvas.height = Math.round(H * echelle * dpr);
  ctx.setTransform(echelle * dpr, 0, 0, echelle * dpr, 0, 0);
}
window.addEventListener('resize', redimensionner);
redimensionner();

// ---------- Petits outils ----------
const Sauvegarde = {
  lire(cle, defaut) { try { const v = localStorage.getItem('nb_' + cle); return v === null ? defaut : JSON.parse(v); } catch (e) { return defaut; } },
  ecrire(cle, val) { try { localStorage.setItem('nb_' + cle, JSON.stringify(val)); } catch (e) {} },
};
const hasard = (a, b) => a + Math.random() * (b - a);
const limiter = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOutBack = t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// Générateur de hasard "avec graine" : même graine = mêmes niveaux (pour le défi du jour)
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashTexte(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
let alea = Math.random;

function aujourdhui(decalage = 0) {
  const d = new Date(); d.setDate(d.getDate() + decalage);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function rr(x, y, l, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, l, h, r); else ctx.rect(x, y, l, h); }
function espacement(px) { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; }

// Halos lumineux pré-dessinés une seule fois (bien plus rapide que shadowBlur sur téléphone)
const cacheHalos = new Map();
function halo(coul, doux = false) {
  const cle = coul + doux;
  let c = cacheHalos.get(cle);
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (!doux) rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(doux ? 0 : 0.18, coul);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    cacheHalos.set(cle, c);
  }
  return c;
}
function dessinerHalo(coul, x, y, rayon, alpha, doux) {
  ctx.globalAlpha = alpha; ctx.drawImage(halo(coul, doux), x - rayon, y - rayon, rayon * 2, rayon * 2); ctx.globalAlpha = 1;
}

// =====================================================
//  BOOSTERS
// =====================================================
const BONUS = {
  grosse:   { emoji: '🌕', nom: 'MÉGA BALLE',     sous: 'Plus grosse, plus lourde : 2 dégâts', coul: '#ffb74d', duree: 10 },
  multi:    { emoji: '✨', nom: 'MULTI-BALLE',    sous: 'Chaque balle se divise en trois',     coul: '#69f0ae' },
  large:    { emoji: '↔️', nom: 'RAQUETTE XL',    sous: 'Ta raquette s\'élargit',              coul: '#40c4ff', duree: 12 },
  feu:      { emoji: '🔥', nom: 'BALLE DE FEU',   sous: 'Traverse les briques : 3 dégâts',     coul: '#ff6e40', duree: 7 },
  lent:     { emoji: '⏳', nom: 'TEMPS SUSPENDU', sous: 'Le monde ralentit…',                  coul: '#b388ff', duree: 8 },
  bouclier: { emoji: '🛡️', nom: 'BOUCLIER',       sous: 'Une barrière sauve ta balle',         coul: '#a7ffeb' },
  laser:    { emoji: '🎯', nom: 'LASER',          sous: 'Ta raquette tire toute seule',        coul: '#ffee58', duree: 8 },
};
const LEGENDAIRES = {
  dinky: { emoji: '😎', label: 'BOOSTER', titre: 'DINKY BOY', sous: '⚡ TEMPÊTE ÉLECTRIQUE ⚡', ligne: 'La foudre frappe pour toi · Points ×2', coul: '#00e5ff', coul2: '#ffea00', duree: 12 },
  bryan: { emoji: '👑', label: 'BOOSTER DE', titre: 'BRYAN', sous: '🔥 SUPERNOVA ROYALE 🔥', ligne: 'Rien ne résiste à la couronne · Points ×3', coul: '#ffd54f', coul2: '#ff4081', duree: 10 },
};
for (const k in BONUS) BONUS[k].id = k;
for (const k in LEGENDAIRES) { LEGENDAIRES[k].id = k; LEGENDAIRES[k].legendaire = true; }
const LISTE_BONUS = Object.values(BONUS);

// =====================================================
//  MODES DE JEU
// =====================================================
const MODES = {
  aventure: { nom: 'AVENTURE',     emoji: '🌌', theme: 'aventure', vies: 3 },
  defi:     { nom: 'DÉFI DU JOUR', emoji: '📅', theme: 'defi',     vies: 3 },
  zen:      { nom: 'ZEN',          emoji: '🌙', theme: 'zen',      vies: Infinity },
  rush:     { nom: 'RUSH 60',      emoji: '⏱️', theme: 'rush',     vies: Infinity },
  invasion: { nom: 'INVASION',     emoji: '☄️', theme: 'invasion', vies: 1 },
};
const MODIFICATEURS = [
  { id: 'rapides',    nom: '⚡ Balles rapides' },
  { id: 'blindees',   nom: '🧱 Briques blindées' },
  { id: 'mini',       nom: '🤏 Raquette mini' },
  { id: 'pluie',      nom: '🎁 Pluie de bonus' },
  { id: 'legendaire', nom: '👑 Nuit légendaire' },
  { id: 'miroir',     nom: '🪞 Commandes inversées' },
];
// Chaque jour, 2 règles spéciales choisies avec la date comme graine (les mêmes pour tout le monde)
function defiDuJour() {
  const date = aujourdhui(), r = mulberry32(hashTexte('NOVA' + date)), liste = MODIFICATEURS.slice(), mods = [];
  while (mods.length < 2) mods.push(liste.splice(Math.floor(r() * liste.length), 1)[0]);
  return { date, graine: hashTexte(date), mods };
}

// =====================================================
//  ÉTAT DU JEU
// =====================================================
let etat = 'menu';                 // menu | jeu | pause | fin
let mode = 'aventure', regles = {};
let score = 0, niveau = 1, vies = 3, chrono = 0, tempsRush = 60, combo = 0, meilleurCombo = 0, brisees = 0, niveauxDefi = 0;
let raquette = { x: W / 2, cibleX: W / 2, y: H - 96, l: 84, h: 14, stun: 0 };
let balles = [], briques = [], capsules = [], tirs = [], orbes = [], boss = null, nova = null;
let particules = [], eclats = [], anneaux = [], textes = [], eclairs = [], flashs = [];
let effets = {}, bouclier = 0, ralenti = 1, cinematique = null, secousse = 0, banniere = null;
let pauseVictoire = 0, cadenceLaser = 0, dernierEclairRaquette = 0, descente = 0, tempsGlobal = 0;
const touches = { gauche: false, droite: false };

// =====================================================
//  DÉMARRAGE D'UNE PARTIE / D'UN NIVEAU
// =====================================================
function demarrerPartie(m) {
  mode = m; regles = {}; alea = Math.random;
  if (m === 'defi') { const d = defiDuJour(); for (const mod of d.mods) regles[mod.id] = true; alea = mulberry32(d.graine); }
  score = 0; combo = 0; meilleurCombo = 0; brisees = 0; chrono = 0; niveauxDefi = 0; descente = 0;
  vies = MODES[m].vies; tempsRush = 60;
  niveau = m === 'aventure' ? Sauvegarde.lire('palier', 1) : 1;
  particules = []; eclats = []; anneaux = []; textes = []; flashs = []; cinematique = null; ralenti = 1;
  demarrerNiveau();
  etat = 'jeu';
  Son.pauseMusique(false);
}

function largeurBase() { return regles.mini ? 62 : 84; }
function vitesseBalle() {
  let v = mode === 'zen' ? 270 : mode === 'rush' ? 380 : mode === 'invasion' ? 330 + Math.min(chrono, 180) * 0.4 : 320 + Math.min(niveau, 20) * 7;
  if (regles.rapides) v *= 1.25;
  return v;
}

function demarrerNiveau() {
  raquette = { x: W / 2, cibleX: W / 2, y: H - 96, l: largeurBase(), h: 14, stun: 0 };
  balles = [nouvelleBalle()];
  briques = []; capsules = []; tirs = []; orbes = []; boss = null; nova = null; eclairs = [];
  effets = {}; bouclier = 0; combo = 0; pauseVictoire = 0;
  Son.boost(null); Son.ralenti(false);
  if (mode === 'invasion') {
    for (let r = 0; r < 6; r++) ajouterLigneInvasion(Y_BRIQUES + r * (BH + ESP));
    banniere = { emoji: '☄️', txt: 'INVASION', sous: 'Ne les laisse pas descendre !', coul: '#ea80fc', t: 0, duree: 1.8 };
  } else if (mode === 'aventure' && niveau % 5 === 0) {
    creerBoss();
    banniere = { emoji: '⚠️', txt: 'NOYAU STELLAIRE', sous: 'Niveau ' + niveau + ' · Boss', coul: '#ff4081', t: 0, duree: 2 };
  } else {
    creerNiveau();
    const titre = mode === 'defi' ? 'DÉFI ' + (niveauxDefi + 1) + '/3' : mode === 'rush' ? 'RUSH !' : 'NIVEAU ' + niveau;
    const sous = mode === 'defi' ? Object.keys(regles).map(id => MODIFICATEURS.find(m => m.id === id).nom).join(' · ') : mode === 'zen' ? 'Respire. Rien ne presse.' : '';
    banniere = { emoji: MODES[mode].emoji, txt: titre, sous, coul: '#80d8ff', t: 0, duree: 1.6 };
  }
  const theme = mode === 'aventure' && boss ? 'boss' : MODES[mode].theme;
  Son.jouerTheme(theme);
}

function nouvelleBalle() {
  return { x: raquette.x, y: raquette.y - raquette.h / 2 - 8, vx: 0, vy: 0, r: 8, collee: true, trace: [], derniere: null, tDerniere: 0 };
}

// ---------- Les briques ----------
function creerBrique(x, y, pv, type = 'normal', l = BL, h = BH) {
  return { x, y, l, h, pv, pvMax: pv, type, fissures: [], nbPetites: 0, grande: false, flash: 0, trem: 0 };
}

// Formes possibles des murs de briques (r = ligne, c = colonne, n = nombre de lignes)
const MOTIFS = [
  () => true,
  (r, c) => (r + c) % 2 === 0,
  (r, c, n) => Math.abs(c - 3.5) <= (n - r) * 0.6 + 0.5,
  (r, c, n) => Math.abs(c - 3.5) / 4 + Math.abs(r - (n - 1) / 2) / (n / 2) <= 1.05,
  (r, c) => !(c === 3 || c === 4) || r % 3 === 0,
  (r, c) => c < 3 || c > 4 || r < 2,
  (r, c) => Math.floor((c + r) / 2) % 2 === 0,
  (r, c, n) => r === 0 || r === n - 1 || c === 0 || c === 7 || (r % 2 === 0 && c % 2 === 1),
];

// Résistance des briques : elle grimpe avec les niveaux
function pvPour(r, n) {
  let base, varia;
  if (mode === 'zen') { base = 1 + Math.floor((niveau - 1) / 3); varia = 2; }
  else if (mode === 'rush') { base = 1; varia = 3; }
  else { base = 1 + Math.floor((niveau - 1) / 2); varia = 1 + Math.floor(niveau / 3); }
  let pv = base + Math.floor(alea() * varia) + (r < n / 3 ? 1 : 0);
  if (regles.blindees) pv += 2;
  return Math.min(16, pv);
}

function creerNiveau() {
  const n = Math.min(5 + Math.floor(niveau / 2), 12);
  const motif = MOTIFS[(niveau - 1 + (mode === 'defi' ? Math.floor(alea() * 8) : 0)) % MOTIFS.length];
  for (let r = 0; r < n; r++) for (let c = 0; c < COLS; c++) {
    if (!motif(r, c, n)) continue;
    const t = alea(), type = t < 0.05 ? 'bombe' : t < 0.09 ? 'cristal' : 'normal';
    briques.push(creerBrique(MARGE + c * (BL + ESP), Y_BRIQUES + r * (BH + ESP), type === 'bombe' ? 1 : pvPour(r, n), type));
  }
  if (briques.length < 10) { briques = []; for (let r = 0; r < 4; r++) for (let c = 0; c < COLS; c++) briques.push(creerBrique(MARGE + c * (BL + ESP), Y_BRIQUES + r * (BH + ESP), pvPour(r, 4))); }
}

function ajouterLigneInvasion(y) {
  const pvb = 1 + Math.floor(chrono / 30);
  for (let c = 0; c < COLS; c++) {
    if (Math.random() < 0.15) continue;
    const t = Math.random(), type = t < 0.05 ? 'bombe' : t < 0.09 ? 'cristal' : 'normal';
    briques.push(creerBrique(MARGE + c * (BL + ESP), y, type === 'bombe' ? 1 : pvb + Math.floor(Math.random() * 2), type));
  }
}

function creerBoss() {
  const pv = 40 + niveau * 8;
  boss = { x: W / 2 - 85, y: 150, l: 170, h: 58, pv, pvMax: pv, t: 0, tir: 3, fissures: [], nbPetites: 0, grande: false, flash: 0, trem: 0, boss: true, prochainBonus: pv * 0.85 };
  for (let c = 0; c < COLS; c++) briques.push(creerBrique(MARGE + c * (BL + ESP), 290, 2 + Math.floor(niveau / 5)));
}

// =====================================================
//  FISSURES : chaque coup ajoute des fissures qui partent
//  du point d'impact. Petites d'abord, puis nombreuses,
//  puis une GRANDE fissure traverse la brique.
// =====================================================
function ajouterFissures(br, ix, iy) {
  const k = limiter(br.pv / br.pvMax, 0, 1);
  const total = br.boss ? 18 : 10;
  const ep = 0.8 + (1 - k) * 1.6;
  const n = Math.max(1, Math.round(total * (1 - k)) - br.nbPetites);
  for (let i = 0; i < n; i++) {
    let x = ix, y = iy, a = Math.random() * Math.PI * 2;
    const pts = [[x, y]], seg = 3 + (Math.random() * 3 | 0);
    const len = (br.boss ? 70 : br.l * 0.55) * hasard(0.5, 1.1) * (0.6 + (1 - k));
    for (let s = 0; s < seg; s++) { a += hasard(-0.9, 0.9); x += Math.cos(a) * len / seg; y += Math.sin(a) * len / seg; pts.push([x, y]); }
    br.fissures.push({ pts, ep });
    if (Math.random() < 0.5) { // petite branche secondaire
      const d = pts[1 + (Math.random() * (pts.length - 1) | 0)], b = a + hasard(-1.5, 1.5);
      br.fissures.push({ pts: [d, [d[0] + Math.cos(b) * len * 0.3, d[1] + Math.sin(b) * len * 0.3]], ep: ep * 0.7 });
    }
  }
  br.nbPetites += n;
  if (!br.grande && k <= 0.4) { // la grande fissure : la brique est sur le point de céder
    br.grande = true;
    const pts = [];
    for (let s = 0; s <= 7; s++) { const px = s / 7 * br.l; pts.push([px, limiter(iy + (px - ix) * hasard(-0.25, 0.25) + hasard(-br.h * 0.2, br.h * 0.2), 1, br.h - 1)]); }
    br.fissures.push({ pts, ep: ep + 1.3 });
  }
  if (br.fissures.length > 40) br.fissures.splice(0, br.fissures.length - 40);
}

// Couleur : intacte = saturée et profonde ; abîmée = pâle et délavée
function teinteBrique(br) {
  if (br.type === 'cristal') return Math.round(((tempsGlobal * 40 + br.x) % 360) / 30) * 30;
  if (br.type === 'bombe') return 16;
  const p = br.pvMax;
  return p <= 1 ? 186 : p <= 2 ? 200 : p <= 4 ? 220 : p <= 6 ? 255 : p <= 9 ? 290 : p <= 12 ? 330 : 42;
}
function couleurBrique(br, a = 1, pleine = false) {
  const k = pleine ? 1 : limiter(br.pv / br.pvMax, 0, 1), h = teinteBrique(br);
  if (br.type === 'cristal') return `hsla(${h},75%,70%,${a})`;
  return `hsla(${h},${25 + 62 * k}%,${70 - 18 * k}%,${a})`;
}

// =====================================================
//  DÉGÂTS, CASSE, EXPLOSIONS
// =====================================================
function multiplicateur() { return (1 + Math.floor(combo / 5) * 0.25) * (effets.dinky ? 2 : 1) * (effets.bryan ? 3 : 1); }

function frapperBrique(br, degats, ix = br.l / 2, iy = br.h / 2) {
  if (br.pv <= 0) return;
  br.pv -= degats; br.flash = 0.12; br.trem = 0.18;
  if (br.pv > 0) {
    ajouterFissures(br, ix, iy);
    etincelles(br.x + ix, br.y + iy, couleurBrique(br), 4 + Math.round((1 - br.pv / br.pvMax) * 6));
    Son.frappe(br.pv / br.pvMax);
    score += 1;
  } else briser(br, ix, iy);
}

function briser(br, ix = br.l / 2, iy = br.h / 2, sansBonus = false) {
  br.pv = 0;
  combo++; meilleurCombo = Math.max(meilleurCombo, combo); brisees++;
  const gain = Math.round(10 * br.pvMax * multiplicateur());
  score += gain;
  const coul = couleurBrique(br, 1, true);
  fragmenter(br.x, br.y, br.l, br.h, ix, iy, coul, 1);
  textes.push({ x: br.x + br.l / 2, y: br.y + br.h / 2, txt: '+' + gain, coul, vie: 0.9, max: 0.9, taille: 12 });
  Son.casse(combo);
  secousse = Math.max(secousse, Math.min(6, 1.5 + br.pvMax * 0.4));
  if (combo % 10 === 0) { textes.push({ x: W / 2, y: H * 0.62, txt: '🔥 COMBO ×' + combo, coul: '#ffab40', vie: 1.2, max: 1.2, taille: 20 }); flash('#ffab40', 0.12); }
  if (!sansBonus) lacherBonus(br.x + br.l / 2, br.y + br.h / 2, br.type === 'cristal');
  if (br.type === 'bombe') exploser(br);
}

// La brique vole en éclats : on la découpe en triangles qui partent depuis le point d'impact
function fragmenter(x, y, l, h, ix, iy, coul, force) {
  const bord = [[0, 0], [l * 0.35, 0], [l * 0.7, 0], [l, 0], [l, h * 0.5], [l, h], [l * 0.65, h], [l * 0.3, h], [0, h], [0, h * 0.5]];
  for (let i = 0; i < bord.length; i++) {
    const p = bord[i], q = bord[(i + 1) % bord.length];
    const cx = (ix + p[0] + q[0]) / 3, cy = (iy + p[1] + q[1]) / 3;
    const ang = Math.atan2(cy - iy, cx - ix) + hasard(-0.3, 0.3), v = hasard(60, 190) * force;
    eclats.push({ x: x + cx, y: y + cy, pts: [[ix - cx, iy - cy], [p[0] - cx, p[1] - cy], [q[0] - cx, q[1] - cy]], vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 50, rot: 0, vr: hasard(-9, 9), vie: hasard(0.6, 1), max: 1, coul });
  }
  if (eclats.length > 260) eclats.splice(0, eclats.length - 260);
  etincelles(x + ix, y + iy, coul, 10 * force);
}

function etincelles(x, y, coul, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283, v = hasard(40, 220);
    particules.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: hasard(0.3, 0.7), max: 0.7, coul, t: hasard(1.5, 3), g: 260 });
  }
  if (particules.length > 450) particules.splice(0, particules.length - 450);
}
function explosionEtoiles(x, y, coul, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283, v = hasard(80, 320);
    particules.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: hasard(0.5, 1), max: 1, coul, t: hasard(4, 9), g: 0, lueur: true });
  }
  if (particules.length > 450) particules.splice(0, particules.length - 450);
}
function flash(coul, force) { flashs.push({ coul, a: force, vie: 0.35, max: 0.35 }); }

function exploser(br) {
  const cx = br.x + br.l / 2, cy = br.y + br.h / 2;
  anneaux.push({ x: cx, y: cy, r: 8, v: 380, vie: 0.35, max: 0.35, coul: '#ff7043', ep: 8 });
  explosionEtoiles(cx, cy, '#ffab40', 16);
  flash('#ff7043', 0.15); secousse = Math.max(secousse, 9); Son.explosion(false);
  for (const o of briques) if (o !== br && o.pv > 0 && Math.abs(o.x - br.x) < br.l * 1.7 && Math.abs(o.y - br.y) < br.h * 2.2) frapperBrique(o, 3);
  if (boss && Math.hypot(boss.x + boss.l / 2 - cx, boss.y + boss.h / 2 - cy) < 130) frapperBoss(4);
}

// Éclair en chaîne (Booster Dinky Boy) : saute vers les 3 briques les plus proches
function chaineEclair(src) {
  let px = src.x + src.l / 2, py = src.y + src.h / 2;
  const cibles = briques.filter(b => b.pv > 0 && b !== src)
    .map(b => ({ b, d: Math.hypot(b.x + b.l / 2 - px, b.y + b.h / 2 - py) }))
    .filter(o => o.d < 170).sort((a, b) => a.d - b.d).slice(0, 3);
  for (const o of cibles) {
    const tx = o.b.x + o.b.l / 2, ty = o.b.y + o.b.h / 2;
    eclairs.push({ x1: px, y1: py, x2: tx, y2: ty, vie: 0.28, max: 0.28, coul: '#80d8ff' });
    frapperBrique(o.b, 2); px = tx; py = ty;
  }
  if (cibles.length) Son.eclair();
}
function briquesAuHasard(n) { return briques.filter(b => b.pv > 0).sort(() => Math.random() - 0.5).slice(0, n); }

// ---------- Le boss ----------
function frapperBoss(degats, ix, iy) {
  if (!boss || boss.pv <= 0) return;
  boss.pv -= degats; boss.flash = 0.12; boss.trem = 0.2;
  score += degats * 5;
  if (boss.pv > 0) {
    ajouterFissures(boss, ix === undefined ? hasard(20, boss.l - 20) : ix, iy === undefined ? boss.h / 2 : iy);
    etincelles(boss.x + (ix === undefined ? boss.l / 2 : ix), boss.y + (iy === undefined ? boss.h / 2 : iy), '#ff80ab', 8);
    Son.frappe(boss.pv / boss.pvMax);
    while (boss.pv <= boss.prochainBonus) { boss.prochainBonus -= boss.pvMax * 0.15; lacherBonus(boss.x + boss.l / 2, boss.y + boss.h, true); }
  } else bossVaincu();
}
function bossVaincu() {
  const b = boss, cx = b.x + b.l / 2, cy = b.y + b.h / 2;
  score += 1000 + niveau * 100;
  for (let i = 0; i < 3; i++) fragmenter(b.x, b.y, b.l, b.h, hasard(20, b.l - 20), hasard(10, b.h - 10), i % 2 ? '#e040fb' : '#ff4081', 1.8);
  explosionEtoiles(cx, cy, '#ffffff', 40);
  for (let i = 0; i < 3; i++) anneaux.push({ x: cx, y: cy, r: 10, v: 300 + i * 160, vie: 0.8, max: 0.8, coul: i ? '#e040fb' : '#ffffff', ep: 10 });
  flash('#ffffff', 0.7); secousse = 22; Son.explosion(true);
  boss = null; orbes = [];
  for (const br of briques) if (br.pv > 0) briser(br, undefined, undefined, true);
  victoireNiveau('🏆', 'BOSS VAINCU !', '+' + (1000 + niveau * 100) + ' points');
}

// =====================================================
//  BOOSTERS : lâcher, attraper, activer
// =====================================================
function lacherBonus(x, y, garanti = false) {
  let chance = mode === 'rush' ? 0.3 : 0.15;
  if (regles.pluie) chance *= 2;
  if (!garanti && Math.random() > chance) return;
  const libre = !effets.dinky && !effets.bryan && !cinematique && !capsules.some(c => c.t.legendaire);
  const pLeg = (garanti ? 0.25 : 0.07) * (regles.legendaire ? 3 : 1);
  const t = libre && Math.random() < pLeg ? (Math.random() < 0.5 ? LEGENDAIRES.dinky : LEGENDAIRES.bryan) : LISTE_BONUS[Math.floor(Math.random() * LISTE_BONUS.length)];
  capsules.push({ x, y, t });
}

function activerBonus(t, x) {
  if (t.legendaire) { lancerCinematique(t.id); return; }
  Son.bonus();
  anneaux.push({ x, y: raquette.y, r: 12, v: 480, vie: 0.6, max: 0.6, coul: t.coul, ep: 5 });
  explosionEtoiles(x, raquette.y, t.coul, 22);
  flash(t.coul, 0.22);
  banniere = { emoji: t.emoji, txt: t.nom, sous: t.sous, coul: t.coul, t: 0, duree: 1.4 };
  if (t.duree) effets[t.id] = t.duree;
  if (t.id === 'multi') ajouterBalles(2, true);
  if (t.id === 'bouclier') bouclier = Math.min(3, bouclier + 1);
}

function lancerCinematique(type) {
  cinematique = { type, t: 0, duree: 2.6 };
  Son.special(type);
  flash(LEGENDAIRES[type].coul, 0.6);
  secousse = 10;
  try { if (navigator.vibrate) navigator.vibrate([60, 40, 140]); } catch (e) {}
}

function activerLegendaire(type) {
  const L = LEGENDAIRES[type];
  effets[type] = L.duree;
  Son.boost(type);
  flash(L.coul, 0.5); secousse = 16;
  anneaux.push({ x: raquette.x, y: raquette.y, r: 20, v: 700, vie: 0.9, max: 0.9, coul: L.coul, ep: 14 });
  explosionEtoiles(raquette.x, raquette.y, L.coul2, 40);
  if (type === 'dinky') {
    ajouterBalles(2, false);
    for (const br of briquesAuHasard(6)) {
      eclairs.push({ x1: raquette.x, y1: raquette.y, x2: br.x + br.l / 2, y2: br.y + br.h / 2, vie: 0.45, max: 0.45, coul: L.coul });
      frapperBrique(br, 3);
    }
    if (boss) { eclairs.push({ x1: raquette.x, y1: raquette.y, x2: boss.x + boss.l / 2, y2: boss.y + boss.h / 2, vie: 0.45, max: 0.45, coul: L.coul2 }); frapperBoss(8); }
    Son.eclair();
  } else {
    nova = { x: raquette.x, y: raquette.y, r: 0, touchees: new Set(), boss: false }; // SUPERNOVA
    Son.nova();
  }
}

function ajouterBalles(nb, depuisToutes) {
  lancerBalles();
  const sources = depuisToutes ? balles.slice() : balles.slice(0, 1), nouvelles = [];
  for (const b of sources) for (let i = 0; i < nb && balles.length + nouvelles.length < 14; i++) {
    const d = (i % 2 ? 1 : -1) * (0.35 + 0.2 * Math.floor(i / 2)), c = Math.cos(d), s = Math.sin(d);
    nouvelles.push({ ...b, trace: [], vx: b.vx * c - b.vy * s, vy: b.vx * s + b.vy * c });
  }
  balles.push(...nouvelles);
}

function lancerBalles() {
  for (const b of balles) if (b.collee) {
    b.collee = false;
    const a = hasard(-0.4, 0.4), v = vitesseBalle();
    b.vx = v * Math.sin(a); b.vy = -v * Math.cos(a);
  }
}

// =====================================================
//  PHYSIQUE DE LA BALLE
// =====================================================
function collisionCercleRect(b, x, y, l, h) {
  const px = limiter(b.x, x, x + l), py = limiter(b.y, y, y + h), dx = b.x - px, dy = b.y - py;
  return dx * dx + dy * dy <= b.r * b.r ? { px, py } : null;
}
function rebondirSurRect(b, x, y, l, h) {
  const chevX = Math.min(b.x + b.r - x, x + l - (b.x - b.r)), chevY = Math.min(b.y + b.r - y, y + h - (b.y - b.r));
  if (chevX < chevY) b.vx = b.x < x + l / 2 ? -Math.abs(b.vx) : Math.abs(b.vx);
  else b.vy = b.y < y + h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy);
}
function degatsBalle() { return effets.bryan ? 4 : effets.feu ? 3 : effets.grosse ? 2 : 1; }

function majBalle(b, dt) {
  b.r += ((effets.grosse || effets.bryan ? 13 : 8) - b.r) * Math.min(1, dt * 10);
  if (b.collee) { b.x = raquette.x; b.y = raquette.y - raquette.h / 2 - b.r; return; }
  const f = effets.lent ? 0.6 : 1, pas = 5, percante = effets.feu || effets.bryan;
  for (let i = 0; i < pas; i++) {    // petits pas : la balle ne traverse jamais une brique par erreur
    b.x += b.vx * dt * f / pas; b.y += b.vy * dt * f / pas;
    if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); Son.mur(); }
    if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx); Son.mur(); }
    if (b.y < HAUT + b.r) { b.y = HAUT + b.r; b.vy = Math.abs(b.vy); Son.mur(); }

    // Raquette : plus la balle touche le bord, plus l'angle est fort
    const rq = raquette;
    if (b.vy > 0 && b.y + b.r >= rq.y - rq.h / 2 && b.y - b.r <= rq.y + rq.h / 2 && b.x >= rq.x - rq.l / 2 - b.r && b.x <= rq.x + rq.l / 2 + b.r) {
      const angle = limiter((b.x - rq.x) / (rq.l / 2), -1, 1) * 1.05, v = vitesseBalle();
      b.vx = v * Math.sin(angle); b.vy = -v * Math.cos(angle);
      b.y = rq.y - rq.h / 2 - b.r;
      toucheRaquette(b);
    }
    // Barrière dorée (Bryan) ou bouclier
    if (b.vy > 0 && b.y + b.r >= H - 14) {
      if (effets.bryan) { b.vy = -Math.abs(b.vy); b.y = H - 14 - b.r; etincelles(b.x, H - 14, '#ffd54f', 8); Son.bouclier(); }
      else if (bouclier > 0) { b.vy = -Math.abs(b.vy); b.y = H - 14 - b.r; bouclier--; anneaux.push({ x: b.x, y: H - 12, r: 6, v: 260, vie: 0.4, max: 0.4, coul: '#a7ffeb', ep: 4 }); Son.bouclier(); }
    }
    // Boss
    if (boss && boss.pv > 0) {
      const c = collisionCercleRect(b, boss.x, boss.y, boss.l, boss.h);
      if (c && !(b.derniere === boss && chrono - b.tDerniere < 0.15)) {
        b.derniere = boss; b.tDerniere = chrono;
        rebondirSurRect(b, boss.x, boss.y, boss.l, boss.h);
        frapperBoss(degatsBalle(), c.px - boss.x, c.py - boss.y);
      }
    }
    // Briques
    for (const br of briques) {
      if (br.pv <= 0) continue;
      const c = collisionCercleRect(b, br.x, br.y, br.l, br.h);
      if (!c || (b.derniere === br && chrono - b.tDerniere < 0.15)) continue;
      b.derniere = br; b.tDerniere = chrono;
      if (!percante) rebondirSurRect(b, br.x, br.y, br.l, br.h);
      frapperBrique(br, degatsBalle(), c.px - br.x, c.py - br.y);
      if (effets.dinky) chaineEclair(br);
      if (!percante) break;
    }
  }
  // Évite les trajectoires presque horizontales (balle coincée)
  const v = Math.hypot(b.vx, b.vy);
  if (Math.abs(b.vy) < v * 0.25) { b.vy = (Math.sign(b.vy) || -1) * v * 0.25; b.vx = (Math.sign(b.vx) || 1) * Math.sqrt(v * v - b.vy * b.vy); }
  b.trace.push({ x: b.x, y: b.y });
  if (b.trace.length > (effets.lent ? 14 : 9)) b.trace.shift();
  if (effets.feu) particules.push({ x: b.x + hasard(-4, 4), y: b.y + hasard(-4, 4), vx: hasard(-20, 20), vy: hasard(-60, -20), vie: 0.4, max: 0.4, coul: Math.random() < 0.5 ? '#ff6e40' : '#ffd740', t: hasard(4, 7), g: -40, lueur: true });
  if (effets.bryan && Math.random() < 0.6) particules.push({ x: b.x, y: b.y, vx: hasard(-30, 30), vy: hasard(-30, 30), vie: 0.6, max: 0.6, coul: '#ffd54f', t: hasard(2, 4), g: 60, lueur: true });
}

function toucheRaquette(b) {
  combo = 0;
  Son.raquette();
  etincelles(b.x, raquette.y - raquette.h / 2, couleurRaquette(), 6);
  if (effets.dinky && chrono - dernierEclairRaquette > 0.35) {   // la raquette électrifiée tire des éclairs
    dernierEclairRaquette = chrono;
    for (const br of briquesAuHasard(2)) { eclairs.push({ x1: b.x, y1: raquette.y, x2: br.x + br.l / 2, y2: br.y + br.h / 2, vie: 0.3, max: 0.3, coul: '#ffea00' }); frapperBrique(br, 3); }
    if (boss) frapperBoss(2);
    Son.eclair();
  }
}
function couleurRaquette() {
  return effets.bryan ? '#ffd54f' : effets.dinky ? '#00e5ff' : effets.feu ? '#ff6e40' : effets.laser ? '#ffee58' : effets.large ? '#40c4ff' : effets.lent ? '#b388ff' : '#4fc3f7';
}

// =====================================================
//  MISE À JOUR (appelée ~60 fois par seconde)
// =====================================================
function majJeu(dtReel) {
  // Cinématique des boosters légendaires : le monde passe au ralenti
  if (cinematique) {
    cinematique.t += dtReel;
    ralenti = 0.1;
    if (cinematique.t >= cinematique.duree) { const type = cinematique.type; cinematique = null; ralenti = 1; activerLegendaire(type); }
  }
  if (banniere) { banniere.t += dtReel; if (banniere.t >= banniere.duree) banniere = null; }
  const dt = dtReel * ralenti;
  chrono += dt;

  if (pauseVictoire > 0) { pauseVictoire -= dtReel; if (pauseVictoire <= 0) niveauSuivant(); return; }

  // Effets à durée limitée
  for (const k in effets) {
    effets[k] -= dt;
    if (effets[k] <= 0) { delete effets[k]; if (k === 'dinky' || k === 'bryan') Son.boost(effets.dinky ? 'dinky' : effets.bryan ? 'bryan' : null); }
  }
  Son.ralenti(!!effets.lent);

  // Modes
  if (mode === 'rush') { tempsRush -= dt; if (tempsRush <= 0) { tempsRush = 0; terminer(true); return; } }
  if (mode === 'invasion') {
    const v = Math.min(7 + chrono * 0.12, 30) * dt;
    for (const br of briques) br.y += v;
    descente += v;
    if (descente >= BH + ESP) { descente -= BH + ESP; ajouterLigneInvasion(Y_BRIQUES - (BH + ESP) + descente); score += 20; }
    if (briques.some(br => br.pv > 0 && br.y + br.h >= raquette.y - 30)) { secousse = 20; flash('#ff1744', 0.5); Son.explosion(true); terminer(false); return; }
  }

  // Raquette
  if (touches.gauche) raquette.cibleX -= 560 * dtReel;
  if (touches.droite) raquette.cibleX += 560 * dtReel;
  raquette.stun = Math.max(0, raquette.stun - dt);
  let cibleL = largeurBase() * (effets.large ? 1.6 : 1) * (effets.bryan ? 1.25 : 1);
  if (raquette.stun > 0) cibleL *= 0.55;
  raquette.l += (cibleL - raquette.l) * Math.min(1, dtReel * 8);
  raquette.cibleX = limiter(raquette.cibleX, raquette.l / 2, W - raquette.l / 2);
  raquette.x += (raquette.cibleX - raquette.x) * Math.min(1, dtReel * 25);

  // Laser
  if (effets.laser) {
    cadenceLaser -= dt;
    if (cadenceLaser <= 0) {
      cadenceLaser = 0.28;
      tirs.push({ x: raquette.x - raquette.l / 2 + 7, y: raquette.y - 10 }, { x: raquette.x + raquette.l / 2 - 7, y: raquette.y - 10 });
      Son.laser();
    }
  }
  for (const t of tirs) {
    t.y -= 600 * dt;
    if (boss && t.x > boss.x && t.x < boss.x + boss.l && t.y > boss.y && t.y < boss.y + boss.h) { frapperBoss(1, t.x - boss.x, boss.h - 2); t.y = -99; continue; }
    for (const o of orbes) if (Math.hypot(o.x - t.x, o.y - t.y) < 12) { o.mort = true; t.y = -99; etincelles(o.x, o.y, '#ea80fc', 8); }
    for (const br of briques) if (br.pv > 0 && t.x > br.x && t.x < br.x + br.l && t.y > br.y && t.y < br.y + br.h) { frapperBrique(br, 1, t.x - br.x, br.h - 2); t.y = -99; break; }
  }
  tirs = tirs.filter(t => t.y > HAUT);

  // Balles
  for (const b of balles) majBalle(b, dt);
  balles = balles.filter(b => b.y - b.r < H);
  if (balles.length === 0) { ballePerdue(); if (etat !== 'jeu') return; }

  // Boosters qui tombent
  for (const c of capsules) {
    c.y += (c.t.legendaire ? 115 : 150) * dt;
    if (c.t.legendaire && Math.random() < 0.5) particules.push({ x: c.x + hasard(-8, 8), y: c.y, vx: hasard(-15, 15), vy: hasard(-40, -10), vie: 0.6, max: 0.6, coul: Math.random() < 0.5 ? c.t.coul : c.t.coul2, t: hasard(2, 4), g: 0, lueur: true });
    if (Math.abs(c.y - raquette.y) < raquette.h / 2 + 14 && Math.abs(c.x - raquette.x) < raquette.l / 2 + 14) { c.prise = true; activerBonus(c.t, c.x); }
  }
  capsules = capsules.filter(c => !c.prise && c.y < H + 30);

  // Boss
  if (boss) {
    boss.t += dt;
    boss.x = W / 2 - boss.l / 2 + Math.sin(boss.t * (0.6 + niveau * 0.01)) * ((W - boss.l) / 2 - 14);
    boss.flash = Math.max(0, boss.flash - dt); boss.trem = Math.max(0, boss.trem - dt);
    boss.tir -= dt;
    if (boss.tir <= 0) {
      boss.tir = Math.max(1.3, 3 - niveau * 0.06);
      const cx = boss.x + boss.l / 2, cy = boss.y + boss.h, dx = raquette.x - cx, dy = raquette.y - cy, d = Math.hypot(dx, dy);
      orbes.push({ x: cx, y: cy, vx: dx / d * 170, vy: dy / d * 170 });
      Son.bossTir();
    }
  }
  for (const o of orbes) {
    o.x += o.vx * dt; o.y += o.vy * dt;
    if (Math.abs(o.y - raquette.y) < raquette.h / 2 + 8 && Math.abs(o.x - raquette.x) < raquette.l / 2 + 8) {
      o.mort = true; raquette.stun = 1.5; secousse = 8; flash('#ff1744', 0.25); etincelles(o.x, o.y, '#ff4081', 14); Son.choc();
    }
  }
  orbes = orbes.filter(o => !o.mort && o.y < H + 20);

  // Supernova (Booster de Bryan) : l'onde fissure tout sur son passage
  if (nova) {
    nova.r += 650 * dt;
    for (const br of briques) {
      if (br.pv <= 0 || nova.touchees.has(br)) continue;
      if (Math.hypot(br.x + br.l / 2 - nova.x, br.y + br.h / 2 - nova.y) < nova.r) { nova.touchees.add(br); frapperBrique(br, Math.max(2, Math.ceil(br.pvMax * 0.6))); }
    }
    if (boss && !nova.boss && Math.hypot(boss.x + boss.l / 2 - nova.x, boss.y + boss.h / 2 - nova.y) < nova.r) { nova.boss = true; frapperBoss(Math.ceil(boss.pvMax * 0.2)); }
    if (nova.r > 950) nova = null;
  }

  briques = briques.filter(b => b.pv > 0);

  // Niveau terminé ?
  if (mode !== 'invasion' && !boss && briques.length === 0 && pauseVictoire <= 0 && etat === 'jeu') {
    const bonus = Math.round(100 * niveau * (mode === 'zen' ? 0.5 : 1));
    score += bonus;
    if (mode === 'rush') tempsRush += 8;
    victoireNiveau('✨', mode === 'defi' ? 'ÉTAPE RÉUSSIE' : 'NIVEAU TERMINÉ', '+' + bonus + ' points' + (mode === 'rush' ? ' · +8 s' : ''));
  }
}

// Effets visuels : ils continuent même pendant l'écran de fin
function majEffets(dt) {
  for (const p of particules) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 1 - dt * 1.5; p.vie -= dt; }
  particules = particules.filter(p => p.vie > 0);
  for (const e of eclats) { e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 520 * dt; e.rot += e.vr * dt; e.vie -= dt; }
  eclats = eclats.filter(e => e.vie > 0);
  for (const a of anneaux) { a.r += a.v * dt; a.vie -= dt; }
  anneaux = anneaux.filter(a => a.vie > 0);
  for (const t of textes) { t.y -= 40 * dt; t.vie -= dt; }
  textes = textes.filter(t => t.vie > 0);
  for (const e of eclairs) e.vie -= dt;
  eclairs = eclairs.filter(e => e.vie > 0);
  for (const f of flashs) f.vie -= dt;
  flashs = flashs.filter(f => f.vie > 0);
  for (const br of briques) { br.flash = Math.max(0, br.flash - dt); br.trem = Math.max(0, br.trem - dt); }
  secousse = Math.max(0, secousse - dt * 30);
}

function ballePerdue() {
  combo = 0;
  if (mode === 'zen') { balles = [nouvelleBalle()]; banniere = { emoji: '🌙', txt: 'RESPIRE…', sous: 'La balle revient, rien n\'est perdu', coul: '#80cbc4', t: 0, duree: 1.4 }; return; }
  if (mode === 'rush') { tempsRush = Math.max(0, tempsRush - 5); textes.push({ x: W / 2, y: H * 0.55, txt: '−5 s', coul: '#ff5252', vie: 1, max: 1, taille: 24 }); balles = [nouvelleBalle()]; Son.perte(); return; }
  vies--;
  Son.perte(); secousse = 10; flash('#ff5252', 0.3);
  try { if (navigator.vibrate) navigator.vibrate(150); } catch (e) {}
  if (vies <= 0) { terminer(false); return; }
  effets = {}; Son.boost(null);
  balles = [nouvelleBalle()];
  banniere = { emoji: '💔', txt: '−1 VIE', sous: vies + ' vie' + (vies > 1 ? 's' : '') + ' restante' + (vies > 1 ? 's' : ''), coul: '#ff6b9d', t: 0, duree: 1.4 };
}

function victoireNiveau(emoji, titre, sous) {
  pauseVictoire = 1.8;
  for (const b of balles) explosionEtoiles(b.x, b.y, '#ffffff', 10);
  balles = []; capsules = []; tirs = []; orbes = [];
  banniere = { emoji, txt: titre, sous, coul: '#69f0ae', t: 0, duree: 1.7 };
  Son.niveau();
}

function niveauSuivant() {
  if (mode === 'aventure' && niveau % 5 === 0) Sauvegarde.ecrire('palier', niveau + 1);  // point de sauvegarde après chaque boss
  if (mode === 'defi' && ++niveauxDefi >= 3) { terminer(true); return; }
  niveau++;
  if (mode === 'aventure' && niveau > Sauvegarde.lire('niveauMax', 1)) Sauvegarde.ecrire('niveauMax', niveau);
  demarrerNiveau();
}

function terminer(gagne) {
  if (etat === 'fin') return;
  etat = 'fin';
  cinematique = null; ralenti = 1;
  Son.boost(null); Son.ralenti(false); Son.fin(gagne);
  const cle = 'record_' + mode, ancien = Sauvegarde.lire(cle, 0), record = score > ancien && score > 0;
  if (record) Sauvegarde.ecrire(cle, score);
  Sauvegarde.ecrire('total_briques', Sauvegarde.lire('total_briques', 0) + brisees);
  let serie = null;
  if (mode === 'defi') {
    const auj = aujourdhui(), s = Sauvegarde.lire('serie', { jour: null, n: 0 });
    if (s.jour !== auj) { s.n = s.jour === aujourdhui(-1) ? s.n + 1 : 1; s.jour = auj; Sauvegarde.ecrire('serie', s); }
    serie = s.n;
    if (score > Sauvegarde.lire('defi_' + auj, -1)) Sauvegarde.ecrire('defi_' + auj, score);
  }
  const resultat = { mode, score, record, ancien, niveau, meilleurCombo, brisees, gagne, serie, chrono };
  setTimeout(() => App.finPartie(resultat), 1100);
}

function mettrePause() { if (etat !== 'jeu') return; etat = 'pause'; Son.pauseMusique(true); App.pause(); }
function reprendre() { etat = 'jeu'; Son.pauseMusique(false); dernier = performance.now(); }

// =====================================================
//  DESSIN
// =====================================================
const etoiles = Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + 0.4, p: Math.random() * 6, v: Math.random() * 1.5 + 0.5 }));
const AMBIANCES = {
  menu:     { c: ['#0a1030', '#131a4a', '#0e3550'], aurores: ['#2ec5d3', '#7b5cff', '#3aa0ff'] },
  aventure: { c: ['#0a1132', '#151a55', '#0c3550'], aurores: ['#29b6f6', '#7c4dff', '#26c6da'] },
  zen:      { c: ['#06192a', '#0b2b3a', '#123f3c'], aurores: ['#26a69a', '#4dd0e1', '#81c784'] },
  rush:     { c: ['#170d2b', '#2a1446', '#4a2340'], aurores: ['#ff7043', '#ec407a', '#ffa726'] },
  invasion: { c: ['#100a26', '#22103b', '#3a0e2e'], aurores: ['#ab47bc', '#ef5350', '#7e57c2'] },
  defi:     { c: ['#0e1430', '#1d2050', '#3a3218'], aurores: ['#ffca28', '#42a5f5', '#ffb74d'] },
  boss:     { c: ['#130a24', '#280e3c', '#3c0c29'], aurores: ['#d500f9', '#ff1744', '#651fff'] },
};
const cacheCiel = {};
function ciel(nom) {
  if (!cacheCiel[nom]) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), a = AMBIANCES[nom], lg = g.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0, a.c[0]); lg.addColorStop(0.55, a.c[1]); lg.addColorStop(1, a.c[2]);
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    cacheCiel[nom] = c;
  }
  return cacheCiel[nom];
}

function dessinerFond() {
  const nom = etat === 'menu' ? 'menu' : boss ? 'boss' : mode, a = AMBIANCES[nom], t = tempsGlobal;
  ctx.drawImage(ciel(nom), 0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {   // aurores : grandes lumières douces qui dérivent lentement
    const x = W * (0.15 + 0.35 * i) + Math.sin(t * 0.08 + i * 2.1) * 90;
    const y = H * (0.2 + 0.25 * i) + Math.cos(t * 0.06 + i * 1.3) * 70;
    dessinerHalo(a.aurores[i], x, y, 240, 0.2, true);
  }
  for (const e of etoiles) {
    ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.3 * (1 + Math.sin(t * e.v + e.p)) / 2})`;
    ctx.fillRect(e.x, (e.y + t * e.v * 4) % H, e.r, e.r);
  }
  if (effets.bryan) dessinerHalo('#ffb300', W / 2, H, 300, 0.35, true);
  if (effets.dinky && Math.random() < 0.03) { ctx.fillStyle = 'rgba(128,216,255,0.08)'; ctx.fillRect(0, 0, W, H); }
  ctx.globalCompositeOperation = 'source-over';
}

function dessinerBrique(br) {
  const k = limiter(br.pv / br.pvMax, 0, 1), h = teinteBrique(br);
  const s = br.type === 'cristal' ? 75 : 25 + 62 * k, l = br.type === 'cristal' ? 70 : 70 - 18 * k;
  let x = br.x, y = br.y;
  if (br.trem > 0) { const f = br.trem / 0.18 * 2.5; x += hasard(-f, f); y += hasard(-f, f); }
  const g = ctx.createLinearGradient(0, y, 0, y + br.h);
  g.addColorStop(0, `hsl(${h},${s}%,${l + 14}%)`);
  g.addColorStop(1, `hsl(${h},${s}%,${l - 10}%)`);
  ctx.fillStyle = g; rr(x, y, br.l, br.h, 5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; rr(x + 3, y + 2, br.l - 6, br.h * 0.3, 3); ctx.fill();   // reflet de verre
  if (br.fissures.length) { ctx.save(); rr(x, y, br.l, br.h, 5); ctx.clip(); dessinerFissures(br, x, y, k, h); ctx.restore(); }
  if (k < 0.3 && br.pvMax > 1) { ctx.fillStyle = `rgba(255,255,255,${0.08 + 0.08 * Math.sin(tempsGlobal * 12 + br.x)})`; rr(x, y, br.l, br.h, 5); ctx.fill(); }
  if (br.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${br.flash / 0.12 * 0.65})`; rr(x, y, br.l, br.h, 5); ctx.fill(); }
  ctx.strokeStyle = `hsla(${h},90%,85%,${0.25 + 0.45 * k})`; ctx.lineWidth = 1; rr(x + 0.5, y + 0.5, br.l - 1, br.h - 1, 5); ctx.stroke();
  if (br.type === 'bombe') {
    ctx.globalCompositeOperation = 'lighter';
    dessinerHalo('#ff7043', x + br.l / 2, y + br.h / 2, 14 + 3 * Math.sin(tempsGlobal * 8), 0.9);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#3e1200'; ctx.font = `bold 13px ${EMOJI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✹', x + br.l / 2, y + br.h / 2 + 1);
  }
  if (br.type === 'cristal') {
    ctx.globalCompositeOperation = 'lighter';
    dessinerHalo('#ffffff', x + (tempsGlobal * 30 + br.y * 3) % br.l, y + br.h * 0.35, 7, 0.8);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (br.pvMax >= 3 && br.type === 'normal') {   // petits points = résistance restante
    const n = Math.min(br.pv, 10), cx = x + br.l / 2 - (n - 1) * 2;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < n; i++) ctx.fillRect(cx + i * 4 - 0.75, y + br.h - 4.5, 1.6, 1.6);
  }
}

function dessinerFissures(br, x, y, k, h) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const f of br.fissures) {
    ctx.beginPath(); ctx.moveTo(x + f.pts[0][0], y + f.pts[0][1]);
    for (let i = 1; i < f.pts.length; i++) ctx.lineTo(x + f.pts[i][0], y + f.pts[i][1]);
    ctx.strokeStyle = 'rgba(8,10,30,0.75)'; ctx.lineWidth = f.ep; ctx.stroke();
    if (k < 0.6) { ctx.strokeStyle = `hsla(${h},100%,88%,${(0.6 - k) * 1.3})`; ctx.lineWidth = Math.max(0.6, f.ep * 0.4); ctx.stroke(); }  // la lumière filtre par les fissures
  }
}

function dessinerBoss() {
  const b = boss, k = limiter(b.pv / b.pvMax, 0, 1);
  let x = b.x, y = b.y;
  if (b.trem > 0) { x += hasard(-3, 3); y += hasard(-3, 3); }
  const cx = x + b.l / 2, cy = y + b.h / 2;
  ctx.globalCompositeOperation = 'lighter';
  dessinerHalo('#d500f9', cx, cy, 130 + 10 * Math.sin(tempsGlobal * 3), 0.35, true);
  ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createLinearGradient(x, y, x + b.l, y + b.h);
  g.addColorStop(0, `hsl(280,${30 + 50 * k}%,${38 + (1 - k) * 15}%)`);
  g.addColorStop(1, `hsl(325,${30 + 50 * k}%,${30 + (1 - k) * 15}%)`);
  ctx.fillStyle = g; rr(x, y, b.l, b.h, 12); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; rr(x + 6, y + 4, b.l - 12, b.h * 0.3, 8); ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  dessinerHalo('#ff4081', cx, cy, 26 + 6 * Math.sin(tempsGlobal * 6) + (1 - k) * 16, 0.95);
  ctx.globalCompositeOperation = 'source-over';
  if (b.fissures.length) { ctx.save(); rr(x, y, b.l, b.h, 12); ctx.clip(); dessinerFissures(b, x, y, k, 320); ctx.restore(); }
  if (b.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${b.flash / 0.12 * 0.5})`; rr(x, y, b.l, b.h, 12); ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,128,171,0.7)'; ctx.lineWidth = 2; rr(x, y, b.l, b.h, 12); ctx.stroke();
}

function dessinerCapsule(c) {
  const L = c.t.legendaire, r = L ? 17 : 14;
  ctx.globalCompositeOperation = 'lighter';
  dessinerHalo(c.t.coul, c.x, c.y, L ? 36 + 5 * Math.sin(tempsGlobal * 8) : 24, L ? 0.9 : 0.6);
  if (L) {
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(tempsGlobal * 2);
    ctx.fillStyle = c.t.coul2; ctx.globalAlpha = 0.5;
    for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(40, 0); ctx.lineTo(0, 3); ctx.fill(); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(10,14,40,0.85)'; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, 6.283); ctx.fill();
  ctx.strokeStyle = c.t.coul; ctx.lineWidth = 2; ctx.stroke();
  ctx.font = `${L ? 19 : 15}px ${EMOJI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(c.t.emoji, c.x, c.y + 1);
}

function dessinerRaquette() {
  const r = raquette, x = r.x - r.l / 2, y = r.y - r.h / 2, coul = couleurRaquette();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.5; ctx.drawImage(halo(coul, true), x - 24, y - 26, r.l + 48, r.h + 52); ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createLinearGradient(0, y, 0, y + r.h);
  g.addColorStop(0, '#5b6fa8'); g.addColorStop(0.5, '#27325e'); g.addColorStop(1, '#141a33');
  ctx.fillStyle = g; rr(x, y, r.l, r.h, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; rr(x + 4, y + 1.5, r.l - 8, 2.5, 2); ctx.fill();
  ctx.fillStyle = coul; rr(r.x - r.l * 0.32, r.y - 2, r.l * 0.64, 4, 2); ctx.fill();          // bande lumineuse
  ctx.fillStyle = '#ffffff'; rr(r.x - r.l * 0.12, r.y - 1, r.l * 0.24, 2, 1); ctx.fill();
  ctx.fillStyle = coul; ctx.globalAlpha = 0.8; rr(x, y + 3, 5, r.h - 6, 2); ctx.fill(); rr(x + r.l - 5, y + 3, 5, r.h - 6, 2); ctx.fill(); ctx.globalAlpha = 1;
  if (effets.laser) { ctx.fillStyle = '#ffee58'; ctx.fillRect(x + 5, y - 6, 4, 6); ctx.fillRect(x + r.l - 9, y - 6, 4, 6); }
  if (r.stun > 0 && Math.floor(tempsGlobal * 16) % 2) { ctx.fillStyle = 'rgba(255,23,68,0.6)'; rr(x, y, r.l, r.h, 7); ctx.fill(); }
  if (effets.dinky) for (let i = 0; i < 2; i++) eclairDessin(x + hasard(0, r.l), y - hasard(4, 18), x + hasard(0, r.l), y + r.h, '#80d8ff', 0.8, 5);
}

function dessinerBalles() {
  const coul = effets.bryan ? '#ffd54f' : effets.dinky ? '#80d8ff' : effets.feu ? '#ff9e40' : effets.grosse ? '#ffcc80' : effets.lent ? '#d1c4e9' : '#b3e5fc';
  ctx.globalCompositeOperation = 'lighter';
  for (const b of balles) {
    for (let i = 0; i < b.trace.length; i++) { const p = b.trace[i], f = (i + 1) / b.trace.length; dessinerHalo(coul, p.x, p.y, b.r * 1.6 * f, 0.35 * f); }
    dessinerHalo(coul, b.x, b.y, b.r * 3.2, 0.55);
  }
  ctx.globalCompositeOperation = 'source-over';
  for (const b of balles) {
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
    ctx.strokeStyle = coul; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 1, 0, 6.283); ctx.stroke();
    if (effets.bryan) { ctx.font = `${b.r}px ${EMOJI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👑', b.x, b.y + 1); }
  }
}

// Un éclair : une ligne en zigzag redessinée à chaque image (ça scintille)
function eclairDessin(x1, y1, x2, y2, coul, alpha, ampli = 10) {
  const n = 8, dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
  ctx.beginPath(); ctx.moveTo(x1, y1);
  for (let i = 1; i < n; i++) { const o = hasard(-ampli, ampli); ctx.lineTo(x1 + dx * i / n + nx * o, y1 + dy * i / n + ny * o); }
  ctx.lineTo(x2, y2);
  ctx.globalAlpha = alpha; ctx.strokeStyle = coul; ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = 1;
}

function dessinerEffets() {
  ctx.globalCompositeOperation = 'lighter';
  for (const t of tirs) { dessinerHalo('#ffee58', t.x, t.y, 10, 0.6); ctx.fillStyle = '#fffde7'; ctx.fillRect(t.x - 1.5, t.y - 9, 3, 12); }
  for (const o of orbes) { dessinerHalo('#ea80fc', o.x, o.y, 18, 0.9); }
  for (const e of eclairs) eclairDessin(e.x1, e.y1, e.x2, e.y2, e.coul, e.vie / e.max, 12);
  if (nova) {
    ctx.globalAlpha = Math.max(0, 1 - nova.r / 950);
    ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(nova.x, nova.y, nova.r, 0, 6.283); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.stroke(); ctx.globalAlpha = 1;
  }
  for (const a of anneaux) {
    ctx.globalAlpha = a.vie / a.max; ctx.strokeStyle = a.coul; ctx.lineWidth = a.ep * a.vie / a.max + 1;
    ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const p of particules) {
    const al = p.vie / p.max;
    if (p.lueur) dessinerHalo(p.coul, p.x, p.y, p.t, al);
    else { ctx.globalAlpha = al; ctx.fillStyle = p.coul; ctx.fillRect(p.x - p.t / 2, p.y - p.t / 2, p.t, p.t); }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  for (const e of eclats) {   // éclats de verre en rotation
    const c = Math.cos(e.rot), s = Math.sin(e.rot);
    ctx.globalAlpha = Math.min(1, e.vie / e.max * 1.5);
    ctx.fillStyle = e.coul; ctx.beginPath();
    e.pts.forEach(([px, py], i) => { const X = e.x + px * c - py * s, Y = e.y + px * s + py * c; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.7; ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t of textes) {
    ctx.globalAlpha = Math.min(1, t.vie / t.max * 1.5);
    ctx.font = `700 ${t.taille}px ${POLICE}`; ctx.fillStyle = t.coul; ctx.fillText(t.txt, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

function dessinerBarrieres() {
  if (effets.bryan) {
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 0, W, 0), d = (tempsGlobal * 0.5) % 1;
    g.addColorStop(0, '#ff8f00'); g.addColorStop(d, '#fff8e1'); g.addColorStop(1, '#ff8f00');
    ctx.fillStyle = g; ctx.fillRect(0, H - 14, W, 3);
    dessinerHalo('#ffd54f', W / 2, H - 12, 200, 0.25, true);
    ctx.globalCompositeOperation = 'source-over';
  } else if (bouclier > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(167,255,235,${0.5 + 0.3 * Math.sin(tempsGlobal * 6)})`; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) { const yy = H - 12 + Math.sin(x * 0.08 + tempsGlobal * 5) * 2; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }
    ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
  }
  if (mode === 'invasion' && etat !== 'menu') {
    const lim = raquette.y - 30, proche = briques.reduce((m, b) => Math.max(m, b.y + b.h), 0);
    const danger = limiter(1 - (lim - proche) / 150, 0, 1);
    ctx.setLineDash([8, 8]); ctx.strokeStyle = `rgba(255,82,82,${0.2 + danger * 0.6 * (0.6 + 0.4 * Math.sin(tempsGlobal * 10))})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, lim); ctx.lineTo(W, lim); ctx.stroke(); ctx.setLineDash([]);
  }
}

function dessinerHUD() {
  ctx.fillStyle = 'rgba(4,8,28,0.55)'; ctx.fillRect(0, 0, W, HAUT - 4);
  const lg = ctx.createLinearGradient(0, 0, W, 0);
  lg.addColorStop(0, 'rgba(64,196,255,0)'); lg.addColorStop(0.5, 'rgba(64,196,255,0.6)'); lg.addColorStop(1, 'rgba(124,77,255,0)');
  ctx.fillStyle = lg; ctx.fillRect(0, HAUT - 4, W, 1.5);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(180,210,255,0.6)'; ctx.font = `600 9px ${POLICE}`; ctx.fillText('SCORE', 14, 15);
  ctx.fillStyle = effets.bryan ? '#ffd54f' : '#ffffff'; ctx.font = `700 19px ${POLICE}`; ctx.fillText(score.toLocaleString('fr-FR'), 14, 35);

  let lab, val, rouge = false;
  if (mode === 'aventure') { lab = boss ? 'BOSS' : 'NIVEAU'; val = niveau; }
  else if (mode === 'defi') { lab = 'DÉFI'; val = Math.min(niveauxDefi + 1, 3) + '/3'; }
  else if (mode === 'zen') { lab = 'BRIQUES'; val = brisees; }
  else if (mode === 'rush') { lab = 'TEMPS'; val = Math.ceil(tempsRush) + ' s'; rouge = tempsRush < 10; }
  else { lab = 'SURVIE'; const s = Math.floor(chrono); val = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(180,210,255,0.6)'; ctx.font = `600 9px ${POLICE}`; ctx.fillText(lab, W / 2, 15);
  ctx.fillStyle = rouge && Math.floor(tempsGlobal * 4) % 2 ? '#ff5252' : '#ffffff'; ctx.font = `700 19px ${POLICE}`; ctx.fillText(val, W / 2, 35);

  // vies
  ctx.textAlign = 'right';
  if (vies === Infinity) { ctx.fillStyle = '#80deea'; ctx.font = `700 22px ${POLICE}`; ctx.fillText('∞', W - 54, 30); }
  else { const max = MODES[mode].vies; ctx.font = `18px ${EMOJI}`; for (let i = 0; i < max; i++) { ctx.fillStyle = i < vies ? '#ff6b9d' : 'rgba(255,255,255,0.15)'; ctx.fillText('♥', W - 54 - (max - 1 - i) * 18, 30); } }
  // bouton pause
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(W - 26, 29, 15, 0, 6.283); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(W - 31, 23, 3.5, 12); ctx.fillRect(W - 24.5, 23, 3.5, 12);

  // boosters actifs
  let ex = 10;
  const pastille = (emoji, frac, coul) => {
    ctx.fillStyle = 'rgba(4,8,28,0.6)'; rr(ex, HAUT + 2, 54, 18, 9); ctx.fill();
    ctx.font = `11px ${EMOJI}`; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(emoji, ex + 5, HAUT + 11.5);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(ex + 22, HAUT + 9.5, 26, 3);
    ctx.fillStyle = coul; ctx.fillRect(ex + 22, HAUT + 9.5, 26 * frac, 3);
    ex += 58;
  };
  for (const k in effets) { const d = BONUS[k] || LEGENDAIRES[k]; pastille(d.emoji, effets[k] / d.duree, d.coul); }
  if (bouclier > 0) pastille('🛡️', bouclier / 3, '#a7ffeb');
  const m = multiplicateur();
  if (m > 1) {
    ctx.textAlign = 'right'; ctx.font = `700 13px ${POLICE}`; ctx.fillStyle = effets.bryan ? '#ffd54f' : '#ffab40';
    ctx.fillText('×' + (Math.round(m * 100) / 100), W - 12, HAUT + 12);
  }
  // barre de vie du boss
  if (boss) {
    const y = HAUT + 28;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; rr(40, y, W - 80, 7, 4); ctx.fill();
    const g = ctx.createLinearGradient(40, 0, W - 40, 0); g.addColorStop(0, '#ff4081'); g.addColorStop(1, '#d500f9');
    ctx.fillStyle = g; rr(40, y, (W - 80) * limiter(boss.pv / boss.pvMax, 0, 1), 7, 4); ctx.fill();
    ctx.font = `600 8px ${POLICE}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText('NOYAU STELLAIRE', W / 2, y + 16);
  }
  // combo + aide en bas
  ctx.textAlign = 'center';
  if (combo >= 3) {
    ctx.globalAlpha = 0.85 + 0.15 * Math.sin(tempsGlobal * 10);
    ctx.font = `700 14px ${POLICE}`; ctx.fillStyle = `hsl(${(180 + combo * 12) % 360},90%,70%)`;
    ctx.fillText('COMBO ×' + combo, W / 2, raquette.y + 44); ctx.globalAlpha = 1;
  } else if (balles.some(b => b.collee) && !cinematique && pauseVictoire <= 0) {
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(tempsGlobal * 4);
    ctx.font = `500 12px ${POLICE}`; ctx.fillStyle = '#e1f5fe';
    ctx.fillText('Touche l\'écran pour lancer', W / 2, raquette.y + 44); ctx.globalAlpha = 1;
  }
}

function dessinerBanniere() {
  const b = banniere, p = b.t / b.duree, ent = Math.min(1, b.t / 0.35), sortie = p > 0.75 ? (p - 0.75) / 0.25 : 0;
  const sc = easeOutBack(ent), y = H * 0.47 - sortie * 30;
  ctx.globalAlpha = 1 - sortie;
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(4,8,30,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, y - 52, W, 104);
  const lx = -W + ent * W * 2;  // trait de lumière qui balaie la bannière
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = b.coul; ctx.fillRect(lx, y - 52, W, 1.5); ctx.fillRect(W - lx - W, y + 51, W, 1.5);
  dessinerHalo(b.coul, W / 2, y + 12, 140 * sc, 0.25, true);
  ctx.globalCompositeOperation = 'source-over';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (b.emoji) { ctx.font = `${Math.round(34 * sc)}px ${EMOJI}`; ctx.fillText(b.emoji, W / 2, y - 22); }
  ctx.save(); ctx.translate(W / 2, y + 14); ctx.scale(sc, sc);
  espacement(3);
  ctx.font = `900 25px ${POLICE}`; ctx.shadowColor = b.coul; ctx.shadowBlur = 16; ctx.fillStyle = '#ffffff';
  ctx.fillText(b.txt, 0, 0); ctx.shadowBlur = 0; espacement(0);
  ctx.restore();
  if (b.sous) { ctx.font = `500 12px ${POLICE}`; ctx.fillStyle = b.coul; ctx.fillText(b.sous, W / 2, y + 40); }
  ctx.globalAlpha = 1;
}

// La grande scène des boosters légendaires
function dessinerCinematique() {
  const c = cinematique, L = LEGENDAIRES[c.type], t = c.t, d = c.duree;
  const a = Math.min(1, t / 0.25) * (t > d - 0.35 ? Math.max(0, 1 - (t - (d - 0.35)) / 0.35) : 1);
  const cx = W / 2, cy = H * 0.38;
  ctx.globalAlpha = a; ctx.fillStyle = 'rgba(3,4,15,0.78)'; ctx.fillRect(0, 0, W, H);
  // rayons de lumière qui tournent
  ctx.globalCompositeOperation = 'lighter';
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.7);
  for (let i = 0; i < 16; i++) {
    ctx.rotate(Math.PI / 8); ctx.fillStyle = i % 2 ? L.coul : L.coul2; ctx.globalAlpha = 0.14 * a;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(560, -40); ctx.lineTo(560, 40); ctx.fill();
  }
  ctx.restore();
  dessinerHalo(L.coul, cx, cy, 170 + 15 * Math.sin(t * 6), 0.8 * a);
  // décor propre à chaque booster
  if (c.type === 'dinky') {
    for (let i = 0; i < 3; i++) if (Math.random() < 0.5) eclairDessin(hasard(0, W), 0, cx + hasard(-40, 40), cy + hasard(-40, 40), i % 2 ? L.coul : L.coul2, a, 22);
  } else {
    for (let i = 0; i < 18; i++) { const px = (i * 97 + t * 40) % W, py = ((i * 53) + t * 160 * (1 + i % 3)) % H; dessinerHalo(i % 2 ? '#ffd54f' : '#ff80ab', px, py, 7, a); }
  }
  for (let i = 0; i < 10; i++) { const an = t * 2 + i * 0.628, rr2 = 95 + 10 * Math.sin(t * 4 + i); dessinerHalo(i % 2 ? L.coul : L.coul2, cx + Math.cos(an) * rr2, cy + Math.sin(an) * rr2, 9, a); }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = a;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // emoji géant qui "explose" à l'écran
  const pop = easeOutBack(Math.min(1, t / 0.5)) * (1 + 0.05 * Math.sin(t * 10));
  ctx.font = `${Math.max(1, Math.round(104 * pop))}px ${EMOJI}`; ctx.fillText(L.emoji, cx, cy);
  if (c.type === 'dinky') { ctx.font = `${Math.max(1, Math.round(40 * pop))}px ${EMOJI}`; ctx.fillText('⚡', cx - 70, cy - 45); ctx.fillText('⚡', cx + 72, cy + 40); }
  else { ctx.font = `${Math.max(1, Math.round(36 * pop))}px ${EMOJI}`; ctx.fillText('🔥', cx - 72, cy + 38); ctx.fillText('✨', cx + 70, cy - 42); }
  // petit titre
  if (t > 0.25) {
    ctx.globalAlpha = a * Math.min(1, (t - 0.25) / 0.3);
    espacement(5); ctx.font = `600 13px ${POLICE}`; ctx.fillStyle = L.coul2; ctx.fillText(L.label, cx, cy + 86); espacement(0);
  }
  // grand titre : les lettres tombent une par une
  ctx.font = `900 44px ${POLICE}`;
  const lettres = [...L.titre], largeurs = lettres.map(l => ctx.measureText(l).width + 3), total = largeurs.reduce((s, v) => s + v, 0);
  const zoom = Math.min(1, (W - 30) / total);
  let x = cx - total * zoom / 2;
  const grad = ctx.createLinearGradient(cx - total / 2, 0, cx + total / 2, 0), dec = (t * 0.6) % 1;
  grad.addColorStop(0, L.coul); grad.addColorStop(dec, '#ffffff'); grad.addColorStop(1, L.coul2);
  lettres.forEach((l, i) => {
    const ti = t - 0.35 - i * 0.06;
    if (ti > 0) {
      const p = Math.min(1, ti / 0.3);
      ctx.save(); ctx.globalAlpha = a * p; ctx.translate(x + largeurs[i] * zoom / 2, cy + 128 - (1 - easeOutBack(p)) * 40); ctx.scale(zoom, zoom);
      ctx.shadowColor = L.coul; ctx.shadowBlur = 22; ctx.fillStyle = grad; ctx.fillText(l, 0, 0);
      ctx.restore();
    }
    x += largeurs[i] * zoom;
  });
  // sous-titres
  if (t > 0.9) {
    ctx.globalAlpha = a * Math.min(1, (t - 0.9) / 0.3);
    ctx.font = `700 15px ${POLICE}`; ctx.fillStyle = '#ffffff'; ctx.fillText(L.sous, cx, cy + 176);
    ctx.font = `500 12px ${POLICE}`; ctx.fillStyle = L.coul; ctx.fillText(L.ligne, cx, cy + 200);
  }
  ctx.globalAlpha = 1;
}

function dessiner() {
  dessinerFond();
  if (etat === 'menu') return;
  ctx.save();
  if (secousse > 0) ctx.translate(hasard(-secousse, secousse) * 0.5, hasard(-secousse, secousse) * 0.5);
  dessinerBarrieres();
  for (const br of briques) if (br.pv > 0) dessinerBrique(br);
  if (boss) dessinerBoss();
  for (const c of capsules) dessinerCapsule(c);
  dessinerRaquette();
  dessinerBalles();
  dessinerEffets();
  ctx.restore();
  if (effets.lent) { ctx.fillStyle = 'rgba(124,77,255,0.08)'; ctx.fillRect(0, 0, W, H); }
  for (const f of flashs) { ctx.globalAlpha = f.a * f.vie / f.max; ctx.fillStyle = f.coul; ctx.fillRect(0, 0, W, H); }
  ctx.globalAlpha = 1;
  dessinerHUD();
  if (banniere && !cinematique) dessinerBanniere();
  if (cinematique) dessinerCinematique();
}

// =====================================================
//  BOUCLE DE JEU
// =====================================================
let dernier = performance.now();
function boucle(t) {
  const dt = Math.min((t - dernier) / 1000, 0.033);
  dernier = t;
  tempsGlobal += dt;
  if (!document.body.classList.contains('vitrine-active')) {
    if (etat === 'jeu') majJeu(dt);
    if (etat === 'jeu' || etat === 'fin') majEffets(dt * (etat === 'jeu' ? ralenti : 1));
    dessiner();
  }
  requestAnimationFrame(boucle);
}
requestAnimationFrame(boucle);

// =====================================================
//  CONTRÔLES
// =====================================================
let doigtPose = false;
const versX = cx => (cx - canvas.getBoundingClientRect().left) / echelle;
const versY = cy => (cy - canvas.getBoundingClientRect().top) / echelle;
function deplacerRaquette(x) { raquette.cibleX = regles.miroir ? W - x : x; }

canvas.addEventListener('pointerdown', e => {
  if (etat !== 'jeu') return;
  const x = versX(e.clientX), y = versY(e.clientY);
  if (x > W - 52 && y < HAUT) { mettrePause(); return; }
  doigtPose = true; deplacerRaquette(x);
  if (!cinematique && pauseVictoire <= 0) lancerBalles();
});
canvas.addEventListener('pointermove', e => { if (etat === 'jeu' && (doigtPose || e.pointerType === 'mouse')) deplacerRaquette(versX(e.clientX)); });
window.addEventListener('pointerup', () => { doigtPose = false; });
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') touches.gauche = true;
  if (e.key === 'ArrowRight') touches.droite = true;
  if (e.key === ' ' && etat === 'jeu' && !cinematique) lancerBalles();
  if ((e.key === 'p' || e.key === 'Escape') && etat === 'jeu') mettrePause();
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') touches.gauche = false;
  if (e.key === 'ArrowRight') touches.droite = false;
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { mettrePause(); Son.suspendre(); } else Son.relancer();
});
