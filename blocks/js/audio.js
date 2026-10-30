/* =========================================================
   TIOKOVA BLOCKS — audio.js
   Tous les sons sont FABRIQUÉS par le code (Web Audio API) :
   aucun fichier mp3 à télécharger → le jeu reste léger
   et fonctionne hors connexion.
   ========================================================= */
(function () {
  'use strict';
  const TK = (window.TK = window.TK || {});

  let ctx = null;        // contexte audio (créé au premier toucher)
  let master = null;     // volume général des effets
  let musicGain = null;  // volume de la musique
  let musicTimer = null;
  let musicStep = 0;

  // Les navigateurs mobiles exigent un geste du joueur avant de jouer un son.
  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.08;
    musicGain.connect(ctx.destination);
    return ctx;
  }

  function enabled() { return TK.Store && TK.Store.data && TK.Store.data.sound; }

  /* Joue une note simple.
     freq : fréquence (Hz) — type : forme d'onde — dur : durée (s)
     slide : fréquence d'arrivée (glissando) */
  function tone(freq, dur, type, vol, delay, slide, out) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    // Enveloppe : attaque très rapide puis décroissance (évite les "clics")
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.5, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(out || master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // Petit bruit blanc filtré (pour les explosions)
  function noise(dur, vol, delay, freq) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq || 1200;
    const g = c.createGain();
    g.gain.value = vol || 0.3;
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t0);
  }

  // Gamme pentatonique : toutes les notes sonnent bien ensemble
  const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

  TK.Audio = {
    unlock: function () { ensure(); },

    pick: function () {
      if (!enabled()) return;
      tone(520, 0.06, 'triangle', 0.25);
    },
    place: function (size) {
      if (!enabled()) return;
      tone(180 + (size || 3) * 20, 0.09, 'square', 0.18);
      tone(90, 0.12, 'sine', 0.4);
    },
    invalid: function () {
      if (!enabled()) return;
      tone(160, 0.15, 'sawtooth', 0.15, 0, 110);
    },
    clear: function (lines, combo) {
      if (!enabled()) return;
      const base = Math.min(combo || 0, 6);
      for (let i = 0; i < Math.min(lines + 1, 5); i++) {
        tone(PENTA[Math.min(i + base, PENTA.length - 1)], 0.22, 'triangle', 0.35, i * 0.06);
      }
      noise(0.25, 0.18 + lines * 0.04, 0, 900 + lines * 400);
    },
    combo: function (n) {
      if (!enabled()) return;
      const f = 400 + Math.min(n, 10) * 60;
      tone(f, 0.18, 'square', 0.15, 0, f * 2);
    },
    boardClear: function () {
      if (!enabled()) return;
      [0, 2, 4, 5, 7, 9].forEach(function (n, i) {
        tone(PENTA[n] * 1, 0.4, 'triangle', 0.3, i * 0.08);
        tone(PENTA[n] * 2, 0.3, 'sine', 0.12, i * 0.08 + 0.02);
      });
    },
    coin: function () {
      if (!enabled()) return;
      tone(988, 0.08, 'square', 0.15);
      tone(1319, 0.25, 'square', 0.15, 0.07);
    },
    click: function () {
      if (!enabled()) return;
      tone(700, 0.04, 'triangle', 0.15);
    },
    levelUp: function () {
      if (!enabled()) return;
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        tone(f, 0.25, 'triangle', 0.3, i * 0.1);
      });
    },
    gameOver: function () {
      if (!enabled()) return;
      [392, 349.23, 311.13, 261.63].forEach(function (f, i) {
        tone(f, 0.35, 'triangle', 0.3, i * 0.15);
      });
    },
    bomb: function () {
      if (!enabled()) return;
      noise(0.6, 0.5, 0, 600);
      tone(120, 0.5, 'sine', 0.6, 0, 40);
    },
    hammer: function () {
      if (!enabled()) return;
      tone(300, 0.08, 'square', 0.25, 0, 150);
      noise(0.12, 0.25, 0.02, 2500);
    },
    shuffle: function () {
      if (!enabled()) return;
      for (let i = 0; i < 5; i++) tone(300 + i * 90, 0.06, 'triangle', 0.2, i * 0.04);
    },
    tick: function () {
      if (!enabled()) return;
      tone(1200, 0.03, 'square', 0.08);
    },
    star: function (i) {
      if (!enabled()) return;
      tone(659.25 * Math.pow(1.25, i), 0.3, 'triangle', 0.35);
    },

    /* ---------- Musique d'ambiance générée (douce, en boucle) ---------- */
    startMusic: function () {
      if (!TK.Store.data.music || musicTimer) return;
      const c = ensure();
      if (!c) return;
      const chords = [[0, 2, 4], [3, 5, 7], [1, 4, 6], [2, 4, 7]];
      musicStep = 0;
      musicTimer = setInterval(function () {
        if (!TK.Store.data.music) return;
        const chord = chords[Math.floor(musicStep / 8) % chords.length];
        const note = chord[musicStep % chord.length];
        tone(PENTA[note] / 2, 0.5, 'sine', 0.5, 0, null, musicGain);
        if (musicStep % 8 === 0) tone(PENTA[chord[0]] / 4, 2.2, 'triangle', 0.6, 0, null, musicGain);
        musicStep++;
      }, 300);
    },
    stopMusic: function () {
      if (musicTimer) clearInterval(musicTimer);
      musicTimer = null;
    },

    /* ---------- Vibrations (si le téléphone le permet) ---------- */
    vibrate: function (pattern) {
      if (!TK.Store.data.vibe || !navigator.vibrate) return;
      try { navigator.vibrate(pattern); } catch (e) { /* ignoré */ }
    }
  };
})();
