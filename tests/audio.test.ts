import { describe, expect, it } from 'vitest';
import { nearestSample } from '../src/lib/audio';
import manifestJson from '../src/data/samples.json';

const manifest: Record<string, (number | string)[]> = manifestJson;
import { detectHz, hitId, measureCents, midiToHz, noteToMidi } from '../scripts/build-samples.mjs';

// Converted sample files on disk, keyed by path.
const sampleFiles = import.meta.glob('../public/samples/**/*.mp3', { query: '?url', import: 'default' });

describe('samples', () => {
  it('has a file for every sample in the manifest', () => {
    for (const [set, ids] of Object.entries(manifest)) {
      expect(ids.length).toBeGreaterThan(0);
      if (set === 'drums') expect(ids.every(id => typeof id === 'string')).toBe(true);
      else {
        expect(ids.every(id => typeof id === 'number')).toBe(true);
        expect([...(ids as number[])].sort((a, b) => a - b)).toEqual(ids);
      }
      for (const id of ids) expect(sampleFiles, `${set}/${id}.mp3`).toHaveProperty([`../public/samples/${set}/${id}.mp3`]);
    }
  });

  it('names drum hits by the ids the drum player uses', () => {
    expect(hitId('drums', 'kick')).toBe('kick');
    expect(hitId('drums', 'Snare')).toBe('snare');
    expect(hitId('drums', 'closed-hat')).toBe('hat');
    expect(hitId('drums', 'hi-hat')).toBe('hat');
    expect(hitId('drums', 'crash')).toBeNull();
    expect(hitId('clean', 'kick')).toBeNull();
    for (const id of manifest.drums ?? []) expect(['kick', 'snare', 'hat']).toContain(id);
  });

  it('covers the range the bass line plays', () => {
    // progressions play the bass root at MIDI 36-47 (rootMidi(root, 36)); keep every note within 2 semitones of a sample
    const bass = manifest.bass?.filter((id): id is number => typeof id === 'number');
    if (!bass) return;
    for (let midi = 36; midi <= 47; midi++) expect(Math.abs(nearestSample(bass, midi).base - midi), `MIDI ${midi}`).toBeLessThanOrEqual(2);
  });

  it('reads note names from sample file names', () => {
    expect(noteToMidi('E2')).toBe(40);
    expect(noteToMidi('F#2')).toBe(42);
    expect(noteToMidi('Fs2')).toBe(42);
    expect(noteToMidi('Bb3')).toBe(58);
    expect(noteToMidi('E#4')).toBe(65);
    expect(noteToMidi('A4')).toBe(69);
    expect(noteToMidi('kick')).toBeNull();
  });

  it('measures how far a recording is from its note', () => {
    const sr = 48000;
    for (const [midi, cents] of [[40, 6.2], [53, -4], [65, 0]]) {
      const hz = midiToHz(midi) * Math.pow(2, cents / 1200);
      // a decaying tone with a few harmonics, like a plucked string
      const x = Float32Array.from({ length: sr }, (_, i) => {
        const ph = 2 * Math.PI * hz * i / sr;
        return Math.exp(-i / sr) * (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.25 * Math.sin(3 * ph));
      });
      const found = detectHz(x, sr, midiToHz(midi), 4800, 19200);
      expect(found).not.toBeNull();
      expect(1200 * Math.log2(found! / midiToHz(midi))).toBeCloseTo(cents, 1);
    }
  });

  it('retunes small errors but not a recording that is a different note', () => {
    const sr = 48000;
    const tone = (hz: number) => Float32Array.from({ length: 2 * sr }, (_, i) => {
      const ph = 2 * Math.PI * hz * i / sr;
      return Math.exp(-i / sr) * (Math.sin(ph) + 0.5 * Math.sin(2 * ph));
    });
    const sharp = measureCents(tone(midiToHz(45) * Math.pow(2, 12 / 1200)), 0, 45);
    expect(sharp.ok).toBe(true);
    expect(sharp.cents).toBeCloseTo(12, 0);
    // named A2 but sounds B2: two semitones out, so it is flagged and left alone
    expect(measureCents(tone(midiToHz(47)), 0, 45)).toEqual({ cents: 0, ok: false });
  });

  it('picks the nearest recorded note and the rate that shifts it', () => {
    const midis = [40, 42, 44, 47];
    expect(nearestSample(midis, 42)).toEqual({ base: 42, rate: 1 });
    expect(nearestSample(midis, 45).base).toBe(44);
    expect(nearestSample(midis, 45).rate).toBeCloseTo(Math.pow(2, 1 / 12), 10);
    expect(nearestSample(midis, 38).base).toBe(40);
    expect(nearestSample(midis, 38).rate).toBeCloseTo(Math.pow(2, -2 / 12), 10);
    expect(nearestSample(midis, 59).rate).toBeCloseTo(2, 10);
  });
});
