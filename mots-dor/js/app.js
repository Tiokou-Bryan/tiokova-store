/* =====================================================
   Mots d'Or — Logique principale
   Une application TIOKOVA STORE
   ===================================================== */
(function () {
  "use strict";

  // ---------- Réglages fixes ----------
  var VERSION = "V1";
  var STORE_URL = "https://tiokou-bryan.github.io/tiokova-store/";
  var OM_NUMBER = "657 15 97 93";
  var OM_HOLDER = "Vanelle Maheva";
  var KEY = "motsdor_state_v1";
  var DAY = 24 * 60 * 60 * 1000;
  var QUOTA = 4; // citations par cycle de 24 h
  var MODES = ["motivation", "amour", "sagesse", "courage", "afrique", "humour"];
  var MODE_ICON = { motivation: "🔥", amour: "❤️", sagesse: "🦉", courage: "🦁", afrique: "🌍", humour: "😂" };
  var TONE_ICON = { drole: "😂", triste: "🌧️", motivante: "🔥", decevante: "💔", idiote: "🤪", touchante: "💛", mystere: "🌙", sage: "🦉" };
  var CATS = ["amour", "amitie", "encouragement", "merci", "pardon", "anniversaire"];
  var CAT_ICON = { amour: "❤️", amitie: "🤝", encouragement: "💪🏾", merci: "🙏🏾", pardon: "🕊️", anniversaire: "🎂" };

  var Q = window.MO_QUOTES, STORIES = window.MO_STORIES, I18N = window.MO_I18N;
  var COMP = window.MO_COMPLIMENTS, FOR = window.MO_FORSOMEONE, AUDIO = window.MO_AUDIO;

  // ---------- État sauvegardé sur le téléphone ----------
  function defaults() {
    return {
      v: 1, lang: null, name: "", gender: null, onboarded: false,
      sound: true, textSize: "medium", mode: "motivation",
      orders: {}, ptrs: {}, cycle: null, view: 0,
      story: null, storyOrder: null, storyPtr: 0, answers: {},
      favs: [], streak: { last: null, count: 0, best: 0 },
      forCat: "amour", forIdx: {}, forTo: ""
    };
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === 1) { var d = defaults(); for (var k in s) d[k] = s[k]; return d; }
    } catch (e) {}
    return defaults();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var S = load();

  // ---------- Outils ----------
  var $app = document.getElementById("app"), $nav = document.getElementById("nav");
  var $toast = document.getElementById("toast"), $modal = document.getElementById("modal");
  var route = "home", tab = "q", compliment = null, toastTimer = null;

  function lang() { return S.lang || ((navigator.language || "fr").toLowerCase().indexOf("en") === 0 ? "en" : "fr"); }
  function t(key, vars) {
    var parts = key.split("."), v = I18N[lang()];
    for (var i = 0; i < parts.length; i++) v = v ? v[parts[i]] : undefined;
    if (v === undefined) v = key;
    if (vars) for (var k in vars) v = v.split("{" + k + "}").join(vars[k]);
    return v;
  }
  function L(pair) { return lang() === "en" ? pair[1] : pair[0]; } // choisit FR ou EN
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function dayKey(d) { return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function toast(msg) {
    $toast.textContent = msg; $toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { $toast.classList.remove("show"); }, 2600);
  }
  function fillName(str) {
    var n = (S.name || "").trim();
    if (n) return str.split("{n}").join(n);
    str = str.replace(/\{n\},?\s*/g, "").replace(/\s+…/, "…").trim();
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  function fmtCountdown(ms) {
    if (ms < 0) ms = 0;
    var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h + " h " + (m < 10 ? "0" : "") + m + " min " + (sec < 10 ? "0" : "") + sec + " s";
  }

  /* ---------- Ordre de lecture sans répétition ----------
     Chaque mode a sa propre liste mélangée. On avance dedans un par un.
     Quand tout a été lu, on remélange et on recommence au début.
     Si une mise à jour ajoute du contenu, les nouveaux éléments sont
     glissés dans la partie pas encore lue. */
  function nextFrom(order, ptr, len) {
    if (!order || !order.length) { order = shuffle(range(len)); ptr = 0; }
    else {
      var seen = {};
      order = order.filter(function (i) { if (i >= len || seen[i]) return false; seen[i] = 1; return true; });
      var missing = range(len).filter(function (i) { return !seen[i]; });
      if (missing.length) order = order.slice(0, ptr).concat(shuffle(order.slice(ptr).concat(missing)));
      if (ptr > order.length) ptr = order.length;
    }
    if (ptr >= order.length) {
      var last = order[order.length - 1];
      order = shuffle(range(len)); ptr = 0;
      if (len > 1 && order[0] === last) { order[0] = order[1]; order[1] = last; }
    }
    var idx = order[ptr];
    return { idx: idx, order: order, ptr: ptr + 1 };
  }
  function nextQuoteIdx(m) {
    var r = nextFrom(S.orders[m], S.ptrs[m] || 0, Q[m].length);
    S.orders[m] = r.order; S.ptrs[m] = r.ptr; return r.idx;
  }
  function nextStoryIdx() {
    var r = nextFrom(S.storyOrder, S.storyPtr || 0, STORIES.length);
    S.storyOrder = r.order; S.storyPtr = r.ptr; return r.idx;
  }

  // ---------- Cycle des 4 citations (24 h après la dernière) ----------
  function cycle() {
    var c = S.cycle, now = Date.now();
    if (c && ((c.fullAt && now >= c.fullAt + DAY) || (!c.fullAt && now >= c.start + DAY))) { S.cycle = null; S.view = 0; save(); }
    return S.cycle;
  }
  function drawQuote() {
    var now = Date.now();
    if (!cycle()) S.cycle = { start: now, items: [], fullAt: null };
    if (S.cycle.items.length >= QUOTA) return;
    S.cycle.items.push({ m: S.mode, i: nextQuoteIdx(S.mode) });
    S.view = S.cycle.items.length - 1;
    if (S.cycle.items.length >= QUOTA) S.cycle.fullAt = now;
    save();
  }
  function quoteData(item) {
    var q = Q[item.m][item.i];
    return { m: item.m, i: item.i, text: L(q), origin: item.m === "afrique" ? (lang() === "en" ? q[3] : q[2]) : null };
  }

  // ---------- Histoire du jour (24 h après son affichage) ----------
  function story() {
    var now = Date.now();
    if (!S.story || S.story.i >= STORIES.length || now >= S.story.at + DAY) { S.story = { i: nextStoryIdx(), at: now }; save(); }
    return S.story;
  }

  // ---------- Série de jours ----------
  function touchStreak() {
    var today = new Date(), y = new Date(); y.setDate(y.getDate() - 1);
    var st = S.streak, d = dayKey(today);
    if (st.last === d) return;
    st.count = st.last === dayKey(y) ? st.count + 1 : 1;
    st.last = d; st.best = Math.max(st.best || 0, st.count); save();
    if ([3, 7, 14, 30, 50, 100, 365].indexOf(st.count) >= 0) setTimeout(function () { toast(t("milestone", { n: st.count })); }, 1200);
  }

  // ---------- Favoris ----------
  function isFav(k) { return S.favs.indexOf(k) >= 0; }
  function toggleFav(k) {
    var i = S.favs.indexOf(k);
    if (i >= 0) { S.favs.splice(i, 1); toast(t("removedFav")); } else { S.favs.unshift(k); toast(t("addedFav")); }
    save();
  }

  // ---------- Compliment d'accueil ----------
  function pickCompliment() {
    var list = COMP[S.gender === "homme" || S.gender === "femme" ? S.gender : "neutre"];
    var i; do { i = Math.floor(Math.random() * list.length); } while (list.length > 1 && compliment && compliment.i === i && compliment.g === S.gender);
    compliment = { i: i, g: S.gender };
  }
  function complimentText() {
    if (!compliment || compliment.g !== S.gender) pickCompliment();
    var list = COMP[S.gender === "homme" || S.gender === "femme" ? S.gender : "neutre"];
    return fillName(L(list[compliment.i]));
  }
  function greeting() {
    var h = new Date().getHours();
    return h < 12 ? t("hello") : h < 18 ? t("afternoon") : t("evening");
  }

  // ---------- Icônes ----------
  var IC = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path class="fill" d="M12 20.3s-7.4-4.5-9.2-9C1.5 8 3.6 4.6 7 4.6c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.5 3.4 4.2 6.7-1.8 4.5-9.2 9-9.2 9z"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="9" cy="9" r="1.8"/><path d="M20.5 15.5l-5-5-9 9"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="6.5" width="11" height="11" rx="2"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5C10.5 5 8 4.5 4 4.5v14c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-14c-4 0-6.5.5-8 2z"/><path d="M12 6.5v14"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3.5L10.5 14"/><path d="M21 3.5l-6.5 17-4-6.5-6.5-4z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5a9.4 9.4 0 00-8.1 14.2L2.6 21.5l4.9-1.3A9.4 9.4 0 1012 2.5zm0 17.1a7.7 7.7 0 01-3.9-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A7.7 7.7 0 1112 19.6zm4.2-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.3 6.3 0 01-3.1-2.7c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a.9.9 0 00-.7.3 2.8 2.8 0 00-.9 2.1 4.9 4.9 0 001 2.6 11.2 11.2 0 004.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.5-.2z"/></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg>'
  };
  var bars = '<span class="playing-bars"><i></i><i></i><i></i></span>';

  // ---------- Installation obligatoire ----------
  var deferredPrompt = null;
  function isInstalled() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.navigator.standalone === true ||
      document.referrer.indexOf("android-app://") === 0;
  }
  // Mode test : sur ton PC (Live Server) ou avec ?dev=1 dans l'adresse
  function devMode() {
    if (/[?&]dev=1/.test(location.search)) { try { sessionStorage.setItem("mo_dev", "1"); } catch (e) {} return true; }
    try { if (sessionStorage.getItem("mo_dev") === "1") return true; } catch (e) {}
    return location.protocol === "file:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  }
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferredPrompt = e; if (route === "install") render(); });
  window.addEventListener("appinstalled", function () { deferredPrompt = null; toast(t("installDone")); });

  // ---------- Synthèse vocale ----------
  var tts = { on: false, target: null };
  function voiceFor(l) {
    if (!("speechSynthesis" in window)) return null;
    var vs = window.speechSynthesis.getVoices();
    var pref = vs.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(l) === 0; });
    return pref.length ? (pref.filter(function (v) { return v.localService; })[0] || pref[0]) : (vs.length ? false : null);
  }
  if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = function () {};
  function speak(text, target) {
    if (!("speechSynthesis" in window)) { toast(t("noVoice")); return; }
    stopSpeak();
    var l = lang(), v = voiceFor(l);
    if (v === false) { toast(t("noVoice")); return; }
    // Découpage en petites phrases : certains téléphones coupent les textes longs
    var parts = text.replace(/\n+/g, " ").match(/[^.!?…»]+[.!?…»]*\s*/g) || [text], chunks = [], cur = "";
    parts.forEach(function (p) { if ((cur + p).length > 200 && cur) { chunks.push(cur); cur = p; } else cur += p; });
    if (cur.trim()) chunks.push(cur);
    tts.on = true; tts.target = target; AUDIO.duck(true);
    chunks.forEach(function (c, k) {
      var u = new SpeechSynthesisUtterance(c.trim());
      u.lang = l === "en" ? "en-US" : "fr-FR"; if (v) u.voice = v; u.rate = 0.95; u.pitch = 1;
      if (k === chunks.length - 1) u.onend = function () { if (tts.target === target) { tts.on = false; tts.target = null; AUDIO.duck(false); updateTTS(); } };
      window.speechSynthesis.speak(u);
    });
    updateTTS();
  }
  function stopSpeak() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    tts.on = false; tts.target = null; AUDIO.duck(false); updateTTS();
  }
  function updateTTS() {
    var b = document.querySelectorAll("[data-tts]");
    for (var i = 0; i < b.length; i++) {
      var on = tts.on && tts.target === b[i].getAttribute("data-tts");
      b[i].classList.toggle("on", on);
      var lbl = b[i].querySelector(".lbl"); if (lbl) lbl.textContent = on ? t("stop") : b[i].getAttribute("data-label");
      var ic = b[i].querySelector(".ic"); if (ic) ic.innerHTML = on ? IC.stop : IC.sound;
    }
  }

  // ---------- Musique d'ambiance ----------
  function updateMusic() {
    var b = document.getElementById("musicBtn"); if (!b) return;
    b.innerHTML = AUDIO.isPlaying() ? bars + " " + t("pauseMusic") : IC.music.replace("<svg", '<svg width="18" height="18"') + " " + t("playMusic");
  }

  // ---------- Image à partager (format statut WhatsApp 9:16) ----------
  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var p = Promise.all([
      document.fonts.load('600 80px "Cormorant Garamond"'),
      document.fonts.load('italic 600 40px "Cormorant Garamond"'),
      document.fonts.load('700 60px "Cormorant Garamond"'),
      document.fonts.load('500 26px "Poppins"')
    ]).catch(function () {});
    return Promise.race([p, new Promise(function (r) { setTimeout(r, 1800); })]);
  }
  function wrapLines(x, text, maxW) {
    var words = text.split(/\s+/), lines = [], line = "";
    words.forEach(function (w) {
      var test = line ? line + " " + w : w;
      if (x.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }
  function spaced(x, text, cx, y, spacing) {
    // Texte espacé centré (lettrage élégant)
    var chars = text.split(""), w = 0, i;
    for (i = 0; i < chars.length; i++) w += x.measureText(chars[i]).width + (i < chars.length - 1 ? spacing : 0);
    var px = cx - w / 2;
    x.textAlign = "left";
    for (i = 0; i < chars.length; i++) { x.fillText(chars[i], px, y); px += x.measureText(chars[i]).width + spacing; }
    x.textAlign = "center";
  }
  function diamond(x, cx, cy, r) { x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r, cy); x.closePath(); x.fill(); }
  function makeImage(o) {
    return fontsReady().then(function () {
      var W = 1080, H = 1920, c = document.createElement("canvas"); c.width = W; c.height = H;
      var x = c.getContext("2d"), SERIF = '"Cormorant Garamond", "Noto Serif", Georgia, serif', SANS = '"Poppins", "Roboto", sans-serif';
      // Fond
      var g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#1a140b"); g.addColorStop(0.5, "#0f0c08"); g.addColorStop(1, "#070605");
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      var rg = x.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, W * 0.8);
      rg.addColorStop(0, "rgba(212,168,75,0.26)"); rg.addColorStop(1, "rgba(212,168,75,0)");
      x.fillStyle = rg; x.fillRect(0, 0, W, H);
      // Poussière d'or
      var seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      for (var s = 0; s < 70; s++) { x.fillStyle = "rgba(243,213,138," + (0.05 + rnd() * 0.25) + ")"; x.beginPath(); x.arc(80 + rnd() * (W - 160), 80 + rnd() * (H - 160), 0.8 + rnd() * 2.4, 0, Math.PI * 2); x.fill(); }
      // Cadre doré double
      x.strokeStyle = "rgba(212,168,75,0.7)"; x.lineWidth = 3; x.strokeRect(56, 56, W - 112, H - 112);
      x.strokeStyle = "rgba(212,168,75,0.25)"; x.lineWidth = 1.5; x.strokeRect(76, 76, W - 152, H - 152);
      x.fillStyle = "#d4a84b";
      [[56, 56], [W - 56, 56], [56, H - 56], [W - 56, H - 56]].forEach(function (p) { diamond(x, p[0], p[1], 14); });
      // Étiquette du haut
      x.textAlign = "center"; x.textBaseline = "alphabetic";
      x.fillStyle = "#d4a84b"; x.font = "500 30px " + SANS;
      spaced(x, "✦  " + o.label.toUpperCase() + "  ✦", W / 2, 250, 6);
      // Guillemet
      var gg = x.createLinearGradient(W / 2 - 80, 0, W / 2 + 80, 0);
      gg.addColorStop(0, "#9c7426"); gg.addColorStop(0.5, "#f3d58a"); gg.addColorStop(1, "#9c7426");
      x.fillStyle = gg; x.font = "700 260px " + SERIF; x.fillText("“", W / 2, 560);
      // Texte : taille ajustée automatiquement
      var maxW = W - 240, areaH = 820, size = 96, lines, lh;
      do { x.font = "600 " + size + "px " + SERIF; lines = wrapLines(x, o.text, maxW); lh = size * 1.28; size -= 4; } while (lines.length * lh > areaH && size > 40);
      var top = 600 + (areaH - lines.length * lh) / 2 + lh * 0.8;
      x.fillStyle = "#f3ead7"; x.shadowColor = "rgba(0,0,0,0.5)"; x.shadowBlur = 18;
      lines.forEach(function (ln, k) { x.fillText(ln, W / 2, top + k * lh); });
      x.shadowBlur = 0;
      if (o.origin) { x.fillStyle = "#d4a84b"; x.font = "italic 600 50px " + SERIF; x.fillText("— " + o.origin, W / 2, top + lines.length * lh + 40); }
      // Bas : signature + pub TIOKOVA STORE
      x.strokeStyle = "rgba(212,168,75,0.45)"; x.lineWidth = 2;
      x.beginPath(); x.moveTo(W / 2 - 210, 1560); x.lineTo(W / 2 - 30, 1560); x.moveTo(W / 2 + 30, 1560); x.lineTo(W / 2 + 210, 1560); x.stroke();
      x.fillStyle = "#d4a84b"; diamond(x, W / 2, 1560, 10);
      var wg = x.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
      wg.addColorStop(0, "#9c7426"); wg.addColorStop(0.35, "#f3d58a"); wg.addColorStop(0.65, "#d4a84b"); wg.addColorStop(1, "#9c7426");
      x.fillStyle = wg; x.font = "700 88px " + SERIF; x.fillText("Mots d'Or", W / 2, 1670);
      x.fillStyle = "rgba(243,234,215,0.85)"; x.font = "500 26px " + SANS; spaced(x, "TIOKOVA STORE", W / 2, 1722, 9);
      x.fillStyle = "rgba(169,157,134,0.9)"; x.font = "400 24px " + SANS; x.fillText(STORE_URL.replace("https://", "").replace(/\/$/, ""), W / 2, 1772);
      return new Promise(function (res) { c.toBlob(function (b) { res(b); }, "image/png"); });
    });
  }
  function openShareImage(o) {
    toast("✨");
    makeImage(o).then(function (blob) {
      if (!blob) return;
      var url = URL.createObjectURL(blob), file = null;
      try { file = new File([blob], "mots-dor.png", { type: "image/png" }); } catch (e) {}
      var canShare = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
      openModal(
        '<h3>' + esc(t("shareTitle")) + '</h3><img src="' + url + '" alt="">' +
        (canShare ? '<button class="btn btn-gold" data-act="img-share">' + IC.share.replace("<svg", '<svg width="20" height="20"') + " " + esc(t("shareNow")) + "</button>" : "") +
        '<a class="btn btn-ghost" style="margin-top:10px" href="' + url + '" download="mots-dor.png" data-act="img-dl">' + esc(t("download")) + "</a>" +
        '<button class="btn btn-soft" style="margin-top:10px" data-act="close">' + esc(t("close")) + "</button>",
        function () { URL.revokeObjectURL(url); }
      );
      shareFile = file;
    });
  }
  var shareFile = null;

  function shareText(text) {
    if (navigator.share) { navigator.share({ text: text }).catch(function () {}); }
    else { window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank"); }
  }
  function quoteShareText(d) {
    return "« " + d.text + " »" + (d.origin ? "\n— " + d.origin : "") + "\n\n" + t("shareTextFooter", { url: STORE_URL });
  }
  function copy(text) {
    var done = function () { toast(t("copied")); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() { var ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) {} document.body.removeChild(ta); }
  }

  // ---------- Modale ----------
  var modalOnClose = null;
  function openModal(html, onClose) {
    $modal.innerHTML = '<div class="sheet">' + html + "</div>";
    $modal.classList.remove("hidden"); modalOnClose = onClose || null;
    try { history.pushState({ modal: 1 }, ""); } catch (e) {}
  }
  function closeModal(fromPop) {
    if ($modal.classList.contains("hidden")) return;
    $modal.classList.add("hidden"); $modal.innerHTML = "";
    if (modalOnClose) modalOnClose(); modalOnClose = null;
    if (tts.target === "fav-story") stopSpeak();
    if (!fromPop) { ignorePop = true; try { history.back(); } catch (e) { ignorePop = false; } }
  }
  var ignorePop = false;

  // ---------- Navigation ----------
  function go(r) {
    if (r === route) { window.scrollTo(0, 0); return; }
    if (route === "story") AUDIO.stop();
    stopSpeak();
    if (r === "home") pickCompliment();
    var wasHome = route === "home";
    route = r; render(); window.scrollTo(0, 0);
    try { if (wasHome && r !== "home") history.pushState({ r: r }, ""); else history.replaceState({ r: r }, ""); } catch (e) {}
  }
  window.addEventListener("popstate", function () {
    if (ignorePop) { ignorePop = false; return; }
    if (!$modal.classList.contains("hidden")) { closeModal(true); return; }
    if (route !== "home" && route !== "install" && route !== "onboard") { if (route === "story") AUDIO.stop(); stopSpeak(); route = "home"; pickCompliment(); render(); }
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden) { AUDIO.stop(); stopSpeak(); updateMusic(); } });

  function renderNav() {
    var show = ["home", "story", "for", "fav", "settings"].indexOf(route) >= 0;
    $nav.classList.toggle("hidden", !show); $app.classList.toggle("no-nav", !show);
    if (!show) return;
    var items = [["home", IC.home, t("navHome")], ["story", IC.book, t("navStory")], ["for", IC.send, t("navFor")], ["fav", IC.star, t("navFav")], ["settings", IC.gear, t("navSettings")]];
    $nav.innerHTML = '<div class="nav-in">' + items.map(function (it) {
      return '<button data-act="go" data-r="' + it[0] + '" class="' + (route === it[0] ? "active" : "") + '" aria-label="' + esc(it[2]) + '">' + it[1] + "<span>" + esc(it[2]) + "</span></button>";
    }).join("") + "</div>";
  }

  // ---------- Écrans ----------
  function viewInstall() {
    return '<div class="screen-center">' +
      '<img class="logo" src="icons/icon-192.png" alt="">' +
      '<div class="wordmark" style="font-size:40px">Mots d\'Or</div>' +
      '<p class="serif" style="font-size:20px;font-style:italic;color:var(--gold2);margin:4px 0 0">' + esc(t("tagline")) + "</p>" +
      "<h2 style=\"margin-top:26px\">" + esc(t("installTitle")) + "</h2>" +
      "<p>" + esc(t("installText")) + "</p>" +
      (deferredPrompt ? '<button class="btn btn-gold" data-act="install">' + esc(t("installBtn")) + "</button>" : "") +
      '<div class="card how"><h3>' + esc(t("installManualTitle")) + "</h3><p>" + esc(t("installManual")) + "</p></div>" +
      "</div>";
  }

  var obStep = 0;
  function viewOnboard() {
    var steps = '<div class="steps">' + [0, 1, 2].map(function (i) { return '<i class="' + (i <= obStep ? "on" : "") + '"></i>'; }).join("") + "</div>";
    var head = '<img class="logo" src="icons/icon-192.png" alt="" style="width:84px;height:84px;border-radius:22px">';
    if (obStep === 0) {
      return '<div class="screen-center">' + head + steps + '<div class="wordmark" style="font-size:38px">Mots d\'Or</div>' +
        '<h3 style="margin-top:20px">Choisis ta langue · Choose your language</h3>' +
        '<div class="lang-opts"><button class="choice" data-act="ob-lang" data-l="fr">🇫🇷 Français</button><button class="choice" data-act="ob-lang" data-l="en">🇬🇧 English</button></div></div>';
    }
    if (obStep === 1) {
      return '<div class="screen-center">' + head + steps + "<h1>" + esc(t("welcomeTitle")) + ' <span class="gold">✨</span></h1>' +
        '<div class="field"><label for="obName">' + esc(t("askName")) + '</label><input id="obName" class="input" maxlength="24" autocomplete="given-name" placeholder="' + esc(t("namePlaceholder")) + '" value="' + esc(S.name) + '"></div>' +
        '<p class="small" style="margin:8px 2px 22px;text-align:left">' + esc(t("nameHint")) + "</p>" +
        '<button class="btn btn-gold" data-act="ob-name">' + esc(t("continue")) + "</button></div>";
    }
    return '<div class="screen-center">' + head + steps + "<h1>" + esc(t("askGender")) + "</h1>" +
      '<div class="gender-opts">' +
      '<button class="choice" data-act="ob-gender" data-g="homme">👨🏾 ' + esc(t("man")) + "</button>" +
      '<button class="choice" data-act="ob-gender" data-g="femme">👩🏾 ' + esc(t("woman")) + "</button>" +
      '<button class="choice" data-act="ob-gender" data-g="neutre">✨ ' + esc(t("noSay")) + "</button></div>" +
      '<p class="small">' + esc(t("genderHint")) + "</p></div>";
  }

  function quoteActions(d, key) {
    var fav = isFav(key);
    return '<div class="qactions">' +
      '<button class="qa ' + (fav ? "on" : "") + '" data-act="fav" data-k="' + key + '">' + IC.heart + "<span>" + esc(t("favorite")) + "</span></button>" +
      '<button class="qa" data-act="q-img" data-k="' + key + '">' + IC.image + "<span>" + esc(t("shareImage")) + "</span></button>" +
      '<button class="qa" data-act="q-share" data-k="' + key + '">' + IC.share + "<span>" + esc(t("shareText")) + "</span></button>" +
      '<button class="qa" data-act="q-tts" data-k="' + key + '" data-tts="q:' + key + '" data-label="' + esc(t("listen")) + '"><span class="ic">' + IC.sound + '</span><span class="lbl">' + esc(t("listen")) + "</span></button>" +
      "</div>";
  }

  function viewHome() {
    var c = cycle(), items = c ? c.items : [], n = items.length, st = S.streak.count || 1;
    var out = '<div class="top"><div class="wordmark">Mots d\'Or</div><div class="pill">🔥 ' + esc(t(st > 1 ? "streakDaysPl" : "streakDays", { n: st })) + "</div></div>";
    out += '<div class="greet"><div class="hi">' + esc(greeting()) + (S.name ? ", <b>" + esc(S.name) + "</b>" : "") + ' 👋🏾</div><div class="compliment">' + esc(complimentText()) + "</div></div>";
    out += '<div class="modes" id="modes">' + MODES.map(function (m) {
      return '<button class="chip ' + (S.mode === m ? "active" : "") + '" data-act="mode" data-m="' + m + '">' + MODE_ICON[m] + " " + esc(t("modes." + m)) + "</button>";
    }).join("") + "</div>";

    var dots = '<div class="dots">' + range(QUOTA).map(function (i) { return '<span class="dot ' + (i < n ? "on " : "") + (n && i === S.view ? "cur" : "") + '"></span>'; }).join("") + "</div>";
    if (!n) {
      out += '<div class="qcard"><div class="qlabel"><span class="eyebrow">' + esc(t("yourQuotes")) + "</span>" + dots + "</div>" +
        '<div class="qempty"><div class="qmark" style="margin-top:6px">“</div><p>' + esc(t("pickModeHint")) + "</p>" +
        '<button class="btn btn-gold" data-act="draw">✨ ' + esc(t("firstQuote")) + " " + MODE_ICON[S.mode] + "</button></div></div>";
    } else {
      if (S.view >= n) S.view = n - 1;
      var it = items[S.view], d = quoteData(it), key = "q:" + it.m + ":" + it.i;
      out += '<div class="qcard"><div class="qlabel"><span class="eyebrow">' + MODE_ICON[d.m] + " " + esc(t("modes." + d.m)) + "</span>" + dots + "</div>" +
        '<div class="qmark">“</div><div class="qtext reveal">' + esc(d.text) + "</div>" +
        (d.origin ? '<div class="qorigin">— ' + esc(d.origin) + "</div>" : "") +
        '<div class="qsign">Mots d\'Or</div>' + quoteActions(d, key) + "</div>";
      if (n < QUOTA) {
        out += '<button class="btn btn-gold" data-act="draw">✨ ' + esc(t("newQuote")) + " " + MODE_ICON[S.mode] + ' <span class="count">· ' + n + "/" + QUOTA + "</span></button>";
      } else {
        out += '<button class="btn btn-ghost" data-act="loop">↻ ' + esc(t("nextOfDay")) + ' <span class="count">· ' + (S.view + 1) + "/" + QUOTA + "</span></button>";
        out += '<div class="done"><div class="msg">' + esc(t("comeBack")) + ' 🌙</div><div class="cd">' + esc(t("newIn")) + ' <b data-until="' + (c.fullAt + DAY) + '">' + fmtCountdown(c.fullAt + DAY - Date.now()) + "</b></div></div>";
      }
    }

    // Histoire du jour
    var sto = story(), sd = STORIES[sto.i];
    out += '<div class="section"><span class="eyebrow">' + esc(t("storyOfDay")) + '</span><div class="card teaser" style="margin-top:10px" data-act="go" data-r="story">' +
      '<div class="ic">' + TONE_ICON[sd.tone] + '</div><div class="tx"><div class="title">' + esc(L(sd.title)) + '</div><div class="small muted">' + esc(t("tones." + sd.tone)) + " · " + esc(t("readStory")) + '</div></div><div class="arrow">›</div></div></div>';

    // Partager le store
    out += '<div class="section"><div class="card"><h3>' + esc(t("shareStore")) + " 🚀</h3><p>" + esc(t("shareStoreSub")) + '</p><button class="btn btn-ghost" data-act="share-store">' + IC.share.replace("<svg", '<svg width="18" height="18"') + " " + esc(t("shareStoreBtn")) + "</button></div>";

    // Nous soutenir (tout en bas)
    out += '<div class="card support"><h3>' + esc(t("support")) + "</h3><p>" + esc(t("supportText")) + "</p>" +
      '<div class="num"><div><span class="om">' + esc(t("supportVia")) + '</span><div class="n" style="margin-top:6px">' + OM_NUMBER + '</div><div class="l">' + esc(t("holder")) + ' : <span class="h">' + esc(OM_HOLDER) + "</span></div></div></div>" +
      '<button class="btn btn-gold" data-act="copy-num">' + esc(t("copyNumber")) + '</button><p class="small" style="text-align:center;margin-top:10px">' + esc(t("supportThanks")) + "</p></div></div>";
    return out;
  }

  function viewStory() {
    var sto = story(), sd = STORIES[sto.i], ans = S.answers[sto.i];
    var fav = isFav("s:" + sto.i);
    var paras = L(sd.text).split(/\n\n+/).map(function (p) { return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>"; }).join("");
    var out = '<div class="story-head"><span class="eyebrow">' + esc(t("storyOfDay")) + "</span><h1>" + esc(L(sd.title)) + '</h1><span class="tone">' + TONE_ICON[sd.tone] + " " + esc(t("tones." + sd.tone)) + "</span></div>";
    out += '<div class="story-tools">' +
      (S.sound ? '<button class="btn btn-ghost" id="musicBtn" data-act="music"></button>' : "") +
      '<button class="btn btn-ghost" data-act="s-tts" data-tts="story" data-label="' + esc(t("listenStory")) + '"><span class="ic" style="display:inline-flex;width:18px;height:18px">' + IC.sound + '</span> <span class="lbl">' + esc(t("listenStory")) + "</span></button>" +
      '<button class="btn btn-soft" style="flex:0 0 52px" data-act="fav" data-k="s:' + sto.i + '" aria-label="' + esc(t("favorite")) + '"><span class="qa ' + (fav ? "on" : "") + '" style="padding:0">' + IC.heart + "</span></button>" +
      "</div>";
    out += '<p class="voice-note">🔊 ' + esc(t("voiceNote")) + "</p>";
    out += '<div class="story-body">' + paras + '</div><div class="story-end">✦ ✦ ✦</div>';
    if (sd.choices) {
      out += '<div class="ask"><h3>' + esc(t("andYou")) + "</h3>" + sd.choices.map(function (ch, k) {
        return '<button class="choice ' + (ans === k ? "sel" : "") + '" data-act="answer" data-k="' + k + '" ' + (ans !== undefined ? "disabled" : "") + ">" + esc(lang() === "en" ? ch[1] : ch[0]) + "</button>";
      }).join("") + (ans !== undefined ? '<div class="reply">' + esc(lang() === "en" ? sd.choices[ans][3] : sd.choices[ans][2]) + "</div>" : "") + "</div>";
    }
    out += '<div class="btn-row" style="margin-top:18px"><button class="btn btn-soft" data-act="s-share">' + IC.share.replace("<svg", '<svg width="18" height="18"') + " " + esc(t("shareText")) + "</button></div>";
    out += '<div class="done" style="margin-top:18px"><div class="cd">' + esc(t("nextStoryIn")) + ' <b data-until="' + (sto.at + DAY) + '">' + fmtCountdown(sto.at + DAY - Date.now()) + "</b></div></div>";
    return out;
  }

  function currentForMsg() {
    var list = FOR[S.forCat], i = (S.forIdx[S.forCat] || 0) % list.length;
    return L(list[i]);
  }
  function forFullText() {
    var to = (S.forTo || "").trim();
    return (to ? t("forLabel", { to: to }) + " 💛\n\n" : "") + currentForMsg() + "\n\n" + t("sentWith") + " " + STORE_URL;
  }
  function viewFor() {
    var to = (S.forTo || "").trim();
    var out = '<span class="eyebrow">Mots d\'Or</span><h1 style="margin-top:6px">' + esc(t("forSomeone")) + ' <span class="gold">💌</span></h1><p class="muted" style="margin-top:6px">' + esc(t("forSomeoneSub")) + "</p>";
    out += '<div class="field"><label for="forTo">' + esc(t("toWhom")) + '</label><input id="forTo" class="input" maxlength="24" placeholder="' + esc(t("toWhomPlaceholder")) + '" value="' + esc(S.forTo) + '"></div>';
    out += '<div class="cats">' + CATS.map(function (c) { return '<button class="chip ' + (S.forCat === c ? "active" : "") + '" data-act="for-cat" data-c="' + c + '">' + CAT_ICON[c] + " " + esc(t("cats." + c)) + "</button>"; }).join("") + "</div>";
    out += '<div class="qcard fmsg"><div class="to" id="forToLbl">' + (to ? esc(t("forLabel", { to: to })) + " 💛" : CAT_ICON[S.forCat] + " " + esc(t("cats." + S.forCat))) + '</div><div class="qtext reveal">' + esc(currentForMsg()) + "</div></div>";
    out += '<div class="btn-row"><button class="btn btn-gold" data-act="for-wa">' + IC.wa.replace("<svg", '<svg width="20" height="20"') + " " + esc(t("sendWhatsApp")) + '</button><button class="btn btn-ghost" data-act="for-img">' + IC.image.replace("<svg", '<svg width="20" height="20"') + " " + esc(t("shareImage")) + "</button></div>";
    out += '<button class="btn btn-soft" style="margin-top:10px" data-act="for-next">↻ ' + esc(t("anotherMsg")) + "</button>";
    return out;
  }

  function viewFav() {
    var qs = S.favs.filter(function (k) { return k.indexOf("q:") === 0; });
    var ss = S.favs.filter(function (k) { return k.indexOf("s:") === 0; });
    var out = '<span class="eyebrow">Mots d\'Or</span><h1 style="margin-top:6px">' + esc(t("favorites")) + ' <span class="gold">✦</span></h1>';
    out += '<div class="tabs"><button class="' + (tab === "q" ? "active" : "") + '" data-act="tab" data-t="q">' + esc(t("favQuotes")) + " (" + qs.length + ')</button><button class="' + (tab === "s" ? "active" : "") + '" data-act="tab" data-t="s">' + esc(t("favStories")) + " (" + ss.length + ")</button></div>";
    var list = tab === "q" ? qs : ss;
    if (!list.length) return out + '<div class="empty"><div class="big">💛</div>' + esc(t("favEmpty")) + "</div>";
    if (tab === "q") {
      out += list.map(function (k) {
        var p = k.split(":"), m = p[1], i = +p[2]; if (!Q[m] || !Q[m][i]) return "";
        var d = quoteData({ m: m, i: i });
        return '<div class="fav"><div class="t">« ' + esc(d.text) + " »</div>" + (d.origin ? '<div class="m" style="font-style:italic">— ' + esc(d.origin) + "</div>" : "") + '<div class="m">' + MODE_ICON[m] + " " + esc(t("modes." + m)) + "</div>" +
          '<div class="acts"><button data-act="q-img" data-k="' + k + '">' + IC.image + " " + esc(t("shareImage")) + '</button><button data-act="q-share" data-k="' + k + '">' + IC.share + " " + esc(t("shareText")) + '</button><button data-act="fav" data-k="' + k + '">' + IC.heart + " " + esc(t("unfavorite")) + "</button></div></div>";
      }).join("");
    } else {
      out += list.map(function (k) {
        var i = +k.split(":")[1], sd = STORIES[i]; if (!sd) return "";
        return '<div class="fav"><div class="t">' + TONE_ICON[sd.tone] + " " + esc(L(sd.title)) + '</div><div class="m">' + esc(t("tones." + sd.tone)) + "</div>" +
          '<div class="acts"><button data-act="read-story" data-i="' + i + '">' + IC.book + " " + esc(t("readStory")) + '</button><button data-act="fav" data-k="' + k + '">' + IC.heart + " " + esc(t("unfavorite")) + "</button></div></div>";
      }).join("");
    }
    return out;
  }

  function seg(act, cur, opts) {
    return '<div class="seg">' + opts.map(function (o) { return '<button class="' + (cur === o[0] ? "active" : "") + '" data-act="' + act + '" data-v="' + o[0] + '">' + esc(o[1]) + "</button>"; }).join("") + "</div>";
  }
  function viewSettings() {
    var out = '<span class="eyebrow">Mots d\'Or</span><h1 style="margin-top:6px">' + esc(t("settings")) + "</h1>";
    out += '<div class="set-group"><span class="eyebrow">' + esc(t("name")) + '</span><div class="btn-row"><input id="setName" class="input" maxlength="24" value="' + esc(S.name) + '" placeholder="' + esc(t("namePlaceholder")) + '"><button class="btn btn-ghost" style="flex:0 0 auto;width:auto" data-act="save-name">' + esc(t("save")) + "</button></div></div>";
    out += '<div class="set-group"><span class="eyebrow">' + esc(t("gender")) + "</span>" + seg("set-gender", S.gender, [["homme", "👨🏾 " + t("man")], ["femme", "👩🏾 " + t("woman")], ["neutre", "✨ " + t("noSay")]]) + "</div>";
    out += '<div class="set-group"><span class="eyebrow">' + esc(t("language")) + "</span>" + seg("set-lang", lang(), [["fr", "🇫🇷 Français"], ["en", "🇬🇧 English"]]) + "</div>";
    out += '<div class="set-group"><span class="eyebrow">' + esc(t("sound")) + "</span>" + seg("set-sound", S.sound ? "on" : "off", [["on", "🎵 " + t("soundOn")], ["off", "🔇 " + t("soundOff")]]) + "</div>";
    out += '<div class="set-group"><span class="eyebrow">' + esc(t("textSize")) + "</span>" + seg("set-size", S.textSize, [["small", "A " + t("small")], ["medium", "A " + t("medium")], ["large", "A " + t("large")]]) + "</div>";
    out += '<div class="set-group"><div class="card"><p>🔊 ' + esc(t("voiceNote")) + "</p></div></div>";
    out += '<div class="set-group"><div class="card"><h3>' + esc(t("shareStore")) + " 🚀</h3><p>" + esc(t("shareStoreSub")) + '</p><button class="btn btn-ghost" data-act="share-store">' + esc(t("shareStoreBtn")) + "</button></div></div>";
    out += '<div class="set-group"><div class="card"><h3>' + esc(t("about")) + "</h3><p>" + esc(t("aboutText")) + '</p><p class="small" style="margin-top:10px">' + esc(t("version")) + " " + VERSION + " · TIOKOVA STORE · " + (S.streak.best ? "🏆 " + S.streak.best : "") + "</p></div></div>";
    return out;
  }

  // ---------- Rendu ----------
  function applyPrefs() {
    document.documentElement.lang = lang();
    document.documentElement.style.setProperty("--q-scale", { small: 0.88, medium: 1, large: 1.14 }[S.textSize] || 1);
  }
  function render() {
    applyPrefs();
    if (!isInstalled() && !devMode()) route = "install";
    else if (!S.onboarded) route = "onboard";
    else if (route === "install" || route === "onboard") route = "home";
    var html = { install: viewInstall, onboard: viewOnboard, home: viewHome, story: viewStory, for: viewFor, fav: viewFav, settings: viewSettings }[route]();
    $app.innerHTML = html;
    renderNav(); updateTTS(); updateMusic();
  }

  // Compte à rebours en direct
  setInterval(function () {
    var els = document.querySelectorAll("[data-until]"), now = Date.now(), refresh = false;
    for (var i = 0; i < els.length; i++) {
      var left = +els[i].getAttribute("data-until") - now;
      if (left <= 0) refresh = true; else els[i].textContent = fmtCountdown(left);
    }
    if (refresh && route !== "story") render();
  }, 1000);

  // ---------- Actions (un seul écouteur pour toute l'appli) ----------
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el) return;
    var a = el.getAttribute("data-act");
    if (a === "img-dl") { setTimeout(function () { toast(t("shareFallback")); }, 300); return; }
    e.preventDefault();
    switch (a) {
      case "go": go(el.getAttribute("data-r")); break;
      case "install":
        if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(function () { deferredPrompt = null; render(); }); }
        break;
      case "ob-lang": S.lang = el.getAttribute("data-l"); save(); obStep = 1; render(); break;
      case "ob-name":
        var inp = document.getElementById("obName"); S.name = inp ? inp.value.trim().slice(0, 24) : ""; save(); obStep = 2; render(); break;
      case "ob-gender":
        S.gender = el.getAttribute("data-g"); S.onboarded = true; save(); touchStreak(); pickCompliment(); route = "home"; render();
        toast(t("letsGo")); break;
      case "mode":
        S.mode = el.getAttribute("data-m"); save();
        var chips = document.querySelectorAll("#modes .chip"); for (var i = 0; i < chips.length; i++) chips[i].classList.toggle("active", chips[i] === el);
        var btn = document.querySelector('[data-act="draw"]');
        if (btn) render();
        break;
      case "draw": stopSpeak(); drawQuote(); render(); break;
      case "loop": stopSpeak(); var c = cycle(); if (c) { S.view = (S.view + 1) % c.items.length; save(); } render(); break;
      case "fav":
        toggleFav(el.getAttribute("data-k"));
        if (route === "home" && el.classList.contains("qa")) el.classList.toggle("on");
        else if (route === "story") { var hs = el.querySelector(".qa"); if (hs) hs.classList.toggle("on"); }
        else render();
        break;
      case "q-img": case "q-share": case "q-tts":
        var p = el.getAttribute("data-k").split(":"), d = quoteData({ m: p[1], i: +p[2] });
        if (a === "q-img") openShareImage({ label: t("modes." + d.m), text: d.text, origin: d.origin });
        else if (a === "q-share") shareText(quoteShareText(d));
        else { var tg = "q:" + el.getAttribute("data-k"); if (tts.on && tts.target === tg) stopSpeak(); else speak(d.text + (d.origin ? ". " + d.origin : ""), tg); }
        break;
      case "img-share":
        if (shareFile && navigator.share) navigator.share({ files: [shareFile], text: "Mots d'Or ✨ " + STORE_URL }).catch(function () {});
        break;
      case "close": closeModal(); break;
      case "music":
        if (AUDIO.isPlaying()) AUDIO.stop(); else AUDIO.play(STORIES[story().i].tone);
        updateMusic(); break;
      case "s-tts":
        if (tts.on && tts.target === "story") stopSpeak();
        else { var sd = STORIES[story().i]; speak(L(sd.title) + ". " + L(sd.text), "story"); }
        break;
      case "answer": S.answers[story().i] = +el.getAttribute("data-k"); save(); render(); break;
      case "s-share":
        var s2 = STORIES[story().i], excerpt = L(s2.text).split(/\n\n+/)[0];
        shareText("📖 " + L(s2.title) + "\n\n" + excerpt + " […]\n\n" + t("shareTextFooter", { url: STORE_URL }));
        break;
      case "read-story":
        var si = +el.getAttribute("data-i"), sx = STORIES[si];
        openModal('<span class="tone">' + TONE_ICON[sx.tone] + " " + esc(t("tones." + sx.tone)) + '</span><h2 style="margin:10px 0 14px">' + esc(L(sx.title)) + '</h2><div class="story-body">' +
          L(sx.text).split(/\n\n+/).map(function (pp) { return "<p>" + esc(pp).replace(/\n/g, "<br>") + "</p>"; }).join("") + '</div><button class="btn btn-soft" data-act="close">' + esc(t("close")) + "</button>");
        break;
      case "tab": tab = el.getAttribute("data-t"); render(); break;
      case "for-cat": S.forCat = el.getAttribute("data-c"); save(); render(); break;
      case "for-next": S.forIdx[S.forCat] = ((S.forIdx[S.forCat] || 0) + 1) % FOR[S.forCat].length; save(); render(); break;
      case "for-wa": window.open("https://wa.me/?text=" + encodeURIComponent(forFullText()), "_blank"); break;
      case "for-img":
        var to = (S.forTo || "").trim();
        openShareImage({ label: to ? t("forLabel", { to: to }) : t("cats." + S.forCat), text: currentForMsg() });
        break;
      case "share-store":
        var txt = t("storeShareText");
        if (navigator.share) navigator.share({ title: "TIOKOVA STORE", text: txt, url: STORE_URL }).catch(function () {});
        else window.open("https://wa.me/?text=" + encodeURIComponent(txt + "\n" + STORE_URL), "_blank");
        break;
      case "copy-num": copy(OM_NUMBER.replace(/\s/g, "")); break;
      case "save-name":
        var sn = document.getElementById("setName"); S.name = sn ? sn.value.trim().slice(0, 24) : S.name; save(); pickCompliment(); toast(t("saved")); break;
      case "set-gender": S.gender = el.getAttribute("data-v"); save(); pickCompliment(); render(); toast(t("saved")); break;
      case "set-lang": S.lang = el.getAttribute("data-v"); save(); stopSpeak(); render(); break;
      case "set-sound": S.sound = el.getAttribute("data-v") === "on"; if (!S.sound) AUDIO.stop(); save(); render(); break;
      case "set-size": S.textSize = el.getAttribute("data-v"); save(); render(); break;
    }
  });
  // Saisie du prénom du destinataire (sans tout redessiner)
  document.addEventListener("input", function (e) {
    if (e.target.id === "forTo") {
      S.forTo = e.target.value.slice(0, 24); save();
      var lbl = document.getElementById("forToLbl"), to = S.forTo.trim();
      if (lbl) lbl.textContent = to ? t("forLabel", { to: to }) + " 💛" : CAT_ICON[S.forCat] + " " + t("cats." + S.forCat);
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.id === "obName") { e.preventDefault(); var b = document.querySelector('[data-act="ob-name"]'); if (b) b.click(); }
  });
  $modal.addEventListener("click", function (e) { if (e.target === $modal) closeModal(); });

  // ---------- Démarrage ----------
  if (S.onboarded) touchStreak();
  try { history.replaceState({ r: "home" }, ""); } catch (e) {}
  render();
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
