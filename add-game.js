const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (q) => new Promise(res => rl.question(q, res));

async function main() {
    console.log("\n=== 🎮 Add New Game to Kavoshgar 5 ===\n");
    const id = await ask("Game ID (e.g., ch3-farsi): ");
    const subject = await ask("Subject (math, science, farsi, social): ");
    const chapter = parseInt(await ask("Chapter Number: "));
    const title = await ask("Title: ");
    const subtitle = await ask("Subtitle: ");
    const description = await ask("Description: ");
    const emoji = await ask("Emoji: ");
    const file = await ask("File Path (e.g., games/farsi/ch3-farsi.html): ");

    const newGame = {
        id, subject, chapter, title, subtitle, description, emoji, file,
        teacher: "یوسف معصومی"
    };

    // 1. Update games.json
    const jsonPath = 'games.json';
    if (fs.existsSync(jsonPath)) {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        if (!data.games.find(g => g.id === id)) {
            data.games.push(newGame);
            fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
            console.log("✅ games.json updated!");
        } else {
            console.log("⚠️ Game ID already exists in games.json!");
        }
    }

    // 2. Update sw.js
    const swPath = 'sw.js';
    if (fs.existsSync(swPath)) {
        let swContent = fs.readFileSync(swPath, 'utf8');
        const newAssetStr = `  './${file}',`;
        if (!swContent.includes(newAssetStr)) {
            // پیدا کردن آخرین فایل در آرایه ASSETS و اضافه کردن زیر آن
            swContent = swContent.replace(/(const ASSETS = \[[\s\S]*?)(\n\];)/, `$1\n  './${file}',$2`);
            fs.writeFileSync(swPath, swContent, 'utf8');
            console.log("✅ sw.js updated!");
        } else {
            console.log("⚠️ File already exists in sw.js ASSETS!");
        }
    }
    
    console.log("\n🎉 Done! You can now run release.bat\n");
    rl.close();
}
main();