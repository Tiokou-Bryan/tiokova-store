/* =========================================================
   TIOKOVA BLOCKS — data.js
   Toutes les données "fixes" du jeu : formes des pièces,
   thèmes, bonus, missions, succès, récompenses de série.
   Séparer les données du code = on peut ajouter du contenu
   sans toucher à la logique.
   ========================================================= */
(function () {
  'use strict';
  const TK = (window.TK = window.TK || {});

  TK.VERSION = '1.0.0';
  TK.SIZE = 8;                 // plateau 8 x 8
  TK.DAILY_SECONDS = 180;      // durée du défi du jour (3 min)
  TK.REVIVE_COST = 100;        // prix pour continuer après un "game over"
  TK.CHEST_HOURS = 3;          // coffre gratuit toutes les 3 heures
  TK.GAME_URL = 'https://tiokou-bryan.github.io/tiokova-store/blocks/';
  TK.DONATE = { number: '657 15 97 93', raw: '657159793', name: 'Vanelle Maheva' };

  /* ---------------------------------------------------------
     FORMES DES PIÈCES
     Chaque pièce = liste de cases [ligne, colonne].
     "w" = poids : plus il est grand, plus la pièce sort souvent.
     "size" sert à favoriser les petites pièces quand le plateau
     est presque plein (pour éviter les fins de partie injustes).
     --------------------------------------------------------- */
  const raw = [
    // pièces simples
    { id: 'dot', w: 2, cells: [[0, 0]] },
    { id: 'h2', w: 3, cells: [[0, 0], [0, 1]] },
    { id: 'v2', w: 3, cells: [[0, 0], [1, 0]] },
    { id: 'h3', w: 3, cells: [[0, 0], [0, 1], [0, 2]] },
    { id: 'v3', w: 3, cells: [[0, 0], [1, 0], [2, 0]] },
    { id: 'h4', w: 2, cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
    { id: 'v4', w: 2, cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
    { id: 'h5', w: 1, cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
    { id: 'v5', w: 1, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
    // carrés et rectangles
    { id: 'sq2', w: 3, cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    { id: 'sq3', w: 1, cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] },
    { id: 'r23', w: 1, cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]] },
    { id: 'r32', w: 1, cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]] },
    // petits coins (3 cases)
    { id: 'c3a', w: 2, cells: [[0, 0], [1, 0], [1, 1]] },
    { id: 'c3b', w: 2, cells: [[0, 0], [0, 1], [1, 0]] },
    { id: 'c3c', w: 2, cells: [[0, 0], [0, 1], [1, 1]] },
    { id: 'c3d', w: 2, cells: [[0, 1], [1, 0], [1, 1]] },
    // L (4 cases) — 8 orientations
    { id: 'L1', w: 1, cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
    { id: 'L2', w: 1, cells: [[0, 1], [1, 1], [2, 1], [2, 0]] },
    { id: 'L3', w: 1, cells: [[0, 0], [0, 1], [1, 0], [2, 0]] },
    { id: 'L4', w: 1, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
    { id: 'L5', w: 1, cells: [[0, 0], [0, 1], [0, 2], [1, 0]] },
    { id: 'L6', w: 1, cells: [[0, 0], [0, 1], [0, 2], [1, 2]] },
    { id: 'L7', w: 1, cells: [[0, 0], [1, 0], [1, 1], [1, 2]] },
    { id: 'L8', w: 1, cells: [[0, 2], [1, 0], [1, 1], [1, 2]] },
    // T — 4 orientations
    { id: 'T1', w: 1, cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
    { id: 'T2', w: 1, cells: [[0, 1], [1, 0], [1, 1], [1, 2]] },
    { id: 'T3', w: 1, cells: [[0, 0], [1, 0], [2, 0], [1, 1]] },
    { id: 'T4', w: 1, cells: [[0, 1], [1, 1], [2, 1], [1, 0]] },
    // S / Z
    { id: 'S1', w: 1, cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
    { id: 'Z1', w: 1, cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
    { id: 'S2', w: 1, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
    { id: 'Z2', w: 1, cells: [[0, 1], [1, 1], [1, 0], [2, 0]] },
    // grands coins (5 cases)
    { id: 'B1', w: 1, cells: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
    { id: 'B2', w: 1, cells: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]] },
    { id: 'B3', w: 1, cells: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]] },
    { id: 'B4', w: 1, cells: [[0, 2], [1, 2], [2, 2], [2, 1], [2, 0]] },
    // diagonales (piège visuel, rares)
    { id: 'd2a', w: 1, cells: [[0, 0], [1, 1]] },
    { id: 'd2b', w: 1, cells: [[0, 1], [1, 0]] }
  ];

  // On calcule largeur / hauteur une seule fois ici.
  TK.SHAPES = raw.map(function (s) {
    let w = 0, h = 0;
    s.cells.forEach(function (c) {
      if (c[0] + 1 > h) h = c[0] + 1;
      if (c[1] + 1 > w) w = c[1] + 1;
    });
    return { id: s.id, weight: s.w, cells: s.cells, w: w, h: h, size: s.cells.length };
  });
  TK.SHAPE_BY_ID = {};
  TK.SHAPES.forEach(function (s) { TK.SHAPE_BY_ID[s.id] = s; });

  /* ---------------------------------------------------------
     THÈMES (achetables en boutique)
     style : façon de dessiner un bloc (voir renderer.js)
     --------------------------------------------------------- */
  TK.THEMES = [
    {
      id: 'neon', price: 0, level: 1,
      name: { fr: 'Néon', en: 'Neon' },
      bg: ['#0f1024', '#1b1442'], board: '#14152f', empty: '#1f2146', line: '#2a2c5a',
      accent: '#7c5cff', accent2: '#22d3ee', style: 'gloss',
      colors: ['#ff4d6d', '#ffb703', '#06d6a0', '#3a86ff', '#b5179e', '#fb8500', '#4cc9f0']
    },
    {
      id: 'sahel', price: 300, level: 2,
      name: { fr: 'Sahel', en: 'Sahel' },
      bg: ['#2b1408', '#4a230c'], board: '#3a1d0b', empty: '#4f2a12', line: '#6a3a1a',
      accent: '#f4a261', accent2: '#e9c46a', style: 'flat',
      colors: ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#c1121f', '#ffb4a2', '#bc6c25']
    },
    {
      id: 'ocean', price: 500, level: 3,
      name: { fr: 'Océan', en: 'Ocean' },
      bg: ['#03142e', '#05325c'], board: '#04213f', empty: '#0a2f55', line: '#0f3e6e',
      accent: '#00b4d8', accent2: '#90e0ef', style: 'glow',
      colors: ['#00b4d8', '#48cae4', '#90e0ef', '#0077b6', '#64dfdf', '#80ffdb', '#5390d9']
    },
    {
      id: 'foret', price: 500, level: 3,
      name: { fr: 'Forêt', en: 'Forest' },
      bg: ['#0b1d12', '#16341f'], board: '#10281a', empty: '#183823', line: '#22492f',
      accent: '#52b788', accent2: '#b7e4c7', style: 'gloss',
      colors: ['#2d6a4f', '#40916c', '#52b788', '#95d5b2', '#d4a373', '#ccd5ae', '#e9edc9']
    },
    {
      id: 'bonbon', price: 800, level: 4,
      name: { fr: 'Bonbon', en: 'Candy' },
      bg: ['#3a0f3d', '#6a1b5e'], board: '#4a1449', empty: '#5e1d5b', line: '#76286f',
      accent: '#ff70a6', accent2: '#ffd670', style: 'candy',
      colors: ['#ff70a6', '#ff9770', '#ffd670', '#e9ff70', '#70d6ff', '#c77dff', '#ff5d8f']
    },
    {
      id: 'pagne', price: 1200, level: 5,
      name: { fr: 'Pagne', en: 'Wax print' },
      bg: ['#1a0b2e', '#3d0f2b'], board: '#24102f', empty: '#331842', line: '#462157',
      accent: '#f77f00', accent2: '#fcbf49', style: 'stripe',
      colors: ['#d62828', '#f77f00', '#fcbf49', '#2a9d8f', '#3a0ca3', '#06d6a0', '#ef476f']
    },
    {
      id: 'nuit', price: 1200, level: 6,
      name: { fr: 'Nuit étoilée', en: 'Starry night' },
      bg: ['#020617', '#0f172a'], board: '#0b1224', empty: '#141d36', line: '#1e2a4a',
      accent: '#a78bfa', accent2: '#f0abfc', style: 'gem',
      colors: ['#a78bfa', '#818cf8', '#60a5fa', '#f0abfc', '#c4b5fd', '#93c5fd', '#e879f9']
    },
    {
      id: 'or', price: 2000, level: 8,
      name: { fr: 'Or royal', en: 'Royal gold' },
      bg: ['#140f02', '#2e2206'], board: '#1d1604', empty: '#2b210a', line: '#3d2f0f',
      accent: '#ffd60a', accent2: '#ffc300', style: 'gem',
      colors: ['#ffd60a', '#ffc300', '#e0a800', '#fff3b0', '#d4a017', '#f5d76e', '#c9a227']
    }
  ];
  TK.THEME_BY_ID = {};
  TK.THEMES.forEach(function (t) { TK.THEME_BY_ID[t.id] = t; });

  /* ---------------------------------------------------------
     BONUS (power-ups)
     --------------------------------------------------------- */
  TK.POWERS = [
    { id: 'hammer', icon: '🔨', price: 60 },
    { id: 'bomb', icon: '💣', price: 120 },
    { id: 'shuffle', icon: '🔄', price: 80 }
  ];
  TK.POWER_BY_ID = {};
  TK.POWERS.forEach(function (p) { TK.POWER_BY_ID[p.id] = p; });

  // Lots (packs) : un peu moins chers que l'achat à l'unité
  TK.PACKS = [
    { id: 'pack_start', price: 220, items: { hammer: 2, bomb: 1, shuffle: 1 } },
    { id: 'pack_big', price: 500, items: { hammer: 4, bomb: 3, shuffle: 3 } },
    { id: 'freeze', price: 150, items: { freeze: 1 } }
  ];

  /* ---------------------------------------------------------
     RÉCOMPENSES DE SÉRIE (cycle de 7 jours)
     --------------------------------------------------------- */
  TK.STREAK_REWARDS = [
    { coins: 20 },
    { coins: 30 },
    { coins: 40, hammer: 1 },
    { coins: 50 },
    { coins: 60, shuffle: 1 },
    { coins: 80 },
    { coins: 150, bomb: 1 }
  ];

  /* ---------------------------------------------------------
     MISSIONS QUOTIDIENNES
     stat : ce qu'on mesure aujourd'hui
     mode : 'sum' = on additionne, 'max' = meilleur résultat
     targets : niveaux de difficulté possibles
     --------------------------------------------------------- */
  TK.MISSION_POOL = [
    { id: 'm_lines', stat: 'lines', mode: 'sum', targets: [10, 20, 35], reward: [30, 50, 80] },
    { id: 'm_games', stat: 'games', mode: 'sum', targets: [2, 3, 5], reward: [25, 40, 60] },
    { id: 'm_score', stat: 'score', mode: 'max', targets: [300, 600, 1000], reward: [30, 50, 90] },
    { id: 'm_combo', stat: 'combo', mode: 'max', targets: [2, 3, 5], reward: [30, 50, 80] },
    { id: 'm_pieces', stat: 'pieces', mode: 'sum', targets: [40, 80, 150], reward: [25, 45, 70] },
    { id: 'm_multi', stat: 'multi', mode: 'sum', targets: [2, 4, 8], reward: [35, 55, 85] },
    { id: 'm_daily', stat: 'daily', mode: 'sum', targets: [1, 1, 1], reward: [40, 40, 40] },
    { id: 'm_stars', stat: 'stars', mode: 'max', targets: [1, 2, 3], reward: [30, 60, 100] },
    { id: 'm_powers', stat: 'powers', mode: 'sum', targets: [1, 2, 3], reward: [20, 35, 50] },
    { id: 'm_clears', stat: 'clears', mode: 'sum', targets: [1, 1, 2], reward: [60, 60, 120] }
  ];
  TK.MISSIONS_BONUS = { coins: 100, bomb: 1 };

  /* ---------------------------------------------------------
     SUCCÈS (achievements)
     stat : statistique "à vie" (voir storage.js -> stats)
     --------------------------------------------------------- */
  TK.ACHIEVEMENTS = [
    { id: 'first_game', icon: '🎮', stat: 'games', target: 1, reward: 20 },
    { id: 'games_10', icon: '🕹️', stat: 'games', target: 10, reward: 50 },
    { id: 'games_50', icon: '👾', stat: 'games', target: 50, reward: 120 },
    { id: 'games_200', icon: '🏟️', stat: 'games', target: 200, reward: 300 },
    { id: 'lines_10', icon: '➖', stat: 'lines', target: 10, reward: 20 },
    { id: 'lines_100', icon: '📏', stat: 'lines', target: 100, reward: 80 },
    { id: 'lines_500', icon: '🧱', stat: 'lines', target: 500, reward: 200 },
    { id: 'lines_2000', icon: '🏗️', stat: 'lines', target: 2000, reward: 500 },
    { id: 'score_500', icon: '🥉', stat: 'bestScore', target: 500, reward: 40 },
    { id: 'score_1000', icon: '🥈', stat: 'bestScore', target: 1000, reward: 80 },
    { id: 'score_2500', icon: '🥇', stat: 'bestScore', target: 2500, reward: 200 },
    { id: 'score_5000', icon: '💎', stat: 'bestScore', target: 5000, reward: 400 },
    { id: 'combo_3', icon: '⚡', stat: 'bestCombo', target: 3, reward: 40 },
    { id: 'combo_6', icon: '🌩️', stat: 'bestCombo', target: 6, reward: 100 },
    { id: 'combo_10', icon: '🌪️', stat: 'bestCombo', target: 10, reward: 250 },
    { id: 'multi_3', icon: '💥', stat: 'maxLinesOnce', target: 3, reward: 60 },
    { id: 'multi_4', icon: '🎆', stat: 'maxLinesOnce', target: 4, reward: 150 },
    { id: 'clear_1', icon: '✨', stat: 'boardClears', target: 1, reward: 80 },
    { id: 'clear_10', icon: '🌟', stat: 'boardClears', target: 10, reward: 250 },
    { id: 'daily_1', icon: '📅', stat: 'dailyDone', target: 1, reward: 30 },
    { id: 'daily_7', icon: '🗓️', stat: 'dailyDone', target: 7, reward: 100 },
    { id: 'daily_30', icon: '📆', stat: 'dailyDone', target: 30, reward: 350 },
    { id: 'stars3_1', icon: '⭐', stat: 'threeStars', target: 1, reward: 60 },
    { id: 'stars3_10', icon: '🌠', stat: 'threeStars', target: 10, reward: 250 },
    { id: 'streak_3', icon: '🔥', stat: 'streakBest', target: 3, reward: 40 },
    { id: 'streak_7', icon: '🔥', stat: 'streakBest', target: 7, reward: 120 },
    { id: 'streak_30', icon: '☄️', stat: 'streakBest', target: 30, reward: 500 },
    { id: 'level_5', icon: '🎓', stat: 'level', target: 5, reward: 60 },
    { id: 'level_10', icon: '🧠', stat: 'level', target: 10, reward: 150 },
    { id: 'level_25', icon: '👑', stat: 'level', target: 25, reward: 400 },
    { id: 'theme_2', icon: '🎨', stat: 'themesOwned', target: 2, reward: 30 },
    { id: 'theme_all', icon: '🖼️', stat: 'themesOwned', target: 8, reward: 500 },
    { id: 'powers_10', icon: '🧰', stat: 'powersUsed', target: 10, reward: 50 },
    { id: 'missions_10', icon: '🎯', stat: 'missionsDone', target: 10, reward: 80 },
    { id: 'missions_50', icon: '🏹', stat: 'missionsDone', target: 50, reward: 250 },
    { id: 'pieces_1000', icon: '🧩', stat: 'pieces', target: 1000, reward: 150 }
  ];

  /* Étoiles du défi du jour : seuils de score */
  TK.DAILY_STARS = [300, 650, 1100];

  /* Score d'une explosion de n lignes en une fois.
     1 ligne = 10, 2 = 30, 3 = 60, 4 = 100, 5 = 150 ...
     (la formule n(n+1)/2 x 10 récompense fortement les gros coups) */
  TK.lineScore = function (n) { return (n * (n + 1) / 2) * 10; };

  /* XP nécessaire pour passer du niveau L au niveau L+1 */
  TK.xpForLevel = function (L) { return 80 + L * 40; };
})();
