# Redesign handover: "Spectrum + notes" (Sunset)

Written 2026-11-12. For a new session that will apply the chosen design to the site in `web-app/`.
Read the project `CLAUDE.md` first; its rules (both languages, parity check, no UI framework, verify music facts) all apply.

## How to run this handover

Two phases, in this order:

1. **Phase A: minor design edits on the preview.** The user has a few small changes to the approved board. Ask
   what they are, make them on the canvas (see "Editing the preview" below), and get a clear "ok, implement".
2. **Phase B: implement** the final board in the site (everything from "What was decided" down).

Do not start Phase B until the user says the preview is final. An earlier implementation session was started and
stopped before it changed anything; the repo has no redesign work in it yet (only this `docs/` folder is new).

## Editing the preview (Phase A)

- The board is the file `project/SpectrumNotes.dc.html` inside the design canvas
  https://claude.ai/artifact/MzUvXE1ijFjf4DYrehv2Y2 (board title "6 Spectrum + notes"). The other five boards are
  rejected directions; leave them alone.
- Read that file with the Artifact tool (`action: "read"`, the URL, `path: "project/SpectrumNotes.dc.html"`) before
  every round of edits. The user also edits the board by hand, so never publish from an old copy. The read returns
  the canvas's own authoring rules; follow them for file format and publishing.
- Change only what the user asks. Publish only that one file. Touch `project/canvas.json` only if the board's
  height must change (`boards["SpectrumNotes.dc.html"].h`, and the matching `$preview` height in the file).
- After each published edit, copy the board file over `docs/design/spectrum-notes.reference.html` and update this
  document if a decision changed, so Phase B works from the final version.
- Lessons from the first round of edits:
  - Doodles sit in fixed positions in narrow side margins (about 60px at this width). Before adding or moving one,
    list the `top` values of the others on that side and pick a gap of at least 150px. The user rejected a
    placement that crowded neighbouring doodles.
  - Root-level absolute doodles are hidden behind the white course-contents section, so doodles for that section
    must be placed inside `<section id="modules">`.
  - The user reverts things they changed by accident; if the board's content differs from what you expect, say what
    differs and ask rather than silently overwriting.
  - Nobody has verified the board rendered. If the user reports an overlap, believe the report over the markup.

## What was decided

The user compared six design previews and chose **"Spectrum + notes" with the Sunset palette**.
It replaces the current dark "Overtone" theme in `src/styles/global.css`.

The idea: a clean, modern, rounded base (the "Spectrum" part) that looks like a teenager has been using it as a
practice book: handwritten notes, taped sticky notes, polaroid-style picture slots, and pen/pencil doodles in the
margins.

## Reference files (in this folder)

- `spectrum-notes.reference.html`: the approved preview. **Reference only, do not ship it.** It is a design-canvas
  file, not a normal page: it needs a canvas runtime, so do not open it in a browser. Read it as markup. `{{p.x}}`
  holes are palette values (use the Sunset row below), `{{k.x}}` are per-button values computed in the script at the
  bottom, and `<sc-for>` is a loop.
- `spectrum-lesson.reference.html`: lesson page preview (board "7 Spectrum + notes: lesson page", file
  `project/SpectrumLesson.dc.html` on the same canvas), built from lesson 1.1. Approved by the user on 2026-11-12. Same rules as
  above: reference only, read as markup. Sync it after every edit, like the home board.
- `guitarist.webp`: the user's cartoon guitarist (a still frame, black background). Used in one picture slot.
- Live preview (private to the user): https://claude.ai/artifact/MzUvXE1ijFjf4DYrehv2Y2, board "6 Spectrum + notes".

The preview covers the **home page only**, in **English only**, plus one small "lesson excerpt" block. An approved lesson page design
exists (`spectrum-lesson.reference.html`); the tools page and the other widgets have no design yet. Extend the
same language to them (see step 5).

## Design tokens (Sunset)

