// Widget UI strings. Language is taken from <html lang>.
// Text lives in src/i18n/widgets.json; interval names come from src/data/intervals.json (keys "i.<id>").
import { dictFor, type DataLang } from '../i18n/dict';
import widgetEntries from '../i18n/widgets.json';
import intervals from '../data/intervals.json';

const build = (lang: DataLang): Record<string, string> => ({
  ...dictFor(widgetEntries, lang),
  ...Object.fromEntries(intervals.map(i => ['i.' + i.id, i[lang]])),
});

const en = build('en');
const dicts: Record<string, Record<string, string>> = { en, uk: build('uk') };

export function t(key: string, vars: Record<string, string | number> = {}): string {
  const lang = (typeof document !== 'undefined' && document.documentElement.lang) || 'en';
  let s = (dicts[lang] ?? en)[key] ?? en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
