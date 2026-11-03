const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, (a) => res(a.trim())));

async function main() {
  try {
    console.log('\n=== 🎮 Add New Game to Kavoshgar 5 ===\n');
    const data = JSON.parse(fs.readFileSync('games.json', 'utf8'));
    const subjects = data.subjects.map((s) => s.id);

    const id = await ask('Game ID (e.g., ch3-farsi): ');
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(id)) throw new Error('Game ID باید فقط شامل حروف انگلیسی، عدد و - باشد.');
    if (data.games.some((g) => g.id === id)) throw new Error('این Game ID قبلاً وجود دارد.');

    const subject = await ask(`Subject (${subjects.join(', ')}): `);
    if (!subjects.includes(subject)) throw new Error('درس نامعتبر است.');
    const chapter = parseInt(await ask('Chapter Number: '), 10);
    if (!Number.isInteger(chapter) || chapter < 1) throw new Error('شماره فصل نامعتبر است.');
    const title = await ask('Title: ');
    const subtitle = await ask('Subtitle: ');
    const description = await ask('Description: ');
    const emoji = await ask('Emoji: ');
    const file = (await ask('File Path (e.g., games/farsi/ch3-farsi.html): ')).replace(/^\.?\//, '');
    if (!fs.existsSync(file)) throw new Error(`فایل ${file} پیدا نشد.`);

    data.games.push({ id, subject, chapter, title, subtitle, description, emoji, file, teacher: 'یوسف معصومی' });
    fs.writeFileSync('games.json', JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ games.json updated!');

    // sw.js: آرایه را بازسازی می‌کنیم تا مشکل ویرگول جا‌افتاده پیش نیاید
    if (fs.existsSync('sw.js')) {
      const sw = fs.readFileSync('sw.js', 'utf8');
      const m = sw.match(/(const ASSETS = \[)([\s\S]*?)(\n?\];)/);
      if (!m) throw new Error('آرایه ASSETS در sw.js پیدا نشد.');
      const entry = `'./${file}'`;
      if (m[2].includes(entry)) console.log('⚠️ File already in sw.js ASSETS.');
      else {
        const inner = m[2].replace(/[\s,]+$/, '');
        fs.writeFileSync('sw.js', sw.replace(m[0], `${m[1]}${inner},\n  ${entry}\n];`), 'utf8');
        console.log('✅ sw.js updated!');
      }
    }
    console.log('\n🎉 Done! Now run release.bat\n');
  } catch (e) {
    console.error('\n❌ ' + e.message + '\n');
    process.exitCode = 1;
  } finally { rl.close(); }
}
main();