| Token | Value | Use |
|---|---|---|
| bg | `#FFF1E8` | page ground (peach) |
| surface | `#FFFFFF` | white sections, chips, pill buttons, polaroid frames |
| soft | `#FFDCC8` | circle-of-fifths disc, placeholder fill |
| ink | `#2B1420` | text; also the dark panel behind tabs |
| muted | `#6B4A52` | secondary text, pencil doodles (at 50% opacity) |
| primary | `#D83A17` | main button, selected key, links on hover (white text on it is about 4.6:1) |
| near | `#FFC2A6` | "related" highlight (neighbouring keys) |
| hand | `#7A2BD6` | handwriting and pen doodles (violet) |
| doodle | `#FFC9AE` | faint background doodles |
| dash / phink | `#E58A66` / `#8A2A10` | placeholder border / placeholder text |
| tape | `rgba(216,58,23,.26)` | tape strips |
| underline | `#FF8A7A` | hand-drawn underline under the h1 |
| sticky notes | `#FFE873`, `#FFB8D9`, `#A8EBC9` | yellow, pink, mint |
| tab accent | `#FFD84A` | labels on the dark tab panel |
| module dots 1–10 | `#FF8A7A #FFB14A #FFD84A #B9E24A #5FDDA0 #4FD6D6 #7DBBFF #A9A8FF #CF9BFF #FF96D5` | dark text on each |

Shapes: pill buttons (radius 30px, 60px tall), chips radius 18px, panels radius 24–40px, hard offset shadows
(`3px 5px 0 rgba(…,.14)`) on notes and polaroids, small rotations (1–5deg) on anything "stuck on".

Three other palettes (Ocean, Garden, Violet) exist in the reference script. They were rejected; ignore them.

## Fonts

- **Unbounded** (500/700/800): headings, buttons, key names.
- **Golos Text** (400/600): body.
- **Caveat** (600/700): handwriting only.

All three have Cyrillic. The site self-hosts fonts with `@fontsource-variable/*` (see `src/layouts/Base.astro`);
do the same here and do not load Google Fonts at runtime. Check that the fontsource packages exist and include the
Cyrillic subset before relying on them. Onest and Playfair Display can be removed once nothing uses them; the
monospace font is still needed for tabs and widget labels.

## Components to build

1. **Header**: plain text brand with a handwritten line under it, "Proudly made in Ukraine", followed by a small
   hand-drawn Ukrainian flag (blue `#0057B7` over yellow `#FFD700`, wavy, ink outline and pole) on the same line;
   the user asked for both, and they need a Ukrainian version. Then nav links, language switch as a white pill. Keep the theme toggle only if a dark
   theme is kept (open question 1).
2. **Hero**: Unbounded h1, hand-drawn underline (inline SVG), then the handwritten line "for guitarists who write
   rock, metal and pop" under the title (the user moved it there from above the h1), lede, two pill buttons, a row of
   handwritten scraps.
3. **Circle of fifths in the hero**: majors on the outer ring, relative minors on the inner ring, both clickable.
   Picking a major lights up its IV, V and vi; picking a minor lights up its iv, v and ♭III. Four chips show the
   chords with numerals. The site already has a circle-of-fifths widget (`.cof-*` styles, code in
   `src/widgets/explorers.ts`) and a theory core in `src/lib/theory.ts`: **reuse and restyle those rather than
   porting the hard-coded tables from the reference**. The reference tables are correctly spelled per key
   (for example D♯m has A♯m as its v) and can serve as test expectations.
4. **Sticky note**: coloured square, tape strip on top, Caveat heading, body text, slight rotation. Used for
   "How it works" (three notes) and a "10 modules, 34 lessons" note.
5. **Polaroid picture slot**: white frame, tape, image or dashed labelled placeholder, Caveat caption.
6. **Course contents**: rows with a coloured numbered dot, module title, lesson count, on a white section with
   40px top corners. The current home page also lists every lesson under each module; **keep that**, the preview
   only shows module rows for brevity.
6b. **Footer** (shared by every page; static, not sticky): dark `ink` panel with 40px top corners. Three columns:
   brand, one-line description and the "Proudly made in Ukraine" line with flag; a "Course" link list; a "Support"
   column with two pill buttons, "Support the creator" (primary, heart icon) and "Support Ukraine’s defence" (flag
   yellow `#FFD700`, flag icon). Bottom row: "Compiled by AI at the request and to the requirements of Taras Konkevych ·
   tkonkevych@gmail.com" (mailto link; wording set by the user) and "© 2026 From Theory to Songs". Open: the
   creator donation URL and which defence fund to link stay placeholders until the user supplies them. All footer text needs Ukrainian versions in `ui.json`.
