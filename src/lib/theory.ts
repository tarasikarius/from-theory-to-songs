// Small music-theory core: spelled notes, intervals, scales, chords, roman numerals.

export interface Note { letter: number; acc: number } // letter 0..6 = C..B, acc in semitones

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
const mod = (n: number, m: number) => ((n % m) + m) % m;

export function parseNote(s: string): Note {
  const letter = LETTERS.indexOf(s[0].toUpperCase());
  if (letter < 0) throw new Error(`Bad note: ${s}`);
  let acc = 0;
  for (const ch of s.slice(1)) {
    if (ch === '#' || ch === '♯') acc++;
    else if (ch === 'b' || ch === '♭') acc--;
  }
  return { letter, acc };
}

export function noteName(n: Note): string {
  return LETTERS[n.letter] + (n.acc > 0 ? '#'.repeat(n.acc) : 'b'.repeat(-n.acc));
}

/** Pretty name with real accidental glyphs. */
export function pretty(s: string): string {
  return s.replace(/#/g, '♯').replace(/([A-G])b/g, '$1♭').replace(/♭b/g, '♭♭')
    .replace(/^b(?=[IiVv1-9])/, '♭').replace(/\/b(?=[IiVv])/, '/♭');
}

export const pc = (n: Note) => mod(LETTER_PC[n.letter] + n.acc, 12);
export const midiToPc = (m: number) => mod(m, 12);

export function noteToMidi(n: Note, octave: number): number {
  return 12 * (octave + 1) + LETTER_PC[n.letter] + n.acc;
}

/** Frequency in Hz for a MIDI note number. */
export const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// ---------- Intervals ----------

export interface Interval { num: number; semis: number }

// Interval ids: P1 m2 M2 A2 m3 M3 P4 A4 d5 P5 A5 m6 M6 d7 m7 M7 P8 ...
const MAJOR_SEMIS = [0, 2, 4, 5, 7, 9, 11];
const PERFECT = new Set([1, 4, 5]);

export function parseInterval(id: string): Interval {
  const q = id[0];
  const num = parseInt(id.slice(1), 10);
  const simple = mod(num - 1, 7) + 1;
  const base = MAJOR_SEMIS[simple - 1] + 12 * Math.floor((num - 1) / 7);
  const perfect = PERFECT.has(simple);
  let delta: number;
  switch (q) {
    case 'P': delta = 0; break;
    case 'M': delta = 0; break;
    case 'm': delta = -1; break;
    case 'A': delta = 1; break;
    case 'd': delta = perfect ? -1 : -2; break;
    default: throw new Error(`Bad interval: ${id}`);
  }
  return { num, semis: base + delta };
}

export function transposeBy(n: Note, iv: Interval): Note {
  const letter = mod(n.letter + iv.num - 1, 7);
  const target = mod(pc(n) + iv.semis, 12);
  let acc = target - LETTER_PC[letter];
  if (acc > 6) acc -= 12;
  if (acc < -6) acc += 12;
  return { letter, acc };
}

export const transpose = (n: Note, id: string) => transposeBy(n, parseInterval(id));

/** Name of the ascending interval from a up to b (within an octave). */
export function intervalName(a: Note, b: Note): string {
  const num = mod(b.letter - a.letter, 7) + 1;
  let semis = mod(pc(b) - pc(a), 12);
  const base = MAJOR_SEMIS[num - 1];
  let d = semis - base;
  if (d > 6) d -= 12;
  if (d < -6) d += 12;
  const perfect = PERFECT.has(num);
  let q: string;
  if (perfect) q = d === 0 ? 'P' : d > 0 ? 'A' : 'd';
  else q = d === 0 ? 'M' : d === -1 ? 'm' : d > 0 ? 'A' : 'd';
  return q + num;
}

/** The 13 common intervals by semitone count, as used in lesson 1.1. */
export const SIMPLE_INTERVALS = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];

// ---------- Degrees, scales ----------

