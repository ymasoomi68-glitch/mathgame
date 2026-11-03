const fs = require('fs');
const crypto = require('crypto');
const notes = process.argv.slice(2).join(' ').trim() || 'بروزرسانی';

const hash = (f) => (fs.existsSync(f) ? crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex') : '');

let version = '1.0.0';
if (fs.existsSync('version.json')) {
  const data = JSON.parse(fs.readFileSync('version.json', 'utf8')); // اگر خراب باشد، خطا می‌دهد و نسخه را ریست نمی‌کند
  const p = String(data.version || '1.0.0').split('.').map((n) => parseInt(n, 10));
  if (p.length === 3 && p.every(Number.isInteger)) { p[2] += 1; version = p.join('.'); }
  else throw new Error('فرمت version در version.json باید x.y.z باشد.');
}

// نام کش سرویس‌ورکر را هم تغییر می‌دهیم تا کاربران آپدیت را بگیرند
if (fs.existsSync('sw.js')) {
  const sw = fs.readFileSync('sw.js', 'utf8');
  fs.writeFileSync('sw.js', sw.replace(/const CACHE_VERSION = '[^']*';/, `const CACHE_VERSION = 'kavoshgar5-v${version}';`), 'utf8');
}

const out = {
  version, releasedAt: new Date().toISOString(), notes,
  hashes: { index: hash('index.html'), css: hash('css/style.css'), app: hash('js/app.js'), sw: hash('sw.js') },
};
fs.writeFileSync('version.json', JSON.stringify(out, null, 2), 'utf8');
console.log('✅ version.json ساخته شد. نسخه جدید:', version);
