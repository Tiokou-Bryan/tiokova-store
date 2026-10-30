// =====================================================
//  NOVA BREAK — app.js
//  Menus, écrans, installation, page de présentation
//  et section « Nous soutenir ».
// =====================================================

// 👉 À PERSONNALISER : ton numéro Orange Money
const SOUTIEN = { numero: '657 15 97 93', nom: 'Vanelle Maheva' };
const CONTACT = 'jiepnoub@gmail.com';

const ecran = document.getElementById('ecran');
const modale = document.getElementById('modale');
const fmt = n => Number(n).toLocaleString('fr-FR');

function montrerEcran(html) { ecran.innerHTML = html; ecran.classList.remove('cache'); ecran.scrollTop = 0; }
function cacherEcran() { ecran.classList.add('cache'); }
function ouvrirModale(html) { modale.innerHTML = `<div class="carte-modale">${html}</div>`; modale.classList.remove('cache'); }
function fermerModale() { modale.classList.add('cache'); }

function serieActuelle() {
  const s = Sauvegarde.lire('serie', { jour: null, n: 0 });
  return s.jour === aujourdhui() || s.jour === aujourdhui(-1) ? s.n : 0;
}

const App = {
  menu() {
    etat = 'menu';
    Son.pauseMusique(false);
    Son.jouerTheme('menu');
    const palier = Sauvegarde.lire('palier', 1);
    const d = defiDuJour();
    const meilleurJour = Sauvegarde.lire('defi_' + d.date, null);
    const serie = serieActuelle();
    const carte = (m, sous, droite) => `
      <button class="mode m-${m}" data-action="jouer" data-mode="${m}">
        <span class="mode-emoji">${MODES[m].emoji}</span>
        <span class="mode-texte"><b>${MODES[m].nom}</b><small>${sous}</small></span>
        <span class="mode-record">${droite}</span>
      </button>`;
    montrerEcran(`
      <div class="menu">
        <img class="logo" src="icon-192.png" alt="NOVA BREAK">
        <h1 class="titre">NOVA BREAK</h1>
        <p class="slogan">Casse. Respire. Recommence.</p>
        <div class="serie ${serie ? 'active' : ''}">🔥 Série : <b>${serie}</b> jour${serie > 1 ? 's' : ''}</div>
        <div class="modes">
          ${carte('aventure', palier > 1 ? 'Reprendre au niveau ' + palier : 'Niveaux sans fin · un boss tous les 5', '🏆 ' + fmt(Sauvegarde.lire('record_aventure', 0)))}
          ${carte('defi', d.mods.map(m => m.nom).join(' · '), meilleurJour !== null ? '✅ ' + fmt(meilleurJour) : '<i>NOUVEAU</i>')}
          ${carte('zen', 'Aucune défaite. Juste du calme.', '🌙')}
          ${carte('rush', '60 secondes. Casse tout.', '🏆 ' + fmt(Sauvegarde.lire('record_rush', 0)))}
          ${carte('invasion', 'Les briques descendent vers toi…', '🏆 ' + fmt(Sauvegarde.lire('record_invasion', 0)))}
        </div>
        <div class="barre">
          <button class="rond" data-action="musique" aria-label="Musique">${Son.musiqueOn() ? '🎵' : '🔇'}</button>
          <button class="rond" data-action="sons" aria-label="Sons">${Son.sonsOn() ? '🔊' : '🔈'}</button>
          <button class="rond" data-action="aide" aria-label="Aide">❓</button>
          <button class="btn-soutien" data-action="soutien">💙 Nous soutenir</button>
        </div>
        <p class="signature">${fmt(Sauvegarde.lire('total_briques', 0))} briques brisées au total · TIOKOVA STORE</p>
      </div>`);
  },

  pause() {
    montrerEcran(`
      <div class="panneau">
        <div class="gros-emoji">⏸️</div>
        <h2>PAUSE</h2>
        <button class="btn" data-action="reprendre">▶ Reprendre</button>
        <button class="btn sec" data-action="recommencer">↺ Recommencer</button>
        ${mode === 'zen' ? '<button class="btn sec" data-action="terminer">🌙 Terminer la session</button>' : ''}
        <button class="btn sec" data-action="menu">⌂ Menu</button>
        <div class="barre">
          <button class="rond" data-action="musique">${Son.musiqueOn() ? '🎵' : '🔇'}</button>
          <button class="rond" data-action="sons">${Son.sonsOn() ? '🔊' : '🔈'}</button>
        </div>
      </div>`);
  },

  finPartie(r) {
    const titres = { aventure: 'PARTIE TERMINÉE', defi: r.gagne ? 'DÉFI RÉUSSI !' : 'DÉFI TERMINÉ', zen: 'BELLE SESSION', rush: 'TEMPS ÉCOULÉ !', invasion: 'ILS SONT ARRIVÉS !' };
    const emoji = r.record ? '🏆' : r.gagne ? '🌟' : r.mode === 'zen' ? '🌙' : '💫';
    const stats = [];
    if (r.mode === 'aventure') stats.push(['Niveau atteint', r.niveau]);
    if (r.mode === 'invasion') stats.push(['Temps de survie', Math.floor(r.chrono / 60) + ':' + String(Math.floor(r.chrono) % 60).padStart(2, '0')]);
    stats.push(['Briques brisées', fmt(r.brisees)], ['Meilleur combo', '×' + r.meilleurCombo]);
    if (r.serie) stats.push(['Série de jours', '🔥 ' + r.serie]);
    montrerEcran(`
      <div class="panneau fin">
        <div class="gros-emoji">${emoji}</div>
        <h2>${titres[r.mode]}</h2>
        <div class="score-final">${fmt(r.score)}</div>
        ${r.record ? '<div class="badge-record">✨ NOUVEAU RECORD ✨</div>' : `<p class="petit">Record : ${fmt(Math.max(r.ancien, r.score))}</p>`}
        <div class="stats">${stats.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('')}</div>
        <button class="btn" data-action="rejouer">↺ Rejouer</button>
        <button class="btn sec" data-action="menu">⌂ Menu</button>
        <button class="lien" data-action="soutien">💙 Tu aimes NOVA BREAK ? Soutiens-nous</button>
      </div>`);
    Son.pauseMusique(false);
    Son.jouerTheme('menu');
  },
};

