import fs from 'fs';

const content = fs.readFileSync('d:/folder (D)/progrmming/NEXA HEALTH/Nexa Health/src/components/ReportAI.jsx', 'utf8');

function count(str, char) {
  let c = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === char) c++;
  }
  return c;
}

console.log('{ count:', count(content, '{'));
console.log('} count:', count(content, '}'));
console.log('( count:', count(content, '('));
console.log(') count:', count(content, ')'));
console.log('[ count:', count(content, '['));
console.log('] count:', count(content, ']'));
