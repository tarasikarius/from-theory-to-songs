# From Theory to Songs / Від теорії до пісень

A bilingual (Ukrainian + English) course in music theory, harmony, composition and arrangement for guitarists, as a static Astro site with interactive tools.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Parity check + static build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm test` | Unit tests (theory, data, audio) |
| `npm run check` | Type check |
| `npm run samples` | Convert raw recordings in `samples-src/` to `public/samples/` (needs `ffmpeg`) |

Before publishing anything, run `npm run check`, `npm test` and `npm run build`, and look at the changed pages in the browser.

## How to…

### Add or change instrument samples

1. Put WAV files (AIFF and FLAC also work) in a folder under `samples-src/`:

   | Folder | Plays | File names |
   |---|---|---|
   | `samples-src/clean/` | the fretboard, and play buttons switched to **Guitar** | one note per file |
   | `samples-src/piano/` | the piano keys, and every widget's play buttons (**Piano** is the default sound) | one note per file |
   | `samples-src/bass/` | the bass line in the progression player and the ear trainer's progressions | one note per file |
   | `samples-src/chug/` | the riff row of the drum grid (palm-muted notes) | one note per file |
   | `samples-src/drums/` | the beat grid | `kick.wav`, `snare.wav`, `closed-hat.wav` (`hat`, `hihat` and `hi-hat` also work) |

2. Name each note file after its note: `E2.wav`, `F#2.wav` (or `Fs2.wav`), `Bb3.wav`. Replacing a note means overwriting its file.
   Octave numbering is detected from the sound, so Logic's (middle C = C3) and the usual (middle C = C4) both work, as long as one folder uses one style throughout. A copy number from Logic or Finder (`G2.1.wav`) is ignored.
3. Run:
   ```bash
   npm run samples
   ```
   It trims each file to the attack, tunes notes to their exact pitch, evens out the loudness, fades the end and writes `public/samples/<set>/` plus the list `src/data/samples.json`. Drum hits are trimmed and levelled but never retuned.
4. Read the output. Files with a wrong name or no sound are skipped. A line starting with `check` means a file seems to sound a different note or octave than its name says. Such a file is converted but not retuned. Fix the name or re-record it, then run `npm run samples` again.
5. Reload the page to hear the new sounds. Commit `public/samples/` and `src/data/samples.json`; `samples-src/` is git-ignored, so back the raw files up yourself.

Tips: record each note for 6–8 s (shorter takes cut held notes short), and cover the whole range a set is used for. Missing notes are filled by stretching the nearest recording, which sounds thin beyond a few semitones. Ranges each set is played over (as the notes sound, middle C = C4):

| Set | Range | Why |
|---|---|---|
| guitar (`clean`) | D2 to G5 | the fretboard: drop-D low string to fret 15 on the high E |
| piano | E2 to C5 | the piano keys from C3; the play buttons also reach down to about E2 |
| bass | C2 to B2 | the bass line plays the chord root in this octave |
| chug | E2 | the riff row always plays low E |

Keep a recording within two or three semitones of every note in the range.

Volume between sets and the balance of the drum kit are set in `src/lib/audio.ts` (`SAMPLE_GAIN`, `DRUM_GAIN`, `CHUG_GAIN`). A **new folder** (say `samples-src/strings/`) is converted but not played until code uses it: pitched sets are linked to a voice in `VOICE_SET` in `src/lib/audio.ts`, and new kinds of drum hit need a name in `HIT_SETS` in `scripts/build-samples.mjs`.

### Edit a lesson

- Lessons are `src/content/lessons/en/MM-NN-slug.mdx` and `src/content/lessons/uk/MM-NN-slug.mdx`. **Change both languages.**
- The file name sets the order (`03-02-…` is module 3, lesson 2). A new lesson needs the same file name in both folders.
- Frontmatter: `title`, `module` (0 intro, 1–10 modules, 11 appendices), `number` (`"1.1"`), `summary`. Quote values that contain `: `.
- Sections, in order: The idea, On your instrument, Worked example, Exercises, Common mistakes, Check yourself.
- Both versions must embed the same widget tags with the same attributes, or `npm run build` stops with a parity error that names the file.
- In MDX: no `key` attribute (widgets use `tonic`), no bare `<` or `{` in prose. Links to other pages are relative (`../11-04-glossary/`, `../../tools/`).

### Change site or widget text

All UI text is JSON lists of `{ "id", "en", "uk" }`. Edit the JSON, not the TypeScript next to it:

| What | File |
|---|---|
| Site UI (menu, headings, buttons) | `src/i18n/ui.json` |
| Widget labels and messages | `src/i18n/widgets.json` |
| Module titles | `src/i18n/modules.json` |
| Interval names | `src/data/intervals.json` |

The build fails if a language is missing or the `{placeholders}` differ between languages.

### Add a widget

Write it in `src/widgets/` as a custom element, register it in `src/widgets/index.ts`, add its text to `src/i18n/widgets.json` in both languages, and put it on the tools page (`src/pages/[lang]/tools.astro`). Put Play last in its button group.

## Deploy

The site is published to **GitHub Pages** by `.github/workflows/deploy.yml`:

- **Every push to `main`** runs the tests, builds the site and publishes it. You can also start it by hand: GitHub → Actions → "Deploy to GitHub Pages" → Run workflow.
- One-time setup: in the GitHub repo, Settings → Pages → Source must be **GitHub Actions**.
- Watch a deploy under the repo's Actions tab. If tests or the build fail, nothing is published and the old site stays up.
- The workflow sets the site address and sub-path for you, so links work at `https://<user>.github.io/<repo>/`.

To build for another host by hand, set `SITE` and `BASE`, then upload `dist/`:

```bash
SITE=https://user.github.io BASE=/repo/ npm run build
```

With no `BASE` the site is built for the root of a domain (`/`).

## Layout

- `src/content/lessons/{en,uk}/` — the course, one MDX file per lesson. `scripts/check-parity.mjs` checks the two languages match.
- `src/lib/theory.ts` — notes, intervals, scales, chords, Roman numerals (tested in `tests/`).
- `src/lib/audio.ts` — Web Audio player: recorded guitar, piano, bass, chug and drum samples (kick, snare, hat); synthesized pad, drone and metronome click, plus a synth fallback while samples load.
- `samples-src/` — raw recordings (git-ignored). `scripts/build-samples.mjs` converts them into `public/samples/` and `src/data/samples.json`.
- `src/widgets/` — custom elements used inside lessons: `<scale-explorer>`, `<chord-explorer>`, `<interval-explorer>`, `<circle-of-fifths>`, `<key-wheel>`, `<progression-player>`, `<metro-nome>`, `<beat-grid>`, `<ear-trainer>`, `<quiz-box>`. The fretboard and piano inside them are in `instruments.ts`; `sound.ts` holds each widget's own Piano/Guitar choice (Piano by default; the circle of fifths, key wheel and progression player show the switch only with the `sound-switch` attribute, used on the tools page).
- `src/i18n/` — UI text (JSON) and `ui.ts` with the `href()` link helper.
- `src/pages/[lang]/` — home page, lessons, tools page.