function htmlAide() {
  return `
    <h2>Comment jouer</h2>
    <p>Glisse ton doigt pour bouger la raquette, touche l'écran pour lancer la balle. Plus la balle touche le <b>bord</b> de la raquette, plus elle part en biais.</p>
    <h3>💎 Les briques</h3>
    <p>Chaque coup les fissure et les fait pâlir, jusqu'à la rupture. Les petits points blancs = résistance restante. <b>✹</b> = brique explosive. Les briques <b>arc-en-ciel</b> lâchent toujours un booster.</p>
    <h3>🚀 Boosters</h3>
    <ul class="liste-bonus">${LISTE_BONUS.map(b => `<li><span>${b.emoji}</span><div><b>${b.nom}</b><small>${b.sous}</small></div></li>`).join('')}</ul>
    <h3>👑 Boosters légendaires (très rares)</h3>
    <ul class="liste-bonus legend">
      <li><span>😎</span><div><b>BOOSTER DINKY BOY</b><small>Tempête électrique : chaque impact déclenche des éclairs en chaîne, ta raquette foudroie les briques, +2 balles, points ×2.</small></div></li>
      <li><span>👑</span><div><b>BOOSTER DE BRYAN</b><small>Supernova royale : une onde fissure tout l'écran, balles dorées qui traversent tout, la balle ne peut plus tomber, points ×3.</small></div></li>
    </ul>
    <h3>🔥 Combo</h3>
    <p>Casse des briques sans retoucher la raquette : tous les 5, ton multiplicateur augmente.</p>
    <button class="btn" data-action="fermer">Compris !</button>`;
}

