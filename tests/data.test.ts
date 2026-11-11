import { describe, expect, it } from 'vitest';
import { INTERVALS, SIMPLE_INTERVALS, parseInterval, simpleInterval } from '../src/lib/theory';
import { moduleTitles, ui } from '../src/i18n/ui';
import widgetEntries from '../src/i18n/widgets.json';

// Source files as raw text, so the tests can check that every string key used in code exists in the JSON.
const astroFiles = import.meta.glob<string>('../src/**/*.astro', { query: '?raw', import: 'default', eager: true });
const widgetFiles = import.meta.glob<string>('../src/widgets/*.ts', { query: '?raw', import: 'default', eager: true });

describe('intervals.json', () => {
  it('lists the 13 simple intervals in ascending order', () => {
    expect(SIMPLE_INTERVALS).toHaveLength(13);
    expect(INTERVALS.map(i => i.semis)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('agrees with parseInterval for every id except the tritone', () => {
    for (const i of INTERVALS.filter(i => i.id !== 'TT')) {
      expect(simpleInterval(i.id), i.id).toEqual(parseInterval(i.id));
    }
  });

  it('spells the tritone as an augmented 4th', () => {
    expect(simpleInterval('TT')).toEqual(parseInterval('A4'));
  });

  it('rejects unknown ids', () => {
    expect(() => simpleInterval('X9')).toThrow();
  });
});

describe('string tables', () => {
  it('builds UI strings in both languages', () => {
    expect(ui.en.siteTitle).toBe('From Theory to Songs');
    expect(ui.uk.siteTitle).toBe('Від теорії до пісень');
    expect(Object.keys(ui.en)).toEqual(Object.keys(ui.uk));
  });

  it('has a title for every module 0..11', () => {
    expect(moduleTitles.en).toHaveLength(12);
    expect(moduleTitles.uk).toHaveLength(12);
    expect(moduleTitles.en[11]).toBe('Appendices');
  });

  it('defines every UI key used as s.<key> in .astro files', () => {
    const missing: string[] = [];
    for (const [f, text] of Object.entries(astroFiles)) {
      for (const m of text.matchAll(/\bs\.([A-Za-z0-9]+)\b/g)) {
        if (!(m[1] in ui.en)) missing.push(`${f}: s.${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("defines every widget key used as t('<key>') in src/widgets", () => {
    const known = new Set(widgetEntries.map(e => e.id));
    const missing: string[] = [];
    for (const [f, text] of Object.entries(widgetFiles)) {
      for (const m of text.matchAll(/\bt\('([^']+)'/g)) {
        const key = m[1];
        if (key.endsWith('.')) continue; // dynamic key such as t('i.' + id); checked by the data itself
        const ok = known.has(key) || (key.startsWith('i.') && INTERVALS.some(i => i.id === key.slice(2)));
        if (!ok) missing.push(`${f}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
