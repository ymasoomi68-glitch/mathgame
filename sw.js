// سرویس‌ورکر کاوشگر پنجم — پشتیبانی آفلاین و نصب‌پذیری
// نکته: CACHE_VERSION را make-version.js خودکار به‌روز می‌کند.
const CACHE_VERSION = 'kavoshgar5-v1.0.20';
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

// نسخه‌هایی که app.js خراب داشتند؛ کاربرانِ این نسخه‌ها باید خودکار و بدون پاک‌کردن کش نجات پیدا کنند
const BROKEN_CACHES = /^kavoshgar5-v1\.0\.(1[5-9])$/;
const NETWORK_TIMEOUT = 4000;

self.addEventListener('install', (event) => {
  // allSettled: نبودِ یک فایل نباید کل نصب (و آپدیت) را شکست بدهد
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const results = await Promise.allSettled(ASSETS.map((a) => cache.add(new Request(a, { cache: 'reload' }))));
    const failed = results.map((r, i) => (r.status === 'rejected' ? ASSETS[i] : null)).filter(Boolean);
    if (failed.length) console.warn('[sw] کش نشدند:', failed);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const wasBroken = keys.some((k) => k !== CACHE_VERSION && BROKEN_CACHES.test(k));
    await Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
    // فقط یک‌بار برای کاربران نسخهٔ خراب: صفحه‌ی بازِ خالی را با نسخهٔ سالم دوباره بارگذاری کن
    if (wasBroken) {
      const wins = await self.clients.matchAll({ type: 'window' });
      wins.forEach((w) => { try { w.navigate(w.url); } catch (e) {} });
    }
  })());
});

function putInCache(event, req, res) {
  const copy = res.clone();
  event.waitUntil(caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {}));
}

// اول شبکه (با مهلت کوتاه)، اگر نشد کش — تا اصلاحات همیشه به کاربر برسد
function networkFirst(event, req) {
  return new Promise((resolve) => {
    let settled = false;
    const fromCache = () => caches.match(req, { ignoreSearch: true });
    const timer = setTimeout(async () => {
      const hit = await fromCache();
      if (hit && !settled) { settled = true; resolve(hit); }
    }, NETWORK_TIMEOUT);
    fetch(req).then(async (res) => {
      clearTimeout(timer);
      if (res.ok && res.status === 200) putInCache(event, req, res);
      if (settled) return;
      settled = true;
      resolve(res);
    }).catch(async () => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      const hit = await fromCache();
      resolve(hit || (req.mode === 'navigate' ? await caches.match('./index.html') : null) || Response.error());
    });
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const p = url.pathname;
  const isShell = req.mode === 'navigate' || /\.(html|js|css|json)$/.test(p) || p.endsWith('/');
  if (isShell) { event.respondWith(networkFirst(event, req)); return; }

  // تصویرها، آیکون‌ها و فونت: اول کش
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && res.status === 200) putInCache(event, req, res);
        return res;
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
