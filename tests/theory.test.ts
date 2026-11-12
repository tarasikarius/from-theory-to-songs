import { describe, it, expect } from 'vitest';
import {
  parseNote, noteName, pc, transpose, intervalName, scaleNotes, chordNotes,
  diatonicChords, romanToChord, noteToMidi, fretMidi, TUNINGS, midiToPc,
  chordMidi, keySignature, relativeMinor, keyCoreChords, CIRCLE_MAJOR,
} from '../src/lib/theory';

const names = (ns: { letter: number; acc: number }[]) => ns.map(noteName).join(' ');

describe('notes', () => {
  it('parses and names', () => {
    expect(noteName(parseNote('F#'))).toBe('F#');
    expect(noteName(parseNote('Bb'))).toBe('Bb');
    expect(pc(parseNote('Cb'))).toBe(11);
    expect(pc(parseNote('B#'))).toBe(0);
  });
  it('midi', () => {
    expect(noteToMidi(parseNote('C'), 4)).toBe(60);
    expect(noteToMidi(parseNote('A'), 4)).toBe(69);
    expect(midiToPc(64)).toBe(4);
  });
});

describe('intervals', () => {
  it('transposes with correct spelling', () => {
    expect(noteName(transpose(parseNote('C'), 'm3'))).toBe('Eb');
    expect(noteName(transpose(parseNote('C'), 'A2'))).toBe('D#');
    expect(noteName(transpose(parseNote('C'), 'A4'))).toBe('F#');
    expect(noteName(transpose(parseNote('C'), 'd5'))).toBe('Gb');
    expect(noteName(transpose(parseNote('F#'), 'M3'))).toBe('A#');
    expect(noteName(transpose(parseNote('Bb'), 'P5'))).toBe('F');
    expect(noteName(transpose(parseNote('E'), 'M7'))).toBe('D#');
    expect(noteName(transpose(parseNote('C'), 'd7'))).toBe('Bbb');
  });
  it('names interval between spelled notes', () => {
    expect(intervalName(parseNote('C'), parseNote('E'))).toBe('M3');
    expect(intervalName(parseNote('C'), parseNote('Eb'))).toBe('m3');
    expect(intervalName(parseNote('C'), parseNote('D#'))).toBe('A2');
    expect(intervalName(parseNote('F'), parseNote('B'))).toBe('A4');
    expect(intervalName(parseNote('B'), parseNote('F'))).toBe('d5');
    expect(intervalName(parseNote('A'), parseNote('G'))).toBe('m7');
    expect(intervalName(parseNote('E'), parseNote('E'))).toBe('P1');
  });
});

describe('scales', () => {
  it('major and minors', () => {
    expect(names(scaleNotes(parseNote('C'), 'major'))).toBe('C D E F G A B');
    expect(names(scaleNotes(parseNote('A'), 'naturalMinor'))).toBe('A B C D E F G');
    expect(names(scaleNotes(parseNote('A'), 'harmonicMinor'))).toBe('A B C D E F G#');
    expect(names(scaleNotes(parseNote('A'), 'melodicMinor'))).toBe('A B C D E F# G#');
    expect(names(scaleNotes(parseNote('F#'), 'major'))).toBe('F# G# A# B C# D# E#');
    expect(names(scaleNotes(parseNote('Eb'), 'major'))).toBe('Eb F G Ab Bb C D');
  });
  it('pentatonics and blues', () => {
    expect(names(scaleNotes(parseNote('A'), 'minorPentatonic'))).toBe('A C D E G');
    expect(names(scaleNotes(parseNote('C'), 'majorPentatonic'))).toBe('C D E G A');
    expect(names(scaleNotes(parseNote('A'), 'blues'))).toBe('A C D Eb E G');
  });
  it('modes from E', () => {
    expect(names(scaleNotes(parseNote('E'), 'dorian'))).toBe('E F# G A B C# D');
    expect(names(scaleNotes(parseNote('E'), 'phrygian'))).toBe('E F G A B C D');
    expect(names(scaleNotes(parseNote('E'), 'phrygianDominant'))).toBe('E F G# A B C D');
    expect(names(scaleNotes(parseNote('E'), 'lydian'))).toBe('E F# G# A# B C# D#');
    expect(names(scaleNotes(parseNote('D'), 'mixolydian'))).toBe('D E F# G A B C');
    expect(names(scaleNotes(parseNote('E'), 'locrian'))).toBe('E F G A Bb C D');
  });
});

