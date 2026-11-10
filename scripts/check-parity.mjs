// Fails when the English and Ukrainian lesson sets differ, or when a lesson uses different widgets per language.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../src/content/lessons/', import.meta.url).pathname;
const list = lang => readdirSync(join(root, lang)).filter(f => f.endsWith('.mdx')).sort();
const en = list('en'), uk = list('uk');
const problems = [];
for (const f of en) if (!uk.includes(f)) problems.push(`missing in uk: ${f}`);
for (const f of uk) if (!en.includes(f)) problems.push(`missing in en: ${f}`);

const widgets = text => (text.match(/<[a-z]+-[a-z-]+[^>]*>/g) ?? []).map(w => w.replace(/\s+/g, ' ')).sort().join('\n');
const moduleOf = text => (text.match(/^module:\s*(\d+)/m) ?? [])[1];
for (const f of en.filter(x => uk.includes(x))) {
  const a = readFileSync(join(root, 'en', f), 'utf8'), b = readFileSync(join(root, 'uk', f), 'utf8');
  if (widgets(a) !== widgets(b)) problems.push(`widgets differ: ${f}`);
  if (moduleOf(a) !== moduleOf(b)) problems.push(`module differs: ${f}`);
}
if (problems.length) {
  console.error('Lesson parity check failed:\n' + problems.map(p => '  - ' + p).join('\n'));
  process.exit(1);
}
console.log(`Lesson parity OK: ${en.length} lessons in each language.`);
