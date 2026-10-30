// Service worker : garde une copie de l'appli pour qu'elle s'ouvre hors connexion.
const CACHE = "tiokova-devises-v5";
const FICHIERS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./installation.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(cles =>
    Promise.all(cles.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  // Les taux viennent toujours d'Internet (l'appli gère le hors-ligne elle-même)
  if (e.request.url.includes("er-api.com")) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});