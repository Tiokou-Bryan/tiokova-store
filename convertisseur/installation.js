/* =========================================================
   TIOKOVA — installation.js  (module réutilisable)
   Oblige à INSTALLER l'application avant de l'utiliser.

   👉 POUR L'AJOUTER À UNE NOUVELLE APPLI OU UN NOUVEAU JEU :
   1. Copie ce fichier dans le dossier de l'appli.
   2. Dans son index.html, colle cette ligne dans le <head> :

      <script src="installation.js"
              data-nom="Nom de l'appli"
              data-icone="icon-192.png"
              data-points-fr="Premier avantage|Deuxième|Troisième"
              data-points-en="First benefit|Second|Third"></script>

   3. Ajoute "./installation.js" dans la liste des fichiers du sw.js
      de l'appli, et change le numéro de version du sw.js.

   Comment ça marche ?
   Une appli installée s'ouvre sans barre d'adresse : c'est le
   mode "standalone". Si on n'est PAS dans ce mode, on cache
   l'appli et on affiche l'écran d'installation à la place.
   ========================================================= */
(function () {
  'use strict';

  const script = document.currentScript;
  const cfg = {
    nom: script.getAttribute('data-nom') || document.title,
    icone: script.getAttribute('data-icone') || 'icon-192.png',
    pointsFr: (script.getAttribute('data-points-fr') || '').split('|').filter(Boolean),
    pointsEn: (script.getAttribute('data-points-en') || '').split('|').filter(Boolean),
    cleLangue: script.getAttribute('data-langue-cle') || ''
  };

  /* ---------- Faut-il afficher l'écran d'installation ? ---------- */
  function estInstallee() {
    const mm = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
    return mm('(display-mode: standalone)') || mm('(display-mode: fullscreen)') ||
      mm('(display-mode: minimal-ui)') || window.navigator.standalone === true;
  }
  const params = new URLSearchParams(location.search);
  const forcer = params.get('gate') === '1';               // pour tester sur ton PC
  const surPC = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (!forcer && (estInstallee() || surPC)) return;         // on laisse l'appli s'ouvrir

  /* ---------- Langue ---------- */
  let langue = (navigator.language || 'fr').toLowerCase().indexOf('en') === 0 ? 'en' : 'fr';
  try {
    if (cfg.cleLangue) {
      const v = localStorage.getItem(cfg.cleLangue);
      if (v) {
        const val = v.charAt(0) === '"' ? JSON.parse(v) : v;
        if (val === 'fr' || val === 'en') langue = val;
      }
    }
  } catch (e) { /* on garde la langue du téléphone */ }

  const TXT = {
    fr: {
      sous: 'Installe l’application pour l’utiliser. C’est gratuit et ça prend 5 secondes.',
      points: ['📲 S’ouvre comme une vraie application', '📶 Marche ensuite sans internet', '💸 Gratuit, sans publicité'],
      bouton: 'Installer l’application',
      fini: 'Installée ! Ferme cette page et ouvre {nom} depuis ton écran d’accueil.',
      and1: 'Touche le menu <b>⋮</b> en haut à droite de Chrome.',
      and2: 'Touche <b>Installer l’application</b> (ou <b>Ajouter à l’écran d’accueil</b>), puis <b>Installer</b>.',
      ios1: 'Touche le bouton <b>Partager</b> en bas de Safari (carré avec une flèche).',
      ios2: 'Choisis <b>Sur l’écran d’accueil</b>.',
      ios3: 'Touche <b>Ajouter</b>, puis ouvre l’appli depuis ton écran d’accueil.',
      iosAutre: 'Sur iPhone, l’appli s’installe uniquement avec Safari. Copie le lien et ouvre-le dans Safari.',
      integre: 'Cette page est ouverte dans une application (Facebook, Instagram…). Copie le lien et ouvre-le dans Chrome pour installer.',
      copier: '📋 Copier le lien', copie: '✅ Lien copié !',
      pc1: 'Dans Chrome ou Edge, clique sur l’icône d’installation à droite de la barre d’adresse.',
      pc2: 'Clique sur <b>Installer</b>, puis ouvre l’appli.',
      deja: 'Déjà installée ? Ouvre {nom} depuis ton écran d’accueil.'
    },
    en: {
      sous: 'Install the app to use it. It’s free and takes 5 seconds.',
      points: ['📲 Opens like a real app', '📶 Then works without internet', '💸 Free, no ads'],
      bouton: 'Install the app',
      fini: 'Installed! Close this page and open {nom} from your home screen.',
      and1: 'Tap the <b>⋮</b> menu at the top right of Chrome.',
      and2: 'Tap <b>Install app</b> (or <b>Add to Home screen</b>), then <b>Install</b>.',
      ios1: 'Tap the <b>Share</b> button at the bottom of Safari (square with an arrow).',
      ios2: 'Choose <b>Add to Home Screen</b>.',
      ios3: 'Tap <b>Add</b>, then open the app from your home screen.',
      iosAutre: 'On iPhone, the app installs only with Safari. Copy the link and open it in Safari.',
      integre: 'This page is open inside an app (Facebook, Instagram…). Copy the link and open it in Chrome to install.',
      copier: '📋 Copy the link', copie: '✅ Link copied!',
      pc1: 'In Chrome or Edge, click the install icon on the right of the address bar.',
      pc2: 'Click <b>Install</b>, then open the app.',
      deja: 'Already installed? Open {nom} from your home screen.'
    }
  };
  const T = TXT[langue];
  const points = (langue === 'en' ? cfg.pointsEn : cfg.pointsFr);
  const listePoints = points.length ? points : T.points;

  /* ---------- On cache l'appli tout de suite (pas de "flash") ---------- */
  const style = document.createElement('style');
  style.textContent =
    'body > :not(#tk-gate){display:none !important}' +
    '#tk-gate{position:fixed;inset:0;z-index:2147483000;overflow-y:auto;display:flex;align-items:center;justify-content:center;' +
    'padding:24px 18px;background:radial-gradient(120% 80% at 50% 0%,#2a1b5c 0%,#0b1120 70%);color:#e2e8f0;' +
    'font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;text-align:center;line-height:1.5}' +
    '#tk-gate .c{width:100%;max-width:400px;display:flex;flex-direction:column;align-items:center;gap:14px}' +
    '#tk-gate img{width:96px;height:96px;border-radius:26px;box-shadow:0 14px 40px rgba(0,0,0,.45)}' +
    '#tk-gate h1{font-size:1.8rem;font-weight:900;line-height:1.1;color:#fff;margin:0}' +
    '#tk-gate .s{color:#94a3b8;margin:0}' +
    '#tk-gate ul{list-style:none;padding:0;margin:0;width:100%;display:flex;flex-direction:column;gap:8px}' +
    '#tk-gate li.p{background:rgba(255,255,255,.07);border-radius:14px;padding:11px 14px;font-weight:700;text-align:left}' +
    '#tk-gate ol{text-align:left;margin:0;padding:16px 16px 16px 36px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:16px;display:flex;flex-direction:column;gap:10px}' +
    '#tk-gate b{color:#fff}' +
    '#tk-gate .a{width:100%}' +
    '#tk-gate button{width:100%;border:none;cursor:pointer;font:inherit;font-weight:800;font-size:1.1rem;color:#fff;padding:16px;border-radius:16px;' +
    'background:linear-gradient(180deg,#7c3aed,#5b21b6);box-shadow:0 5px 0 #3b0f8c}' +
    '#tk-gate button.g{background:rgba(255,255,255,.08);box-shadow:none;border:1px solid rgba(255,255,255,.15);font-size:1rem;margin-top:10px}' +
    '#tk-gate .w{background:rgba(255,159,67,.15);border:1px solid rgba(255,159,67,.4);border-radius:14px;padding:12px;margin:0}' +
    '#tk-gate .ok{background:rgba(6,214,160,.15);border:1px solid #06d6a0;border-radius:14px;padding:14px;font-weight:700}' +
    '#tk-gate .f{color:#94a3b8;font-size:.82rem;margin:0}';
  document.head.appendChild(style);

  /* ---------- Type d'appareil ---------- */
  function plateforme() {
    const ua = navigator.userAgent || '';
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (/FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|TikTok|musical_ly|; wv\)/i.test(ua)) return 'integre';
    if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? 'ios-autre' : 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'pc';
  }

  let invitation = null;   // l'"invitation à installer" envoyée par Chrome
  let installee = false;
  let racine = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    invitation = e;
    afficher();
  });
  window.addEventListener('appinstalled', function () {
    installee = true;
    invitation = null;
    afficher();
  });

  function copierLien(btn) {
    const lien = location.href.split('?')[0];
    const fini = function (ok) { btn.textContent = ok ? T.copie : lien; };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(lien).then(function () { fini(true); }, function () { fini(false); });
    } else {
      fini(false);
    }
  }

  function afficher() {
    if (!racine) return;
    const nom = cfg.nom;
    const p = plateforme();
    let action;
    if (installee) {
      action = '<div class="ok">✅ ' + T.fini.replace('{nom}', nom) + '</div>';
    } else if (invitation) {
      action = '<button id="tk-installer">📲 ' + T.bouton + '</button>';
    } else if (p === 'integre') {
      action = '<p class="w">⚠️ ' + T.integre + '</p><button class="g" id="tk-copier">' + T.copier + '</button>';
    } else if (p === 'ios') {
      action = '<ol><li>' + T.ios1 + '</li><li>' + T.ios2 + '</li><li>' + T.ios3 + '</li></ol>';
    } else if (p === 'ios-autre') {
      action = '<p class="w">⚠️ ' + T.iosAutre + '</p><button class="g" id="tk-copier">' + T.copier + '</button>';
    } else if (p === 'android') {
      action = '<ol><li>' + T.and1 + '</li><li>' + T.and2 + '</li></ol>';
    } else {
      action = '<ol><li>' + T.pc1 + '</li><li>' + T.pc2 + '</li></ol>';
    }
    racine.innerHTML =
      '<div class="c">' +
        '<img src="' + cfg.icone + '" alt="">' +
        '<h1>' + nom + '</h1>' +
        '<p class="s">' + T.sous + '</p>' +
        '<ul>' + listePoints.map(function (x) { return '<li class="p">' + x + '</li>'; }).join('') + '</ul>' +
        '<div class="a">' + action + '</div>' +
        (installee ? '' : '<p class="f">' + T.deja.replace('{nom}', nom) + '</p>') +
      '</div>';

    const bi = document.getElementById('tk-installer');
    if (bi) bi.addEventListener('click', function () {
      if (!invitation) return;
      const ev = invitation;
      ev.prompt();
      ev.userChoice.then(function (choix) {
        if (choix && choix.outcome === 'accepted') installee = true;
        invitation = null;
        afficher();
      });
    });
    const bc = document.getElementById('tk-copier');
    if (bc) bc.addEventListener('click', function () { copierLien(bc); });
  }

  function monter() {
    racine = document.createElement('div');
    racine.id = 'tk-gate';
    document.body.appendChild(racine);
    afficher();
  }
  if (document.body) monter();
  else document.addEventListener('DOMContentLoaded', monter);
})();