describe('chords', () => {
  it('spells chords', () => {
    expect(names(chordNotes(parseNote('C'), 'maj'))).toBe('C E G');
    expect(names(chordNotes(parseNote('C'), 'dim'))).toBe('C Eb Gb');
    expect(names(chordNotes(parseNote('C'), 'aug'))).toBe('C E G#');
    expect(names(chordNotes(parseNote('G'), '7'))).toBe('G B D F');
    expect(names(chordNotes(parseNote('F#'), 'm7b5'))).toBe('F# A C E');
    expect(names(chordNotes(parseNote('C'), 'dim7'))).toBe('C Eb Gb Bbb');
    expect(names(chordNotes(parseNote('C'), 'add9'))).toBe('C E G D');
    expect(names(chordNotes(parseNote('D'), 'sus4'))).toBe('D G A');
    expect(names(chordNotes(parseNote('E'), '5'))).toBe('E B');
  });
  it('diatonic chords', () => {
    expect(diatonicChords(parseNote('C'), 'major').map(c => c.symbol).join(' '))
      .toBe('C Dm Em F G Am Bdim');
    expect(diatonicChords(parseNote('C'), 'major').map(c => c.numeral).join(' '))
      .toBe('I ii iii IV V vi vii°');
    expect(diatonicChords(parseNote('A'), 'minor').map(c => c.symbol).join(' '))
      .toBe('Am Bdim C Dm Em F G');
    expect(diatonicChords(parseNote('A'), 'minor').map(c => c.numeral).join(' '))
      .toBe('i ii° bIII iv v bVI bVII');
    expect(diatonicChords(parseNote('C'), 'major', true).map(c => c.symbol).join(' '))
      .toBe('Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7b5');
    expect(diatonicChords(parseNote('E'), 'major').map(c => c.symbol).join(' '))
      .toBe('E F#m G#m A B C#m D#dim');
  });
  it('roman numerals', () => {
    const k = parseNote('C');
    expect(romanToChord('I', k).symbol).toBe('C');
    expect(romanToChord('vi', k).symbol).toBe('Am');
    expect(romanToChord('bVII', k).symbol).toBe('Bb');
    expect(romanToChord('iv', k).symbol).toBe('Fm');
    expect(romanToChord('bVI', k).symbol).toBe('Ab');
    expect(romanToChord('V7', k).symbol).toBe('G7');
    expect(romanToChord('ii7', k).symbol).toBe('Dm7');
    expect(romanToChord('Imaj7', k).symbol).toBe('Cmaj7');
    expect(romanToChord('vii°', k).symbol).toBe('Bdim');
    expect(romanToChord('iiø', k).symbol).toBe('Dm7b5');
    expect(romanToChord('V7/vi', k).symbol).toBe('E7');
    expect(romanToChord('V7/ii', k).symbol).toBe('A7');
    expect(romanToChord('V/V', k).symbol).toBe('D');
    expect(romanToChord('Isus4', k).symbol).toBe('Csus4');
    expect(romanToChord('i', parseNote('A')).symbol).toBe('Am');
    expect(romanToChord('bVI', parseNote('A')).symbol).toBe('F');
    expect(romanToChord('V', parseNote('A')).symbol).toBe('E');
    expect(romanToChord('bII', parseNote('E')).symbol).toBe('F');
    expect(romanToChord('I5', parseNote('E')).symbol).toBe('E5');
    expect(names(romanToChord('V7/vi', k).notes)).toBe('E G# B D');
  });
  it('chord midi voicing ascends from root', () => {
    expect(chordMidi(chordNotes(parseNote('G'), '7'), 3)).toEqual([55, 59, 62, 65]);
    expect(chordMidi(chordNotes(parseNote('A'), 'min'), 3)).toEqual([57, 60, 64]);
  });
});

describe('keys', () => {
  it('signatures', () => {
    expect(keySignature(parseNote('C'))).toBe(0);
    expect(keySignature(parseNote('G'))).toBe(1);
    expect(keySignature(parseNote('E'))).toBe(4);
    expect(keySignature(parseNote('F'))).toBe(-1);
    expect(keySignature(parseNote('Eb'))).toBe(-3);
    expect(noteName(relativeMinor(parseNote('C')))).toBe('A');
    expect(noteName(relativeMinor(parseNote('Eb')))).toBe('C');
  });
});

describe('fretboard', () => {
  it('standard tuning', () => {
    // string index 0 = 6th (low E)
    expect(fretMidi(TUNINGS.standard, 0, 5)).toBe(45); // A2
    expect(fretMidi(TUNINGS.standard, 1, 7)).toBe(52); // E3
    expect(fretMidi(TUNINGS.standard, 5, 0)).toBe(64); // E4
    expect(fretMidi(TUNINGS.dropD, 0, 0)).toBe(38);
  });
});

describe('keyCoreChords', () => {
  // Expectations from the approved design board, clockwise from C: [key, IV, V, vi] and [rel. minor, iv, v, bIII].
  const MAJ = ['C F G Am', 'G C D Em', 'D G A Bm', 'A D E F#m', 'E A B C#m', 'B E F# G#m', 'F# B C# D#m',
    'Db Gb Ab Bbm', 'Ab Db Eb Fm', 'Eb Ab Bb Cm', 'Bb Eb F Gm', 'F Bb C Dm'];
  const MIN = ['Am Dm Em C', 'Em Am Bm G', 'Bm Em F#m D', 'F#m Bm C#m A', 'C#m F#m G#m E', 'G#m C#m D#m B',
    'D#m G#m A#m F#', 'Bbm Ebm Fm Db', 'Fm Bbm Cm Ab', 'Cm Fm Gm Eb', 'Gm Cm Dm Bb', 'Dm Gm Am F'];
  it('spells all 24 keys of the circle', () => {
    CIRCLE_MAJOR.forEach((k, i) => {
      const t = parseNote(k);
      expect(keyCoreChords(t, 'major').map(c => c.symbol).join(' ')).toBe(MAJ[i]);
      expect(keyCoreChords(relativeMinor(t), 'minor').map(c => c.symbol).join(' ')).toBe(MIN[i]);
    });
  });
  it('labels the numerals', () => {
    expect(keyCoreChords(parseNote('G'), 'major').map(c => c.numeral).join(' ')).toBe('I IV V vi');
    expect(keyCoreChords(parseNote('E'), 'minor').map(c => c.numeral).join(' ')).toBe('i iv v bIII');
  });
});
