/* =========================================================
   TIOKOVA BLOCKS — input.js
   Gestion du doigt / de la souris : prendre une pièce,
   la glisser, la poser, viser avec un bonus.
   On utilise les "Pointer Events" : un seul code pour
   le tactile ET la souris.
   ========================================================= */
(function () {
  'use strict';
  const TK = (window.TK = window.TK || {});

  const Input = {
    drag: null,       // { index, x, y, lift, pointerId }
    preview: null,    // { r, c, cells, valid, full, color }
    bombAim: null,
    handlers: null,   // fonctions fournies par game.js

    init: function (canvas, handlers) {
      this.canvas = canvas;
      this.handlers = handlers;
      const self = this;
      canvas.addEventListener('pointerdown', function (e) { self.down(e); });
      canvas.addEventListener('pointermove', function (e) { self.move(e); });
      canvas.addEventListener('pointerup', function (e) { self.up(e); });
      canvas.addEventListener('pointercancel', function (e) { self.cancel(e); });
      // Empêche le défilement / zoom de la page pendant qu'on joue
      canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
      canvas.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
      canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    },

    pos: function (e) {
      const rect = this.canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },

    down: function (e) {
      TK.Audio.unlock();
      const h = this.handlers;
      if (!h.canInteract()) return;
      const p = this.pos(e);

      // Mode bonus actif : on vise une case du plateau
      const power = h.activePower();
      if (power) {
        const cell = TK.Renderer.pointToCell(p.x, p.y);
        if (power === 'bomb' && cell) {
          this.bombAim = cell;
          this.aimPointer = e.pointerId;
          try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* rien */ }
          return;
        }
        if (cell) h.usePowerAt(power, cell.r, cell.c);
        return;
      }

      const slot = TK.Renderer.slotAt(p.x, p.y);
      if (slot < 0 || !h.getTray()[slot]) return;

      // Sur un téléphone, on soulève la pièce au-dessus du doigt
      // pour qu'elle reste visible (sinon le doigt la cache).
      const touch = e.pointerType !== 'mouse';
      const cell = TK.Renderer.L.cell;
      this.drag = {
        index: slot, x: p.x, y: p.y,
        lift: touch ? cell * 2.1 : cell * 0.6,
        pointerId: e.pointerId
      };
      try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* rien */ }
      TK.Audio.pick();
      TK.Audio.vibrate(8);
      this.updatePreview();
    },

    move: function (e) {
      const p = this.pos(e);
      if (this.bombAim && e.pointerId === this.aimPointer) {
        const cell = TK.Renderer.pointToCell(p.x, p.y);
        if (cell) this.bombAim = cell;
        return;
      }
      if (!this.drag || e.pointerId !== this.drag.pointerId) return;
      this.drag.x = p.x;
      this.drag.y = p.y;
      this.updatePreview();
    },

    up: function (e) {
      const h = this.handlers;
      if (this.bombAim && e.pointerId === this.aimPointer) {
        const aim = this.bombAim;
        this.bombAim = null;
        h.usePowerAt('bomb', aim.r, aim.c);
        return;
      }
      if (!this.drag || e.pointerId !== this.drag.pointerId) return;
      const d = this.drag, pv = this.preview;
      this.drag = null;
      this.preview = null;
      if (pv && pv.valid) {
        h.place(d.index, pv.r, pv.c);
      } else if (pv) {
        // posée au-dessus du plateau mais à un endroit interdit
        TK.Audio.invalid();
        TK.Audio.vibrate([20, 30, 20]);
      }
    },

    cancel: function () {
      this.drag = null;
      this.preview = null;
      this.bombAim = null;
    },

    /* Calcule la case visée par la pièce tenue.
       On part du coin haut-gauche de la pièce dessinée
       et on l'arrondit à la case la plus proche. */
    updatePreview: function () {
      const d = this.drag;
      if (!d) { this.preview = null; return; }
      const g = this.handlers.getState();
      const piece = g.tray[d.index];
      if (!piece) { this.preview = null; return; }
      const shape = TK.SHAPE_BY_ID[piece.id];
      const L = TK.Renderer.L;
      const size = L.cell * 0.98;
      const left = d.x - (shape.w * size) / 2;
      const top = d.y - d.lift - (shape.h * size) / 2;
      const c = Math.round((left - L.bx) / L.cell);
      const r = Math.round((top - L.by) / L.cell);

      // trop loin du plateau : pas d'aperçu
      if (r < -1 || c < -1 || r + shape.h > TK.SIZE + 1 || c + shape.w > TK.SIZE + 1) {
        this.preview = null;
        return;
      }
      const valid = TK.Engine.canPlace(g.grid, shape, r, c);
      const cells = [];
      shape.cells.forEach(function (cc) {
        const rr = r + cc[0], col = c + cc[1];
        if (rr >= 0 && rr < TK.SIZE && col >= 0 && col < TK.SIZE) cells.push(rr * TK.SIZE + col);
      });
      const full = valid ? TK.Engine.previewClear(g.grid, shape, r, c) : { rows: [], cols: [] };
      const prev = this.preview;
      // petit "tic" de vibration quand on change de case valide
      if (valid && (!prev || prev.r !== r || prev.c !== c)) TK.Audio.vibrate(4);
      this.preview = { r: r, c: c, cells: cells, valid: valid, full: full, color: piece.color };
    },

    view: function (powerMode) {
      return { drag: this.drag, preview: this.preview, powerMode: powerMode, bombAim: this.bombAim };
    }
  };

  TK.Input = Input;
})();
