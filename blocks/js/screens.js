/* =========================================================
   TIOKOVA BLOCKS — screens.js
   Le contenu de chaque écran (hors partie) :
   accueil, missions, boutique, records, succès, réglages, don.
   ========================================================= */
(function () {
  'use strict';
  const TK = (window.TK = window.TK || {});
  const $ = function (s) { return document.querySelector(s); };

  function D() { return TK.Store.data; }

  const Screens = {
    shopTab: 'themes',
    recordsTab: 'classic',
    timers: [],

    onShow: function (name) {
      this.clearTimers();
      if (name === 'home') this.refreshHome();
      if (name === 'missions') this.renderMissions();
      if (name === 'shop') this.renderShop();
      if (name === 'records') this.renderRecords();
      if (name === 'achievements') this.renderAchievements();
      if (name === 'settings') this.renderSettings();
      TK.UI.refreshHUD();
    },

    clearTimers: function () {
      this.timers.forEach(function (t) { clearInterval(t); });
      this.timers = [];
    },

    /* ===================== ACCUEIL ===================== */
    refreshHome: function () {
      const d = D();
      const today = TK.dayKey();
      TK.UI.refreshHUD();
      // Bouton "Jouer" devient "Continuer" si une partie est en cours
      const saved = d.saved.classic;
      $('#btn-play-label').textContent = saved && saved.score > 0
        ? TK.t('continue') + ' · ' + TK.fmt(saved.score)
        : TK.t('play');

      const rec = d.daily[today];
      const sub = $('#daily-sub');
      const starsEl = $('#daily-stars');
      if (rec) {
        sub.textContent = TK.t('best') + ' ' + TK.fmt(rec.best) + ' · ' + TK.t('replay');
        starsEl.innerHTML = '★'.repeat(rec.stars) + '<i>' + '★'.repeat(3 - rec.stars) + '</i>';
      } else {
        const ds = d.saved.daily;
        sub.textContent = ds && ds.dateKey === today ? TK.t('in_progress') : TK.t('daily_new');
        starsEl.innerHTML = '<i>★★★</i>';
      }
      $('#btn-daily').classList.toggle('done', !!rec && rec.stars === 3);
      $('#btn-daily').classList.toggle('glow', !rec);
      $('#app-version').textContent = 'v' + TK.VERSION;
    },

    /* ===================== MISSIONS ===================== */
    renderMissions: function () {
      this.clearTimers();
      TK.Progress.ensureMissions();
      const d = D(), m = d.missions;
      const self = this;

      // Carte de la série (7 jours)
      const st = d.streak;
      let days = '';
      const pos = (st.count - 1) % 7;  // jour du cycle actuel
      for (let k = 0; k < 7; k++) {
        const rw = TK.STREAK_REWARDS[k];
        const cls = k < pos ? 'past' : k === pos ? 'today' : '';
        days += '<div class="sday ' + cls + '"><span class="sday-n">' + TK.t('day') + ' ' + (k + 1) + '</span>' +
          '<span class="sday-r">' + (rw.bomb ? '💣' : rw.shuffle ? '🔄' : rw.hammer ? '🔨' : '🪙') + '</span>' +
          '<span class="sday-c">' + rw.coins + '</span></div>';
      }
      $('#streak-card').innerHTML =
        '<div class="streak-head"><span class="streak-flame">🔥</span><div><b>' + st.count + ' ' +
        TK.t(st.count > 1 ? 'days' : 'day_one') + '</b><small>' + TK.t('streak_txt') + '</small></div>' +
        '<div class="freeze" title="' + TK.t('freeze') + '">🧊 ' + (d.inv.freeze || 0) + '</div></div>' +
        '<div class="streak-days">' + days + '</div>' +
        '<small class="muted">' + TK.t('best_streak') + ' : ' + st.best + ' · ' + TK.t('freeze_txt') + '</small>';

      // Missions
      const list = $('#missions-list');
      list.innerHTML = '';
      m.list.forEach(function (mis, k) {
        const prog = TK.Progress.missionProgress(mis);
        const done = prog >= mis.target;
        const el = document.createElement('div');
        el.className = 'card mission' + (mis.claimed ? ' claimed' : done ? ' done' : '');
        el.innerHTML =
          '<div class="mission-ico">' + self.missionIcon(mis.stat) + '</div>' +
          '<div class="mission-main"><div class="mission-txt">' + TK.t('mis_' + mis.stat).replace('{n}', TK.fmt(mis.target)) + '</div>' +
          '<div class="pbar"><div class="pbar-fill" style="width:' + Math.round(prog / mis.target * 100) + '%"></div></div>' +
          '<small>' + TK.fmt(prog) + ' / ' + TK.fmt(mis.target) + '</small></div>' +
          '<button class="btn btn-small ' + (mis.claimed ? 'btn-ghost' : done ? 'btn-primary' : 'btn-ghost') + '"' +
          (mis.claimed || !done ? ' disabled' : '') + '>' +
          (mis.claimed ? '✓' : '+' + mis.reward + ' 🪙') + '</button>';
        const btn = el.querySelector('button');
        btn.addEventListener('click', function () {
          const got = TK.Progress.claimMission(k);
          if (got) {
            TK.UI.flyCoins(btn, got);
            self.renderMissions();
          }
        });
        list.appendChild(el);
      });

      // Bonus si les 3 missions sont réclamées
      const allClaimed = m.list.every(function (x) { return x.claimed; });
      const bonus = $('#missions-bonus');
      bonus.innerHTML = '<div class="bonus-chest">' + (m.bonusClaimed ? '📭' : '🎁') + '</div>' +
        '<div class="mission-main"><b>' + TK.t('all_missions') + '</b><small>' + TK.UI.rewardText(TK.MISSIONS_BONUS) + '</small></div>' +
        '<button class="btn btn-small ' + (allClaimed && !m.bonusClaimed ? 'btn-primary' : 'btn-ghost') + '"' +
        (allClaimed && !m.bonusClaimed ? '' : ' disabled') + '>' + (m.bonusClaimed ? '✓' : TK.t('open')) + '</button>';
      bonus.querySelector('button').addEventListener('click', function () {
        const got = TK.Progress.claimMissionBonus();
        if (got) {
          TK.UI.flyCoins(this, got.coins);
          TK.UI.confetti();
          self.renderMissions();
        }
      });

      // compte à rebours jusqu'aux nouvelles missions
      const resetEl = $('#missions-reset');
      const upd = function () { resetEl.textContent = '· ' + TK.t('new_in') + ' ' + TK.fmtDuration(TK.msToMidnight()); };
      upd();
      this.timers.push(setInterval(upd, 1000));
      TK.UI.refreshHUD();
    },

    missionIcon: function (stat) {
      return {
        lines: '➖', games: '🎮', score: '🎯', combo: '⚡', pieces: '🧩', multi: '💥',
        daily: '📅', stars: '⭐', powers: '🧰', clears: '✨'
      }[stat] || '🎯';
    },

    /* ===================== BOUTIQUE ===================== */
    renderShop: function () {
      const self = this;
      this.clearTimers();
      document.querySelectorAll('#shop-tabs .tab').forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-tab') === self.shopTab);
      });
      const box = $('#shop-content');
      box.innerHTML = '';
      if (this.shopTab === 'themes') this.renderThemes(box);
      else if (this.shopTab === 'powers') this.renderPowers(box);
      else this.renderFree(box);
    },

    renderThemes: function (box) {
      const d = D();
      const self = this;
      const grid = document.createElement('div');
      grid.className = 'theme-grid';
      TK.THEMES.forEach(function (th) {
        const owned = d.themes.indexOf(th.id) >= 0;
        const active = d.theme === th.id;
        const locked = d.level < th.level;
        const card = document.createElement('div');
        card.className = 'theme-card' + (active ? ' active' : '') + (locked ? ' locked' : '');
        let btn;
        if (active) btn = '<button class="btn btn-small btn-ghost" disabled>✓ ' + TK.t('equipped') + '</button>';
        else if (owned) btn = '<button class="btn btn-small btn-primary" data-act="equip">' + TK.t('equip') + '</button>';
        else if (locked) btn = '<button class="btn btn-small btn-ghost" disabled>🔒 ' + TK.t('level_short') + ' ' + th.level + '</button>';
        else btn = '<button class="btn btn-small btn-gold" data-act="buy"' + (d.coins < th.price ? ' disabled' : '') + '>' + TK.fmt(th.price) + ' 🪙</button>';
        card.innerHTML = '<canvas class="theme-prev"></canvas><div class="theme-name">' + th.name[d.lang] + '</div>' + btn;
        grid.appendChild(card);
        const b = card.querySelector('button[data-act]');
        if (b) {
          b.addEventListener('click', function () {
            if (b.getAttribute('data-act') === 'buy') {
              TK.UI.confirm(th.name[d.lang], '<p>' + TK.t('buy_theme_q').replace('{p}', TK.fmt(th.price)) + '</p>', function () {
                if (TK.Progress.spend(th.price)) {
                  d.themes.push(th.id);
                  d.theme = th.id;
                  TK.Store.save();
                  self.themeChanged();
                  TK.UI.toast('🎨 ' + th.name[d.lang] + ' ✓', 'good');
                  TK.Progress.checkAchievements();
                }
              }, TK.t('buy'));
            } else {
              d.theme = th.id;
              TK.Store.save();
              self.themeChanged();
            }
          });
        }
      });
      box.appendChild(grid);
      // les aperçus se dessinent une fois les cartes dans la page
      requestAnimationFrame(function () {
        grid.querySelectorAll('.theme-prev').forEach(function (c, k) { TK.drawThemePreview(c, TK.THEMES[k]); });
      });
    },

    themeChanged: function () {
      TK.Renderer.setTheme(D().theme);
      TK.UI.applyTheme();
      this.renderShop();
    },

    renderPowers: function (box) {
      const d = D();
      const self = this;
      TK.POWERS.forEach(function (p) {
        const card = document.createElement('div');
        card.className = 'card shop-item';
        card.innerHTML = '<div class="shop-ico">' + p.icon + '</div>' +
          '<div class="mission-main"><b>' + TK.t('p_' + p.id) + ' <span class="owned">×' + (d.inv[p.id] || 0) + '</span></b>' +
          '<small>' + TK.t('p_' + p.id + '_desc') + '</small></div>' +
          '<button class="btn btn-small btn-gold"' + (d.coins < p.price ? ' disabled' : '') + '>' + p.price + ' 🪙</button>';
        card.querySelector('button').addEventListener('click', function () {
          if (TK.Progress.spend(p.price)) {
            d.inv[p.id] = (d.inv[p.id] || 0) + 1;
            TK.Store.save();
            TK.Audio.coin();
            TK.UI.toast(p.icon + ' +1', 'good');
            self.renderShop();
          }
        });
        box.appendChild(card);
      });
      const h = document.createElement('h3');
      h.className = 'section-title';
      h.textContent = TK.t('packs');
      box.appendChild(h);
      TK.PACKS.forEach(function (pk) {
        const card = document.createElement('div');
        card.className = 'card shop-item';
        const isFreeze = !!pk.items.freeze;
        card.innerHTML = '<div class="shop-ico">' + (isFreeze ? '🧊' : '📦') + '</div>' +
          '<div class="mission-main"><b>' + TK.t(pk.id) + (isFreeze ? ' <span class="owned">×' + (d.inv.freeze || 0) + '</span>' : '') + '</b>' +
          '<small>' + (isFreeze ? TK.t('freeze_desc') : TK.UI.rewardText(pk.items)) + '</small></div>' +
          '<button class="btn btn-small btn-gold"' + (d.coins < pk.price ? ' disabled' : '') + '>' + pk.price + ' 🪙</button>';
        card.querySelector('button').addEventListener('click', function () {
          if (TK.Progress.spend(pk.price)) {
            TK.Progress.grant(pk.items, true);
            TK.Audio.coin();
            TK.UI.toast('📦 ' + TK.UI.rewardText(pk.items), 'good');
            self.renderShop();
          }
        });
        box.appendChild(card);
      });
    },

    renderFree: function (box) {
      const d = D();
      const self = this;
      // Coffre toutes les 3 heures
      const chest = document.createElement('div');
      chest.className = 'card chest-card';
      box.appendChild(chest);
      const drawChest = function () {
        const wait = TK.Progress.chestReadyIn();
        chest.innerHTML = '<div class="chest-ico ' + (wait ? '' : 'ready') + '">' + (wait ? '🔒' : '🎁') + '</div>' +
          '<div class="mission-main"><b>' + TK.t('free_chest') + '</b><small>' +
          (wait ? TK.t('ready_in') + ' ' + TK.fmtDuration(wait) : TK.t('chest_ready')) + '</small></div>' +
          '<button class="btn btn-small ' + (wait ? 'btn-ghost' : 'btn-primary') + '"' + (wait ? ' disabled' : '') + '>' + TK.t('open') + '</button>';
        chest.querySelector('button').addEventListener('click', function () {
          const r = TK.Progress.openChest();
          if (r) {
            TK.UI.flyCoins(this, r.coins);
            TK.UI.modal({ icon: '🎁', title: TK.t('free_chest'), html: '<p class="big-reward">' + TK.UI.rewardText(r) + '</p>' });
            drawChest();
          }
        });
      };
      drawChest();
      this.timers.push(setInterval(function () {
        if (TK.Progress.chestReadyIn() >= 0) drawChest();
      }, 1000));

      // Partage quotidien
      const share = document.createElement('div');
      share.className = 'card shop-item';
      const sharedToday = d.shareDay === TK.dayKey();
      share.innerHTML = '<div class="shop-ico">📤</div><div class="mission-main"><b>' + TK.t('share_game') + '</b>' +
        '<small>' + TK.t('share_reward') + '</small></div>' +
        '<button class="btn btn-small ' + (sharedToday ? 'btn-ghost' : 'btn-primary') + '"' + (sharedToday ? ' disabled' : '') + '>' +
        (sharedToday ? '✓' : '+30 🪙') + '</button>';
      share.querySelector('button').addEventListener('click', function () {
        const btn = this;
        TK.shareGame().then(function (ok) {
          if (ok && D().shareDay !== TK.dayKey()) {
            D().shareDay = TK.dayKey();
            TK.Progress.addCoins(30);
            TK.UI.flyCoins(btn, 30);
            self.renderShop();
          }
        });
      });
      box.appendChild(share);

      const info = document.createElement('p');
      info.className = 'about';
      info.textContent = TK.t('free_info');
      box.appendChild(info);
    },

    /* ===================== RECORDS ===================== */
    renderRecords: function () {
      const self = this;
      document.querySelectorAll('#records-tabs .tab').forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-tab') === self.recordsTab);
      });
      const box = $('#records-content');
      const d = D();
      let html = '';
      if (this.recordsTab === 'classic') {
        if (!d.top.length) html = '<p class="empty">' + TK.t('no_records') + '</p>';
        else {
          html += '<div class="card board-list">';
          d.top.forEach(function (e, k) {
            const medal = ['🥇', '🥈', '🥉'][k] || (k + 1) + '.';
            html += '<div class="board-row' + (k < 3 ? ' top' : '') + '"><span class="rank">' + medal + '</span>' +
              '<span class="who">' + TK.esc(d.name || TK.t('player')) + '<small>' + self.prettyDate(e.d) + ' · ' + (e.l || 0) + ' ' + TK.t('lines') + '</small></span>' +
              '<b>' + TK.fmt(e.s) + '</b></div>';
          });
          html += '</div>';
        }
        html += '<p class="about">' + TK.t('records_info') + '</p>';
      } else if (this.recordsTab === 'daily') {
        // calendrier des 28 derniers jours
        html += '<div class="card"><h3 class="section-title">' + TK.t('last_28') + '</h3><div class="cal">';
        const today = new Date();
        for (let k = 27; k >= 0; k--) {
          const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() - k);
          const key = TK.dayKey(dt);
          const rec = d.daily[key];
          const st = rec ? rec.stars : -1;
          html += '<div class="cal-day s' + st + (k === 0 ? ' today' : '') + '" title="' + key + '">' +
            '<span>' + dt.getDate() + '</span>' + (rec ? '<i>' + '★'.repeat(st) + '</i>' : '') + '</div>';
        }
        html += '</div></div>';
        const keys = Object.keys(d.daily).sort().reverse().slice(0, 15);
        if (keys.length) {
          html += '<div class="card board-list">';
          keys.forEach(function (k) {
            const r = d.daily[k];
            html += '<div class="board-row"><span class="rank">📅</span><span class="who">' + self.prettyDate(k) +
              '<small>' + '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars) + '</small></span><b>' + TK.fmt(r.best) + '</b></div>';
          });
          html += '</div>';
        } else {
          html += '<p class="empty">' + TK.t('no_daily') + '</p>';
        }
      } else {
        const s = d.stats;
        const rows = [
          ['🎮', 'st_games', TK.fmt(s.games)],
          ['🏆', 'best_score', TK.fmt(d.best)],
          ['➖', 'st_lines', TK.fmt(s.lines)],
          ['🧩', 'st_pieces', TK.fmt(s.pieces)],
          ['⚡', 'best_combo', 'x' + s.bestCombo],
          ['💥', 'st_maxlines', s.maxLinesOnce],
          ['✨', 'st_clears', s.boardClears],
          ['📅', 'st_daily', s.dailyDone],
          ['⭐', 'st_three', s.threeStars],
          ['🔥', 'best_streak', d.streak.best],
          ['🎯', 'st_missions', s.missionsDone],
          ['🧰', 'st_powers', s.powersUsed],
          ['🪙', 'st_coins', TK.fmt(s.coinsEarned)],
          ['⏱️', 'st_time', TK.fmtDuration(s.playTime * 1000)]
        ];
        html += '<div class="stat-grid">';
        rows.forEach(function (r) {
          html += '<div class="stat"><span>' + r[0] + '</span><b>' + r[2] + '</b><small>' + TK.t(r[1]) + '</small></div>';
        });
        html += '</div>';
      }
      box.innerHTML = html;
    },

    prettyDate: function (key) {
      const p = key.split('-').map(Number);
      const dt = new Date(p[0], p[1] - 1, p[2]);
      try {
        return dt.toLocaleDateString(D().lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short' });
      } catch (e) {
        return p[2] + '/' + p[1];
      }
    },

    /* ===================== SUCCÈS ===================== */
    renderAchievements: function () {
      const d = D();
      const self = this;
      const list = $('#ach-list');
      list.innerHTML = '';
      let unlocked = 0;
      // ordre : à réclamer, puis en cours, puis réclamés
      const order = TK.ACHIEVEMENTS.slice().sort(function (a, b) {
        const ra = d.ach.unlocked[a.id] ? (d.ach.claimed[a.id] ? 2 : 0) : 1;
        const rb = d.ach.unlocked[b.id] ? (d.ach.claimed[b.id] ? 2 : 0) : 1;
        return ra - rb;
      });
      order.forEach(function (a) {
        const un = !!d.ach.unlocked[a.id];
        const cl = !!d.ach.claimed[a.id];
        if (un) unlocked++;
        const val = Math.min(TK.Progress.statValue(a.stat), a.target);
        const el = document.createElement('div');
        el.className = 'card ach' + (un ? ' unlocked' : '') + (cl ? ' claimed' : '');
        el.innerHTML = '<div class="ach-ico">' + (un ? a.icon : '🔒') + '</div>' +
          '<div class="mission-main"><b>' + TK.t('ach_' + a.id) + '</b>' +
          '<small>' + TK.t('achd_' + a.stat).replace('{n}', TK.fmt(a.target)) + '</small>' +
          (un ? '' : '<div class="pbar"><div class="pbar-fill" style="width:' + Math.round(val / a.target * 100) + '%"></div></div>') +
          '</div>' +
          '<button class="btn btn-small ' + (un && !cl ? 'btn-gold' : 'btn-ghost') + '"' + (un && !cl ? '' : ' disabled') + '>' +
          (cl ? '✓' : '+' + a.reward + ' 🪙') + '</button>';
        el.querySelector('button').addEventListener('click', function () {
          const got = TK.Progress.claimAchievement(a.id);
          if (got) {
            TK.UI.flyCoins(this, got);
            self.renderAchievements();
          }
        });
        list.appendChild(el);
      });
      $('#ach-count').textContent = unlocked + '/' + TK.ACHIEVEMENTS.length;
      TK.UI.refreshHUD();
    },

    /* ===================== RÉGLAGES ===================== */
    renderSettings: function () {
      const d = D();
      $('#set-name').value = d.name || '';
      $('#set-sound').checked = !!d.sound;
      $('#set-music').checked = !!d.music;
      $('#set-vibe').checked = !!d.vibe;
      $('#set-lang').value = d.lang;
      $('#btn-install').classList.toggle('hidden', !TK.installPrompt);
    },

    bindSettings: function () {
      const self = this;
      $('#set-name').addEventListener('change', function () {
        D().name = this.value.trim().slice(0, 16);
        TK.Store.save();
      });
      $('#set-sound').addEventListener('change', function () {
        D().sound = this.checked;
        TK.Store.save();
        TK.Audio.click();
      });
      $('#set-music').addEventListener('change', function () {
        D().music = this.checked;
        TK.Store.save();
        if (!this.checked) TK.Audio.stopMusic();
      });
      $('#set-vibe').addEventListener('change', function () {
        D().vibe = this.checked;
        TK.Store.save();
        TK.Audio.vibrate(30);
      });
      $('#set-lang').addEventListener('change', function () {
        D().lang = this.value;
        TK.Store.save();
        TK.UI.applyI18n();
        self.refreshHome();
      });
      $('#btn-tuto').addEventListener('click', function () { TK.Tuto.open(); });
      $('#btn-install').addEventListener('click', function () { TK.promptInstall(); });
      $('#btn-reset').addEventListener('click', function () {
        TK.UI.confirm(TK.t('reset_all'), '<p>' + TK.t('reset_q') + '</p>', function () {
          TK.Store.reset();
          location.reload();
        }, TK.t('reset_yes'));
      });
    },

    /* ===================== DON ===================== */
    bindDonate: function () {
      $('#btn-copy-number').addEventListener('click', function () {
        const btn = this;
        TK.copyText(TK.DONATE.raw).then(function (ok) {
          TK.UI.toast(ok ? '📋 ' + TK.t('copied') : TK.DONATE.number, ok ? 'good' : 'info');
          if (ok) {
            btn.classList.add('ok');
            setTimeout(function () { btn.classList.remove('ok'); }, 1500);
          }
        });
      });
      $('#btn-share-game').addEventListener('click', function () { TK.shareGame(); });
    }
  };

  TK.Screens = Screens;
})();
