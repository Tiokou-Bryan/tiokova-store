/* =========================================================
   TIOKOVA BLOCKS — ui.js
   Outils d'interface réutilisables : navigation entre écrans,
   fenêtres (modales), notifications (toasts), traductions,
   barre du haut (pièces, niveau, série).
   ========================================================= */
(function () {
  'use strict';
  const TK = (window.TK = window.TK || {});
  const $ = function (sel) { return document.querySelector(sel); };
  const $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  TK.$ = $;
  TK.$$ = $$;

  // Formate un nombre : 12500 -> "12 500"
  TK.fmt = function (n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Durée lisible : 3725000 ms -> "1 h 02 min"
  TK.fmtDuration = function (ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return h + ' h ' + (m < 10 ? '0' : '') + m + ' min';
    if (m > 0) return m + ' min ' + (sec < 10 ? '0' : '') + sec + ' s';
    return sec + ' s';
  };

  // Protège le texte saisi par le joueur (pseudo) avant de l'afficher en HTML
  TK.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  const UI = {
    current: 'home',
    history: [],
    modalOpen: false,
    modalOnClose: null,

    /* ---------- Navigation ---------- */
    show: function (name, opts) {
      opts = opts || {};
      const next = document.getElementById('screen-' + name);
      if (!next || name === this.current) return;
      const prev = document.getElementById('screen-' + this.current);
      if (!opts.noHistory && this.current !== 'game') this.history.push(this.current);
      if (prev) prev.classList.remove('active');
      next.classList.add('active');
      this.current = name;
      next.scrollTop = 0;
      if (TK.Screens && TK.Screens.onShow) TK.Screens.onShow(name);
    },

    back: function () {
      const prev = this.history.pop() || 'home';
      this.show(prev, { noHistory: true });
    },

    /* ---------- Traductions ---------- */
    applyI18n: function () {
      $$('[data-i18n]').forEach(function (el) {
        el.textContent = TK.t(el.getAttribute('data-i18n'));
      });
      document.documentElement.lang = TK.Store.data.lang;
    },

    /* ---------- Thème (couleurs de l'interface) ---------- */
    applyTheme: function () {
      const th = TK.THEME_BY_ID[TK.Store.data.theme] || TK.THEMES[0];
      const root = document.documentElement.style;
      root.setProperty('--bg1', th.bg[0]);
      root.setProperty('--bg2', th.bg[1]);
      root.setProperty('--accent', th.accent);
      root.setProperty('--accent2', th.accent2);
      root.setProperty('--board', th.board);
      root.setProperty('--panel', TK.rgba(th.empty.length === 7 ? th.empty : '#1f2146', 0.75));
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', th.bg[0]);
      // logo animé aux couleurs du thème
      $$('.lb').forEach(function (el, k) { el.style.background = th.colors[k % 7]; });
    },

    /* ---------- Barre du haut ---------- */
    refreshHUD: function () {
      const d = TK.Store.data;
      $('#home-coins-num').textContent = TK.fmt(d.coins);
      $$('.coins-mirror').forEach(function (el) { el.textContent = TK.fmt(d.coins); });
      $('#home-level-num').textContent = d.level;
      $('#home-xp-fill').style.width = Math.round(TK.Progress.xpProgress() * 100) + '%';
      $('#home-streak-num').textContent = d.streak.count;
      $('#home-best').textContent = TK.fmt(d.best);
      ['hammer', 'bomb', 'shuffle'].forEach(function (p) {
        const el = document.getElementById('pc-' + p);
        if (el) el.textContent = d.inv[p] || 0;
      });
      const nm = TK.Progress.missionsToClaim();
      $('#badge-missions').classList.toggle('hidden', nm === 0);
      $('#badge-missions').textContent = nm;
      const na = TK.Progress.achToClaim();
      $('#badge-ach').classList.toggle('hidden', na === 0);
      $('#badge-ach').textContent = na;
    },

    /* ---------- Fenêtre modale ----------
       opts = { icon, title, html, buttons:[{label, cls, action, keep}], onClose, dismissable } */
    modal: function (opts) {
      const self = this;
      $('#modal-icon').textContent = opts.icon || '';
      $('#modal-icon').classList.toggle('hidden', !opts.icon);
      $('#modal-title').textContent = opts.title || '';
      $('#modal-body').innerHTML = opts.html || '';
      const actions = $('#modal-actions');
      actions.innerHTML = '';
      (opts.buttons || [{ label: TK.t('ok'), cls: 'btn-primary' }]).forEach(function (b) {
        const btn = document.createElement('button');
        btn.className = 'btn ' + (b.cls || 'btn-ghost');
        btn.innerHTML = b.label;
        if (b.disabled) btn.disabled = true;
        btn.addEventListener('click', function () {
          TK.Audio.click();
          if (!b.keep) self.closeModal(true);
          if (b.action) b.action();
        });
        actions.appendChild(btn);
      });
      this.modalOnClose = opts.onClose || null;
      this.modalDismissable = opts.dismissable !== false;
      $('#modal').classList.remove('hidden');
      requestAnimationFrame(function () { $('#modal').classList.add('show'); });
      this.modalOpen = true;
    },

    closeModal: function (byButton) {
      if (!this.modalOpen) return;
      $('#modal').classList.remove('show');
      $('#modal').classList.add('hidden');
      this.modalOpen = false;
      const cb = this.modalOnClose;
      this.modalOnClose = null;
      if (cb && !byButton) cb();
    },

    confirm: function (title, html, onYes, yesLabel) {
      this.modal({
        icon: '❓', title: title, html: html,
        buttons: [
          { label: TK.t('cancel'), cls: 'btn-ghost' },
          { label: yesLabel || TK.t('confirm'), cls: 'btn-primary', action: onYes }
        ]
      });
    },

    /* ---------- Notifications ---------- */
    toast: function (msg, kind) {
      const box = $('#toasts');
      const el = document.createElement('div');
      el.className = 'toast ' + (kind || '');
      el.textContent = msg;
      box.appendChild(el);
      // max 3 à la fois
      while (box.children.length > 3) box.removeChild(box.firstChild);
      setTimeout(function () { el.classList.add('out'); }, 2400);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2900);
    },

    /* Pièces qui "volent" vers le compteur (effet de récompense) */
    flyCoins: function (fromEl, count) {
      const target = this.current === 'home' ? $('#home-coins') : document.querySelector('.screen.active .chip-coins');
      const layer = $('#floating-layer');
      if (!target || !fromEl) return;
      const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
      const n = Math.min(10, Math.max(3, Math.round((count || 10) / 10)));
      for (let k = 0; k < n; k++) {
        const c = document.createElement('div');
        c.className = 'fly-coin';
        c.textContent = '🪙';
        const sx = a.left + a.width / 2 + (Math.random() - 0.5) * 40;
        const sy = a.top + a.height / 2 + (Math.random() - 0.5) * 20;
        c.style.left = sx + 'px';
        c.style.top = sy + 'px';
        layer.appendChild(c);
        const dx = b.left + b.width / 2 - sx, dy = b.top + b.height / 2 - sy;
        setTimeout(function () {
          c.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(0.6)';
          c.style.opacity = '0.2';
        }, 30 + k * 60);
        setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 900 + k * 60);
      }
    },

    /* Petite pluie de confettis (record, niveau…) */
    confetti: function () {
      const layer = $('#floating-layer');
      const th = TK.THEME_BY_ID[TK.Store.data.theme];
      for (let k = 0; k < 40; k++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.background = th.colors[k % 7];
        c.style.animationDelay = Math.random() * 0.4 + 's';
        c.style.animationDuration = 1.6 + Math.random() * 1.2 + 's';
        layer.appendChild(c);
        setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 3400);
      }
    },

    /* Texte d'une récompense : "50 🪙 + 1 💣" */
    rewardText: function (r) {
      if (!r) return '';
      const parts = [];
      if (r.coins) parts.push(TK.fmt(r.coins) + ' 🪙');
      if (r.hammer) parts.push(r.hammer + ' 🔨');
      if (r.bomb) parts.push(r.bomb + ' 💣');
      if (r.shuffle) parts.push(r.shuffle + ' 🔄');
      if (r.freeze) parts.push(r.freeze + ' 🧊');
      return parts.join(' + ');
    }
  };

  TK.UI = UI;
})();
