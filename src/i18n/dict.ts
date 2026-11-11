// Helpers for the bilingual JSON string lists (src/i18n/*.json, src/data/*.json).
export type DataLang = 'en' | 'uk';
export interface Entry { id: string; en: string; uk: string }

/** Turn a list of { id, en, uk } entries into an id → text map for one language. */
export function dictFor(entries: readonly Entry[], lang: DataLang): Record<string, string> {
  return Object.fromEntries(entries.map(e => [e.id, e[lang]]));
}
