const CACHE_VERSION = 'kavoshgar5-v1.0.18';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './version.json',
  './css/style.css',
  './js/app.js',
  './js/storage.js',
  './games.json',
  './fonts/vazirmatn.css',
  './fonts/Vazirmatn-Variable.woff2',
  './games/math/ch1-time.html',
  './games/math/ch2-fractions.html',
  './games/math/ch2-multiply-fractions-quiz.html',
  './games/math/ch3-multiply-fractions.html',
  './games/math/ch2-fraction-butterfly.html',
  './games/math/ch2-fractions-adventure.html',
  './games/science/ch3-rainbow.html',
  './games/science/ch3-science-quiz.html',
  './games/farsi/ch3-farsi.html',
  './games/farsi/ch4-farsi-treasure.html',
  './games/farsi/ch1-farsi-theater.html',
  './games/social/ch1-social-quiz.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.png',
  './icons/apple-touch-icon.png',
  './images/math.png',
  './images/science.png',
  './images/persian.png',
  './images/social.png',
  './images/profile.png',
  './images/scores.png',
  './images/settings.png',
  './images/levels.png',
  './images/games.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS))
  );
  // 🆕 این خط باعث میشه سرویس‌ورکر جدید فوراً نصب بشه و منتظر نمونه
  self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // 🆕 فوراً کنترل صفحه رو به دست می‌گیره
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);
  const isDynamic =
    url.pathname.includes('/games/') ||
    url.pathname.endsWith('/games.json') ||
    url.pathname.endsWith('/version.json');

  if (isDynamic) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(c => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(c => c.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});