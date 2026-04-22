import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/Sahaara AI/g, 'Nexa Health');
  content = content.replace(/Sahaara/g, 'Nexa');
  content = content.replace(/sahaara/g, 'nexa');
  content = content.replace(/SAHAARA/g, 'NEXA');
  content = content.replace(/Sara AI/g, 'Nexa Health');
  content = content.replace(/Sara/g, 'Nexa');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.css') || fullPath.endsWith('.html')) {
      replaceInFile(fullPath);
    }
  }
}

walk('./src');
replaceInFile('./index.html');
console.log('Replacement complete.');
