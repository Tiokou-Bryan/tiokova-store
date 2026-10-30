/* =========================================================
   TIOKOVA BLOCKS — main.js
   Point de départ : charge la sauvegarde, branche tous les
   boutons, gère le tutoriel, le partage, l'installation (PWA)
   et le bouton "retour" d'Android.
   ========================================================= */
(function () {
  'use strict';
  const TK = (window.TK = window.TK || {});
  const $ = function (s) { return document.querySelector(s); };

  /* ---------------------------------------------------------
     PARTAGE ET COPIE
     --------------------------------------------------------- */
  // Copie dans le presse-papier (avec plan B pour les vieux téléphones)
  TK.copyText = function (text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
    }
    return Promise.resolve(fallback());
    function fallback() {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch (e) { return false; }
    }
  };

  // Ouvre le menu de partage du téléphone, sinon WhatsApp.
  // Renvoie une promesse : true si le partage a (probablement) eu lieu.
  function share(text) {
    const url = TK.GAME_URL;
    if (navigator.share) {
      return navigator.share({ title: 'TIOKOVA BLOCKS', text: text, url: url })
        .then(function () { return true; }, function () { return false; });
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank');
    return Promise.resolve(true);
  }

  TK.shareScore = function (score, mode) {
    const key = mode === 'daily' ? 'share_daily' : 'share_score';
    const stars = mode === 'daily' ? TK.Progress.starsFor(score) : 0;
    const txt = TK.t(key).replace('{s}', TK.fmt(score)).replace('{st}', '⭐'.repeat(stars));
    return share(txt);
  };

  TK.shareGame = function () { return share(TK.t('share_game_txt')); };

  /* ---------------------------------------------------------
     INSTALLATION (PWA)
     Chrome Android propose "Ajouter à l'écran d'accueil".
     On garde l'évènement pour proposer notre propre bouton.
     --------------------------------------------------------- */
  TK.installPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    TK.installPrompt = e;
    const b = $('#btn-install');
    if (b) b.classList.remove('hidden');
    if (TK.Gate.active) TK.Gate.render();
  });
  window.addEventListener('appinstalled', function () {
    TK.installPrompt = null;
    TK.Gate.installed = true;
    if (TK.Gate.active) TK.Gate.render();
  });

  /* ---------------------------------------------------------
     ÉCRAN « INSTALLE LE JEU POUR JOUER »
     Le jeu ne se lance que dans l'application installée.
     Comment on le sait ? Une appli installée s'ouvre en mode
     "standalone" (sans barre d'adresse) : le navigateur
     nous le dit avec matchMedia('(display-mode: standalone)').
     --------------------------------------------------------- */
  TK.Gate = {
    active: false,
    installed: false,

    isInstalledApp: function () {
      const mm = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
      return mm('(display-mode: standalone)') || mm('(display-mode: fullscreen)') ||
        mm('(display-mode: minimal-ui)') || window.navigator.standalone === true;
    },

    // Faut-il bloquer le jeu derrière l'écran d'installation ?
    needed: function () {
      const params = new URLSearchParams(location.search);
      if (params.get('gate') === '1') return true;           // pour tester l'écran sur ton PC
      if (this.isInstalledApp()) return false;
      // Sur ton PC avec Live Server, on laisse jouer pour pouvoir tester
      if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return false;
      return true;
    },

    platform: function () {
      const ua = navigator.userAgent || '';
      const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      // Navigateurs intégrés (Facebook, Instagram, TikTok…) : impossible d'installer
      if (/FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|TikTok|musical_ly|; wv\)/i.test(ua)) return 'inapp';
      if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? 'ios-other' : 'ios';
      if (/Android/i.test(ua)) return 'android';
      return 'desktop';
    },

    open: function () {
      this.active = true;
      $('#gate').classList.remove('hidden');
      $('#app').classList.add('hidden');
      this.render();
    },

    render: function () {
      const t = TK.t;
      $('#gate-sub').textContent = t('gate_sub');
      $('#gate-points').innerHTML = ['gate_p1', 'gate_p2', 'gate_p3'].map(function (k) {
        return '<li>' + t(k) + '</li>';
      }).join('');
      const box = $('#gate-action');
      const plat = this.platform();
      let html = '';

      if (this.installed) {
        html = '<div class="gate-ok">✅ ' + t('gate_done') + '</div>';
      } else if (TK.installPrompt) {
        html = '<button class="btn btn-primary btn-big" id="gate-install">📲 ' + t('gate_install') + '</button>';
      } else if (plat === 'inapp') {
        html = '<p class="gate-warn">⚠️ ' + t('gate_inapp') + '</p>' +
          '<button class="btn btn-ghost full" id="gate-copy">📋 ' + t('gate_copy') + '</button>';
      } else if (plat === 'ios') {
        html = '<ol class="gate-steps"><li>' + t('gate_ios1') + '</li><li>' + t('gate_ios2') + '</li><li>' + t('gate_ios3') + '</li></ol>';
      } else if (plat === 'ios-other') {
        html = '<p class="gate-warn">⚠️ ' + t('gate_ios_safari') + '</p>' +
          '<button class="btn btn-ghost full" id="gate-copy">📋 ' + t('gate_copy') + '</button>';
      } else if (plat === 'android') {
        html = '<ol class="gate-steps"><li>' + t('gate_and1') + '</li><li>' + t('gate_and2') + '</li></ol>';
      } else {
        html = '<ol class="gate-steps"><li>' + t('gate_pc1') + '</li><li>' + t('gate_pc2') + '</li></ol>';
      }
      box.innerHTML = html;
      $('#gate-foot').textContent = this.installed ? '' : t('gate_already');

      const ib = $('#gate-install');
      if (ib) ib.addEventListener('click', function () {
        const ev = TK.installPrompt;
        if (!ev) return;
        ev.prompt();
        ev.userChoice.then(function (choice) {
          if (choice && choice.outcome === 'accepted') TK.Gate.installed = true;
          TK.installPrompt = null;
          TK.Gate.render();
        });
      });
      const cb = $('#gate-copy');
      if (cb) cb.addEventListener('click', function () {
        TK.copyText(TK.GAME_URL).then(function (ok) {
          cb.textContent = ok ? '✅ ' + t('gate_copied') : TK.GAME_URL;
        });
      });
    }
  };
  TK.promptInstall = function () {
    if (!TK.installPrompt) {
      TK.UI.toast(TK.t('install_manual'), 'info');
      return;
    }
    TK.installPrompt.prompt();
    TK.installPrompt.userChoice.then(function () { TK.installPrompt = null; });
  };

  /* ---------------------------------------------------------
     TUTORIEL (4 écrans)
     --------------------------------------------------------- */
  TK.Tuto = {
    step: 0,
    steps: [
      { anim: 'drag', t: 'tuto1_t', x: 'tuto1_x' },
      { anim: 'line', t: 'tuto2_t', x: 'tuto2_x' },
      { anim: 'combo', t: 'tuto3_t', x: 'tuto3_x' },
      { anim: 'daily', t: 'tuto4_t', x: 'tuto4_x' }
    ],
    open: function () {
      this.step = 0;
      $('#tuto').classList.remove('hidden');
      this.render();
    },
    close: function () {
      $('#tuto').classList.add('hidden');
      TK.Store.data.tutoDone = true;
      TK.Store.save();
    },
    render: function () {
      const st = this.steps[this.step];
      $('#tuto-title').textContent = TK.t(st.t);
      $('#tuto-text').textContent = TK.t(st.x);
      $('#tuto-anim').className = 'tuto-anim anim-' + st.anim;
      $('#tuto-anim').innerHTML = this.animHTML(st.anim);
      let dots = '';
      for (let k = 0; k < this.steps.length; k++) dots += '<span class="' + (k === this.step ? 'on' : '') + '"></span>';
      $('#tuto-dots').innerHTML = dots;
      $('#tuto-next').textContent = TK.t(this.step === this.steps.length - 1 ? 'lets_go' : 'next');
    },
    // Petites animations en CSS (voir style.css)
    animHTML: function (kind) {
      const th = TK.THEME_BY_ID[TK.Store.data.theme];
      const c = th.colors;
      if (kind === 'drag' || kind === 'line') {
        let cells = '';
        for (let k = 0; k < 16; k++) {
          const filled = kind === 'line' && k >= 4 && k < 7;
          cells += '<i style="' + (filled ? 'background:' + c[3] : '') + '"></i>';
        }
        const piece = kind === 'drag'
          ? '<div class="t-piece" style="--c:' + c[0] + '"><b></b><b></b><b></b></div>'
          : '<div class="t-piece t-one" style="--c:' + c[1] + '"><b></b></div>';
        return '<div class="t-grid">' + cells + '</div>' + piece;
      }
      if (kind === 'combo') return '<div class="t-combo">COMBO <span>x2</span><span>x3</span><span>x4</span></div>';
      return '<div class="t-daily"><span>📅</span><span>🔥</span><span>🎯</span></div>';
    },
    next: function () {
      TK.Audio.click();
      if (this.step < this.steps.length - 1) { this.step++; this.render(); }
      else this.close();
    }
  };

  /* ---------------------------------------------------------
     BOUTONS
     --------------------------------------------------------- */
  function bind() {
    const UI = TK.UI;

    // Jouer / continuer
    $('#btn-play').addEventListener('click', function () {
      TK.Audio.unlock();
      TK.Audio.click();
      const saved = TK.Store.data.saved.classic;
      TK.Game.start('classic', saved && saved.score > 0 ? saved : null);
    });

    // Défi du jour
    $('#btn-daily').addEventListener('click', function () {
      TK.Audio.unlock();
      TK.Audio.click();
      const d = TK.Store.data, today = TK.dayKey();
      const saved = d.saved.daily;
      if (saved && saved.dateKey === today) { TK.Game.start('daily', saved); return; }
      const rec = d.daily[today];
      const th = TK.DAILY_STARS;
      UI.modal({
        icon: '📅', title: TK.t('daily_challenge'),
        html: '<p>' + TK.t('daily_rules') + '</p>' +
          '<div class="star-goals">' +
          '<div><span>★</span>' + TK.fmt(th[0]) + '</div>' +
          '<div><span>★★</span>' + TK.fmt(th[1]) + '</div>' +
          '<div><span>★★★</span>' + TK.fmt(th[2]) + '</div></div>' +
          (rec ? '<p class="muted">' + TK.t('daily_best') + ' : ' + TK.fmt(rec.best) + '</p>' : '<p class="muted">' + TK.t('daily_reward_txt') + '</p>'),
        buttons: [
          { label: TK.t('cancel'), cls: 'btn-ghost' },
          { label: '▶ ' + TK.t('start'), cls: 'btn-primary', action: function () { TK.Game.start('daily'); } }
        ]
      });
    });

    // Tuiles de l'accueil
    document.querySelectorAll('[data-go]').forEach(function (b) {
      b.addEventListener('click', function () {
        TK.Audio.click();
        UI.show(b.getAttribute('data-go'));
      });
    });
    document.querySelectorAll('[data-back]').forEach(function (b) {
      b.addEventListener('click', function () { TK.Audio.click(); UI.back(); });
    });
    $('#home-coins').addEventListener('click', function () {
      TK.Screens.shopTab = 'free';
      UI.show('shop');
    });
    $('#home-streak').addEventListener('click', function () { UI.show('missions'); });

    // Onglets
    document.querySelectorAll('#shop-tabs .tab').forEach(function (t) {
      t.addEventListener('click', function () {
        TK.Audio.click();
        TK.Screens.shopTab = t.getAttribute('data-tab');
        TK.Screens.renderShop();
      });
    });
    document.querySelectorAll('#records-tabs .tab').forEach(function (t) {
      t.addEventListener('click', function () {
        TK.Audio.click();
        TK.Screens.recordsTab = t.getAttribute('data-tab');
        TK.Screens.renderRecords();
      });
    });

    // Jeu
    $('#btn-pause').addEventListener('click', function () { TK.Audio.click(); TK.Game.pause(); });
    document.querySelectorAll('.power').forEach(function (b) {
      b.addEventListener('click', function () {
        TK.Audio.click();
        TK.Game.selectPower(b.getAttribute('data-power'));
      });
    });

    // Fond de la modale : fermer (si autorisé)
    $('#modal').addEventListener('click', function (e) {
      if (e.target.id === 'modal' && UI.modalDismissable) UI.closeModal(false);
    });

    // Tutoriel
    $('#tuto-next').addEventListener('click', function () { TK.Tuto.next(); });
    $('#tuto-skip').addEventListener('click', function () { TK.Tuto.close(); });

    TK.Screens.bindSettings();
    TK.Screens.bindDonate();

    // Redimensionnement / rotation de l'écran
    let rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { TK.Renderer.resize(); }, 120);
    });

    // L'appli passe en arrière-plan : pause + sauvegarde
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        TK.Store.save();
        TK.Audio.stopMusic();
        if (UI.current === 'game') TK.Game.pause();
      } else if (UI.current === 'game' && TK.Store.data.music) {
        TK.Audio.startMusic();
      }
    });
    window.addEventListener('pagehide', function () {
      if (TK.Game.s && !TK.Game.s.over) TK.Game.save();
      TK.Store.save();
    });

    // Bouton "retour" d'Android
    history.replaceState({ tk: 'root' }, '');
    history.pushState({ tk: 'app' }, '');
    window.addEventListener('popstate', function () {
      if (!$('#tuto').classList.contains('hidden')) TK.Tuto.close();
      else if (UI.modalOpen) { if (UI.modalDismissable) UI.closeModal(false); }
      else if (UI.current === 'game') TK.Game.pause();
      else if (UI.current !== 'home') UI.back();
      else { history.back(); return; } // à l'accueil : on laisse sortir
      history.pushState({ tk: 'app' }, '');
    });

    // Mise à jour automatique de l'interface quand la progression change
    TK.Progress.onChange(function () { UI.refreshHUD(); });
  }

  /* ---------------------------------------------------------
     ACCUEIL DU JOUR : série + nouvelles missions
     --------------------------------------------------------- */
  function dailyWelcome() {
    const res = TK.Progress.checkStreak();
    TK.Progress.ensureMissions();
    TK.Progress.checkAchievements();
    if (!res) return;
    // Première visite : pas de pop-up de série, le tutoriel suffit
    if (!TK.Store.data.tutoDone) return;
    let html = '<div class="streak-big">🔥 ' + res.count + '</div>';
    if (res.usedFreeze) html += '<p>🧊 ' + TK.t('freeze_used') + '</p>';
    else if (res.lost) html += '<p class="muted">' + TK.t('streak_lost').replace('{n}', res.lostCount) + '</p>';
    html += '<p>' + TK.t('streak_reward') + '</p><p class="big-reward">' + TK.UI.rewardText(res.reward) + '</p>';
    html += '<p class="muted">' + TK.t('streak_come_back') + '</p>';
    setTimeout(function () {
      TK.UI.modal({
        icon: '🎁', title: TK.t('day') + ' ' + res.count, html: html,
        buttons: [{
          label: TK.t('collect'), cls: 'btn-primary', action: function () {
            TK.Audio.unlock();
            TK.Audio.coin();
            TK.UI.flyCoins($('#home-streak'), res.reward.coins);
          }
        }]
      });
    }, 350);
  }

  /* ---------------------------------------------------------
     DÉMARRAGE
     --------------------------------------------------------- */
  function boot() {
    TK.Store.load();
    TK.UI.applyI18n();
    TK.UI.applyTheme();

    // Pas installé ? On montre seulement l'écran d'installation.
    if (TK.Gate.needed()) {
      TK.Gate.open();
      if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        navigator.serviceWorker.register('sw.js').catch(function () { /* rien */ });
      }
      document.body.classList.add('ready');
      return;
    }
    TK.Renderer.init($('#game-canvas'), $('#canvas-wrap'));
    TK.Input.init($('#game-canvas'), {
      canInteract: function () { return TK.Game.canInteract(); },
      activePower: function () { return TK.Game.power; },
      getTray: function () { return TK.Game.s ? TK.Game.s.tray : []; },
      getState: function () { return TK.Game.s; },
      place: function (i, r, c) { TK.Game.place(i, r, c); },
      usePowerAt: function (p, r, c) { TK.Game.usePowerAt(p, r, c); }
    });
    bind();
    // la sauvegarde d'un défi d'hier n'a plus de sens
    const sd = TK.Store.data.saved.daily;
    if (sd && sd.dateKey !== TK.dayKey()) TK.Store.data.saved.daily = null;

    dailyWelcome();
    TK.Screens.refreshHome();
    if (!TK.Store.data.tutoDone) setTimeout(function () { TK.Tuto.open(); }, 300);

    // Rafraîchit l'accueil à minuit (nouveau défi, nouvelles missions)
    let lastDay = TK.dayKey();
    setInterval(function () {
      const now = TK.dayKey();
      if (now !== lastDay) {
        lastDay = now;
        if (TK.UI.current !== 'game') { dailyWelcome(); TK.Screens.refreshHome(); }
      }
    }, 30000);

    // Service worker = fonctionne hors connexion + installable
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').catch(function (e) { console.warn('SW', e); });
    }
    document.body.classList.add('ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
