// سرویس‌ورکر کاوشگر پنجم — پشتیبانی آفلاین و نصب‌پذیری
// نکته: CACHE_VERSION را make-version.js خودکار به‌روز می‌کند.
const CACHE_VERSION = 'kavoshgar5-v1.0.15';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './games.json',
  './css/style.css',
  './fonts/vazirmatn.css',
  './fonts/Vazirmatn-Variable.woff2',
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
  './games/farsi/ch4-farsi-treasure.html',
  './games/math/ch2-fraction-butterfly.html',
  './games/math/ch2-fractions-adventure.html',
  './games/science/ch3-science-quiz.html',
  './games/social/ch1-social-quiz.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // اگر یک فایل پیدا نشد، نصب کل سرویس‌ورکر شکست نخورد
    const results = await Promise.allSettled(ASSETS.map((a) => cache.add(new Request(a, { cache: 'reload' }))));
    const failed = results.map((r, i) => (r.status === 'rejected' ? ASSETS[i] : null)).filter(Boolean);
    if (failed.length) console.warn('[sw] فایل‌هایی که کش نشدند:', failed);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  // صفحه‌ها، بازی‌ها و داده‌ها: اول شبکه، بعد کش
  const dynamic = req.mode === 'navigate' || url.pathname.includes('/games/') || /\/(games|version)\.json$/.test(url.pathname) || /\/(js|css)\//.test(url.pathname);
  if (dynamic) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok && res.status === 200) { const copy = res.clone(); event.waitUntil(caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {})); }
        return res;
      } catch (e) {
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
      if (res.ok && res.status === 200) { const copy = res.clone(); event.waitUntil(caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {})); }
      return res;
    } catch (e) { return Response.error(); }
  })());
});
