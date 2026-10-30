/* Mots d'Or — Service worker (fonctionnement hors ligne)
   Change le numéro de CACHE à chaque mise à jour (v1 → v2…)
   pour que les téléphones téléchargent la nouvelle version. */
var CACHE = "motsdor-v1";
var FILES = [
  "./", "./index.html", "./manifest.webmanifest", "./css/style.css",
  "./js/i18n.js", "./js/audio.js", "./js/app.js",
  "./data/quotes-1.js", "./data/quotes-2.js", "./data/quotes-3.js",
  "./data/stories-1.js", "./data/stories-2.js", "./data/stories-3.js", "./data/extras.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("motsdor-") === 0 && k !== CACHE && k !== "motsdor-fonts"; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  // Polices Google : on garde une copie pour le mode hors ligne
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open("motsdor-fonts").then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) { if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // Fichiers de l'appli : cache d'abord, réseau ensuite
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return caches.match("./index.html"); });
  }));
});
