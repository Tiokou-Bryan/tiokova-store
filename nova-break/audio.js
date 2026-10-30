// =====================================================
//  NOVA BREAK — audio.js
//  Toute la musique et tous les sons sont CRÉÉS PAR LE CODE
//  (Web Audio API) : aucun fichier mp3 à télécharger.
//
//  Le secret de la "symbiose" : la musique joue des accords,
//  et chaque brique touchée joue une note de L'ACCORD EN COURS.
//  Résultat : tes coups font partie de la musique.
// =====================================================

const Son = (() => {
  let ctx = null, master, busMusique, filtreMusique, busSfx, entreeReverb, entreeDelay, delay;
  let musiqueOn = lire('musique', true), sonsOn = lire('sons', true);
  let theme = null, nomTheme = '', pas = 0, prochainPas = 0, minuteur = null;
  let boostActif = null, lentActif = false, enPause = false;
  let accordCourant = [57, 60, 64, 67];
  const derniers = {};

  function lire(k, d) { try { const v = localStorage.getItem('nb_' + k); return v === null ? d : v === '1'; } catch (e) { return d; } }
  function ecrire(k, v) { try { localStorage.setItem('nb_' + k, v ? '1' : '0'); } catch (e) {} }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);   // numéro de note MIDI -> fréquence

  // ---------- Mise en place de la "table de mixage" ----------
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();

    master = ctx.createGain(); master.gain.value = 0.85;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);

    // Réverbération : donne l'impression d'un grand espace calme
    const reverb = ctx.createConvolver(); reverb.buffer = impulsion(2.6);
    const gRev = ctx.createGain(); gRev.gain.value = 0.3;
    entreeReverb = ctx.createGain();
    entreeReverb.connect(reverb); reverb.connect(gRev); gRev.connect(master);

    // Musique : volume + filtre (on "étouffe" la musique pendant le ralenti ou la pause)
    busMusique = ctx.createGain(); busMusique.gain.value = musiqueOn ? 0.5 : 0;
    filtreMusique = ctx.createBiquadFilter(); filtreMusique.type = 'lowpass'; filtreMusique.frequency.value = 3000;
    busMusique.connect(filtreMusique); filtreMusique.connect(master); filtreMusique.connect(entreeReverb);

    // Écho rythmé (calé sur le tempo)
    delay = ctx.createDelay(1.5); delay.delayTime.value = 0.375;
    const fb = ctx.createGain(); fb.gain.value = 0.33;
    const fDelay = ctx.createBiquadFilter(); fDelay.type = 'lowpass'; fDelay.frequency.value = 2400;
    entreeDelay = ctx.createGain(); entreeDelay.gain.value = 0.32;
    entreeDelay.connect(delay); delay.connect(fDelay); fDelay.connect(fb); fb.connect(delay);
    fDelay.connect(busMusique);

    // Effets sonores
    busSfx = ctx.createGain(); busSfx.gain.value = sonsOn ? 0.75 : 0;
    busSfx.connect(master); busSfx.connect(entreeReverb);
    return true;
  }

  function impulsion(sec) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
    return b;
  }
  let tampon = null;
  function tamponBruit() {
    if (!tampon) { const n = ctx.sampleRate; tampon = ctx.createBuffer(1, n, ctx.sampleRate); const d = tampon.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; }
    return tampon;
  }

  // ---------- Instruments de base ----------
  // Une note : un oscillateur + une enveloppe de volume (attaque puis extinction)
  function note(dest, o) {
    const t = o.t || ctx.currentTime, att = o.att || 0.005;
    const osc = ctx.createOscillator(); osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.glisse) osc.frequency.exponentialRampToValueAtTime(o.glisse, t + att + o.dur);
    if (o.detune) osc.detune.value = o.detune;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + att + o.dur);
    let sortie = osc;
    if (o.filtre) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.filtre; f.Q.value = o.q || 0.8; osc.connect(f); sortie = f; }
    sortie.connect(g); g.connect(dest);
    if (o.echo) g.connect(entreeDelay);
    osc.start(t); osc.stop(t + att + o.dur + 0.05);
  }
  // Un souffle : du bruit filtré (charleston, verre qui casse, explosion, vent…)
  function souffle(dest, o) {
    const t = o.t || ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = tamponBruit(); s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = o.type || 'highpass'; f.Q.value = o.q || 0.7;
    f.frequency.setValueAtTime(o.f || 5000, t);
    if (o.fFin) f.frequency.exponentialRampToValueAtTime(o.fFin, t + o.dur);
    const g = ctx.createGain();
    if (o.att) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.vol || 0.2, t + o.att); }
    else g.gain.setValueAtTime(o.vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + o.dur + 0.05);
  }
  const grosseCaisse = (t, v) => note(busMusique, { f: 150, glisse: 42, t, dur: 0.22, vol: v, att: 0.002 });
  const charleston = (t, v) => souffle(busMusique, { t, dur: 0.045, vol: v, f: 8000 });
  const claquement = (t, v) => { souffle(busMusique, { t, dur: 0.14, vol: v, type: 'bandpass', f: 1600, q: 0.9 }); souffle(busMusique, { t: t + 0.012, dur: 0.1, vol: v * 0.7, type: 'bandpass', f: 1200 }); };

  // ---------- Les musiques (une par mode) ----------
  // accords : 4 mesures qui tournent en boucle (notes MIDI). Motifs : 16 cases = 1 mesure.
  const THEMES = {
    menu:     { bpm: 72,  accords: [[57,60,64,67],[53,57,60,64],[48,52,55,59],[55,59,62,64]], pad: .045, cloche: .35, basse: .08, motifBasse: 'x.......x.......', coupure: 2600 },
    zen:      { bpm: 64,  accords: [[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,64]], pad: .05, cloche: .45, basse: .07, motifBasse: 'x...............', coupure: 2200 },
    aventure: { bpm: 96,  accords: [[57,60,64],[53,57,60],[60,64,67],[55,59,62]], pad: .03, arp: 2, arpType: 'triangle', arpVol: .055, basse: .11, motifBasse: 'x.....x.x.......', kick: 'x.......x.......', hat: '..x...x...x...x.', kv: .32, hv: .025, coupure: 3200 },
    defi:     { bpm: 104, accords: [[64,68,71],[61,64,68],[57,61,64],[59,63,66]], pad: .03, arp: 2, arpType: 'triangle', arpVol: .055, basse: .11, motifBasse: 'x...x...x...x.x.', kick: 'x...x...x...x...', hat: '..x...x...x...x.', clap: '....x.......x...', kv: .3, hv: .025, cv: .05, coupure: 3600 },
    rush:     { bpm: 124, accords: [[62,65,69],[58,62,65],[53,57,60,65],[60,64,67]], pad: .025, arp: 2, arpType: 'sawtooth', arpVol: .03, arpFiltre: 1800, basse: .12, motifBasse: 'x.x.x.x.x.x.x.x.', kick: 'x...x...x...x...', hat: 'x.x.x.x.x.x.x.x.', clap: '....x.......x...', kv: .36, hv: .022, cv: .06, coupure: 4200 },
    invasion: { bpm: 108, accords: [[64,67,71],[60,64,67,71],[57,60,64],[59,63,66,69]], pad: .035, arp: 1, arpType: 'square', arpVol: .022, arpFiltre: 1400, basse: .12, motifBasse: 'x.xxx.xxx.xxx.xx', kick: 'x.......x.......', hat: '..x...x...x...x.', clap: '....x.......x...', kv: .36, hv: .025, cv: .055, coupure: 2600 },
    boss:     { bpm: 128, accords: [[62,65,69],[58,62,65],[55,58,62],[57,61,64]], pad: .025, arp: 2, arpType: 'sawtooth', arpVol: .035, arpFiltre: 2200, basse: .13, motifBasse: 'x.xxx.xxx.xxx.xx', kick: 'x...x...x...x...', hat: 'x.x.x.x.x.x.x.x.', clap: '....x.......x...', kv: .4, hv: .025, cv: .07, coupure: 5000 },
  };

  function jouerPas(p, t, d) {
    const th = theme, s = p % 16, acc = th.accords[Math.floor(p / 16) % th.accords.length];
    if (s === 0) accordCourant = acc;
    if (s === 0 && th.pad) for (const n of acc) for (const dt of [-8, 8])
      note(busMusique, { f: hz(n), t, dur: d * 16, att: 0.5, vol: th.pad, type: 'triangle', detune: dt, filtre: 1500 });
    if (th.basse && th.motifBasse[s] === 'x')
      note(busMusique, { f: hz(acc[0] - 12), t, dur: d * 1.6, vol: th.basse, type: 'triangle', filtre: 700, att: 0.01 });
    if (th.arp && (th.arp === 2 || s % 2 === 0)) {
      const i = th.arp === 2 ? s : s / 2;
      const n = acc[i % acc.length] + 12 * (Math.floor(i / acc.length) % 2);
      note(busMusique, { f: hz(n + 12), t, dur: d * 1.4, vol: th.arpVol, type: th.arpType, filtre: th.arpFiltre || 2600, echo: true });
    }
    if (th.cloche && s % 4 === 0 && Math.random() < th.cloche) {
      const n = acc[Math.floor(Math.random() * acc.length)] + 12 + (Math.random() < 0.4 ? 12 : 0);
      note(busMusique, { f: hz(n), t, dur: 1.8, vol: 0.05, echo: true });
      note(busMusique, { f: hz(n) * 3, t, dur: 0.5, vol: 0.01 });
    }
    if (th.kick && th.kick[s] === 'x') grosseCaisse(t, th.kv);
    if (th.hat && th.hat[s] === 'x') charleston(t, th.hv);
    if (th.clap && th.clap[s] === 'x') claquement(t, th.cv);
    // Couche spéciale pendant les boosters légendaires
    if (boostActif === 'dinky' && s % 2 === 0)
      note(busMusique, { f: hz(acc[(s / 2) % acc.length] + 24), t, dur: d * 0.8, vol: 0.028, type: 'square', filtre: 3500, echo: true });
    if (boostActif === 'bryan' && s % 4 === 0) {
      const n = acc[(s / 4) % acc.length] + 12;
      for (const dt of [-6, 6]) note(busMusique, { f: hz(n), t, dur: d * 3.5, vol: 0.04, type: 'sawtooth', filtre: 2400, att: 0.02, detune: dt });
    }
    if (boostActif && !th.kick && s % 8 === 0) grosseCaisse(t, 0.3);
  }

  function planifier() {
    if (!theme || !ctx || ctx.state !== 'running') return;
    const d = 60 / theme.bpm / 4;
    if (prochainPas < ctx.currentTime - 0.2) prochainPas = ctx.currentTime + 0.05; // après une coupure, on recale
    while (prochainPas < ctx.currentTime + 0.12) {
      jouerPas(pas, prochainPas, d);
      prochainPas += d; pas = (pas + 1) % 64;
    }
  }

  function majFiltre() {
    if (!ctx) return;
    let f = (theme && theme.coupure) || 3000;
    if (boostActif) f = 7000;
    if (lentActif) f = 650;
    if (enPause) f = 500;
    filtreMusique.frequency.setTargetAtTime(f, ctx.currentTime, 0.15);
    busMusique.gain.setTargetAtTime(musiqueOn ? (enPause ? 0.25 : 0.5) : 0, ctx.currentTime, 0.1);
  }

  // ---------- Petits outils pour les effets ----------
  function peut(nom, ms) { const n = performance.now(); if (derniers[nom] && n - derniers[nom] < ms) return false; derniers[nom] = n; return true; }
  const pret = () => ctx && sonsOn && ctx.state === 'running';
  function noteAccord(i, octave) { const a = accordCourant, l = a.length; return a[((i % l) + l) % l] + 12 * (octave + Math.floor(i / l)); }

  return {
    debloquer() { init(); },
    jouerTheme(nom) {
      if (!init() || nomTheme === nom) return;
      nomTheme = nom; theme = THEMES[nom]; pas = 0;
      prochainPas = ctx.currentTime + 0.08;
      delay.delayTime.setValueAtTime(3 * 60 / theme.bpm / 4, ctx.currentTime);
      majFiltre();
      if (!minuteur) minuteur = setInterval(planifier, 30);
    },
    boost(type) { if (boostActif !== type) { boostActif = type; majFiltre(); } },
    ralenti(actif) { if (lentActif !== actif) { lentActif = actif; majFiltre(); } },
    pauseMusique(p) { enPause = p; majFiltre(); },
    suspendre() { if (ctx && ctx.state === 'running') ctx.suspend(); },
    relancer() { if (ctx && ctx.state === 'suspended') ctx.resume(); },
    musiqueOn: () => musiqueOn,
    sonsOn: () => sonsOn,
    basculerMusique() { musiqueOn = !musiqueOn; ecrire('musique', musiqueOn); majFiltre(); return musiqueOn; },
    basculerSons() { sonsOn = !sonsOn; ecrire('sons', sonsOn); if (busSfx) busSfx.gain.value = sonsOn ? 0.75 : 0; return sonsOn; },

    // Brique touchée mais pas cassée : plus elle est abîmée, plus la note descend et plus ça craque
    frappe(k) {
      if (!pret() || !peut('frappe', 35)) return;
      const t = ctx.currentTime;
      note(busSfx, { f: hz(noteAccord(Math.round(k * 3), 1)), t, dur: 0.09, vol: 0.08, type: 'triangle' });
      souffle(busSfx, { t, dur: 0.05 + (1 - k) * 0.09, vol: 0.03 + (1 - k) * 0.09, type: 'bandpass', f: 1800 + k * 2500, q: 1.5 });
    },
    // Brique cassée : verre + note de l'accord qui MONTE avec le combo
    casse(combo) {
      if (!pret() || !peut('casse', 30)) return;
      const t = ctx.currentTime, n = noteAccord(Math.min(combo, 14), 1);
      note(busSfx, { f: hz(n + 12), t, dur: 0.35, vol: 0.09 });
      note(busSfx, { f: hz(n + 24), t, dur: 0.16, vol: 0.025, type: 'triangle' });
      souffle(busSfx, { t, dur: 0.18, vol: 0.07, f: 4500 });
    },
    raquette() { if (!pret() || !peut('raq', 40)) return; const t = ctx.currentTime; note(busSfx, { f: hz(noteAccord(0, 0)), t, dur: 0.14, vol: 0.1, type: 'triangle' }); note(busSfx, { f: 110, glisse: 60, t, dur: 0.08, vol: 0.08 }); },
    mur() { if (!pret() || !peut('mur', 50)) return; note(busSfx, { f: 900, dur: 0.03, vol: 0.02 }); },
    clic() { if (!pret()) return; note(busSfx, { f: 880, dur: 0.05, vol: 0.05 }); },
    bonus() {
      if (!pret()) return;
      const t = ctx.currentTime;
      for (let i = 0; i < 5; i++) note(busSfx, { f: hz(noteAccord(i, 1) + 12), t: t + i * 0.05, dur: 0.25, vol: 0.06, type: 'triangle', echo: true });
      souffle(busSfx, { t, dur: 0.4, vol: 0.08, type: 'bandpass', f: 400, fFin: 5000, q: 2, att: 0.1 });
    },
    special(type) {
      if (!pret()) return;
      const t = ctx.currentTime;
      souffle(busSfx, { t, dur: 1.4, vol: 0.12, type: 'bandpass', f: 200, fFin: 7000, q: 1.5, att: 0.9 });
      note(busSfx, { f: 90, glisse: 30, t: t + 0.05, dur: 1.2, vol: 0.35 });
      if (type === 'dinky') {
        for (let i = 0; i < 8; i++) note(busSfx, { f: 1500 + Math.random() * 2500, glisse: 200, t: t + i * 0.07, dur: 0.07, vol: 0.04, type: 'square' });
        for (const n of accordCourant) note(busSfx, { f: hz(n + 12), t: t + 0.6, dur: 1.4, vol: 0.05, type: 'sawtooth', filtre: 3000, echo: true });
      } else {
        const r = accordCourant[0] + 12, majeur = [0, 4, 7, 12];
        majeur.forEach((m, i) => note(busSfx, { f: hz(r + m), t: t + i * 0.13, dur: 0.3, vol: 0.06, type: 'sawtooth', filtre: 2500 }));
        for (const m of majeur) for (const dt of [-7, 7]) note(busSfx, { f: hz(r + m), t: t + 0.55, dur: 1.6, vol: 0.045, type: 'sawtooth', filtre: 2800, detune: dt, echo: true });
        souffle(busSfx, { t: t + 0.55, dur: 1.8, vol: 0.06, f: 6000 });
      }
    },
    laser() { if (!pret() || !peut('laser', 60)) return; note(busSfx, { f: 1400, glisse: 500, dur: 0.08, vol: 0.03, type: 'square' }); },
    eclair() { if (!pret() || !peut('eclair', 70)) return; const t = ctx.currentTime; souffle(busSfx, { t, dur: 0.14, vol: 0.09, type: 'bandpass', f: 3000, q: 2 }); note(busSfx, { f: 2200, glisse: 300, t, dur: 0.1, vol: 0.03, type: 'square' }); },
    explosion(gros) {
      if (!pret() || !peut('boom', 60)) return;
      const t = ctx.currentTime, d = gros ? 1.1 : 0.45;
      souffle(busSfx, { t, dur: d, vol: gros ? 0.3 : 0.18, type: 'lowpass', f: 1500, fFin: 90 });
      note(busSfx, { f: 95, glisse: 30, t, dur: d, vol: gros ? 0.4 : 0.25 });
    },
    nova() { if (!pret()) return; const t = ctx.currentTime; souffle(busSfx, { t, dur: 1.3, vol: 0.16, type: 'bandpass', f: 6000, fFin: 200, q: 1 }); note(busSfx, { f: 70, glisse: 28, t, dur: 1.2, vol: 0.4 }); },
    bouclier() { if (!pret() || !peut('bouclier', 80)) return; note(busSfx, { f: 600, glisse: 1300, dur: 0.18, vol: 0.06 }); },
    perte() { if (!pret()) return; const t = ctx.currentTime; [0, -3, -7].forEach((m, i) => note(busSfx, { f: hz(accordCourant[0] + m), t: t + i * 0.16, dur: 0.3, vol: 0.09, type: 'triangle' })); },
    niveau() { if (!pret()) return; const t = ctx.currentTime; for (let i = 0; i < 7; i++) note(busSfx, { f: hz(noteAccord(i, 1) + 12), t: t + i * 0.07, dur: 0.4, vol: 0.06, echo: true }); },
    fin(gagne) {
      if (!pret()) return;
      const t = ctx.currentTime, pasNote = gagne ? [0, 4, 7, 12] : [12, 7, 3, 0];
      pasNote.forEach((m, i) => note(busSfx, { f: hz(57 + m), t: t + i * 0.18, dur: 0.6, vol: 0.08, type: 'triangle', echo: true }));
    },
    bossTir() { if (!pret()) return; note(busSfx, { f: 320, glisse: 110, dur: 0.22, vol: 0.05, type: 'square', filtre: 1500 }); },
    choc() { if (!pret()) return; const t = ctx.currentTime; note(busSfx, { f: 130, dur: 0.3, vol: 0.09, type: 'sawtooth', filtre: 600, t }); souffle(busSfx, { t, dur: 0.2, vol: 0.08, type: 'lowpass', f: 900 }); },
  };
})();
