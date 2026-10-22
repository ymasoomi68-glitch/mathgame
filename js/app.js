// ============================================
// کاوشگر پنجم — منطق اصلی (چنددرسی)
// ============================================

const App = {
  el: {},
  state: {
    view: 'home',
    subjects: [],
    games: [],
    currentSubject: null,
    currentGame: null,
    error: null,
  },

  async init() {
    this.el = {
      main: document.getElementById('app-main'),
      title: document.getElementById('app-title'),
      backBtn: document.getElementById('back-btn'),
       homeBtn: document.getElementById('home-btn'),
      updateBanner: document.getElementById('update-banner'),
    };

    this.el.backBtn.addEventListener('click', () => this.goBack());
    window.addEventListener('hashchange', () => this.route());
    window.addEventListener('message', (e) => this.handleGameMessage(e));

    await this.loadData();

    if (!location.hash) {
      location.hash = '/';
    } else {
      this.route();
    }

    this.setupSWUpdate();
  },

  async loadData() {
    try {
      const res = await fetch('./games.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      this.state.subjects = data.subjects || [];
      this.state.games = data.games || [];
    } catch (err) {
      console.warn('خطا در بارگذاری داده‌ها:', err);
      this.state.subjects = [];
      this.state.games = [];
      this.state.error = 'بارگذاری اطلاعات ممکن نشد. اتصال اینترنت را بررسی کنید.';
    }
  },

  route() {
    const path = location.hash.replace(/^#/, '') || '/';

    if (path === '/') {
      this.state.view = 'home';
      this.state.currentSubject = null;
      this.state.currentGame = null;
    } else if (path === '/subjects') {
      this.state.view = 'subjects';
      this.state.currentSubject = null;
      this.state.currentGame = null;
    } else if (path.startsWith('/subject/')) {
      const id = path.slice(9);
      const subject = this.state.subjects.find(s => s.id === id);
      if (subject) {
        this.state.currentSubject = subject;
        this.state.view = 'subject-games';
      } else {
        this.state.view = 'subjects';
      }
      this.state.currentGame = null;
    } else if (path.startsWith('/game/')) {
      const id = path.slice(6);
      const game = this.state.games.find(g => g.id === id);
      if (game) {
        this.state.currentGame = game;
        this.state.view = 'game';
      } else {
        this.state.view = 'subjects';
      }
    } else {
      this.state.view = 'home';
    }

    this.render();
  },

  goBack() {
    switch (this.state.view) {
      case 'game':
        location.hash = '/subject/' + (this.state.currentGame?.subject || 'math');
        break;
      case 'subject-games':
        location.hash = '/subjects';
        break;
      case 'subjects':
        location.hash = '/';
        break;
    }
  },

  goSubjects() { location.hash = '/subjects'; },
  openSubject(id) { location.hash = '/subject/' + id; },
  openGame(id) { location.hash = '/game/' + id; },

  handleGameMessage(e) {
    if (!e.data || e.data.type !== 'GAME_FINISHED') return;

    const { gameId, score, total } = e.data;
    if (!gameId || typeof score !== 'number' || typeof total !== 'number') return;

    const pct = total > 0 ? score / total : 0;
    const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.5 ? 1 : 0;

    Storage.recordGame(gameId, stars);
    console.log(`🎮 ${gameId}: ${score}/${total} → ⭐${stars}`);
  },

  render() {
    if (this.state.view === 'home') {
      this.el.title.textContent = '🚀 کاوشگر پنجم';
    } else if (this.state.view === 'subjects') {
      this.el.title.textContent = '📚 انتخاب درس';
    } else if (this.state.view === 'subject-games' && this.state.currentSubject) {
      this.el.title.textContent = `${this.state.currentSubject.emoji} ${this.state.currentSubject.label}`;
    } else if (this.state.view === 'game' && this.state.currentGame) {
      this.el.title.textContent = `${this.state.currentGame.emoji} ${this.state.currentGame.title}`;
    }

    this.el.backBtn.classList.toggle('hidden', this.state.view === 'home');
    this.el.homeBtn.classList.toggle('hidden', this.state.view === 'home');
    this.el.main.classList.toggle('game-mode', this.state.view === 'game');

    if (this.state.view === 'home') this.renderHome();
    else if (this.state.view === 'subjects') this.renderSubjects();
    else if (this.state.view === 'subject-games') this.renderSubjectGames();
    else if (this.state.view === 'game') this.renderGame();
  },

  renderHome() {
    const totalStars = Storage.getTotalStars();
    const gamesPlayed = Object.keys(Storage.getProgress().games).length;

    this.el.main.innerHTML = `
      <div class="home">
        <div class="hero-emoji">🚀</div>
        <h2>کاوشگر پنجم</h2>
        <p>ماجراجویی یادگیری را با بازی شروع کن!</p>
        <div class="stats">
          <div class="stat-card">
            <div class="stat-emoji">⭐</div>
            <div class="stat-value">${toFa(totalStars)}</div>
            <div class="stat-label">ستاره‌ها</div>
          </div>
          <div class="stat-card">
            <div class="stat-emoji">🎮</div>
            <div class="stat-value">${toFa(gamesPlayed)}</div>
            <div class="stat-label">بازی انجام‌شده</div>
          </div>
        </div>
        <div class="actions-home">
          <button class="btn btn-primary" onclick="App.goSubjects()">شروع ماجراجویی 🚀</button>
        </div>
        ${this.state.error ? `<p style="color:var(--danger);font-size:0.9rem;margin-top:1rem">${this.state.error}</p>` : ''}
      </div>
    `;
  },

  renderSubjects() {
    const subjects = this.state.subjects;
    const progress = Storage.getProgress();

    if (subjects.length === 0) {
      this.el.main.innerHTML = `
        <div class="home">
          <div class="hero-emoji">📭</div>
          <h2>هنوز درسی اضافه نشده</h2>
          <p>به‌زودی محتوا اضافه می‌شود.</p>
        </div>
      `;
      return;
    }

    const cardsHtml = subjects.map(s => {
      const subjectGames = this.state.games.filter(g => g.subject === s.id);
      const count = subjectGames.length;
      const stars = subjectGames.reduce((sum, g) => sum + (progress.games[g.id]?.stars || 0), 0);
      const maxStars = count * 3;
      const isReady = count > 0;

      const statusText = isReady
        ? `${toFa(count)} بازی • ⭐ ${toFa(stars)} از ${toFa(maxStars)}`
        : 'به‌زودی...';

      return `
        <div
          class="subject-card ${isReady ? '' : 'coming-soon'}"
          style="border-right-color: ${s.color}"
          ${isReady ? `onclick="App.openSubject('${s.id}')"` : ''}
        >
          <div class="subject-emoji" style="background:${s.color}20;color:${s.color}">
            ${s.emoji}
          </div>
          <div class="subject-info">
            <div class="subject-title">${s.label}</div>
            <div class="subject-desc">${statusText}</div>
          </div>
          ${isReady ? '<div class="subject-arrow">←</div>' : ''}
        </div>
      `;
    }).join('');

    this.el.main.innerHTML = `
      <h2 class="page-title">📚 یک درس انتخاب کن</h2>
      <div class="subjects-grid">${cardsHtml}</div>
    `;
  },

  renderSubjectGames() {
    const subject = this.state.currentSubject;
    if (!subject) return;

    const subjectGames = this.state.games.filter(g => g.subject === subject.id);

    if (subjectGames.length === 0) {
      this.el.main.innerHTML = `
        <div class="home">
          <div class="hero-emoji">${subject.emoji}</div>
          <h2>${subject.label}</h2>
          <p>هنوز بازی‌ای برای این درس اضافه نشده.</p>
          <button class="btn btn-primary" onclick="App.goSubjects()">بازگشت</button>
        </div>
      `;
      return;
    }

    const byChapter = {};
    subjectGames.forEach(g => {
      const ch = g.chapter ?? 1;
      if (!byChapter[ch]) byChapter[ch] = [];
      byChapter[ch].push(g);
    });

    const progress = Storage.getProgress();

    const chaptersHtml = Object.keys(byChapter)
      .map(Number)
      .sort((a, b) => a - b)
      .map(chNum => {
        const gamesHtml = byChapter[chNum].map(game => {
          const p = progress.games[game.id];
          const stars = p?.stars || 0;
          const starsText = stars > 0
            ? '⭐'.repeat(stars)
            : '<span style="color:#94a3b8">بازی نشده</span>';
          return `
            <div class="game-card" onclick="App.openGame('${game.id}')">
              <div class="game-emoji">${game.emoji || '🎮'}</div>
              <div class="game-info">
                <div class="game-title">${game.title}</div>
                <div class="game-desc">${game.description || ''}</div>
                ${game.teacher ? `<div class="game-teacher">👩‍🏫 ${game.teacher}</div>` : ''}
              </div>
              <div class="game-stars">${starsText}</div>
            </div>
          `;
        }).join('');

        return `
          <div class="chapter-section">
            <h3 class="chapter-header">📖 فصل ${toFa(chNum)}</h3>
            <div class="games-list">${gamesHtml}</div>
          </div>
        `;
      }).join('');

    this.el.main.innerHTML = `
      <div class="subject-header">
        <div class="subject-header-emoji" style="background:${subject.color}20;color:${subject.color}">
          ${subject.emoji}
        </div>
        <h2>${subject.label}</h2>
      </div>
      ${chaptersHtml}
    `;
  },

  renderGame() {
    const game = this.state.currentGame;
    if (!game) return;

    this.el.main.innerHTML = `
      <div class="game-view">
        <iframe
          src="${game.file}"
          title="${game.title}"
          allow="fullscreen"
          loading="eager"
        ></iframe>
      </div>
    `;
  },

  setupSWUpdate() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('خطا در ثبت SW:', err);
    });

    navigator.serviceWorker.ready.then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateBanner(reg);
          }
        });
      });
    });
  },

  showUpdateBanner(reg) {
    const banner = this.el.updateBanner;
    if (!banner) return;
    banner.classList.remove('hidden');

    document.getElementById('update-btn').onclick = () => {
      reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
      banner.classList.add('hidden');
      setTimeout(() => location.reload(), 200);
    };
    document.getElementById('dismiss-update').onclick = () => banner.classList.add('hidden');
  },
};

function toFa(n) {
  return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
}

document.addEventListener('DOMContentLoaded', () => App.init());
