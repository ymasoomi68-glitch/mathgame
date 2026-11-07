// مدیریت پیشرفت بازیکن با localStorage (امن در برابر خطا و حالت خصوصی)
const Progress = (() => {
  const KEY = 'math5-progress';
  const fresh = () => ({ games: {}, totalStars: 0 }); // هر بار شیء تازه؛ مشکل مرجع مشترک رفع شد
  const GAME_KEYS = ['farsi_razi_progress', 'farsi_treasure_progress', 'time_lab_progress', 'butterfly_progress', 'fractions_adventure_progress', 'fractions_game_progress', 'multiply_fractions_progress', 'rainbow_mission_progress', 'science_quiz_progress', 'social_quiz_progress', 'multiply_quiz_progress'];
  let memory = null; // اگر localStorage در دسترس نبود

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return memory || fresh();
      const p = JSON.parse(raw);
      if (!p || typeof p !== 'object' || typeof p.games !== 'object' || !p.games) return fresh();
      return { games: p.games, totalStars: Number(p.totalStars) || 0 };
    } catch (e) { return memory || fresh(); }
  }
  function save(data) {
    memory = data;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.warn('ذخیره‌سازی ممکن نشد:', e); }
  }
  const sum = (games) => Object.values(games).reduce((s, g) => s + (g.stars || 0), 0);

  return {
    getProgress: load,
    getGame: (id) => load().games[id],
    getTotalStars: () => sum(load().games), // یک منبع حقیقت: مجموع ستاره‌ی بازی‌ها
    recordGame(id, stars) {
      const data = load();
      const prev = data.games[id];
      data.games[id] = { stars: Math.max(stars, (prev && prev.stars) || 0), attempts: ((prev && prev.attempts) || 0) + 1, lastPlayed: Date.now() };
      data.totalStars = sum(data.games);
      save(data);
    },
    reset() {
      memory = fresh();
      try { localStorage.removeItem(KEY); } catch (e) {}
      // وضعیت ذخیره‌شدهٔ داخل خود بازی‌ها (ادامهٔ آزمون و ...) هم پاک شود
      GAME_KEYS.forEach((k) => { try { localStorage.removeItem(k); } catch (e) {} });
    },
  };
})();