function htmlSoutien() {
  return `
    <div class="soutien">
      <div class="gros-emoji">💙</div>
      <h2>Soutenir NOVA BREAK</h2>
      <p>NOVA BREAK est gratuit et sans publicité. Si le jeu t'apporte de bons moments, tu peux contribuer à la création des prochains jeux TIOKOVA. Chaque geste compte, même petit — merci d'être là.</p>
      <div class="om">
        <span class="om-titre">Orange Money</span>
        <strong>${SOUTIEN.numero}</strong>
        <small>Bénéficiaire : ${SOUTIEN.nom}</small>
        <button class="btn-copier" data-action="copier">📋 Copier le numéro</button>
      </div>
      <p class="petit">Une idée, un bug ? Écris-nous : <a href="mailto:${CONTACT}">${CONTACT}</a></p>
    </div>`;
}

function copier() {
  const ok = () => document.querySelectorAll('[data-action="copier"]').forEach(b => { b.textContent = '✅ Numéro copié'; });
  const num = SOUTIEN.numero.replace(/\s/g, '');
  if (navigator.clipboard) navigator.clipboard.writeText(num).then(ok).catch(() => {});
}

// ---------- Un seul écouteur pour tous les boutons ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  Son.debloquer(); Son.clic();
  switch (el.dataset.action) {
    case 'jouer': cacherEcran(); demarrerPartie(el.dataset.mode); break;
    case 'reprendre': cacherEcran(); reprendre(); break;
    case 'recommencer':
    case 'rejouer': cacherEcran(); demarrerPartie(mode); break;
    case 'terminer': cacherEcran(); etat = 'jeu'; terminer(true); break;
    case 'menu': App.menu(); break;
    case 'musique': el.textContent = Son.basculerMusique() ? '🎵' : '🔇'; break;
    case 'sons': el.textContent = Son.basculerSons() ? '🔊' : '🔈'; break;
    case 'aide': ouvrirModale(htmlAide()); break;
    case 'soutien': ouvrirModale(htmlSoutien() + '<button class="btn" data-action="fermer">Retour</button>'); break;
    case 'copier': copier(); break;
    case 'fermer': fermerModale(); break;
    case 'installer': installer(); break;
  }
});
modale.addEventListener('click', e => { if (e.target === modale) fermerModale(); });
window.addEventListener('pointerdown', () => Son.debloquer(), { passive: true });

// =====================================================
//  INSTALLATION (le jeu se joue seulement une fois installé)
// =====================================================
let invite = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); invite = e; });
window.addEventListener('appinstalled', () => {
  const z = document.getElementById('zoneInstall');
  if (z) z.innerHTML = '<p class="installe">✅ NOVA BREAK est installé ! Ouvre-le depuis l\'écran d\'accueil de ton téléphone.</p>';
});
async function installer() {
  if (invite) { invite.prompt(); try { await invite.userChoice; } catch (e) {} invite = null; }
  else document.getElementById('aideInstall').classList.remove('cache');
}
function estInstalle() {
  return ['standalone', 'fullscreen', 'minimal-ui'].some(m => matchMedia('(display-mode: ' + m + ')').matches) || navigator.standalone === true;
}

function ouvrirVitrine() {
  document.documentElement.classList.add('vitrine-active');
  document.body.classList.add('vitrine-active');
  document.getElementById('vitrine').classList.remove('cache');
  document.getElementById('soutienVitrine').innerHTML = htmlSoutien();
}

// =====================================================
//  DÉMARRAGE
// =====================================================
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

// Sur ton PC (Live Server) on peut jouer sans installer, pour tester.
// Ajoute ?vitrine à la fin de l'adresse pour voir la page de présentation.
const MODE_TEST = ['localhost', '127.0.0.1'].includes(location.hostname) || location.hostname.startsWith('192.168.');
const VOIR_VITRINE = location.search.includes('vitrine');

if ((estInstalle() || MODE_TEST) && !VOIR_VITRINE) {
  const police = document.fonts ? document.fonts.load('700 20px Orbitron').catch(() => {}) : Promise.resolve();
  Promise.race([police, new Promise(r => setTimeout(r, 1500))]).then(() => App.menu());
} else ouvrirVitrine();
