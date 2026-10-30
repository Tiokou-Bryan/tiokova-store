/* =========================================================
   TIOKOVA STORE — app.js
   👉 POUR AJOUTER UNE NOUVELLE APPLICATION :
      copie un bloc { ... } dans la liste APPS ci-dessous,
      change les informations, et c'est tout.
      La carte, la recherche et les filtres se mettent à jour seuls.
   ========================================================= */
(function () {
  'use strict';

  const URL_STORE = 'https://tiokou-bryan.github.io/tiokova-store/';
  const NUMERO_OM = '657159793';

  /* ---------------------------------------------------------
     LISTE DES APPLICATIONS
     cat : 'jeux' ou 'outils'
     nouveau : true = ruban « Nouveau » sur la carte
     --------------------------------------------------------- */
  const APPS = [
    {
      id: 'blocks',
      nom: 'TIOKOVA BLOCKS',
      cat: 'jeux',
      icone: 'blocks/icons/icon-192.png',
      lien: 'blocks/',
      nouveau: true,
      badges: { fr: ['Gratuit', 'FR / EN', 'Hors connexion'], en: ['Free', 'FR / EN', 'Offline'] },
      sousTitre: { fr: 'Jeu · Réflexion', en: 'Game · Puzzle' },
      desc: {
        fr: 'Jeu de blocs rapide et addictif : défi du jour, série de jours, missions, 8 thèmes et records.',
        en: 'A fast, addictive block game: daily challenge, streaks, missions, 8 themes and records.'
      },
      motsCles: 'jeu game puzzle blocs block tetris casse-tête'
    },
    {
      id: 'devises',
      nom: 'TIOKOVA Devises',
      cat: 'outils',
      icone: 'convertisseur/icon-192.png',
      lien: 'convertisseur/index.html',
      nouveau: false,
      badges: { fr: ['Gratuit', 'FR / EN', 'Hors connexion'], en: ['Free', 'FR / EN', 'Offline'] },
      sousTitre: { fr: 'Outil · Finance', en: 'Tool · Finance' },
      desc: {
        fr: 'Convertisseur 18 devises, calculateur de prix pour commerçants et carnet de dépenses de voyage.',
        en: '18-currency converter, price calculator for traders and travel expense tracker.'
      },
      motsCles: 'fcfa xaf euro dollar naira yuan argent money convertisseur commerce voyage'
    }
  ];

  /* ---------------------------------------------------------
     TEXTES FR / EN
     --------------------------------------------------------- */
  const TEXTES = {
    fr: {
      nav_apps: 'Applis', nav_install: 'Installer', nav_support: 'Soutenir', nav_faq: 'FAQ',
      hero_kicker: '🇨🇲 Créé au Cameroun',
      hero_text: 'Des applications et des jeux gratuits, sans publicité, qui marchent même sans connexion.',
      hero_cta: 'Voir les applications', hero_share: '📤 Partager le store',
      stat_apps: 'applications', stat_free: 'gratuit', stat_ads: 'publicité', stat_offline: 'hors connexion',
      new_badge: '✨ Nouveau', cat_game_puzzle: 'Jeu · Réflexion',
      blocks_long: 'Place les pièces, complète les lignes et fais exploser le plateau. Chaque jour, un nouveau défi de 3 minutes, des missions et une série à garder. Une partie dure 2 à 5 minutes.',
      blocks_p1: '📅 Défi du jour : les mêmes pièces pour tout le monde',
      blocks_p2: '🔥 Série de jours et cadeaux quotidiens',
      blocks_p3: '🎨 8 thèmes, 36 succès, bonus à gagner',
      play_now: '📲 Télécharger le jeu',
      apps_title: 'Toutes les applications', search: 'Rechercher…',
      f_all: 'Tout', f_games: '🎮 Jeux', f_tools: '🧰 Outils',
      no_result: 'Aucune application ne correspond à ta recherche.',
      open: '📲 Télécharger', share_app: 'Partager', ribbon_new: 'NOUVEAU',
      why_title: 'Pourquoi TIOKOVA ?',
      v1_t: 'Gratuit, sans pub', v1_x: 'Aucune publicité, aucun abonnement, aucun achat caché.',
      v2_t: 'Marche sans internet', v2_x: 'Une fois installées, les applis s’ouvrent même sans connexion. Idéal quand le réseau ne suit pas.',
      v3_t: 'Tes données restent chez toi', v3_x: 'Pas de compte à créer. Ta progression est gardée sur ton téléphone, et nulle part ailleurs.',
      v4_t: 'Toujours à jour', v4_x: 'Les nouveautés arrivent toutes seules, sans rien réinstaller.',
      install_title: 'Comment installer une application ?', tab_pc: '💻 Ordinateur',
      and1: 'Sur cette page, touche <b>📲 Télécharger</b> sous l’application (avec <b>Chrome</b>).',
      and2: 'Touche <b>« Installer »</b> sur l’écran qui s’ouvre.',
      and3: 'Sinon : touche le menu <b>⋮</b> en haut à droite, puis <b>Ajouter à l’écran d’accueil</b> → <b>Installer</b>.',
      and4: 'L’icône apparaît sur ton écran d’accueil, comme une vraie application.',
      ios1: 'Ouvre l’application dans <b>Safari</b>.',
      ios2: 'Touche le bouton <b>Partager</b> (carré avec une flèche vers le haut).',
      ios3: 'Choisis <b>Sur l’écran d’accueil</b>, puis <b>Ajouter</b>.',
      pc1: 'Ouvre l’application dans <b>Chrome</b> ou <b>Edge</b>.',
      pc2: 'Clique sur l’icône d’installation à droite de la barre d’adresse (un écran avec une flèche).',
      pc3: 'Clique sur <b>Installer</b>.',
      support_title: '💛 Soutenir TIOKOVA',
      support_txt: 'Toutes les applis sont gratuites. Si elles te rendent service, un petit don Orange Money aide à en créer de nouvelles.',
      support_free: 'Tu peux aussi nous aider en partageant le store autour de toi 🙏',
      beneficiary: 'Bénéficiaire', copy: '📋 Copier le numéro', copied: '✅ Numéro copié !', dial: '📞 Ouvrir #150#',
      pin_warning: 'Ne donne jamais ton code secret. TIOKOVA ne te le demandera jamais.',
      faq_title: 'Questions fréquentes',
      q1: 'C’est vraiment gratuit ?', a1: 'Oui. Aucune application ne demande de paiement, et il n’y a pas de publicité. Les dons sont totalement facultatifs.',
      q2: 'Pourquoi ce n’est pas sur le Play Store ?', a2: 'Ce sont des « applications web installables ». Elles s’installent directement depuis ce site, sans passer par le Play Store, et prennent très peu de place.',
      q3: 'Est-ce que c’est sûr ?', a3: 'Oui. Les applis ne demandent aucune autorisation spéciale (contacts, photos, position…) et ne collectent pas tes données.',
      q5: 'Comment avoir la dernière version ?', a5: 'Rien à faire : l’application se met à jour toute seule quand tu l’ouvres avec internet.',
      news_title: 'Nouveautés',
      news_when: 'Octobre 2026',
      news1: 'Nouveau jeu : <b>TIOKOVA BLOCKS</b> 🎮',
      news2: 'Nouveau look pour le store ✨',
      news3: 'Arrivée de <b>TIOKOVA Devises</b> 💱',
      footer_txt: 'Vos envies, notre priorité.',
      nav_contact: 'Contact', contact_title: '📩 Nous contacter', contact_btn: '✉️ Écrire un e-mail',
      contact_txt: 'Une idée d’application, un bug, une question ? Écris-nous : chaque message est lu.',
      share_store_txt: 'Découvre TIOKOVA STORE : des applis et des jeux gratuits créés au Cameroun 🇨🇲, sans pub et hors connexion !',
      share_app_txt: 'Essaie {app} sur TIOKOVA STORE, c’est gratuit 👉',
      link_copied: '✅ Lien copié, colle-le à tes amis !'
    },
    en: {
      nav_apps: 'Apps', nav_install: 'Install', nav_support: 'Support', nav_faq: 'FAQ',
      hero_kicker: '🇨🇲 Made in Cameroon',
      hero_text: 'Free apps and games, with no ads, that work even without internet.',
      hero_cta: 'See the apps', hero_share: '📤 Share the store',
      stat_apps: 'apps', stat_free: 'free', stat_ads: 'ads', stat_offline: 'offline',
      new_badge: '✨ New', cat_game_puzzle: 'Game · Puzzle',
      blocks_long: 'Place the pieces, complete lines and blast the board. Every day: a new 3-minute challenge, missions and a streak to keep. A game lasts 2 to 5 minutes.',
      blocks_p1: '📅 Daily challenge: same pieces for everyone',
      blocks_p2: '🔥 Day streaks and daily gifts',
      blocks_p3: '🎨 8 themes, 36 achievements, power-ups to earn',
      play_now: '📲 Download the game',
      apps_title: 'All apps', search: 'Search…',
      f_all: 'All', f_games: '🎮 Games', f_tools: '🧰 Tools',
      no_result: 'No app matches your search.',
      open: '📲 Download', share_app: 'Share', ribbon_new: 'NEW',
      why_title: 'Why TIOKOVA?',
      v1_t: 'Free, no ads', v1_x: 'No ads, no subscription, no hidden purchases.',
      v2_t: 'Works offline', v2_x: 'Once installed, the apps open even without internet. Perfect when the network is weak.',
      v3_t: 'Your data stays with you', v3_x: 'No account needed. Your progress is kept on your phone and nowhere else.',
      v4_t: 'Always up to date', v4_x: 'New features arrive on their own, nothing to reinstall.',
      install_title: 'How to install an app?', tab_pc: '💻 Computer',
      and1: 'On this page, tap <b>📲 Download</b> under the app (in <b>Chrome</b>).',
      and2: 'Tap <b>"Install"</b> on the screen that opens.',
      and3: 'Otherwise: tap the <b>⋮</b> menu at the top right, then <b>Add to Home screen</b> → <b>Install</b>.',
      and4: 'The icon appears on your home screen, like a real app.',
      ios1: 'Open the app in <b>Safari</b>.',
      ios2: 'Tap the <b>Share</b> button (square with an up arrow).',
      ios3: 'Choose <b>Add to Home Screen</b>, then <b>Add</b>.',
      pc1: 'Open the app in <b>Chrome</b> or <b>Edge</b>.',
      pc2: 'Click the install icon on the right of the address bar (a screen with an arrow).',
      pc3: 'Click <b>Install</b>.',
      support_title: '💛 Support TIOKOVA',
      support_txt: 'All apps are free. If they help you, a small Orange Money donation helps create new ones.',
      support_free: 'You can also help by sharing the store with people around you 🙏',
      beneficiary: 'Recipient', copy: '📋 Copy the number', copied: '✅ Number copied!', dial: '📞 Open #150#',
      pin_warning: 'Never share your PIN. TIOKOVA will never ask for it.',
      faq_title: 'FAQ',
      q1: 'Is it really free?', a1: 'Yes. No app asks for payment, and there are no ads. Donations are completely optional.',
      q2: 'Why isn’t it on the Play Store?', a2: 'These are "installable web apps". They install straight from this site, without the Play Store, and take very little space.',
      q3: 'Is it safe?', a3: 'Yes. The apps ask for no special permissions (contacts, photos, location…) and don’t collect your data.',
      q5: 'How do I get the latest version?', a5: 'Nothing to do: the app updates itself when you open it with internet.',
      news_title: 'What’s new',
      news_when: 'October 2026',
      news1: 'New game: <b>TIOKOVA BLOCKS</b> 🎮',
      news2: 'A fresh new look for the store ✨',
      news3: '<b>TIOKOVA Devises</b> is here 💱',
      footer_txt: 'Your wishes, our priority.',
      nav_contact: 'Contact', contact_title: '📩 Contact us', contact_btn: '✉️ Send an e-mail',
      contact_txt: 'An app idea, a bug, a question? Write to us: every message is read.',
      share_store_txt: 'Check out TIOKOVA STORE: free apps and games made in Cameroon 🇨🇲, no ads, works offline!',
      share_app_txt: 'Try {app} on TIOKOVA STORE, it’s free 👉',
      link_copied: '✅ Link copied, paste it to your friends!'
    }
  };

  /* ---------- Langue choisie (gardée dans le téléphone) ---------- */
  let langue = 'fr';
  try {
    langue = localStorage.getItem('tiokova_langue') ||
      ((navigator.language || 'fr').toLowerCase().indexOf('en') === 0 ? 'en' : 'fr');
  } catch (e) { /* stockage bloqué : on reste en français */ }

  function t(cle) {
    return (TEXTES[langue] && TEXTES[langue][cle]) || TEXTES.fr[cle] || cle;
  }

  const $ = function (s) { return document.querySelector(s); };
  const $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  let filtre = 'tout';
  let recherche = '';

  /* ---------------------------------------------------------
     AFFICHAGE DES CARTES
     --------------------------------------------------------- */
  // Enlève les accents pour que "theme" trouve "thème"
  function simplifier(txt) {
    return txt.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function afficherApplis() {
    const liste = $('#liste-applis');
    liste.innerHTML = '';
    const q = simplifier(recherche.trim());
    const visibles = APPS.filter(function (a) {
      if (filtre !== 'tout' && a.cat !== filtre) return false;
      if (!q) return true;
      const texte = simplifier([a.nom, a.desc.fr, a.desc.en, a.motsCles].join(' '));
      return texte.indexOf(q) >= 0;
    });

    visibles.forEach(function (a, k) {
      const li = document.createElement('li');
      li.className = 'carte-appli';
      li.style.animationDelay = (k * 0.06) + 's';
      li.innerHTML =
        (a.nouveau ? '<span class="ruban">' + t('ribbon_new') + '</span>' : '') +
        '<div class="carte-tete">' +
          '<img src="' + a.icone + '" alt="" width="64" height="64" loading="lazy">' +
          '<div><h3>' + a.nom + '</h3><span class="carte-cat">' + a.sousTitre[langue] + '</span></div>' +
        '</div>' +
        '<div class="badges">' + a.badges[langue].map(function (b) { return '<span class="badge">' + b + '</span>'; }).join('') + '</div>' +
        '<p>' + a.desc[langue] + '</p>' +
        '<div class="carte-actions">' +
          '<a class="bouton bouton-plein" href="' + a.lien + '">' + t('open') + '</a>' +
          '<button class="btn-icone" aria-label="' + t('share_app') + '" title="' + t('share_app') + '">📤</button>' +
        '</div>';
      li.querySelector('.btn-icone').addEventListener('click', function () {
        partager(t('share_app_txt').replace('{app}', a.nom), URL_STORE + a.lien);
      });
      liste.appendChild(li);
    });

    $('#aucun-resultat').classList.toggle('hidden', visibles.length > 0);
    $('#nb-applis').textContent = APPS.length;
  }

  /* ---------------------------------------------------------
     TRADUCTION DE LA PAGE
     --------------------------------------------------------- */
  function traduire() {
    document.documentElement.lang = langue;
    $$('[data-t]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-t'));
    });
    $$('[data-t-placeholder]').forEach(function (el) {
      el.placeholder = t(el.getAttribute('data-t-placeholder'));
    });
    $('#btn-langue').textContent = langue === 'fr' ? 'EN' : 'FR';
    afficherApplis();
  }

  /* ---------------------------------------------------------
     PARTAGE ET COPIE
     --------------------------------------------------------- */
  function notifier(msg) {
    const n = $('#notif');
    n.textContent = msg;
    n.classList.remove('hidden');
    clearTimeout(notifier.timer);
    notifier.timer = setTimeout(function () { n.classList.add('hidden'); }, 2500);
  }

  function copier(texte) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texte).then(function () { return true; }, planB);
    }
    return Promise.resolve(planB());
    function planB() {
      try {
        const ta = document.createElement('textarea');
        ta.value = texte;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch (e) { return false; }
    }
  }

  // Menu de partage du téléphone, sinon WhatsApp, sinon copie du lien
  function partager(texte, lien) {
    if (navigator.share) {
      navigator.share({ title: 'TIOKOVA STORE', text: texte, url: lien }).catch(function () { /* annulé */ });
      return;
    }
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
      window.open('https://wa.me/?text=' + encodeURIComponent(texte + ' ' + lien), '_blank');
      return;
    }
    copier(texte + ' ' + lien).then(function (ok) { if (ok) notifier(t('link_copied')); });
  }

  /* ---------------------------------------------------------
     BRANCHEMENT DES BOUTONS
     --------------------------------------------------------- */
  function brancher() {
    $('#btn-langue').addEventListener('click', function () {
      langue = langue === 'fr' ? 'en' : 'fr';
      try { localStorage.setItem('tiokova_langue', langue); } catch (e) { /* rien */ }
      traduire();
    });

    $$('.filtre').forEach(function (b) {
      b.addEventListener('click', function () {
        filtre = b.getAttribute('data-cat');
        $$('.filtre').forEach(function (x) { x.classList.toggle('actif', x === b); });
        afficherApplis();
      });
    });

    $('#recherche').addEventListener('input', function () {
      recherche = this.value;
      afficherApplis();
    });

    $$('.onglet').forEach(function (b) {
      b.addEventListener('click', function () {
        const id = b.getAttribute('data-onglet');
        $$('.onglet').forEach(function (x) { x.classList.toggle('actif', x === b); });
        $$('.panneau').forEach(function (p) { p.classList.toggle('actif', p.id === 'p-' + id); });
      });
    });

    $('#btn-partager-store').addEventListener('click', function () {
      partager(t('share_store_txt'), URL_STORE);
    });

    $('#btn-copier').addEventListener('click', function () {
      const btn = this;
      copier(NUMERO_OM).then(function (ok) {
        if (!ok) return;
        btn.classList.add('ok');
        btn.innerHTML = t('copied');
        setTimeout(function () { btn.classList.remove('ok'); btn.innerHTML = t('copy'); }, 1800);
      });
    });

    // Agrandir une capture d'écran
    $$('.captures img').forEach(function (img) {
      img.addEventListener('click', function () {
        $('#loupe-img').src = img.src;
        $('#loupe-img').alt = img.alt;
        $('#loupe').classList.remove('hidden');
      });
    });
    $('#loupe').addEventListener('click', function () { this.classList.add('hidden'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') $('#loupe').classList.add('hidden');
    });

    $('#annee').textContent = new Date().getFullYear();
  }

  brancher();
  traduire();

  // Le store lui-même devient installable et s'ouvre hors connexion
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* pas grave */ });
  }
})();
