/* =========================================================
   TIOKOVA BLOCKS — sw.js (Service Worker)
   Garde une copie du jeu dans le téléphone :
   → le jeu s'ouvre même SANS connexion internet.

   ⚠️ À CHAQUE MISE À JOUR du jeu, change le numéro de VERSION
   ci-dessous (ex : v1.0.1). Sinon les joueurs garderont
   l'ancienne version en mémoire.
   ========================================================= */
const VERSION = 'tk-blocks-v1.0.0';

const FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/i18n.js',
  './js/data.js',
  './js/storage.js',
  './js/audio.js',
  './js/engine.js',
  './js/renderer.js',
  './js/input.js',
  './js/progress.js',
  './js/ui.js',
  './js/screens.js',
  './js/game.js',
  './js/main.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

// Installation : on télécharge tous les fichiers une fois
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(VERSION).then(function (cache) { return cache.addAll(FILES); })
  );
  self.skipWaiting();
});

// Activation : on supprime les anciennes versions
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf('tk-blocks-') === 0 && k !== VERSION;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Chaque demande de fichier : réseau d'abord (pour avoir la
// dernière version), sinon la copie gardée (hors connexion).
self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then(function (cache) { cache.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});
