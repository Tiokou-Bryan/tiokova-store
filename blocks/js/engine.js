/* =========================================================
   TIOKOVA BLOCKS — engine.js
   Le "cerveau" du jeu : règles pures, sans dessin ni son.
   Plateau = tableau de 64 cases (8x8).
     0       = case vide
     1 à 7   = case remplie (numéro de couleur + 1)
   Avantage : facile à tester et à sauvegarder.
   ========================================================= */
(function () {
  'use strict';
  const TK = (window.TK = window.TK || {});
  const N = TK.SIZE;

  /* ---------------------------------------------------------
     HASARD CONTRÔLÉ (générateur "mulberry32")
     Avec la même graine, on obtient la même suite de nombres.
     C'est ce qui permet au défi du jour d'être IDENTIQUE
     pour tous les joueurs.
     --------------------------------------------------------- */
  function RNG(seed) { this.s = seed >>> 0; }
  RNG.prototype.next = function () {
    this.s = (this.s + 0x6D2B79F5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  RNG.prototype.int = function (n) { return Math.floor(this.next() * n); };
  TK.RNG = RNG;

  const idx = function (r, c) { return r * N + c; };

  const Engine = {
    idx: idx,

    newGrid: function () {
      const g = new Array(N * N);
      for (let i = 0; i < g.length; i++) g[i] = 0;
      return g;
    },

    // Proportion de cases remplies (0 à 1)
    fillRatio: function (grid) {
      let n = 0;
      for (let i = 0; i < grid.length; i++) if (grid[i]) n++;
      return n / grid.length;
    },

    isEmpty: function (grid) {
      for (let i = 0; i < grid.length; i++) if (grid[i]) return false;
      return true;
    },

    /* Peut-on poser la pièce avec son coin haut-gauche en (r, c) ? */
    canPlace: function (grid, shape, r, c) {
      if (r < 0 || c < 0 || r + shape.h > N || c + shape.w > N) return false;
      const cells = shape.cells;
      for (let i = 0; i < cells.length; i++) {
        if (grid[idx(r + cells[i][0], c + cells[i][1])]) return false;
      }
      return true;
    },

    /* Toutes les positions possibles pour une pièce */
    positions: function (grid, shape) {
      const out = [];
      for (let r = 0; r <= N - shape.h; r++) {
        for (let c = 0; c <= N - shape.w; c++) {
          if (this.canPlace(grid, shape, r, c)) out.push([r, c]);
        }
      }
      return out;
    },

    /* La pièce rentre-t-elle quelque part ? (on s'arrête au 1er trouvé) */
    fitsAnywhere: function (grid, shape) {
      for (let r = 0; r <= N - shape.h; r++) {
        for (let c = 0; c <= N - shape.w; c++) {
          if (this.canPlace(grid, shape, r, c)) return true;
        }
      }
      return false;
    },

    /* Pose la pièce (modifie la grille). Renvoie les index remplis. */
    place: function (grid, shape, r, c, color) {
      const filled = [];
      shape.cells.forEach(function (cell) {
        const i = idx(r + cell[0], c + cell[1]);
        grid[i] = color + 1;
        filled.push(i);
      });
      return filled;
    },

    /* Lignes et colonnes complètes */
    findFull: function (grid) {
      const rows = [], cols = [];
      for (let r = 0; r < N; r++) {
        let full = true;
        for (let c = 0; c < N; c++) if (!grid[idx(r, c)]) { full = false; break; }
        if (full) rows.push(r);
      }
      for (let c = 0; c < N; c++) {
        let full = true;
        for (let r = 0; r < N; r++) if (!grid[idx(r, c)]) { full = false; break; }
        if (full) cols.push(c);
      }
      return { rows: rows, cols: cols };
    },

    /* Simule une pose SANS modifier la vraie grille :
       sert à l'aperçu (quelles lignes vont exploser ?) */
    previewClear: function (grid, shape, r, c) {
      const copy = grid.slice();
      this.place(copy, shape, r, c, 0);
      return this.findFull(copy);
    },

    /* Vide les lignes/colonnes. Renvoie [{i, v}] des cases effacées
       (v = couleur, utile pour l'animation d'explosion). */
    clearLines: function (grid, rows, cols) {
      const seen = {};
      const cleared = [];
      function take(i) {
        if (seen[i]) return;
        seen[i] = true;
        cleared.push({ i: i, v: grid[i] });
      }
      rows.forEach(function (r) { for (let c = 0; c < N; c++) take(idx(r, c)); });
      cols.forEach(function (c) { for (let r = 0; r < N; r++) take(idx(r, c)); });
      cleared.forEach(function (o) { grid[o.i] = 0; });
      return cleared;
    },

    /* Choisit une forme au hasard, avec les poids.
       Si le plateau est très rempli, on favorise les petites pièces. */
    pickShape: function (rng, fill) {
      const shapes = TK.SHAPES;
      let total = 0;
      const weights = shapes.map(function (s) {
        let w = s.weight;
        if (fill > 0.55 && s.size >= 5) w *= 0.35;
        if (fill > 0.55 && s.size <= 2) w *= 1.8;
        total += w;
        return w;
      });
      let x = rng.next() * total;
      for (let i = 0; i < shapes.length; i++) {
        x -= weights[i];
        if (x <= 0) return shapes[i];
      }
      return shapes[shapes.length - 1];
    },

    /* Les 3 pièces peuvent-elles TOUTES être posées, dans un certain ordre ?
       On essaie (comme un joueur prudent) en tenant compte des lignes
       qui explosent entre deux poses. "budget" limite le calcul
       pour ne jamais ralentir un petit téléphone. */
    canPlaceAll: function (grid, shapes) {
      const self = this;
      let budget = 4000;
      function solve(g, rest) {
        if (!rest.length) return true;
        for (let k = 0; k < rest.length; k++) {
          const sh = rest[k];
          const others = rest.slice(0, k).concat(rest.slice(k + 1));
          for (let r = 0; r <= N - sh.h; r++) {
            for (let c = 0; c <= N - sh.w; c++) {
              if (--budget < 0) return true; // trop long : on considère que c'est jouable
              if (!self.canPlace(g, sh, r, c)) continue;
              const g2 = g.slice();
              self.place(g2, sh, r, c, 0);
              const f = self.findFull(g2);
              if (f.rows.length || f.cols.length) self.clearLines(g2, f.rows, f.cols);
              if (solve(g2, others)) return true;
            }
          }
        }
        return false;
      }
      return solve(grid, shapes);
    },

    /* Génère 3 nouvelles pièces.
       Règle d'équité : on cherche une main où les 3 pièces peuvent
       être posées. Sinon, au moins une pièce qui rentre.
       (Le joueur peut quand même perdre s'il les place mal !) */
    generateTray: function (grid, rng, count) {
      count = count || 3;
      const fill = this.fillRatio(grid);
      let best = null, bestFit = -1;
      for (let attempt = 0; attempt < 25; attempt++) {
        const tray = [], shapes = [];
        let fitCount = 0;
        for (let k = 0; k < count; k++) {
          const shape = this.pickShape(rng, fill);
          tray.push({ id: shape.id, color: rng.int(7) });
          shapes.push(shape);
          if (this.fitsAnywhere(grid, shape)) fitCount++;
        }
        if (fitCount === count && (fill < 0.25 || this.canPlaceAll(grid, shapes))) return tray;
        if (fitCount > bestFit) { bestFit = fitCount; best = tray; }
      }
      // Dernier recours : on force un petit bloc s'il rentre
      if (bestFit === 0) {
        const dot = TK.SHAPE_BY_ID.dot;
        if (this.fitsAnywhere(grid, dot)) best[0] = { id: 'dot', color: rng.int(7) };
      }
      return best;
    },

    /* Reste-t-il au moins un coup possible ? */
    hasMove: function (grid, tray) {
      for (let i = 0; i < tray.length; i++) {
        if (tray[i] && this.fitsAnywhere(grid, TK.SHAPE_BY_ID[tray[i].id])) return true;
      }
      return false;
    },

    /* Cases touchées par une bombe 3x3 centrée en (r, c) */
    bombCells: function (r, c) {
      const out = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < N && cc >= 0 && cc < N) out.push(idx(rr, cc));
        }
      }
      return out;
    }
  };

  TK.Engine = Engine;
})();