/** Degree string like "b3", "#4", "7", "bb7", "9" → interval above the root. */
export function degreeInterval(deg: string): Interval {
  const m = /^([b#]*)(\d+)$/.exec(deg);
  if (!m) throw new Error(`Bad degree: ${deg}`);
  const num = parseInt(m[2], 10);
  const simple = mod(num - 1, 7);
  let semis = MAJOR_SEMIS[simple] + 12 * Math.floor((num - 1) / 7);
  for (const ch of m[1]) semis += ch === '#' ? 1 : -1;
  return { num, semis };
}

export const SCALES: Record<string, string[]> = {
  major: ['1', '2', '3', '4', '5', '6', '7'],
  naturalMinor: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
  harmonicMinor: ['1', '2', 'b3', '4', '5', 'b6', '7'],
  melodicMinor: ['1', '2', 'b3', '4', '5', '6', '7'],
  minorPentatonic: ['1', 'b3', '4', '5', 'b7'],
  majorPentatonic: ['1', '2', '3', '5', '6'],
  blues: ['1', 'b3', '4', 'b5', '5', 'b7'],
  lydian: ['1', '2', '3', '#4', '5', '6', '7'],
  ionian: ['1', '2', '3', '4', '5', '6', '7'],
  mixolydian: ['1', '2', '3', '4', '5', '6', 'b7'],
  dorian: ['1', '2', 'b3', '4', '5', '6', 'b7'],
  aeolian: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
  phrygian: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'],
  locrian: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'],
  phrygianDominant: ['1', 'b2', '3', '4', '5', 'b6', 'b7'],
};

export const MODE_ORDER = ['lydian', 'ionian', 'mixolydian', 'dorian', 'aeolian', 'phrygian', 'locrian'];

export const fromDegrees = (root: Note, degs: string[]) => degs.map(d => transposeBy(root, degreeInterval(d)));
export const scaleNotes = (root: Note, id: string) => fromDegrees(root, SCALES[id]);

// ---------- Chords ----------

export interface ChordType { suffix: string; degrees: string[] }

export const CHORDS: Record<string, ChordType> = {
  maj: { suffix: '', degrees: ['1', '3', '5'] },
  min: { suffix: 'm', degrees: ['1', 'b3', '5'] },
  dim: { suffix: 'dim', degrees: ['1', 'b3', 'b5'] },
  aug: { suffix: 'aug', degrees: ['1', '3', '#5'] },
  '5': { suffix: '5', degrees: ['1', '5'] },
  sus2: { suffix: 'sus2', degrees: ['1', '2', '5'] },
  sus4: { suffix: 'sus4', degrees: ['1', '4', '5'] },
  add9: { suffix: 'add9', degrees: ['1', '3', '5', '9'] },
  madd9: { suffix: 'm(add9)', degrees: ['1', 'b3', '5', '9'] },
  maj7: { suffix: 'maj7', degrees: ['1', '3', '5', '7'] },
  '7': { suffix: '7', degrees: ['1', '3', '5', 'b7'] },
  m7: { suffix: 'm7', degrees: ['1', 'b3', '5', 'b7'] },
  m7b5: { suffix: 'm7b5', degrees: ['1', 'b3', 'b5', 'b7'] },
  dim7: { suffix: 'dim7', degrees: ['1', 'b3', 'b5', 'bb7'] },
  mMaj7: { suffix: 'm(maj7)', degrees: ['1', 'b3', '5', '7'] },
  '7sus4': { suffix: '7sus4', degrees: ['1', '4', '5', 'b7'] },
  m9: { suffix: 'm9', degrees: ['1', 'b3', '5', 'b7', '9'] },
  '9': { suffix: '9', degrees: ['1', '3', '5', 'b7', '9'] },
};

export const chordNotes = (root: Note, id: string) => fromDegrees(root, CHORDS[id].degrees);
export const chordSymbol = (root: Note, id: string) => noteName(root) + CHORDS[id].suffix;

/** Close-position ascending MIDI voicing with the root in the given octave. */
export function chordMidi(notes: Note[], octave: number, inversion = 0): number[] {
  const out: number[] = [];
  let prev = -Infinity;
  notes.forEach((n, i) => {
    let m = noteToMidi(n, octave);
    if (i === 0) { while (pc(n) !== mod(m, 12)) m++; }
    while (m <= prev) m += 12;
    out.push(m);
    prev = m;
  });
  for (let i = 0; i < inversion && i < out.length; i++) out.push(out.shift()! + 12);
  return out;
}

export interface KeyChord { numeral: string; symbol: string; root: Note; type: string; notes: Note[] }

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

function stackType(scale: Note[], i: number, sevenths: boolean): string {
  const r = scale[i], third = scale[(i + 2) % 7], fifth = scale[(i + 4) % 7], sev = scale[(i + 6) % 7];
  const t = mod(pc(third) - pc(r), 12), f = mod(pc(fifth) - pc(r), 12), s = mod(pc(sev) - pc(r), 12);
  if (!sevenths) {
    if (t === 4 && f === 7) return 'maj';
    if (t === 3 && f === 7) return 'min';
    if (t === 3 && f === 6) return 'dim';
    return 'aug';
  }
  if (t === 4 && f === 7) return s === 11 ? 'maj7' : '7';
  if (t === 3 && f === 7) return s === 10 ? 'm7' : 'mMaj7';
  if (t === 3 && f === 6) return s === 10 ? 'm7b5' : 'dim7';
  return 'aug';
}

function numeralFor(degIndex: number, accFromMajor: number, type: string): string {
  const upper = ['maj', 'aug', 'maj7', '7'].includes(type);
  let r = upper ? ROMAN[degIndex] : ROMAN[degIndex].toLowerCase();
  if (type === 'dim') r += '°';
  else if (type === 'm7b5') r += 'ø7';
  else if (type === 'dim7') r += '°7';
  else if (type === 'aug') r += '+';
  else if (type === 'maj7') r += 'maj7';
  else if (type === '7' || type === 'm7') r += '7';
  return (accFromMajor < 0 ? 'b'.repeat(-accFromMajor) : '#'.repeat(accFromMajor)) + r;
}

/** Diatonic chords of a major or natural-minor key. Numerals are relative to the major scale (bIII, bVI, bVII). */
export function diatonicChords(tonic: Note, mode: 'major' | 'minor', sevenths = false): KeyChord[] {
  const scale = scaleNotes(tonic, mode === 'major' ? 'major' : 'naturalMinor');
  const majorRef = scaleNotes(tonic, 'major');
  return scale.map((root, i) => {
    const type = stackType(scale, i, sevenths);
    let d = pc(root) - pc(majorRef[i]);
    if (d > 6) d -= 12; if (d < -6) d += 12;
    return { numeral: numeralFor(i, d, type), symbol: chordSymbol(root, type), root, type, notes: chordNotes(root, type) };
  });
}

/**
 * Roman numeral → chord in a key. Numerals are measured against the major scale of the tonic:
 * bVII, bVI, bIII, iv, V7/vi, iiø, vii°, Imaj7, Isus4, I5, Iadd9.
 */
export function romanToChord(numeral: string, tonic: Note): KeyChord {
  const [main, target] = numeral.split('/');
  let base = tonic;
  if (target) base = romanToChord(target, tonic).root;
  const m = /^([b#♭♯]*)([IiVv]+)(.*)$/.exec(main.trim());
  if (!m) throw new Error(`Bad numeral: ${numeral}`);
  const accStr = m[1].replace(/♭/g, 'b').replace(/♯/g, '#');
  const idx = ROMAN.indexOf(m[2].toUpperCase());
  if (idx < 0) throw new Error(`Bad numeral: ${numeral}`);
  const upper = m[2] === m[2].toUpperCase();
  const suffix = m[3];
  const root = transposeBy(base, degreeInterval(accStr + (idx + 1)));
  let type: string;
  switch (suffix) {
    case '': type = upper ? 'maj' : 'min'; break;
    case '°': case 'dim': type = 'dim'; break;
    case '°7': case 'dim7': type = 'dim7'; break;
    case 'ø': case 'ø7': case 'm7b5': type = 'm7b5'; break;
    case '+': case 'aug': type = 'aug'; break;
    case '7': type = upper ? '7' : 'm7'; break;
    case 'maj7': type = upper ? 'maj7' : 'mMaj7'; break;
    case '9': type = upper ? '9' : 'm9'; break;
    case 'add9': type = upper ? 'add9' : 'madd9'; break;
    case 'sus2': type = 'sus2'; break;
    case 'sus4': type = 'sus4'; break;
    case '7sus4': type = '7sus4'; break;
    case '5': type = '5'; break;
    default: throw new Error(`Bad numeral suffix: ${numeral}`);
  }
  return { numeral, symbol: chordSymbol(root, type), root, type, notes: chordNotes(root, type) };
}

// ---------- Keys ----------

/** Number of sharps (+) or flats (−) in a major key. */
export function keySignature(tonic: Note): number {
  const scale = scaleNotes(tonic, 'major');
  return scale.reduce((sum, n) => sum + n.acc, 0);
}

export const relativeMinor = (majorTonic: Note) => transpose(majorTonic, 'M6');

export const CIRCLE_MAJOR = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
export const ROOTS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// ---------- Fretboard ----------

/** Open-string MIDI numbers, index 0 = 6th (lowest) string. */
export const TUNINGS: Record<string, number[]> = {
  standard: [40, 45, 50, 55, 59, 64],
  dropD: [38, 45, 50, 55, 59, 64],
};

export const fretMidi = (tuning: number[], stringIndex: number, fret: number) => tuning[stringIndex] + fret;

/** Map a set of spelled notes (with their degree labels) by pitch class. */
export function pcMap(notes: Note[], labels: string[]): Map<number, { name: string; label: string; index: number }> {
  const map = new Map<number, { name: string; label: string; index: number }>();
  notes.forEach((n, i) => map.set(pc(n), { name: noteName(n), label: labels[i], index: i }));
  return map;
}
