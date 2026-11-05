// سرویس‌ورکر کاوشگر پنجم — پشتیبانی آفلاین و نصب‌پذیری
// نکته: CACHE_VERSION را make-version.js خودکار به‌روز می‌کند.
const CACHE_VERSION = 'kavoshgar5-v1.0.11';
const FONT_CACHE = 'kavoshgar5-fonts';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './games.json',
  './css/style.css',
  './css/game-theme.css',
  './js/app.js',
  './js/storage.js',
  './icons/apple-touch-icon.png',
  './icons/favicon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './images/games.png',
  './images/levels.png',
  './images/math.png',
  './images/persian.png',
  './images/profile.png',
  './images/science.png',
  './images/scores.png',
  './images/settings.png',
  './images/social.png',
  './games/farsi/ch3-farsi.html',
  './games/math/ch1-time.html',
  './games/math/ch2-fractions.html',
  './games/math/ch3-multiply-fractions.html',
  './games/science/ch3-rainbow.html',
  './games/math/ch2-multiply-fractions-quiz.html',
  './games/farsi/ch4-farsi-treasure.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // اگر یک فایل پیدا نشد، نصب کل سرویس‌ورکر شکست نخورد
    await Promise.allSettled(ASSETS.map((a) => cache.add(new Request(a, { cache: 'reload' }))));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_VERSION && k !== FONT_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

const isOk = (res) => res && (res.ok || res.type === 'opaque');

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // فونت‌ها و استایل CDN: اول کش، در پس‌زمینه به‌روز
  if (url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith((async () => {
      const cache = await caches.open(FONT_CACHE);
      const hit = await cache.match(req);
      const net = fetch(req).then((r) => { if (isOk(r)) cache.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })());
    return;
  }
  if (url.origin !== self.location.origin) return;

  // صفحه‌ها، بازی‌ها و داده‌ها: اول شبکه، بعد کش
  const dynamic = req.mode === 'navigate' || url.pathname.includes('/games/') || /\/(games|version)\.json$/.test(url.pathname) || /\/(js|css)\//.test(url.pathname);
  if (dynamic) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok && res.status === 200) { const c = await caches.open(CACHE_VERSION); c.put(req, res.clone()); }
        return res;
      } catch {
        const hit = await caches.match(req, { ignoreSearch: true });
        if (hit) return hit;
        if (req.mode === 'navigate') return (await caches.match('./index.html')) || Response.error();
        return Response.error();
      }
    })());
    return;
  }

  // تصویر و آیکون: اول کش
  event.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && res.status === 200) { const c = await caches.open(CACHE_VERSION); c.put(req, res.clone()); }
      return res;
    } catch { return Response.error(); }
  })());
});
