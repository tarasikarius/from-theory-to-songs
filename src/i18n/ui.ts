import { dictFor } from './dict';
import uiEntries from './ui.json';
import moduleEntries from './modules.json';

export const LANGS = ['uk', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'uk';

export const ui: Record<Lang, Record<string, string>> = {
  en: dictFor(uiEntries, 'en'),
  uk: dictFor(uiEntries, 'uk'),
};

/** Module titles, indexed by module number (0 = Introduction, 11 = Appendices). */
export const moduleTitles: Record<Lang, string[]> = {
  en: moduleEntries.map(m => m.en),
  uk: moduleEntries.map(m => m.uk),
};

export const isLang = (x: string | undefined): x is Lang => !!x && (LANGS as readonly string[]).includes(x);
export const other = (lang: Lang): Lang => (lang === 'uk' ? 'en' : 'uk');

/** Prefix a site path with the configured base. */
export function href(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + (path.startsWith('/') ? path : '/' + path);
}

/** "3 lessons" / «3 уроки» / «5 уроків»: the count with the right plural form. */
export function lessonsCount(lang: Lang, n: number): string {
  const s = ui[lang];
  if (lang === 'en') return `${n} ${n === 1 ? s.lessonOne : s.lessonMany}`;
  const d = n % 10, h = n % 100;
  const word = d === 1 && h !== 11 ? s.lessonOne : d >= 2 && d <= 4 && (h < 12 || h > 14) ? s.lessonFew : s.lessonMany;
  return `${n} ${word}`;
}
