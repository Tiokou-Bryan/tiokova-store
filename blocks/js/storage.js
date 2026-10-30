/* =========================================================
   TIOKOVA BLOCKS — storage.js
   Sauvegarde de toute la progression dans le téléphone
   (localStorage). Le joueur peut fermer l'appli : rien n'est perdu.
   ========================================================= */
(function () {
  'use strict';
  const TK = (window.TK = window.TK || {});
  const KEY = 'tiokova_blocks_v1';

  /* ---------- Outils de date (heure LOCALE du téléphone) ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // "2026-10-30" : clé du jour, utilisée pour le défi, les missions, la série
  TK.dayKey = function (d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };

  // Différence en jours entre deux clés "AAAA-MM-JJ"
  TK.dayDiff = function (a, b) {
    const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
    // Date.UTC évite les pièges des changements d'heure
    const ta = Date.UTC(pa[0], pa[1] - 1, pa[2]);
    const tb = Date.UTC(pb[0], pb[1] - 1, pb[2]);
    return Math.round((tb - ta) / 86400000);
  };

  // Millisecondes restantes avant minuit (pour "nouvelles missions dans ...")
  TK.msToMidnight = function () {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return next - now;
  };

  // Transforme une clé de jour en nombre (graine du hasard du défi)
  TK.hashString = function (str) {
    let h = 2166136261 >>> 0; // FNV-1a
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  };

  /* ---------- État par défaut d'un nouveau joueur ---------- */
  function defaults() {
    return {
      v: 1,
      name: '',
      lang: (navigator.language || 'fr').toLowerCase().indexOf('en') === 0 ? 'en' : 'fr',
      sound: true,
      music: false,
      vibe: true,

      coins: 150,
      xp: 0,
      level: 1,

      best: 0,                // meilleur score classique
      top: [],                // 10 meilleurs scores classiques [{s, d}]
      inv: { hammer: 2, bomb: 1, shuffle: 2, freeze: 0 },
      themes: ['neon'],
      theme: 'neon',

      streak: { count: 0, best: 0, last: null },
      daily: {},              // { "2026-10-30": { best, stars, rewardedStars } }

      missions: { date: null, list: [], progress: {}, bonusClaimed: false },

      stats: {
        games: 0, lines: 0, pieces: 0, boardClears: 0, maxLinesOnce: 0,
        bestCombo: 0, dailyDone: 0, powersUsed: 0, coinsEarned: 0,
        threeStars: 0, missionsDone: 0, playTime: 0, bestScore: 0
      },
      ach: { unlocked: {}, claimed: {} },

      chestAt: 0,             // timestamp du dernier coffre ouvert
      shareDay: null,         // dernier jour où la récompense de partage a été donnée
      tutoDone: false,
      saved: { classic: null, daily: null }, // parties en cours
      firstPlay: TK.dayKey()
    };
  }

  // Fusion "profonde" : si on ajoute de nouveaux champs dans une
  // future version, les anciens joueurs les reçoivent automatiquement.
  function merge(base, data) {
    if (!data || typeof data !== 'object') return base;
    Object.keys(base).forEach(function (k) {
      if (!(k in data)) return;
      const b = base[k], d = data[k];
      if (b && typeof b === 'object' && !Array.isArray(b) && d && typeof d === 'object' && !Array.isArray(d)) {
        // Les objets "dictionnaire" (daily, saved…) gardent toutes leurs clés
        base[k] = merge(b, d);
        Object.keys(d).forEach(function (kk) { if (!(kk in b)) base[k][kk] = d[kk]; });
      } else {
        base[k] = d;
      }
    });
    return base;
  }

  let saveTimer = null;

  TK.Store = {
    data: null,

    load: function () {
      let parsed = null;
      try {
        const txt = localStorage.getItem(KEY);
        if (txt) parsed = JSON.parse(txt);
      } catch (e) {
        console.warn('Sauvegarde illisible, nouvelle partie.', e);
      }
      this.data = merge(defaults(), parsed);
      this.cleanup();
      return this.data;
    },

    // Sauvegarde immédiate
    save: function () {
      if (!this.data) return;
      try {
        localStorage.setItem(KEY, JSON.stringify(this.data));
      } catch (e) {
        console.warn('Impossible de sauvegarder', e);
      }
    },

    // Sauvegarde "groupée" : si on appelle 10 fois en 1 seconde,
    // on n'écrit qu'une seule fois (plus rapide sur les petits téléphones).
    saveSoon: function () {
      const self = this;
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(function () { saveTimer = null; self.save(); }, 400);
    },

    reset: function () {
      try { localStorage.removeItem(KEY); } catch (e) { /* rien */ }
      this.data = defaults();
      this.save();
    },

    // On ne garde que les 60 derniers jours de défis pour ne pas
    // remplir la mémoire du téléphone.
    cleanup: function () {
      const d = this.data.daily;
      const keys = Object.keys(d).sort();
      while (keys.length > 60) delete d[keys.shift()];
      if (this.data.top.length > 10) this.data.top.length = 10;
    }
  };
})();
