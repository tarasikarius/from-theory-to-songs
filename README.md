# From Theory to Songs / Від теорії до пісень

A bilingual (Ukrainian + English) course in music theory, harmony, composition and arrangement for guitarists, as a static Astro site with interactive tools.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Parity check + static build into `dist/` |
| `npm test` | Unit tests for the music-theory core |
| `npm run check` | Type check |

## Layout

- `src/content/lessons/{en,uk}/` — the course, one MDX file per lesson. File names (`MM-NN-slug.mdx`) set the order and must match between languages; `scripts/check-parity.mjs` enforces that and that both versions embed the same widgets.
- `src/lib/theory.ts` — notes, intervals, scales, chords, Roman numerals (tested in `tests/`).
- `src/lib/audio.ts` — Web Audio synth, no samples.
- `src/widgets/` — custom elements used inside lessons: `<fret-board>`, `<piano-keys>`, `<scale-explorer>`, `<chord-explorer>`, `<interval-explorer>`, `<circle-of-fifths>`, `<progression-player>`, `<metro-nome>`, `<beat-grid>`, `<ear-trainer>`, `<quiz-box>`. UI strings for both languages are in `strings.ts`.
- `src/i18n/ui.ts` — site UI strings and module titles.

## Deploying under a sub-path

Set `SITE` and `BASE` when building, e.g. `SITE=https://user.github.io BASE=/repo/ npm run build`.