6c. **"How it works" thread**: one thin hand-drawn line (`primary`, 2.5px) that runs behind the row of sticky notes
   and the polaroid, showing only in the gaps and the side margins, as if the notes were strung on it. On a phone,
   where the row stacks, hide it or redraw it vertically.
6d. **"russia is a terrorist state"** (the user asked for it; lowercase "russia" is deliberate): black (`#111111`)
   handwriting, Caveat 400, about 36px, over a yellow highlighter stroke (`#FFD84A` at 85%, covering the middle
   band of the line, slightly uneven corners), above the lesson-excerpt block on the home page. Ukrainian draft for review:
   «росія — держава-терорист».
7. **Doodles**: inline SVG, `aria-hidden`, two styles: pen (`hand` colour, 3.5px stroke) and pencil (`muted`, 3px,
   50% opacity). Motifs in the reference: lightning bolt, sunglasses smiley, 3D cube, tic-tac-toe, spiral, heart,
   stars, guitar pick, notes, skull, amp, and a cute kitten (pen style; the user asked for it; on the lesson page it
   sits under the sidebar contents). Put them in side margins and in gaps, never under body text.
8. **Handwritten scraps**: "5th = 7 frets!!", "E A D G B E", "practice!!", "louder.", "Am – F – C – G again?!",
   crossed-out "band name: ???". ("riff idea: 0-3-5 on the low E" was in the old footer and went with it; reuse it elsewhere if it fits.)
9. **"Bon Jovi" margin scribble** (the user asked for this one specifically): black pen (`#111111`, not the violet
   `hand` colour), in a hand-drawn box (no heart; the user had it removed), written vertically in the right side margin of the course-contents section. Keep it clear of other doodles; the
   user rejected a spot where it crowded them.

## Suggested order of work

1. Add fonts and replace the colour/shape tokens in `src/styles/global.css`. Keep the scale-degree colours
   `--d1`…`--d7` and the instrument tokens unless they clash; fretboard and piano should stay readable.
2. Restyle the shared layout (`src/layouts/Base.astro`: header, footer).
3. Rebuild the home page (`src/pages/[lang]/index.astro`) to match the reference. The harmonics figure currently
   in the hero is replaced by the circle of fifths; ask the user before deleting it for good, it could move into a
   lesson.
4. Add every new string to `src/i18n/ui.json` (or `widgets.json` for widget text) in both `en` and `uk`.
5. Carry the style to lesson pages (`src/pages/[lang]/lessons/[slug].astro`, `.prose`, `.toc`, `.pager`), the tools
   page, and all `.w-*` widget styles. Use notes and doodles sparingly there; reading comes first. Show the user
   one lesson page before doing the rest.
6. Run `npm run build`, `npm run check`, `npm test` in `web-app/`, then look at the home page, one lesson and the
   tools page in the browser, in both languages, at desktop and phone width.

## Open questions for the user

1. **Dark theme.** The site is dark by default with a light toggle. The approved design is light only. Options:
   make Sunset the only theme and drop the toggle, or design a dark Sunset variant. Ask before removing the toggle.
2. **Pictures.** Two slots are still placeholders ("fretboard widget in action", "guitar, amp or practice
   corner"). The guitarist file is a still; the user has an animated GIF and should supply the original file.
3. **Ukrainian handwriting text.** The scraps and captions need Ukrainian versions. Draft them, but flag them for
   the user's review; do not present them as checked. "Bon Jovi" and note names stay as they are.
4. **Harmonics figure**: keep somewhere or drop (see step 3).

## Known rough edges in the preview

- It was never checked rendered by the assistant that made it: doodle positions and spacing are estimates.
- Inner-ring (minor) buttons shrink below a 44px tap target on narrow phones. Fix in the real build.
- The guitarist crop is estimated and may be off-centre.
- The guitarist polaroid caption is final, set by the user: EN "from Vitya", UK «від Віті». Other captions, such as
  "where the songs get written", are placeholder wording.
- Shortened or reworded copy in the preview is not authoritative; site text comes from `src/i18n/*.json`.

## Constraints (from CLAUDE.md, repeated because they bite)

- Every content or string change goes into both languages, or `scripts/check-parity.mjs` fails the build.
- No UI framework, no audio samples, no tracking. Widgets stay framework-free custom elements in light DOM.
- Build internal links with `href()` from `src/i18n/ui.ts`.
- Verify music facts (spell chords, check fret numbers). B = сі, never H.
- Commit only when the user asks.
