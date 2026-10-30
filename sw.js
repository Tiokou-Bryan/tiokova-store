/* =========================================================
   TIOKOVA STORE — sw.js
   Garde une copie de la page du store pour l'ouvrir
   même sans connexion.
   Il ne touche PAS aux applis (blocks/, convertisseur/…) :
   chacune a son propre sw.js.
   ⚠️ Change VERSION à chaque mise à jour du store.
   ========================================================= */
const VERSION = 'tiokova-store-v3';

const FICHIERS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './assets/icon-192.png',
  './assets/logo-tiokova.jpg',
  './assets/logo-embleme.png',
  './assets/blocks-1.jpg',
  './assets/blocks-2.jpg',
  './assets/blocks-3.jpg',
  './assets/motsdor-1.jpg',
  './assets/motsdor-2.jpg',
  './assets/motsdor-3.jpg',
  './assets/motsdor-4.jpg',
  './assets/devises-1.jpg',
  './assets/devises-2.jpg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FICHIERS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (cles) {
      return Promise.all(cles.filter(function (k) {
        return k.indexOf('tiokova-store-') === 0 && k !== VERSION;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Seuls les fichiers du store sont concernés (racine et dossier assets)
function estDuStore(url) {
  const base = new URL('./', self.registration.scope).pathname;
  if (url.origin !== self.location.origin || url.pathname.indexOf(base) !== 0) return false;
  const reste = url.pathname.slice(base.length);
  return reste.indexOf('/') === -1 || reste.indexOf('assets/') === 0;
}

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET' || !estDuStore(new URL(req.url))) return;
  // Internet d'abord (dernière version), sinon la copie gardée
  e.respondWith(
    fetch(req).then(function (rep) {
      if (rep && rep.ok) {
        const copie = rep.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copie); });
      }
      return rep;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) {
        return r || caches.match('./index.html');
      });
    })
  );
});