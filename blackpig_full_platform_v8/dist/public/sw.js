const CACHE_VERSION = 'blackpig-v8.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const ASSETS = [
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/01-security-fsrs-rollover.js',
  './js/02-curriculum-data.js',
  './js/03-database-ledger-account.js',
  './js/04-avatar-frames-roadmap-exam.js',
  './js/05-ai-dojo-arena-srs-profile.js',
  './js/06-router-events-init.js',
  './assets/images/hero_banner.jpg',
  './assets/images/tutor_dragon.jpg',
  './assets/images/scene_streetfood_milktea.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
    ).then(() => {
      self.clients.claim();
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATE_READY', version: CACHE_VERSION });
        });
      });
    })
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Network-first for HTML navigation so users always receive new deployments promptly
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(e.request, clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  // Stale-while-revalidate for assets
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const networkFetch = fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(e.request, clone)).catch(() => {});
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
