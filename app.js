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
     id         : nom court, sans espace ni accent
     cat        : 'jeux' ou 'outils'
     nouveau    : true = ruban « Nouveau » sur la carte
     version    : numéro affiché dans la fiche
     longue     : description complète (fiche détaillée)
     points     : les points forts (fiche détaillée)
     quoiDeNeuf : ce qui change dans la dernière version
     captures   : images de l'appli (format portrait)
     👉 Touche une carte : la fiche s'ouvre, comme sur le Play Store.
     --------------------------------------------------------- */
  const APPS = [
    {
      id: 'motsdor',
      nom: "Mots d'Or",
      cat: 'outils',
      icone: 'mots-dor/icons/icon-192.png',
      lien: 'mots-dor/',
      nouveau: true,
      version: 'V1',
      badges: { fr: ['Gratuit', 'FR / EN', 'Hors connexion'], en: ['Free', 'FR / EN', 'Offline'] },
      sousTitre: { fr: 'Outil · Bien-être', en: 'Tool · Wellbeing' },
      desc: {
        fr: '4 citations en or chaque jour, une histoire du jour et des mots doux à envoyer à ceux que tu aimes.',
        en: '4 golden quotes a day, a story of the day and sweet words to send to the people you love.'
      },
      longue: {
        fr: "Chaque jour, Mots d'Or t'offre 4 citations élégantes à choisir parmi 6 modes : Motivation, Amour, Sagesse, Courage, Sagesse d'Afrique et Humour. Une histoire t'attend aussi chaque jour : parfois drôle, parfois triste, parfois pleine de mystère, avec son ambiance musicale et sa question finale : « Et toi, tu aurais fait comment ? ». Transforme n'importe quelle citation en belle image pour ton statut WhatsApp, et envoie un mot d'amour, un merci ou un encouragement à quelqu'un qui compte.",
        en: "Every day, Mots d'Or gives you 4 elegant quotes from 6 modes: Motivation, Love, Wisdom, Courage, African Wisdom and Humour. A story also awaits you every day: sometimes funny, sometimes sad, sometimes mysterious, with its own background music and a final question: « And you, what would you have done? ». Turn any quote into a beautiful image for your WhatsApp status, and send a word of love, thanks or encouragement to someone who matters."
      },
      points: {
        fr: ['✨ 4 citations par jour, 6 modes, 600 citations', '📖 Une histoire du jour avec musique et lecture vocale', '📲 Des images prêtes pour ton statut WhatsApp', '💌 Des mots doux à envoyer à tes proches'],
        en: ['✨ 4 quotes a day, 6 modes, 600 quotes', '📖 A story of the day with music and read-aloud', '📲 Images ready for your WhatsApp status', '💌 Sweet words to send to your loved ones']
      },
      quoiDeNeuf: {
        fr: 'Première version : 600 citations, 60 histoires, partage en image, favoris et série de jours.',
        en: 'First release: 600 quotes, 60 stories, image sharing, favourites and day streaks.'
      },
      captures: ['assets/motsdor-1.jpg', 'assets/motsdor-2.jpg', 'assets/motsdor-3.jpg', 'assets/motsdor-4.jpg'],
      motsCles: 'citation citations quote quotes motivation amour love sagesse wisdom courage humour histoire story proverbe afrique whatsapp statut mots or'
    },
    {
      id: 'nova-break',
      nom: 'NOVA BREAK',
      cat: 'jeux',
      icone: 'nova-break/icon-192.png',
      lien: 'nova-break/',
      nouveau: true,
      version: 'V1',
      badges: { fr: ['Gratuit', 'Musique', 'Hors connexion'], en: ['Free', 'Music', 'Offline'] },
      sousTitre: { fr: 'Jeu · Arcade', en: 'Game · Arcade' },
      desc: {
        fr: 'Casse-briques relaxant : briques qui se fissurent, boosters légendaires, boss et 5 modes de jeu.',
        en: 'A relaxing brick breaker: cracking bricks, legendary boosters, bosses and 5 game modes.'
      },
      longue: {
        fr: 'Une bille de lumière, une raquette et des murs de briques de cristal. Chaque coup les fissure, les fait pâlir… jusqu’à ce qu’elles volent en éclats. Plus tu avances, plus elles résistent. Une ambiance douce, une musique qui vit au rythme de ta partie.',
        en: 'A ball of light, a paddle and walls of crystal bricks. Every hit cracks them and makes them fade… until they shatter. The further you go, the tougher they get. A calm atmosphere and music that lives to the rhythm of your game.'
      },
      points: {
        fr: ['💎 Des briques qui se fissurent coup après coup', '👑 2 boosters légendaires : Dinky Boy et le Booster de Bryan', '🎮 5 modes : Aventure avec boss, Défi du jour, Zen, Rush 60, Invasion'],
        en: ['💎 Bricks that crack hit after hit', '👑 2 legendary boosters: Dinky Boy and Bryan’s Booster', '🎮 5 modes: Adventure with bosses, Daily Challenge, Zen, Rush 60, Invasion']
      },
      quoiDeNeuf: { fr: 'Sortie du jeu.', en: 'Game launch.' },
      captures: ['nova-break/captures/capture2.jpg', 'nova-break/captures/capture3.jpg', 'nova-break/captures/capture4.jpg', 'nova-break/captures/capture5.jpg'],
      motsCles: 'jeu game casse-briques brick breaker arkanoid balle raquette arcade boss booster nova'
    },
    {
      id: 'blocks',
      nom: 'TIOKOVA BLOCKS',
      cat: 'jeux',
      icone: 'blocks/icons/icon-192.png',
      lien: 'blocks/',
      nouveau: false,
      version: 'V1.0',
      badges: { fr: ['Gratuit', 'FR / EN', 'Hors connexion'], en: ['Free', 'FR / EN', 'Offline'] },
      sousTitre: { fr: 'Jeu · Réflexion', en: 'Game · Puzzle' },
      desc: {
        fr: 'Jeu de blocs rapide et addictif : défi du jour, série de jours, missions, 8 thèmes et records.',
        en: 'A fast, addictive block game: daily challenge, streaks, missions, 8 themes and records.'
      },
      longue: {
        fr: 'Place les pièces, complète les lignes et fais exploser le plateau. Chaque jour, un nouveau défi de 3 minutes, des missions et une série à garder. Une partie dure 2 à 5 minutes.',
        en: 'Place the pieces, complete lines and blast the board. Every day: a new 3-minute challenge, missions and a streak to keep. A game lasts 2 to 5 minutes.'
      },
      points: {
        fr: ['📅 Défi du jour : les mêmes pièces pour tout le monde', '🔥 Série de jours et cadeaux quotidiens', '🎨 8 thèmes, 36 succès, bonus à gagner'],
        en: ['📅 Daily challenge: same pieces for everyone', '🔥 Day streaks and daily gifts', '🎨 8 themes, 36 achievements, power-ups to earn']
      },
      quoiDeNeuf: { fr: 'Sortie du jeu.', en: 'Game launch.' },
      captures: ['assets/blocks-1.jpg', 'assets/blocks-2.jpg', 'assets/blocks-3.jpg'],
      motsCles: 'jeu game puzzle blocs block tetris casse-tête'
    },
    {
      id: 'devises',
      nom: 'TIOKOVA Devises',
      cat: 'outils',
      icone: 'convertisseur/icon-192.png',
      lien: 'convertisseur/index.html',
      nouveau: false,
      version: 'V1',
      badges: { fr: ['Gratuit', 'FR / EN', 'Hors connexion'], en: ['Free', 'FR / EN', 'Offline'] },
      sousTitre: { fr: 'Outil · Finance', en: 'Tool · Finance' },
      desc: {
        fr: 'Convertisseur 18 devises, calculateur de prix pour commerçants et carnet de dépenses de voyage.',
        en: '18-currency converter, price calculator for traders and travel expense tracker.'
      },
      longue: {
        fr: 'Convertis instantanément le franc CFA et 17 autres devises, calcule ton prix de revente avec le transport, la douane et ta marge, et suis tes dépenses de voyage dans la devise de ton choix. Les taux se mettent à jour dès que tu as internet, puis restent disponibles hors connexion.',
        en: 'Instantly convert the CFA franc and 17 other currencies, work out your resale price including transport, customs and margin, and track travel expenses in the currency of your choice. Rates update whenever you are online, then stay available offline.'
      },
      points: {
        fr: ['💱 18 devises, taux mis à jour', '🛒 Calculateur de prix pour commerçants', '✈️ Carnet de dépenses de voyage'],
        en: ['💱 18 currencies, updated rates', '🛒 Price calculator for traders', '✈️ Travel expense tracker']
      },
      quoiDeNeuf: { fr: 'Version bilingue FR / EN.', en: 'Bilingual FR / EN version.' },
      captures: ['assets/devises-1.jpg', 'assets/devises-2.jpg'],
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
      cat_game_arcade: 'Jeu · Arcade',
      nova_long: 'Une bille de lumière, une raquette et des murs de briques de cristal. Chaque coup les fissure, les fait pâlir… jusqu’à ce qu’elles volent en éclats. Plus tu avances, plus elles résistent. Une ambiance douce, une musique qui vit au rythme de ta partie.',
      nova_p1: '💎 Des briques qui se fissurent coup après coup',
      nova_p2: '👑 2 boosters légendaires : Dinky Boy et le Booster de Bryan',
      nova_p3: '🎮 5 modes : Aventure avec boss, Défi du jour, Zen, Rush 60, Invasion',
      play_now: '📲 Télécharger le jeu',
      cat_tool_wellbeing: 'Outil · Bien-être',
      motsdor_long: 'Chaque jour, 4 citations élégantes à choisir parmi 6 modes : Motivation, Amour, Sagesse, Courage, Sagesse d’Afrique et Humour. Une histoire du jour t’attend aussi, avec son ambiance musicale et sa question finale : « Et toi, tu aurais fait comment ? ».',
      motsdor_p1: '✨ 4 citations par jour, 6 modes, 600 citations',
      motsdor_p2: '📖 Une histoire du jour avec musique et lecture vocale',
      motsdor_p3: '📲 Des images prêtes pour ton statut WhatsApp',
      motsdor_p4: '💌 Des mots doux à envoyer à tes proches',
      get_app: '📲 Télécharger l’appli', see_more: 'Voir la fiche ›',
      st_price: 'Prix', st_free: 'Gratuit', st_lang: 'Langues', st_version: 'Version', st_offline: 'Hors ligne',
      about_app: 'À propos de cette appli', whats_new: 'Nouveautés de la version', close: 'Fermer',
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
      news_motsdor: 'Nouvelle appli : <b>Mots d’Or</b> ✨',
      news_nova: 'Nouveau jeu : <b>NOVA BREAK</b> 💎',
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
      cat_game_arcade: 'Game · Arcade',
      nova_long: 'A ball of light, a paddle and walls of crystal bricks. Every hit cracks them and makes them fade… until they shatter. The further you go, the tougher they get. A calm atmosphere and music that lives to the rhythm of your game.',
      nova_p1: '💎 Bricks that crack hit after hit',
      nova_p2: '👑 2 legendary boosters: Dinky Boy and Bryan’s Booster',
      nova_p3: '🎮 5 modes: Adventure with bosses, Daily Challenge, Zen, Rush 60, Invasion',
      play_now: '📲 Download the game',
      cat_tool_wellbeing: 'Tool · Wellbeing',
      motsdor_long: 'Every day, 4 elegant quotes from 6 modes: Motivation, Love, Wisdom, Courage, African Wisdom and Humour. A story of the day also awaits you, with its own background music and a final question: « And you, what would you have done? ».',
      motsdor_p1: '✨ 4 quotes a day, 6 modes, 600 quotes',
      motsdor_p2: '📖 A story of the day with music and read-aloud',
      motsdor_p3: '📲 Images ready for your WhatsApp status',
      motsdor_p4: '💌 Sweet words to send to your loved ones',
      get_app: '📲 Download the app', see_more: 'See details ›',
      st_price: 'Price', st_free: 'Free', st_lang: 'Languages', st_version: 'Version', st_offline: 'Offline',
      about_app: 'About this app', whats_new: 'What’s new in this version', close: 'Close',
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
      news_motsdor: 'New app: <b>Mots d’Or</b> ✨',
      news_nova: 'New game: <b>NOVA BREAK</b> 💎',
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
    return txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
        '<button class="lien-fiche">' + t('see_more') + '</button>' +
        '<div class="carte-actions">' +
          '<a class="bouton bouton-plein" href="' + a.lien + '">' + t('open') + '</a>' +
          '<button class="btn-icone" aria-label="' + t('share_app') + '" title="' + t('share_app') + '">📤</button>' +
        '</div>';
      li.querySelector('.btn-icone').addEventListener('click', function () {
        partager(t('share_app_txt').replace('{app}', a.nom), lienFiche(a));
      });
      // Toucher la carte (ailleurs que sur « Télécharger » ou 📤) ouvre la fiche
      li.addEventListener('click', function (e) {
        if (e.target.closest('a, .btn-icone')) return;
        ouvrirFiche(a.id);
      });
      liste.appendChild(li);
    });

    $('#aucun-resultat').classList.toggle('hidden', visibles.length > 0);
    $('#nb-applis').textContent = APPS.length;
  }

  /* ---------------------------------------------------------
     FICHE DÉTAILLÉE D'UNE APPLI (comme sur le Play Store)
     L'adresse devient …/#app=motsdor : on peut partager ce lien,
     et le bouton « retour » du téléphone ferme la fiche.
     --------------------------------------------------------- */
  let ficheOuverte = null;

  function trouverAppli(id) { return APPS.filter(function (a) { return a.id === id; })[0]; }
  function lienFiche(a) { return URL_STORE + '#app=' + a.id; }

  function ouvrirFiche(id, simpleMiseAJour) {
    const a = trouverAppli(id);
    if (!a) return;
    const longue = a.longue ? a.longue[langue] : a.desc[langue];
    $('#fiche-boite').innerHTML =
      '<button class="fiche-fermer" id="fiche-fermer" aria-label="' + t('close') + '">✕</button>' +
      '<div class="fiche-tete">' +
        '<img src="' + a.icone + '" alt="" width="84" height="84">' +
        '<div><h2>' + a.nom + '</h2><span class="carte-cat">' + a.sousTitre[langue] + '</span>' +
        '<div class="fiche-dev">TIOKOVA STORE</div></div>' +
      '</div>' +
      '<div class="fiche-stats">' +
        '<div><b>0 F</b><span>' + t('st_free') + '</span></div>' +
        '<div><b>📶</b><span>' + t('st_offline') + '</span></div>' +
        '<div><b>' + (a.badges.fr.indexOf('FR / EN') >= 0 ? 'FR · EN' : 'FR') + '</b><span>' + t('st_lang') + '</span></div>' +
        '<div><b>' + (a.version || 'V1') + '</b><span>' + t('st_version') + '</span></div>' +
      '</div>' +
      '<div class="fiche-actions">' +
        '<a class="bouton bouton-plein" href="' + a.lien + '">' + t('open') + '</a>' +
        '<button class="btn-icone" id="fiche-partager" aria-label="' + t('share_app') + '" title="' + t('share_app') + '">📤</button>' +
      '</div>' +
      ((a.captures && a.captures.length) ? '<div class="captures">' + a.captures.map(function (src, k) {
        return '<img src="' + src + '" alt="' + a.nom + ' — ' + (k + 1) + '" loading="lazy" width="360">';
      }).join('') + '</div>' : '') +
      '<h3>' + t('about_app') + '</h3>' +
      '<p>' + longue + '</p>' +
      (a.points ? '<ul class="points">' + a.points[langue].map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>' : '') +
      (a.quoiDeNeuf ? '<h3>' + t('whats_new') + '</h3><p>' + a.quoiDeNeuf[langue] + '</p>' : '') +
      '<div class="badges">' + a.badges[langue].map(function (b) { return '<span class="badge">' + b + '</span>'; }).join('') + '</div>';

    $('#fiche-fermer').addEventListener('click', fermerFiche);
    $('#fiche-partager').addEventListener('click', function () {
      partager(t('share_app_txt').replace('{app}', a.nom), lienFiche(a));
    });

    if (simpleMiseAJour) return; // changement de langue : on réécrit juste le texte
    ficheOuverte = id;
    $('#fiche').classList.remove('hidden');
    $('#fiche').scrollTop = 0;
    document.body.classList.add('sans-defilement');
    if (location.hash !== '#app=' + id) {
      try { history.pushState({ fiche: id }, '', '#app=' + id); } catch (e) { /* rien */ }
    }
  }

  function cacherFiche() {
    ficheOuverte = null;
    $('#fiche').classList.add('hidden');
    document.body.classList.remove('sans-defilement');
  }

  function fermerFiche() {
    if (history.state && history.state.fiche) {
      history.back(); // comme le bouton retour : la fiche se ferme toute seule
    } else {
      cacherFiche();
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* rien */ }
    }
  }

  // Ouvre ou ferme la fiche selon l'adresse (#app=…)
  function ficheDepuisAdresse() {
    const m = location.hash.match(/^#app=([a-z0-9-]+)/);
    if (m && trouverAppli(m[1])) ouvrirFiche(m[1]);
    else if (ficheOuverte) cacherFiche();
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
    if (ficheOuverte) ouvrirFiche(ficheOuverte, true);
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

    // Agrandir une capture d'écran (marche aussi dans la fiche)
    // + boutons « Voir la fiche » (attribut data-fiche)
    document.addEventListener('click', function (e) {
      const img = e.target.closest('.captures img');
      if (img) {
        $('#loupe-img').src = img.src;
        $('#loupe-img').alt = img.alt;
        $('#loupe').classList.remove('hidden');
        return;
      }
      const btnFiche = e.target.closest('[data-fiche]');
      if (btnFiche) ouvrirFiche(btnFiche.getAttribute('data-fiche'));
    });
    $('#loupe').addEventListener('click', function () { this.classList.add('hidden'); });

    // Toucher le fond sombre autour de la fiche la ferme
    $('#fiche').addEventListener('click', function (e) { if (e.target === this) fermerFiche(); });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!$('#loupe').classList.contains('hidden')) $('#loupe').classList.add('hidden');
      else if (ficheOuverte) fermerFiche();
    });

    // Bouton retour du téléphone / lien partagé avec #app=…
    window.addEventListener('popstate', ficheDepuisAdresse);
    window.addEventListener('hashchange', ficheDepuisAdresse);

    $('#annee').textContent = new Date().getFullYear();
  }

  brancher();
  traduire();
  ficheDepuisAdresse(); // si le lien contient #app=…, on ouvre directement la fiche

  // Le store lui-même devient installable et s'ouvre hors connexion
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* pas grave */ });
  }
})();