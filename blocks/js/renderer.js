/* =========================================================
   TIOKOVA BLOCKS — renderer.js
   Tout ce qui se DESSINE sur le canvas : plateau, pièces,
   aperçu, explosions, particules, textes flottants.
   Le canvas est redessiné ~60 fois par seconde.
   ========================================================= */
(function () {
  'use strict';
  const TK = (window.TK = window.TK || {});
  const N = TK.SIZE;

  /* ---------- Outils couleur ---------- */
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  // pct > 0 éclaircit, pct < 0 assombrit
  function shade(hex, pct) {
    const rgb = hexToRgb(hex);
    const out = rgb.map(function (v) {
      const t = pct < 0 ? 0 : 255;
      return Math.round(v + (t - v) * Math.abs(pct));
    });
    return 'rgb(' + out.join(',') + ')';
  }
  function rgba(hex, a) {
    const rgb = hexToRgb(hex);
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  TK.shade = shade;
  TK.rgba = rgba;

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  TK.roundRect = roundRect;

  /* ---------------------------------------------------------
     DESSIN D'UN BLOC selon le style du thème.
     On dessine chaque bloc UNE fois dans un petit canvas caché
     (cache), puis on le recopie : beaucoup plus rapide.
     --------------------------------------------------------- */
  const spriteCache = {};

  function paintBlock(ctx, x, y, s, color, style) {
    const r = s * 0.18;
    switch (style) {
      case 'flat': {
        roundRect(ctx, x, y, s, s, r * 0.6);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = Math.max(1, s * 0.06);
        ctx.strokeStyle = shade(color, -0.25);
        roundRect(ctx, x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, s - ctx.lineWidth, s - ctx.lineWidth, r * 0.5);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(x + s * 0.18, y + s * 0.16, s * 0.3, s * 0.08);
        break;
      }
      case 'glow': {
        const g = ctx.createRadialGradient(x + s * 0.5, y + s * 0.45, s * 0.05, x + s * 0.5, y + s * 0.5, s * 0.7);
        g.addColorStop(0, shade(color, 0.55));
        g.addColorStop(0.6, color);
        g.addColorStop(1, shade(color, -0.35));
        roundRect(ctx, x, y, s, s, r);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.lineWidth = Math.max(1, s * 0.04);
        ctx.strokeStyle = shade(color, 0.6);
        ctx.stroke();
        break;
      }
      case 'candy': {
        roundRect(ctx, x, y, s, s, s * 0.32);
        const g = ctx.createLinearGradient(x, y, x, y + s);
        g.addColorStop(0, shade(color, 0.25));
        g.addColorStop(1, shade(color, -0.2));
        ctx.fillStyle = g;
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.ellipse(x + s * 0.32, y + s * 0.28, s * 0.14, s * 0.09, -0.6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'stripe': {
        roundRect(ctx, x, y, s, s, r * 0.7);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.save();
        roundRect(ctx, x, y, s, s, r * 0.7);
        ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = s * 0.1;
        for (let k = -s; k < s * 2; k += s * 0.3) {
          ctx.beginPath();
          ctx.moveTo(x + k, y);
          ctx.lineTo(x + k - s, y + s);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.arc(x + s / 2, y + s / 2, s * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.lineWidth = Math.max(1, s * 0.05);
        ctx.strokeStyle = shade(color, -0.35);
        roundRect(ctx, x, y, s, s, r * 0.7);
        ctx.stroke();
        break;
      }
      case 'gem': {
        // Bloc "taillé" : 4 faces biseautées + face centrale
        const b = s * 0.2;
        ctx.save();
        roundRect(ctx, x, y, s, s, r * 0.5);
        ctx.clip();
        ctx.fillStyle = color;
        ctx.fillRect(x, y, s, s);
        const faces = [
          { pts: [[0, 0], [s, 0], [s - b, b], [b, b]], c: shade(color, 0.45) },
          { pts: [[s, 0], [s, s], [s - b, s - b], [s - b, b]], c: shade(color, -0.15) },
          { pts: [[0, s], [s, s], [s - b, s - b], [b, s - b]], c: shade(color, -0.4) },
          { pts: [[0, 0], [0, s], [b, s - b], [b, b]], c: shade(color, 0.2) }
        ];
        faces.forEach(function (f) {
          ctx.beginPath();
          ctx.moveTo(x + f.pts[0][0], y + f.pts[0][1]);
          for (let k = 1; k < 4; k++) ctx.lineTo(x + f.pts[k][0], y + f.pts[k][1]);
          ctx.closePath();
          ctx.fillStyle = f.c;
          ctx.fill();
        });
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(x + b * 1.3, y + b * 1.3, s * 0.18, s * 0.08);
        ctx.restore();
        break;
      }
      default: { // 'gloss'
        roundRect(ctx, x, y, s, s, r);
        const g = ctx.createLinearGradient(x, y, x, y + s);
        g.addColorStop(0, shade(color, 0.3));
        g.addColorStop(0.5, color);
        g.addColorStop(1, shade(color, -0.3));
        ctx.fillStyle = g;
        ctx.fill();
        // reflet brillant en haut
        ctx.save();
        roundRect(ctx, x, y, s, s, r);
        ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        roundRect(ctx, x + s * 0.1, y + s * 0.08, s * 0.8, s * 0.3, r * 0.8);
        ctx.fill();
        ctx.restore();
        ctx.lineWidth = Math.max(1, s * 0.04);
        ctx.strokeStyle = shade(color, -0.45);
        roundRect(ctx, x, y, s, s, r);
        ctx.stroke();
      }
    }
  }

  function getSprite(color, style, size) {
    const s = Math.max(4, Math.round(size));
    const key = style + '|' + color + '|' + s;
    if (spriteCache[key]) return spriteCache[key];
    const c = document.createElement('canvas');
    const pad = 2;
    c.width = c.height = s + pad * 2;
    paintBlock(c.getContext('2d'), pad, pad, s, color, style);
    spriteCache[key] = c;
    return c;
  }

  /* ---------------------------------------------------------
     RENDERER
     --------------------------------------------------------- */
  const R = {
    canvas: null, ctx: null, wrap: null,
    L: null,             // layout (positions/tailles calculées)
    theme: null,
    placed: {},          // i -> heure de pose (animation "pop")
    clearing: [],        // cases en train d'exploser
    particles: [],
    floats: [],          // textes flottants (+30, COMBO…)
    shakeUntil: 0, shakeMag: 0,
    trayStart: 0,        // animation d'arrivée des nouvelles pièces
    flashUntil: 0, flashColor: '#fff',

    init: function (canvas, wrap) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.wrap = wrap;
      this.setTheme(TK.Store.data.theme);
      this.resize();
    },

    setTheme: function (id) {
      this.theme = TK.THEME_BY_ID[id] || TK.THEMES[0];
      for (const k in spriteCache) delete spriteCache[k];
    },

    /* Calcule où se trouvent le plateau et les 3 emplacements de pièces */
    resize: function () {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const W = Math.max(200, this.wrap.clientWidth);
      const H = Math.max(260, this.wrap.clientHeight);
      this.canvas.width = Math.round(W * dpr);
      this.canvas.height = Math.round(H * dpr);
      this.canvas.style.width = W + 'px';
      this.canvas.style.height = H + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const side = 12;
      let bs = Math.min(W - side * 2, H / 1.45, 560);
      bs = Math.floor(bs / N) * N;          // taille multiple de 8 = cases nettes
      const cell = bs / N;
      const gap = Math.max(10, cell * 0.35);
      const trayH = Math.min(H - bs - gap - 8, bs * 0.5);
      const total = bs + gap + trayH;
      const by = Math.max(4, (H - total) / 2);
      const bx = (W - bs) / 2;
      const ty = by + bs + gap;
      const slotW = Math.min(W, bs + side * 2) / 3;
      const sx0 = (W - slotW * 3) / 2;
      const slots = [0, 1, 2].map(function (k) {
        return { x: sx0 + k * slotW, y: ty, w: slotW, h: trayH, cx: sx0 + k * slotW + slotW / 2, cy: ty + trayH / 2 };
      });
      const trayCell = Math.min(cell * 0.6, slotW / 5.6, trayH / 5.6);
      this.L = { W: W, H: H, dpr: dpr, bs: bs, cell: cell, bx: bx, by: by, gap: gap, slots: slots, trayCell: trayCell };
      for (const k in spriteCache) delete spriteCache[k];
    },

    cellXY: function (i) {
      const r = Math.floor(i / N), c = i % N;
      return { x: this.L.bx + c * this.L.cell, y: this.L.by + r * this.L.cell };
    },

    /* Position écran (x,y) -> case du plateau (ou null) */
    pointToCell: function (x, y) {
      const L = this.L;
      const c = Math.floor((x - L.bx) / L.cell);
      const r = Math.floor((y - L.by) / L.cell);
      if (r < 0 || r >= N || c < 0 || c >= N) return null;
      return { r: r, c: c };
    },

    /* Quel emplacement de pièce est sous le doigt ? */
    slotAt: function (x, y) {
      const s = this.L.slots;
      for (let k = 0; k < 3; k++) {
        if (x >= s[k].x && x <= s[k].x + s[k].w && y >= s[k].y - 10 && y <= s[k].y + s[k].h + 20) return k;
      }
      return -1;
    },

    /* ---------- Effets déclenchés par le jeu ---------- */
    addPlaced: function (cells) {
      const now = performance.now();
      const self = this;
      cells.forEach(function (i) { self.placed[i] = now; });
    },

    addClear: function (cleared, delayStep) {
      const now = performance.now();
      const self = this;
      cleared.forEach(function (o, k) {
        const t0 = now + (delayStep ? k * delayStep : 0);
        self.clearing.push({ i: o.i, v: o.v, t0: t0 });
        // particules
        const p = self.cellXY(o.i);
        const color = self.theme.colors[(o.v - 1 + 7) % 7];
        for (let j = 0; j < 4; j++) {
          self.particles.push({
            x: p.x + self.L.cell / 2, y: p.y + self.L.cell / 2,
            vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 6 - 1,
            s: self.L.cell * (0.12 + Math.random() * 0.18),
            color: color, t0: t0, life: 700 + Math.random() * 400, rot: Math.random() * 6
          });
        }
      });
      if (this.particles.length > 600) this.particles.splice(0, this.particles.length - 600);
    },

    addFloat: function (text, x, y, opts) {
      opts = opts || {};
      this.floats.push({
        text: text, x: x, y: y, t0: performance.now(),
        color: opts.color || '#fff', size: opts.size || 26, life: opts.life || 1100
      });
    },

    shake: function (mag, ms) {
      this.shakeMag = mag;
      this.shakeUntil = performance.now() + (ms || 300);
    },

    flash: function (color, ms) {
      this.flashColor = color || '#fff';
      this.flashUntil = performance.now() + (ms || 250);
    },

    newTray: function () { this.trayStart = performance.now(); },

    /* ---------------------------------------------------------
       DESSIN COMPLET D'UNE IMAGE
       g = état du jeu, v = vue (pièce tenue, aperçu, mode bonus)
       --------------------------------------------------------- */
    draw: function (g, v) {
      const ctx = this.ctx, L = this.L, th = this.theme;
      const now = performance.now();
      ctx.clearRect(0, 0, L.W, L.H);

      ctx.save();
      // tremblement de l'écran
      if (now < this.shakeUntil) {
        const k = (this.shakeUntil - now) / 300;
        ctx.translate((Math.random() - 0.5) * this.shakeMag * k, (Math.random() - 0.5) * this.shakeMag * k);
      }

      this.drawBoard(g, v, now);
      this.drawTray(g, v, now);
      this.drawParticles(now);
      if (v.drag) this.drawDragged(g, v);
      this.drawFloats(now);
      ctx.restore();

      if (now < this.flashUntil) {
        ctx.fillStyle = this.flashColor;
        ctx.globalAlpha = ((this.flashUntil - now) / 250) * 0.25;
        ctx.fillRect(0, 0, L.W, L.H);
        ctx.globalAlpha = 1;
      }
    },

    drawBoard: function (g, v, now) {
      const ctx = this.ctx, L = this.L, th = this.theme, cs = L.cell;
      // fond du plateau
      ctx.fillStyle = th.board;
      roundRect(ctx, L.bx - 6, L.by - 6, L.bs + 12, L.bs + 12, 14);
      ctx.fill();
      if (v.powerMode) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = rgba(th.accent2, 0.5 + 0.5 * Math.sin(now / 150));
        roundRect(ctx, L.bx - 6, L.by - 6, L.bs + 12, L.bs + 12, 14);
        ctx.stroke();
      }

      // lignes qui vont exploser (aperçu) : on les recolore
      const hlRows = {}, hlCols = {};
      let hlColor = null;
      if (v.preview && v.preview.valid) {
        v.preview.full.rows.forEach(function (r) { hlRows[r] = true; });
        v.preview.full.cols.forEach(function (c) { hlCols[c] = true; });
        hlColor = th.colors[v.preview.color];
      }
      const ghost = {};
      if (v.preview) v.preview.cells.forEach(function (i) { ghost[i] = true; });

      // bombe : zone visée
      const bombZone = {};
      if (v.bombAim) TK.Engine.bombCells(v.bombAim.r, v.bombAim.c).forEach(function (i) { bombZone[i] = true; });

      const pad = Math.max(1, cs * 0.05);
      for (let i = 0; i < N * N; i++) {
        const r = Math.floor(i / N), c = i % N;
        const x = L.bx + c * cs, y = L.by + r * cs;
        const val = g.grid[i];
        // case vide
        ctx.fillStyle = th.empty;
        roundRect(ctx, x + pad, y + pad, cs - pad * 2, cs - pad * 2, cs * 0.16);
        ctx.fill();

        if (val) {
          let color = th.colors[val - 1];
          if (hlColor && (hlRows[r] || hlCols[c])) color = hlColor;
          let scale = 1;
          const tp = this.placed[i];
          if (tp) {
            const k = (now - tp) / 180;
            if (k >= 1) delete this.placed[i];
            else scale = 0.75 + 0.25 * easeOutBack(k);
          }
          this.blit(color, x + pad, y + pad, cs - pad * 2, scale, 1);
          if (hlColor && (hlRows[r] || hlCols[c])) {
            ctx.fillStyle = 'rgba(255,255,255,' + (0.12 + 0.1 * Math.sin(now / 90)) + ')';
            roundRect(ctx, x + pad, y + pad, cs - pad * 2, cs - pad * 2, cs * 0.16);
            ctx.fill();
          }
        } else if (ghost[i]) {
          this.blit(th.colors[v.preview.color], x + pad, y + pad, cs - pad * 2, 1, v.preview.valid ? 0.45 : 0.18);
        } else if (hlColor && (hlRows[r] || hlCols[c])) {
          ctx.fillStyle = rgba(hlColor, 0.18);
          roundRect(ctx, x + pad, y + pad, cs - pad * 2, cs - pad * 2, cs * 0.16);
          ctx.fill();
        }
        if (bombZone[i]) {
          ctx.fillStyle = 'rgba(255,80,60,' + (0.35 + 0.15 * Math.sin(now / 80)) + ')';
          roundRect(ctx, x + pad, y + pad, cs - pad * 2, cs - pad * 2, cs * 0.16);
          ctx.fill();
        }
      }

      // cases en train d'exploser
      const self = this;
      this.clearing = this.clearing.filter(function (o) {
        const k = (now - o.t0) / 320;
        if (k < 0) {
          const p0 = self.cellXY(o.i);
          self.blit(th.colors[(o.v - 1 + 7) % 7], p0.x + pad, p0.y + pad, cs - pad * 2, 1, 1);
          return true;
        }
        if (k >= 1) return false;
        const p = self.cellXY(o.i);
        const s = 1 + k * 0.35;
        self.blit(th.colors[(o.v - 1 + 7) % 7], p.x + pad, p.y + pad, cs - pad * 2, s, 1 - k);
        ctx.fillStyle = 'rgba(255,255,255,' + (1 - k) * 0.6 + ')';
        roundRect(ctx, p.x + pad, p.y + pad, cs - pad * 2, cs - pad * 2, cs * 0.16);
        ctx.fill();
        return true;
      });
    },

    /* Copie un sprite de bloc à l'écran, avec zoom et transparence */
    blit: function (color, x, y, size, scale, alpha) {
      const ctx = this.ctx;
      const spr = getSprite(color, this.theme.style, size * this.L.dpr);
      const s = size * (scale || 1);
      const off = (size - s) / 2;
      const padPx = 2 / this.L.dpr;
      if (alpha !== undefined && alpha < 1) ctx.globalAlpha = Math.max(0, alpha);
      ctx.drawImage(spr, x + off - padPx * scale, y + off - padPx * scale, s + padPx * 2 * scale, s + padPx * 2 * scale);
      ctx.globalAlpha = 1;
    },

    /* Dessine une pièce : (cx, cy) = centre, cs = taille d'une case */
    drawPiece: function (piece, cx, cy, cs, alpha, scale) {
      const shape = TK.SHAPE_BY_ID[piece.id];
      const color = this.theme.colors[piece.color];
      const sc = scale || 1;
      const size = cs * sc;
      const x0 = cx - (shape.w * size) / 2;
      const y0 = cy - (shape.h * size) / 2;
      const pad = Math.max(1, size * 0.05);
      const self = this;
      shape.cells.forEach(function (c) {
        self.blit(color, x0 + c[1] * size + pad, y0 + c[0] * size + pad, size - pad * 2, 1, alpha);
      });
    },

    drawTray: function (g, v, now) {
      const L = this.L;
      const k = Math.min(1, (now - this.trayStart) / 350);
      for (let s = 0; s < 3; s++) {
        const p = g.tray[s];
        if (!p) continue;
        if (v.drag && v.drag.index === s) continue;
        const slot = L.slots[s];
        const fits = TK.Engine.fitsAnywhere(g.grid, TK.SHAPE_BY_ID[p.id]);
        // animation d'arrivée : glisse depuis la droite, décalée par emplacement
        const ks = Math.max(0, Math.min(1, k * 1.6 - s * 0.25));
        const dx = (1 - easeOutBack(ks)) * L.W * 0.6;
        this.drawPiece(p, slot.cx + dx, slot.cy, L.trayCell, fits ? 1 : 0.28);
      }
    },

    drawDragged: function (g, v) {
      const d = v.drag;
      const p = g.tray[d.index];
      if (!p) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 10;
      this.drawPiece(p, d.x, d.y - d.lift, this.L.cell * 0.98, 1);
      ctx.restore();
    },

    drawParticles: function (now) {
      const ctx = this.ctx;
      const self = this;
      this.particles = this.particles.filter(function (p) {
        const t = now - p.t0;
        if (t < 0) return true;
        if (t > p.life) return false;
        const k = t / 16;
        const x = p.x + p.vx * k;
        const y = p.y + p.vy * k + 0.12 * k * k;
        ctx.save();
        ctx.globalAlpha = 1 - t / p.life;
        ctx.translate(x, y);
        ctx.rotate(p.rot + k * 0.1);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
        ctx.restore();
        return y < self.L.H + 50;
      });
    },

    drawFloats: function (now) {
      const ctx = this.ctx;
      this.floats = this.floats.filter(function (f) {
        const t = now - f.t0;
        if (t > f.life) return false;
        const k = t / f.life;
        const pop = k < 0.15 ? easeOutBack(k / 0.15) : 1;
        ctx.save();
        ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
        ctx.translate(f.x, f.y - k * 50);
        ctx.scale(pop, pop);
        ctx.font = '900 ' + f.size + 'px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = Math.max(3, f.size / 6);
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.strokeText(f.text, 0, 0);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, 0, 0);
        ctx.restore();
        return true;
      });
    },

    /* Y a-t-il encore une animation en cours ? */
    busy: function () {
      return this.clearing.length > 0;
    }
  };

  function easeOutBack(k) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
  }
  TK.easeOutBack = easeOutBack;

  /* Petite fonction utilisée par le tutoriel et la boutique :
     dessine un aperçu de thème dans un canvas quelconque */
  TK.drawThemePreview = function (canvas, theme) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.clientWidth || 120, H = canvas.clientHeight || 70;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, theme.bg[0]);
    g.addColorStop(1, theme.bg[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const s = Math.min(W / 6, H / 3) * 0.86;
    const layout = [[0, 0], [0, 1], [1, 1], [1, 2], [0, 3], [1, 3], [1, 4], [0, 4]];
    const x0 = (W - 5 * s) / 2, y0 = (H - 2 * s) / 2;
    layout.forEach(function (p, k) {
      paintBlock(ctx, x0 + p[1] * s + 1, y0 + p[0] * s + 1, s - 2, theme.colors[k % 7], theme.style);
    });
  };

  TK.Renderer = R;
})();
