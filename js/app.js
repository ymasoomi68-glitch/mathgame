// ============================================
// کاوشگر پنجم — منطق اصلی
// ============================================
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toFa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
const ICON_DL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 20h16"/></svg>';

const App = {
  el: {},
  state: { view: 'home', subjects: [], games: [], currentSubject: null, currentGame: null, error: null, version: '' },
  swReg: null,

  async init() {
    this.el = {
      main: document.getElementById('app-main'),
      title: document.getElementById('app-title'),
      backBtn: document.getElementById('back-btn'),
      homeBtn: document.getElementById('home-btn'),
      updateBanner: document.getElementById('update-banner'),
    };
    this.el.backBtn.addEventListener('click', () => this.goBack());
    this.el.homeBtn.addEventListener('click', () => { location.hash = '/'; });
    document.getElementById('scores-btn').addEventListener('click', () => { location.hash = '/scores'; });
    document.getElementById('profile-btn').addEventListener('click', () => { location.hash = '/settings'; });
    window.addEventListener('hashchange', () => this.route());
    window.addEventListener('message', (e) => this.handleGameMessage(e));
    window.addEventListener('install-ready', () => this.refreshInstallUI());
    window.addEventListener('appinstalled', () => { window.__installEvent = null; this.toast('✅ برنامه نصب شد'); this.refreshInstallUI(); });
    matchMedia('(display-mode: standalone)').addEventListener?.('change', () => this.refreshInstallUI());

    try { await this.loadData(); } catch (e) { console.warn(e); }
    try { const v = await (await fetch('./version.json', { cache: 'no-cache' })).json(); this.state.version = v.version; } catch {}
    if (!location.hash || location.hash === '#') location.hash = '/'; else this.route();
    this.setupSW();
  },

  async loadData() {
    try {
      const res = await fetch('./games.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      this.state.subjects = data.subjects || [];
      this.state.games = data.games || [];
      this.state.error = null;
    } catch (err) {
      console.warn('خطا در بارگذاری داده‌ها:', err);
      this.state.error = 'بارگذاری اطلاعات ممکن نشد. اتصال اینترنت را بررسی کنید.';
    }
  },

  // ---------- سرویس‌ورکر و به‌روزرسانی ----------
  setupSW() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      this.swReg = reg;
      if (reg.waiting && navigator.serviceWorker.controller) this.showUpdateBanner(reg);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) this.showUpdateBanner(reg);
        });
      });
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    }).catch((e) => console.warn('ثبت سرویس‌ورکر ناموفق:', e));
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
  },
  showUpdateBanner(reg) {
    const b = this.el.updateBanner; if (!b) return;
    b.classList.remove('hidden');
    document.getElementById('update-btn').onclick = () => { reg.waiting?.postMessage({ type: 'SKIP_WAITING' }); b.classList.add('hidden'); };
    document.getElementById('dismiss-update').onclick = () => b.classList.add('hidden');
  },

  // ---------- نصب برنامه ----------
  isStandalone() { return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: window-controls-overlay)').matches || navigator.standalone === true; },
  isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); },
  refreshInstallUI() { document.querySelectorAll('[data-install]').forEach((b) => b.classList.toggle('hidden', this.isStandalone())); },
  async install() {
    const ev = window.__installEvent;
    if (ev) {
      ev.prompt();
      const { outcome } = await ev.userChoice.catch(() => ({}));
      window.__installEvent = null;
      if (outcome === 'accepted') this.toast('⏳ در حال نصب...');
      this.refreshInstallUI();
      return;
    }
    const steps = this.isIOS()
      ? ['در Safari دکمه «اشتراک‌گذاری» (مربع با فلش) را بزنید.', 'گزینه‌ی «Add to Home Screen» را انتخاب کنید.', 'روی «Add» بزنید.']
      : /android/i.test(navigator.userAgent)
        ? ['از منوی ⋮ مرورگر Chrome گزینه‌ی «Install app» یا «Add to Home screen» را بزنید.']
        : ['در Chrome یا Edge، آیکون نصب (⊕) را در انتهای نوار آدرس بزنید، یا از منوی ⋯ گزینه‌ی «Install Kavoshgar» را انتخاب کنید.', 'اگر گزینه‌ای نمی‌بینید، صفحه را با آدرس https باز کنید و یک بار تازه‌سازی کنید.'];
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<div class="modal-box"><h3>📲 نصب کاوشگر پنجم</h3><ol>${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol><button class="btn btn-primary" style="width:100%">متوجه شدم</button></div>`;
    m.addEventListener('click', (e) => { if (e.target === m || e.target.tagName === 'BUTTON') m.remove(); });
    document.body.appendChild(m);
  },

  // ---------- مسیریابی ----------
  route() {
    const path = location.hash.replace(/^#/, '') || '/';
    const s = this.state;
    s.currentSubject = null; s.currentGame = null;
    if (path === '/') s.view = 'home';
    else if (path === '/subjects') s.view = 'subjects';
    else if (path === '/scores') s.view = 'scores';
    else if (path === '/settings') s.view = 'settings';
    else if (path.startsWith('/subject/')) {
      const sub = s.subjects.find((x) => x.id === decodeURIComponent(path.slice(9)));
      if (sub) { s.currentSubject = sub; s.view = 'subject-games'; } else s.view = 'subjects';
    } else if (path.startsWith('/game/')) {
      const g = s.games.find((x) => x.id === decodeURIComponent(path.slice(6)));
      if (g) { s.currentGame = g; s.view = 'game'; } else s.view = 'subjects';
    } else s.view = 'home';
    this.render();
  },
  goBack() {
    const v = this.state.view;
    if (v === 'game') location.hash = '/subject/' + (this.state.currentGame?.subject || '');
    else if (v === 'subject-games') location.hash = '/subjects';
    else location.hash = '/';
  },
  goSubjects() { location.hash = '/subjects'; },
  openSubject(id) { location.hash = '/subject/' + encodeURIComponent(id); },
  openGame(id) { location.hash = '/game/' + encodeURIComponent(id); },

  // ---------- پیام بازی‌ها (با اعتبارسنجی) ----------
  handleGameMessage(e) {
    if (e.origin !== location.origin) return;
    const frame = this.el.main.querySelector('iframe');
    if (!frame || e.source !== frame.contentWindow) return;
    const d = e.data;
    if (!d || d.type !== 'GAME_FINISHED') return;
    const g = this.state.games.find((x) => x.id === d.gameId);
    if (!g || g.id !== this.state.currentGame?.id) return;
    if (!Number.isFinite(d.score) || !Number.isFinite(d.total) || d.total <= 0) return;
    const pct = Math.min(1, Math.max(0, d.score / d.total));
    const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.5 ? 1 : 0;
    Progress.recordGame(g.id, stars);
    this.toast(stars ? '⭐'.repeat(stars) + ' آفرین!' : '💪 دوباره امتحان کن!');
    if (stars) this.confetti(stars * 18);
  },
  toast(msg) {
    document.querySelector('.toast')?.remove();
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  },
  confetti(n) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cols = ['#ffc933', '#22c3a0', '#ff6b6b', '#6c7bff', '#fff'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i'); c.className = 'confetti';
      c.style.cssText = `left:${Math.random() * 100}vw;background:${cols[i % 5]};animation-duration:${1.6 + Math.random() * 1.6}s;animation-delay:${Math.random() * .5}s;border-radius:${i % 2 ? '50%' : '2px'}`;
      document.body.appendChild(c); setTimeout(() => c.remove(), 4000);
    }
  },

  // ---------- نمایش ----------
  render() {
    const s = this.state;
    const titles = { home: '🚀 کاوشگر پنجم', subjects: '📚 انتخاب درس', scores: '🏆 امتیازها', settings: '⚙️ تنظیمات' };
    this.el.title.textContent = s.view === 'subject-games' && s.currentSubject ? `${s.currentSubject.emoji} ${s.currentSubject.label}`
      : s.view === 'game' && s.currentGame ? `${s.currentGame.emoji} ${s.currentGame.title}` : titles[s.view] || titles.home;
    this.el.backBtn.classList.toggle('hidden', s.view === 'home');
    this.el.homeBtn.classList.toggle('hidden', s.view === 'home');
    this.el.main.classList.toggle('game-mode', s.view === 'game');
    this.el.main.scrollTop = 0;
    const fn = { home: 'renderHome', subjects: 'renderSubjects', 'subject-games': 'renderSubjectGames', game: 'renderGame', scores: 'renderScores', settings: 'renderSettings' }[s.view];
    this[fn]();
    this.refreshInstallUI();
  },

  installBtn() { return `<button class="btn btn-install" data-install onclick="App.install()">${ICON_DL} نصب برنامه روی این دستگاه</button>`; },

  renderHome() {
    const total = Progress.getTotalStars();
    const played = Object.keys(Progress.getProgress().games).length;
    this.el.main.innerHTML = `
      <div class="home">
        <div class="hero"><div class="orbit"></div><div class="rocket">🚀</div></div>
        <h2>کاوشگر پنجم</h2>
        <p>ماجراجویی یادگیری را با بازی شروع کن!</p>
        <div class="stats">
          <div class="stat-card"><div class="stat-value">${toFa(total)} ⭐</div><div class="stat-label">ستاره‌ها</div></div>
          <div class="stat-card"><div class="stat-value">${toFa(played)} 🎮</div><div class="stat-label">بازی انجام‌شده</div></div>
        </div>
        <div class="actions-home">
          <button class="btn btn-primary" onclick="App.goSubjects()">شروع ماجراجویی 🚀</button>
          ${this.installBtn()}
        </div>
        ${this.state.error ? `<p class="err">${esc(this.state.error)}</p>` : ''}
      </div>`;
  },

  renderSubjects() {
    const { subjects, games } = this.state;
    if (!subjects.length) { this.el.main.innerHTML = `<div class="home"><div class="hero-emoji" style="font-size:4rem">📭</div><h2>هنوز درسی اضافه نشده</h2><p>${esc(this.state.error || 'به‌زودی محتوا اضافه می‌شود.')}</p></div>`; return; }
    const progress = Progress.getProgress();
    const cards = subjects.map((s) => {
      const sg = games.filter((g) => g.subject === s.id);
      const stars = sg.reduce((n, g) => n + (progress.games[g.id]?.stars || 0), 0);
      const ready = sg.length > 0;
      return `<div class="subject-card ${ready ? '' : 'coming-soon'}" style="--c:${esc(s.color)}" ${ready ? `role="button" tabindex="0" onclick="App.openSubject('${esc(s.id)}')" onkeydown="if(event.key==='Enter')App.openSubject('${esc(s.id)}')"` : ''}>
        <div class="subject-emoji" style="background:${esc(s.color)}22">${s.icon ? `<img src="${esc(s.icon)}" alt="">` : esc(s.emoji)}</div>
        <div class="subject-info"><div class="subject-title">${esc(s.label)}</div><div class="subject-desc">${ready ? `${toFa(sg.length)} بازی • ⭐ ${toFa(stars)} از ${toFa(sg.length * 3)}` : 'به‌زودی...'}</div></div>
        ${ready ? '<div class="subject-arrow">‹</div>' : ''}</div>`;
    }).join('');
    this.el.main.innerHTML = `<h2 class="page-title">📚 یک درس انتخاب کن</h2><div class="subjects-grid">${cards}</div>`;
  },

  gameCard(g, progress) {
    const st = progress.games[g.id]?.stars || 0;
    const stars = st ? '⭐'.repeat(st) + `<span class="dim">${'☆'.repeat(3 - st)}</span>` : '<span class="dim">بازی نشده</span>';
    return `<div class="game-card" role="button" tabindex="0" onclick="App.openGame('${esc(g.id)}')" onkeydown="if(event.key==='Enter')App.openGame('${esc(g.id)}')">
      <div class="game-emoji">${esc(g.emoji || '🎮')}</div>
      <div class="game-info"><div class="game-title">${esc(g.title)}</div><div class="game-desc">${esc(g.description || '')}</div>${g.teacher ? `<div class="game-teacher">🧑‍🏫 ${esc(g.teacher)}</div>` : ''}</div>
      <div class="game-stars">${stars}</div></div>`;
  },

  renderSubjectGames() {
    const sub = this.state.currentSubject; if (!sub) return;
    const sg = this.state.games.filter((g) => g.subject === sub.id);
    const head = `<div class="subject-header"><div class="subject-header-emoji" style="background:${esc(sub.color)}22">${sub.icon ? `<img src="${esc(sub.icon)}" alt="">` : esc(sub.emoji)}</div><h2>${esc(sub.label)}</h2></div>`;
    if (!sg.length) { this.el.main.innerHTML = head + '<p>هنوز بازی‌ای برای این درس اضافه نشده.</p>'; return; }
    const by = {}; sg.forEach((g) => (by[g.chapter ?? 1] ||= []).push(g));
    const progress = Progress.getProgress();
    this.el.main.innerHTML = head + Object.keys(by).map(Number).sort((a, b) => a - b).map((ch) =>
      `<h3 class="chapter-header">📖 فصل ${toFa(ch)}</h3><div class="games-list">${by[ch].map((g) => this.gameCard(g, progress)).join('')}</div>`).join('');
  },

  renderGame() {
    const g = this.state.currentGame; if (!g) return;
    this.el.main.innerHTML = `<div class="game-view"><iframe src="${esc(g.file)}" title="${esc(g.title)}" allow="fullscreen" loading="eager"></iframe></div>`;
  },

  renderScores() {
    const p = Progress.getProgress();
    const rows = this.state.games.map((g) => `<div class="row"><span>${esc(g.emoji)} ${esc(g.title)}</span><span>${p.games[g.id]?.stars ? '⭐'.repeat(p.games[g.id].stars) : '—'}</span></div>`).join('');
    this.el.main.innerHTML = `<div class="panel"><h3>مجموع: ${toFa(Progress.getTotalStars())} ⭐ از ${toFa(this.state.games.length * 3)}</h3>${rows || '<p>هنوز بازی‌ای نیست.</p>'}</div>`;
  },

  renderSettings() {
    this.el.main.innerHTML = `
      <div class="panel"><h3>📲 نصب برنامه</h3><p style="margin-bottom:.8rem">برنامه را مثل یک اپ واقعی روی گوشی یا ویندوز نصب کن تا بدون مرورگر و حتی آفلاین اجرا شود.</p>${this.installBtn()}</div>
      <div class="panel"><h3>🗑️ پاک‌کردن پیشرفت</h3><p style="margin-bottom:.8rem">همه‌ی ستاره‌ها حذف می‌شود.</p><button class="btn btn-danger" onclick="if(confirm('مطمئنی؟ همه‌ی ستاره‌ها پاک می‌شود.')){Progress.reset();App.toast('پیشرفت پاک شد');App.route()}">پاک‌کردن</button></div>
      <p style="text-align:center;color:var(--muted);font-size:.85rem">نسخه ${esc(toFa(this.state.version || '—'))}</p>`;
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
