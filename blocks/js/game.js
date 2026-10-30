/* =========================================================
   TIOKOVA BLOCKS — game.js
   Le "chef d'orchestre" d'une partie :
   démarrage, pose des pièces, score, combos, bonus,
   minuteur du défi, fin de partie et récompenses.
   ========================================================= */
(function () {
  'use strict';
  const TK = (window.TK = window.TK || {});
  const E = TK.Engine;
  const N = TK.SIZE;

  const G = {
    s: null,            // état de la partie en cours
    rng: null,
    running: false,
    paused: false,
    power: null,        // bonus sélectionné ('hammer' | 'bomb' | null)
    shownScore: 0,      // score affiché (monte doucement)
    lastFrame: 0,
    lastTick: -1,
    endPending: false,

    /* ---------------------------------------------------------
       DÉMARRER UNE PARTIE
       mode : 'classic' ou 'daily'
       saved : partie sauvegardée à reprendre (facultatif)
       --------------------------------------------------------- */
    start: function (mode, saved) {
      const today = TK.dayKey();
      if (saved) {
        this.s = JSON.parse(JSON.stringify(saved));
        this.rng = new TK.RNG(this.s.rngS);
      } else {
        const seed = mode === 'daily'
          ? TK.hashString('daily-' + today)
          : (Math.random() * 4294967296) >>> 0;
        this.rng = new TK.RNG(seed);
        const grid = E.newGrid();
        if (mode === 'daily') this.dailyObstacles(grid);
        this.s = {
          mode: mode, dateKey: today, grid: grid,
          tray: E.generateTray(grid, this.rng),
          rngS: this.rng.s,
          score: 0, combo: 0, sinceClear: 0, maxCombo: 0,
          lines: 0, pieces: 0, clears: 0, multi: 0, powers: 0, maxLinesOnce: 0,
          timeLeft: mode === 'daily' ? TK.DAILY_SECONDS : null,
          revived: false, playMs: 0
        };
      }
      this.gameId = (this.gameId || 0) + 1;
      TK.UI.closeModal(true);
      TK.$('#combo-banner').classList.remove('show');
      this.running = true;
      this.paused = false;
      this.power = null;
      this.endPending = false;
      this.shownScore = this.s.score;
      this.lastTick = -1;
      TK.Renderer.placed = {};
      TK.Renderer.clearing = [];
      TK.Renderer.particles = [];
      TK.Renderer.floats = [];
      TK.Renderer.newTray();
      TK.Input.cancel();

      TK.UI.show('game');
      TK.Renderer.resize();
      this.updateTopBar();
      this.updatePowerButtons();
      TK.$('#game-timer').classList.toggle('hidden', mode !== 'daily');
      TK.$('#game-target').classList.toggle('hidden', mode !== 'daily');
      TK.Audio.startMusic();
      this.lastFrame = performance.now();
      if (!this.rafOn) {
        this.rafOn = true;
        requestAnimationFrame(this.loop.bind(this));
      }
      // Partie reprise déjà bloquée ? (rare)
      const self = this;
      setTimeout(function () { self.checkStuck(); }, 400);
    },

    /* Le défi du jour commence avec quelques blocs déjà posés :
       chaque jour a donc son propre "puzzle" de départ. */
    dailyObstacles: function (grid) {
      const n = 6 + this.rng.int(6);
      let placed = 0, guard = 0;
      while (placed < n && guard++ < 200) {
        const i = this.rng.int(N * N);
        if (grid[i]) continue;
        grid[i] = 1 + this.rng.int(7);
        // on n'accepte pas une ligne/colonne déjà complète
        const f = E.findFull(grid);
        if (f.rows.length || f.cols.length) { grid[i] = 0; continue; }
        placed++;
      }
    },

    /* ---------------------------------------------------------
       BOUCLE D'ANIMATION (~60 images / seconde)
       --------------------------------------------------------- */
    loop: function (now) {
      const dt = Math.min(100, now - this.lastFrame);
      this.lastFrame = now;
      const onGame = TK.UI.current === 'game';

      if (this.running && onGame && this.s) {
        const active = !this.paused && !TK.UI.modalOpen && !this.s.over;
        if (active) {
          this.s.playMs += dt;
          if (this.s.mode === 'daily') this.updateTimer(dt);
        }
        // le score affiché rattrape le vrai score (effet compteur)
        if (this.shownScore < this.s.score) {
          this.shownScore += Math.max(1, (this.s.score - this.shownScore) * 0.18);
          if (this.shownScore > this.s.score) this.shownScore = this.s.score;
          TK.$('#score-now').textContent = TK.fmt(this.shownScore);
        }
        TK.Renderer.draw(this.s, TK.Input.view(!!this.power));
      }
      requestAnimationFrame(this.loop.bind(this));
    },

    updateTimer: function (dt) {
      const s = this.s;
      s.timeLeft -= dt / 1000;
      const left = Math.max(0, s.timeLeft);
      const sec = Math.ceil(left);
      const el = TK.$('#game-timer');
      el.textContent = Math.floor(sec / 60) + ':' + ((sec % 60) < 10 ? '0' : '') + (sec % 60);
      el.classList.toggle('urgent', sec <= 10);
      if (sec <= 10 && sec !== this.lastTick && sec > 0) {
        this.lastTick = sec;
        TK.Audio.tick();
      }
      if (left <= 0 && !this.endPending) {
        this.endPending = true;
        TK.Input.cancel();
        TK.UI.toast('⏱️ ' + TK.t('time_up'), 'warn');
        const self = this, id = this.gameId;
        setTimeout(function () { if (id === self.gameId) self.finish('time'); }, 700);
      }
    },

    updateTopBar: function () {
      const s = this.s, d = TK.Store.data;
      TK.$('#score-now').textContent = TK.fmt(Math.floor(this.shownScore));
      if (s.mode === 'daily') {
        const rec = d.daily[s.dateKey];
        TK.$('#score-best').textContent = TK.fmt(rec ? rec.best : 0);
        // prochaine étoile à viser
        const next = TK.DAILY_STARS.find(function (th) { return s.score < th; });
        const stars = TK.Progress.starsFor(s.score);
        TK.$('#game-target').innerHTML = '<span class="mini-stars">' + '★'.repeat(stars) + '<i>' + '★'.repeat(3 - stars) + '</i></span>' +
          (next ? '<small>' + TK.t('next_star') + ' ' + TK.fmt(next) + '</small>' : '<small>' + TK.t('max_stars') + '</small>');
      } else {
        TK.$('#score-best').textContent = TK.fmt(Math.max(d.best, s.score));
      }
    },

    canInteract: function () {
      return this.running && !this.paused && !TK.UI.modalOpen && this.s && !this.s.over && !this.endPending;
    },

    /* ---------------------------------------------------------
       POSER UNE PIÈCE
       --------------------------------------------------------- */
    place: function (index, r, c) {
      const s = this.s;
      const piece = s.tray[index];
      if (!piece) return;
      const shape = TK.SHAPE_BY_ID[piece.id];
      if (!E.canPlace(s.grid, shape, r, c)) return;

      const filled = E.place(s.grid, shape, r, c, piece.color);
      s.tray[index] = null;
      TK.Renderer.addPlaced(filled);
      TK.Audio.place(shape.size);
      TK.Audio.vibrate(12);

      // 1 point par case posée
      s.score += shape.size;
      s.pieces++;
      TK.Store.data.stats.pieces++;
      TK.Progress.track('pieces', 1);

      // Lignes complètes ?
      const full = E.findFull(s.grid);
      const n = full.rows.length + full.cols.length;
      if (n > 0) {
        s.combo++;
        s.sinceClear = 0;
        this.explode(full, n, r + shape.h / 2, c + shape.w / 2);
      } else {
        s.sinceClear++;
        // le combo survit à 2 poses sans explosion, pas à 3
        if (s.sinceClear >= 3 && s.combo > 0) {
          s.combo = 0;
          this.showCombo(0);
        }
      }

      // Plus de pièces ? On en distribue 3 nouvelles
      if (!s.tray[0] && !s.tray[1] && !s.tray[2]) {
        s.tray = E.generateTray(s.grid, this.rng);
        TK.Renderer.newTray();
      }
      s.rngS = this.rng.s;
      this.updateTopBar();
      this.save();
      this.checkStuck();
    },

    /* Explosion de lignes : score, effets, combo */
    explode: function (full, n, cr, cc) {
      const s = this.s, d = TK.Store.data;
      const cleared = E.clearLines(s.grid, full.rows, full.cols);
      // on trie les cases par distance au point de pose : effet "onde"
      cleared.sort(function (a, b) {
        const da = Math.abs(Math.floor(a.i / N) - cr) + Math.abs((a.i % N) - cc);
        const db = Math.abs(Math.floor(b.i / N) - cr) + Math.abs((b.i % N) - cc);
        return da - db;
      });
      TK.Renderer.addClear(cleared, 9);

      // Multiplicateur de combo : x1, x1.5, x2, x2.5 …
      const mult = 1 + (s.combo - 1) * 0.5;
      const points = Math.round(TK.lineScore(n) * mult);
      s.score += points;
      s.lines += n;
      if (n >= 2) { s.multi++; TK.Progress.track('multi', 1); }
      s.maxLinesOnce = Math.max(s.maxLinesOnce, n);
      s.maxCombo = Math.max(s.maxCombo, s.combo);

      d.stats.lines += n;
      d.stats.maxLinesOnce = Math.max(d.stats.maxLinesOnce, n);
      d.stats.bestCombo = Math.max(d.stats.bestCombo, s.combo);
      TK.Progress.track('lines', n);
      TK.Progress.track('combo', s.combo);

      // Effets visuels
      const L = TK.Renderer.L;
      const fx = L.bx + (cc / N) * L.bs;
      const fy = L.by + (cr / N) * L.bs;
      TK.Renderer.addFloat('+' + points, fx, fy, { size: 24 + n * 4, color: '#fff' });
      if (n >= 2) {
        const words = ['', '', TK.t('w_nice'), TK.t('w_great'), TK.t('w_amazing'), TK.t('w_legend')];
        TK.Renderer.addFloat(words[Math.min(n, 5)], L.W / 2, L.by + L.bs * 0.4, { size: 34, color: TK.Renderer.theme.accent2, life: 1300 });
        TK.Renderer.shake(4 + n * 2);
      }
      TK.Audio.clear(n, s.combo);
      TK.Audio.vibrate(n >= 3 ? [30, 40, 60] : 25);
      this.showCombo(s.combo);

      // Plateau entièrement vide = gros bonus !
      if (E.isEmpty(s.grid)) {
        s.score += 300;
        s.clears++;
        d.stats.boardClears++;
        TK.Progress.track('clears', 1);
        TK.Renderer.addFloat(TK.t('board_clear') + ' +300', L.W / 2, L.by + L.bs / 2, { size: 30, color: '#ffd60a', life: 1600 });
        TK.Renderer.flash('#ffffff', 400);
        TK.Audio.boardClear();
        TK.UI.confetti();
      }
    },

    showCombo: function (n) {
      const el = TK.$('#combo-banner');
      if (n < 2) { el.classList.remove('show'); return; }
      el.textContent = TK.t('combo') + ' x' + n;
      el.classList.remove('show');
      void el.offsetWidth;         // relance l'animation CSS
      el.classList.add('show');
      if (n >= 3) TK.Audio.combo(n);
    },

    /* ---------------------------------------------------------
       BLOQUÉ ? (aucune pièce ne rentre)
       --------------------------------------------------------- */
    checkStuck: function () {
      const s = this.s;
      if (!s || s.over || this.endPending) return;
      if (E.hasMove(s.grid, s.tray)) return;
      this.endPending = true;
      const self = this, id = this.gameId;
      // petite pause pour laisser finir l'explosion
      setTimeout(function () {
        // la partie a pu changer entre-temps (rejouer, accueil…)
        if (id !== self.gameId || !self.s || self.s.over || !self.running) return;
        if (E.hasMove(self.s.grid, self.s.tray)) { self.endPending = false; return; }
        if (TK.UI.current !== 'game' || self.paused) { self.endPending = false; return; }
        self.offerContinue();
      }, 650);
    },

    offerContinue: function () {
      const s = this.s, d = TK.Store.data;
      const self = this;
      TK.Audio.vibrate([40, 60, 40]);
      const hasPower = (d.inv.hammer || 0) + (d.inv.bomb || 0) + (d.inv.shuffle || 0) > 0;
      const buttons = [];
      if (!s.revived) {
        buttons.push({
          label: '❤️ ' + TK.t('revive') + ' · ' + TK.REVIVE_COST + ' 🪙',
          cls: 'btn-primary', disabled: d.coins < TK.REVIVE_COST,
          action: function () { self.revive(); }
        });
      }
      if (hasPower) {
        buttons.push({
          label: '🧰 ' + TK.t('use_power'), cls: 'btn-ghost',
          action: function () {
            self.endPending = false;
            TK.UI.toast(TK.t('pick_power'), 'info');
            self.pulsePowers();
          }
        });
      }
      buttons.push({ label: TK.t('end_game'), cls: 'btn-ghost', action: function () { self.finish('noMoves'); } });
      TK.UI.modal({
        icon: '🧱', title: TK.t('no_space'),
        html: '<p>' + TK.t('no_space_txt') + '</p>' +
          (!s.revived ? '<p class="muted">' + TK.t('revive_txt') + '</p>' : ''),
        buttons: buttons,
        onClose: function () { self.finish('noMoves'); }
      });
    },

    revive: function () {
      const s = this.s;
      if (!TK.Progress.spend(TK.REVIVE_COST)) return;
      s.revived = true;
      // on vide les 4 lignes du milieu
      const cleared = [];
      for (let r = 2; r < 6; r++) {
        for (let c = 0; c < N; c++) {
          const i = r * N + c;
          if (s.grid[i]) { cleared.push({ i: i, v: s.grid[i] }); s.grid[i] = 0; }
        }
      }
      TK.Renderer.addClear(cleared, 6);
      TK.Audio.bomb();
      TK.Renderer.shake(10);
      s.tray = E.generateTray(s.grid, this.rng);
      s.rngS = this.rng.s;
      TK.Renderer.newTray();
      this.endPending = false;
      this.save();
      TK.UI.toast('❤️ ' + TK.t('revived'), 'good');
    },

    pulsePowers: function () {
      TK.$$('.power').forEach(function (b) {
        b.classList.remove('pulse');
        void b.offsetWidth;
        b.classList.add('pulse');
      });
    },

    /* ---------------------------------------------------------
       BONUS
       --------------------------------------------------------- */
    selectPower: function (p) {
      if (!this.running || this.s.over || this.paused) return;
      if (TK.UI.modalOpen) return;
      const d = TK.Store.data;
      const self = this;
      if ((d.inv[p] || 0) <= 0) {
        // pas de stock : proposer d'en acheter un
        const def = TK.POWER_BY_ID[p];
        TK.UI.modal({
          icon: def.icon, title: TK.t('p_' + p),
          html: '<p>' + TK.t('p_' + p + '_desc') + '</p><p class="muted">' + TK.t('no_stock') + '</p>',
          buttons: [
            { label: TK.t('cancel'), cls: 'btn-ghost' },
            {
              label: TK.t('buy') + ' · ' + def.price + ' 🪙', cls: 'btn-primary', disabled: d.coins < def.price,
              action: function () {
                if (TK.Progress.spend(def.price)) {
                  d.inv[p] = (d.inv[p] || 0) + 1;
                  TK.Store.save();
                  self.updatePowerButtons();
                  self.selectPower(p);
                }
              }
            }
          ]
        });
        return;
      }
      if (p === 'shuffle') { this.useShuffle(); return; }
      this.power = this.power === p ? null : p;
      TK.Input.cancel();
      this.updatePowerButtons();
    },

    updatePowerButtons: function () {
      const self = this;
      TK.$$('.power').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-power') === self.power);
      });
      const hint = TK.$('#power-hint');
      if (this.power) {
        hint.textContent = TK.t('hint_' + this.power);
        hint.classList.remove('hidden');
      } else {
        hint.classList.add('hidden');
      }
      TK.UI.refreshHUD();
    },

    consumePower: function (p) {
      const d = TK.Store.data;
      d.inv[p]--;
      d.stats.powersUsed++;
      this.s.powers++;
      TK.Progress.track('powers', 1);
      this.power = null;
      this.updatePowerButtons();
      TK.Progress.checkAchievements();
    },

    usePowerAt: function (p, r, c) {
      const s = this.s;
      const i = r * N + c;
      if (p === 'hammer') {
        if (!s.grid[i]) { TK.Audio.invalid(); TK.UI.toast(TK.t('hint_hammer'), 'info'); return; }
        TK.Renderer.addClear([{ i: i, v: s.grid[i] }], 0);
        s.grid[i] = 0;
        TK.Audio.hammer();
        TK.Audio.vibrate(30);
        TK.Renderer.shake(5);
      } else if (p === 'bomb') {
        const cells = E.bombCells(r, c).filter(function (k) { return s.grid[k]; });
        if (!cells.length) { TK.Audio.invalid(); TK.UI.toast(TK.t('hint_bomb'), 'info'); return; }
        TK.Renderer.addClear(cells.map(function (k) { return { i: k, v: s.grid[k] }; }), 15);
        cells.forEach(function (k) { s.grid[k] = 0; });
        TK.Audio.bomb();
        TK.Audio.vibrate([50, 30, 80]);
        TK.Renderer.shake(14, 450);
        TK.Renderer.flash('#ff7b54', 300);
      }
      this.consumePower(p);
      this.save();
      this.checkStuck();
    },

    useShuffle: function () {
      const s = this.s;
      const fresh = E.generateTray(s.grid, this.rng);
      for (let k = 0; k < 3; k++) if (s.tray[k]) s.tray[k] = fresh[k];
      // si toutes étaient déjà posées, rien à mélanger (n'arrive pas en pratique)
      s.rngS = this.rng.s;
      TK.Renderer.newTray();
      TK.Audio.shuffle();
      this.consumePower('shuffle');
      this.save();
      this.checkStuck();
    },

    /* ---------------------------------------------------------
       PAUSE
       --------------------------------------------------------- */
    pause: function () {
      if (!this.running || this.s.over || this.paused || TK.UI.modalOpen) return;
      this.paused = true;
      TK.Input.cancel();
      const self = this;
      TK.UI.modal({
        icon: '⏸️', title: TK.t('paused'),
        html: '<p class="muted">' + TK.t('paused_txt') + '</p>',
        buttons: [
          { label: '▶ ' + TK.t('resume'), cls: 'btn-primary', action: function () { self.paused = false; self.checkStuck(); } },
          {
            label: '↻ ' + TK.t('restart'), cls: 'btn-ghost', action: function () {
              self.paused = false;
              self.abandon();
              self.start(self.s.mode);
            }
          },
          {
            label: '🏠 ' + TK.t('home'), cls: 'btn-ghost', action: function () {
              self.paused = false;
              self.leave();
            }
          }
        ],
        onClose: function () { self.paused = false; self.checkStuck(); }
      });
    },

    // Retour à l'accueil : la partie reste sauvegardée (on pourra continuer)
    leave: function () {
      this.save();
      this.running = false;
      this.power = null;
      TK.Audio.stopMusic();
      TK.UI.show('home', { noHistory: true });
      TK.UI.history = [];
      TK.Screens.refreshHome();
    },

    // Abandon : la partie compte quand même (score, stats), sans récompense de fin
    abandon: function () {
      if (!this.s) return;
      TK.Store.data.saved[this.s.mode] = null;
      if (this.s.score > 0) this.recordStats(true);
      TK.Store.save();
    },

    save: function () {
      if (!this.s || this.s.over) return;
      TK.Store.data.saved[this.s.mode] = JSON.parse(JSON.stringify(this.s));
      TK.Store.saveSoon();
    },

    /* Met à jour les stats "à vie" et les records */
    recordStats: function (quiet) {
      const s = this.s, d = TK.Store.data;
      d.stats.games++;
      d.stats.playTime += Math.round(s.playMs / 1000);
      TK.Progress.track('games', 1);
      TK.Progress.track('score', s.score);
      let newBest = false;
      if (s.mode === 'classic') {
        if (s.score > d.best) { newBest = d.best > 0; d.best = s.score; }
        d.stats.bestScore = Math.max(d.stats.bestScore, s.score);
        d.top.push({ s: s.score, d: TK.dayKey(), l: s.lines, c: s.maxCombo });
        d.top.sort(function (a, b) { return b.s - a.s; });
        d.top = d.top.slice(0, 10);
      } else {
        d.stats.bestScore = Math.max(d.stats.bestScore, s.score);
      }
      return newBest;
    },

    /* ---------------------------------------------------------
       FIN DE PARTIE + RÉCOMPENSES
       --------------------------------------------------------- */
    finish: function (reason) {
      const s = this.s;
      if (!s || s.over) return;
      s.over = true;
      this.endPending = true;
      this.power = null;
      this.updatePowerButtons();
      const d = TK.Store.data;
      d.saved[s.mode] = null;

      const prevBest = d.best;
      const newBest = this.recordStats();
      // Récompenses de fin de partie
      const coins = Math.floor(s.score / 40) + s.clears * 10;
      const xp = s.score / 4 + s.lines * 2;
      if (coins) TK.Progress.addCoins(coins, true);
      const levelsUp = TK.Progress.addXP(xp);

      let daily = null;
      // Il faut au moins avoir joué 3 pièces pour que le défi compte
      if (s.mode === 'daily' && s.pieces >= 3) daily = TK.Progress.recordDaily(s.dateKey, s.score);
      TK.Store.save();
      TK.Progress.checkAchievements();
      TK.Audio.gameOver();
      TK.Audio.stopMusic();

      this.showResults({
        reason: reason, coins: coins + (daily ? daily.coins : 0), xpGain: Math.round(xp),
        newBest: newBest, prevBest: prevBest, levelsUp: levelsUp, daily: daily
      });
    },

    showResults: function (r) {
      const s = this.s, d = TK.Store.data;
      const self = this;
      let html = '<div class="result">';
      html += '<div class="result-label">' + TK.t(r.reason === 'time' ? 'time_up' : 'final_score') + '</div>';
      html += '<div class="result-score">' + TK.fmt(s.score) + '</div>';
      if (r.newBest) html += '<div class="result-record">🏆 ' + TK.t('new_record') + '</div>';
      if (r.daily) {
        html += '<div class="result-stars">';
        for (let k = 0; k < 3; k++) {
          html += '<span class="rstar ' + (k < r.daily.stars ? 'on' : '') + '" style="animation-delay:' + (0.3 + k * 0.25) + 's">★</span>';
        }
        html += '</div>';
        html += '<div class="muted">' + TK.t('daily_best') + ' : ' + TK.fmt(r.daily.best) + '</div>';
      } else {
        html += '<div class="muted">' + TK.t('best_score') + ' : ' + TK.fmt(d.best) + '</div>';
      }
      html += '<div class="result-grid">' +
        '<div><b>' + s.lines + '</b><span>' + TK.t('lines') + '</span></div>' +
        '<div><b>x' + s.maxCombo + '</b><span>' + TK.t('best_combo') + '</span></div>' +
        '<div><b>' + s.pieces + '</b><span>' + TK.t('pieces') + '</span></div>' +
        '</div>';
      html += '<div class="result-rewards">' +
        '<span>+' + TK.fmt(r.coins) + ' 🪙</span><span>+' + TK.fmt(r.xpGain) + ' XP</span></div>';
      if (r.levelsUp) html += '<div class="result-level">⭐ ' + TK.t('level_up') + ' ' + d.level + ' ! (+' + 25 * r.levelsUp + ' 🪙)</div>';
      html += '</div>';

      TK.UI.modal({
        icon: r.newBest ? '🏆' : (r.daily ? '📅' : '🎮'),
        title: r.daily ? TK.t('daily_challenge') : TK.t('game_over'),
        html: html,
        dismissable: false,
        buttons: [
          { label: '↻ ' + TK.t('play_again'), cls: 'btn-primary', action: function () { self.start(s.mode === 'daily' ? 'daily' : 'classic'); } },
          { label: '📤 ' + TK.t('share'), cls: 'btn-ghost', keep: true, action: function () { TK.shareScore(s.score, s.mode); } },
          { label: '🏠 ' + TK.t('home'), cls: 'btn-ghost', action: function () { self.leave(); } }
        ],
        onClose: function () { self.leave(); }
      });
      if (r.newBest || r.levelsUp || (r.daily && r.daily.stars === 3)) {
        TK.UI.confetti();
        if (r.levelsUp) TK.Audio.levelUp();
      }
      if (r.daily) {
        for (let k = 0; k < r.daily.stars; k++) {
          setTimeout(function () { TK.Audio.star(k); }, 300 + k * 250);
        }
      }
      TK.UI.refreshHUD();
    }
  };

  TK.Game = G;
})();
