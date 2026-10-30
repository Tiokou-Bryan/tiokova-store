/* Mots d'Or — Ambiances musicales générées en direct (Web Audio API)
   Aucune piste audio téléchargée : la musique est composée par le téléphone
   en temps réel. Zéro droit d'auteur, zéro poids, fonctionne hors ligne. */
window.MO_AUDIO = (function () {
  var ctx = null, master = null, reverb = null, dry = null, timer = null;
  var playing = false, step = 0, nextTime = 0, current = null, duckLevel = 1;

  // Notes MIDI -> fréquence
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // Chaque ambiance : tempo, accords (MIDI), motif d'arpège, timbre
  var MOODS = {
    joyeux:    { bpm: 104, chords: [[60,64,67,72],[57,60,64,69],[65,69,72,77],[67,71,74,79]], pattern: [0,2,1,3,2,1,3,2], lead: "pluck", pad: 0.05, bass: true },
    comique:   { bpm: 120, chords: [[60,64,67],[62,65,69],[64,67,71],[62,65,69]], pattern: [0,-1,1,-1,2,1,0,-1], lead: "bassoon", pad: 0.02, bass: true },
    triste:    { bpm: 58,  chords: [[57,60,64,69],[53,57,60,65],[48,52,55,60],[52,55,59,64]], pattern: [0,1,2,3,2,1,-1,-1], lead: "piano", pad: 0.06, bass: false },
    melancolie:{ bpm: 66,  chords: [[62,65,69,74],[58,62,65,70],[60,64,67,72],[57,61,64,69]], pattern: [3,-1,2,-1,1,-1,0,-1], lead: "piano", pad: 0.06, bass: false },
    epique:    { bpm: 92,  chords: [[57,60,64,69],[53,57,60,65],[48,52,55,60],[55,59,62,67]], pattern: [0,1,2,3,0,1,2,3], lead: "brass", pad: 0.07, bass: true },
    doux:      { bpm: 70,  chords: [[60,64,67,71],[57,60,64,67],[65,69,72,76],[67,71,74,77]], pattern: [0,2,3,2,1,2,3,-1], lead: "piano", pad: 0.06, bass: false },
    mystere:   { bpm: 52,  chords: [[57,60,63,66],[56,59,62,66],[57,61,64,68],[55,58,62,65]], pattern: [3,-1,-1,1,-1,-1,2,-1], lead: "bell", pad: 0.07, bass: false },
    serein:    { bpm: 62,  chords: [[62,64,67,69],[60,62,67,69],[62,64,69,71],[57,62,64,67]], pattern: [0,-1,2,-1,3,-1,1,-1], lead: "flute", pad: 0.05, bass: false }
  };
  var TONE_TO_MOOD = { drole: "joyeux", idiote: "comique", triste: "triste", decevante: "melancolie", motivante: "epique", touchante: "doux", mystere: "mystere", sage: "serein" };

  function init() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    // Réverbération : bruit qui décroît (salle virtuelle)
    reverb = ctx.createConvolver();
    var len = ctx.sampleRate * 2.8, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = buf.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    reverb.buffer = buf;
    var wet = ctx.createGain(); wet.gain.value = 0.45;
    dry = ctx.createGain(); dry.gain.value = 0.8;
    reverb.connect(wet); wet.connect(master); dry.connect(master);
    master.connect(ctx.destination);
  }

  function out(node) { node.connect(dry); node.connect(reverb); }

  function voice(type, freq, t, dur, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = "lowpass";
    var a = 0.01, r = dur;
    if (type === "pluck") { o.type = "triangle"; f.frequency.value = 2400; r = 0.5; }
    else if (type === "piano") { o.type = "sine"; f.frequency.value = 3000; r = 1.8; var o2 = ctx.createOscillator(); o2.type = "triangle"; o2.frequency.value = freq * 2; var g2 = ctx.createGain(); g2.gain.setValueAtTime(vol * 0.15, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.8); o2.connect(g2); g2.connect(f); o2.start(t); o2.stop(t + 0.9); }
    else if (type === "bassoon") { o.type = "square"; f.frequency.value = 900; r = 0.22; vol *= 0.6; }
    else if (type === "brass") { o.type = "sawtooth"; f.frequency.setValueAtTime(600, t); f.frequency.linearRampToValueAtTime(1800, t + 0.15); a = 0.06; r = dur * 0.9; vol *= 0.45; }
    else if (type === "bell") { o.type = "sine"; f.frequency.value = 5000; r = 3; var o3 = ctx.createOscillator(); o3.type = "sine"; o3.frequency.value = freq * 2.76; var g3 = ctx.createGain(); g3.gain.setValueAtTime(vol * 0.25, t); g3.gain.exponentialRampToValueAtTime(0.0001, t + 1.5); o3.connect(g3); g3.connect(f); o3.start(t); o3.stop(t + 1.6); }
    else if (type === "flute") { o.type = "sine"; f.frequency.value = 2000; a = 0.12; r = dur * 1.1; var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5; lg.gain.value = freq * 0.008; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + a + r + 0.1); }
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + r);
    o.connect(f); f.connect(g); out(g);
    o.start(t); o.stop(t + a + r + 0.05);
  }

  function pad(chord, t, dur, vol) {
    chord.forEach(function (m, k) {
      [-6, 6].forEach(function (det) {
        var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = "sawtooth"; o.frequency.value = hz(m - 12); o.detune.value = det + k;
        f.type = "lowpass"; f.frequency.value = 700; f.Q.value = 0.3;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol / chord.length, t + dur * 0.35);
        g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
        o.connect(f); f.connect(g); out(g);
        o.start(t); o.stop(t + dur + 0.7);
      });
    });
  }

  function bassNote(m, t, dur) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = hz(m - 24);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dry); o.start(t); o.stop(t + dur + 0.05);
  }

  function schedule() {
    var mood = MOODS[current];
    var stepDur = 60 / mood.bpm / 2; // croches
    while (nextTime < ctx.currentTime + 0.2) {
      var bar = Math.floor(step / 8) % mood.chords.length;
      var chord = mood.chords[bar];
      var pos = step % 8;
      if (pos === 0) {
        pad(chord, nextTime, stepDur * 8, mood.pad);
        if (mood.bass) bassNote(chord[0], nextTime, stepDur * 3);
      }
      if (mood.bass && pos === 4) bassNote(chord[0] + (current === "comique" ? 7 : 0), nextTime, stepDur * 2);
      var idx = mood.pattern[pos];
      if (idx >= 0) {
        var note = chord[idx % chord.length] + 12;
        voice(mood.lead, hz(note), nextTime, stepDur * 2, 0.11);
      }
      nextTime += stepDur; step++;
    }
  }

  function setLevel(v, time) {
    if (!master) return;
    var t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(v, t + (time || 0.8));
  }

  return {
    moodForTone: function (tone) { return TONE_TO_MOOD[tone] || "doux"; },
    isPlaying: function () { return playing; },
    play: function (tone) {
      init(); if (!ctx) return false;
      if (ctx.state === "suspended") ctx.resume();
      current = TONE_TO_MOOD[tone] || "doux";
      if (playing) return true;
      playing = true; step = 0; nextTime = ctx.currentTime + 0.1;
      setLevel(0.55 * duckLevel, 1.5);
      timer = setInterval(schedule, 50);
      return true;
    },
    stop: function () {
      if (!playing) return;
      playing = false;
      setLevel(0, 0.6);
      var t = timer; setTimeout(function () { clearInterval(t); }, 700);
    },
    duck: function (on) { duckLevel = on ? 0.35 : 1; if (playing) setLevel(0.55 * duckLevel, 0.5); }
  };
})();
