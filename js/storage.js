// مدیریت پیشرفت بازیکن با localStorage
const Storage = (() => {
  const KEY = 'math5-progress';

  const defaults = {
    games: {},   // { gameId: { stars, attempts, lastPlayed } }
    totalStars: 0,
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
    } catch {
      return { ...defaults };
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('خطا در ذخیره‌سازی:', e);
    }
  }

  return {
    getProgress() {
      return load();
    },

    getGame(gameId) {
      return load().games[gameId];
    },

    recordGame(gameId, stars) {
      const data = load();
      const prev = data.games[gameId];
      const bestStars = Math.max(stars, prev?.stars ?? 0);
      const diff = bestStars - (prev?.stars ?? 0);

      data.games[gameId] = {
        stars: bestStars,
        attempts: (prev?.attempts ?? 0) + 1,
        lastPlayed: Date.now(),
      };
      data.totalStars += diff;

      save(data);
    },

    reset() {
      localStorage.removeItem(KEY);
    },

    getTotalStars() {
      return load().totalStars;
    },
  };
})();
