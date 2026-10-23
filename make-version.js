const fs = require('fs'); 
const crypto = require('crypto'); 
 
function getHash(file) { 
  if (!fs.existsSync(file)) return ''; 
  const content = fs.readFileSync(file); 
  return crypto.createHash('md5').update(content).digest('hex'); 
} 
 
const versionFile = 'version.json'; 
let version = '1.0.0'; 
if (fs.existsSync(versionFile)) { 
  try { 
    const data = JSON.parse(fs.readFileSync(versionFile, 'utf8')); 
  } catch (e) {} 
} 
 
const hashes = { 
  index: getHash('index.html'), 
  css: getHash('css/style.css'), 
  app: getHash('js/app.js') 
}; 
 
const out = { 
  version: version, 
  releasedAt: new Date().toISOString(), 
  notes: 'نسخه جدید کاوشگر پنجم', 
  hashes: hashes 
}; 
 
fs.writeFileSync(versionFile, JSON.stringify(out, null, 2), 'utf8'); 
console.log('✅ version.json ساخته شد. نسخه:', version); 
