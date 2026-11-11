// Fails when the English and Ukrainian lesson sets differ, when a lesson uses different widgets per language,
// or when a bilingual JSON list (src/i18n, src/data) has a missing/empty translation or mismatched {placeholders}.
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
// Bilingual JSON lists: [{ id, en, uk, ... }]
const dataFiles = ['i18n/ui.json', 'i18n/widgets.json', 'i18n/modules.json', 'data/intervals.json'];
const placeholders = str => (str.match(/\{\w+\}/g) ?? []).sort().join(',');
for (const rel of dataFiles) {
  const list = JSON.parse(readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8'));
  if (!Array.isArray(list)) { problems.push(`${rel}: not a list`); continue; }
  const seen = new Set();
  list.forEach((e, i) => {
    if (seen.has(e.id)) problems.push(`${rel}: duplicate id ${e.id}`);
    seen.add(e.id);
    for (const lang of ['en', 'uk']) {
      if (typeof e[lang] !== 'string' || !e[lang].trim()) problems.push(`${rel}: ${e.id} has no ${lang} text`);
    }
    if (typeof e.en === 'string' && typeof e.uk === 'string' && placeholders(e.en) !== placeholders(e.uk)) {
      problems.push(`${rel}: ${e.id} has different {placeholders} in en and uk`);
    }
    if (rel === 'i18n/modules.json' && e.id !== i) problems.push(`${rel}: id ${e.id} is not its position ${i}`);
    if (rel === 'data/intervals.json' && !(Number.isInteger(e.semis) && Number.isInteger(e.steps))) {
      problems.push(`${rel}: ${e.id} needs integer semis and steps`);
    }
  });
}

if (problems.length) {
  console.error('Parity check failed:\n' + problems.map(p => '  - ' + p).join('\n'));
  process.exit(1);
}
console.log(`Parity OK: ${en.length} lessons in each language, ${dataFiles.length} bilingual data files.`);
