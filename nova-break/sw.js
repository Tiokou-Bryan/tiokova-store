// =====================================================
//  NOVA BREAK — sw.js (Service Worker)
//  Garde le jeu en mémoire pour qu'il marche sans connexion.
//  ⚠️ Quand tu modifies le jeu, change "v1" en "v2", "v3"…
//  sinon les téléphones garderont l'ancienne version.
// =====================================================
const CACHE = 'nova-break-v1';
const FICHIERS = [
  './', './index.html', './style.css', './audio.js', './jeu.js', './app.js', './manifest.json',
  './icon-192.png', './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(cles => Promise.all(cles.filter(k => k.startsWith('nova-break') && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(rep => {
      // on garde aussi les polices et les captures dès qu'elles ont été chargées une fois
      const url = e.request.url;
      if (url.includes('fonts.g') || url.includes('/captures/')) {
        const copie = rep.clone();
        caches.open(CACHE).then(c => c.put(e.request, copie));
      }
      return rep;
    }))
  );
});
