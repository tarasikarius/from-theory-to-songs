// Converts raw recordings in samples-src/<set>/<Note>.wav into web-ready files:
// public/samples/<set>/<midi>.mp3 plus the manifest src/data/samples.json.
// Each file is trimmed to its attack, tuned to the note in its name, levelled to a common loudness,
// faded out and encoded as mono MP3.
// Drum hits (samples-src/drums/kick.wav, snare.wav, closed-hat.wav; see HIT_SETS) become
// public/samples/drums/<id>.mp3: trimmed and levelled, never retuned.
// Needs ffmpeg on PATH. Run: npm run samples
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'samples-src');
const OUT = join(root, 'public', 'samples');
const MANIFEST = join(root, 'src', 'data', 'samples.json');

const SR = 48000;
const TARGET_RMS_DB = -20; // loudness of the first second after the attack
const PEAK_CEILING_DB = -6; // percussive notes (piano) would otherwise clip when several sound together
const SILENT_DB = -70; // a file quieter than this is treated as empty
const PRE_ROLL = 0.004; // keep a few ms before the attack
const FADE_OUT = 0.3;

const HIT_PEAK_DB = -6; // drum hits are levelled by peak; audio.ts balances them against each other
const HIT_TAIL_DB = -60; // a hit ends where it has fallen this far below its peak
const HIT_FADE = 0.05;

/** Folders of unpitched hits, and the file names each hit may have. These are never retuned. */
export const HIT_SETS = {
  drums: { kick: ['kick'], snare: ['snare'], hat: ['closed-hat', 'hat', 'hihat', 'hi-hat'] },
};

/** 'closed-hat' → 'hat' in the drums folder. Returns null for a name the folder does not use. */
export function hitId(set, name) {
  const ids = HIT_SETS[set];
  if (!ids) return null;
  const n = name.toLowerCase();
  for (const [id, names] of Object.entries(ids)) if (names.includes(n)) return id;
  return null;
}

const STEPS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** 'E2' → 40, 'F#2' or 'Fs2' → 42, 'Bb3' → 58, 'E#4' → 65. Returns null for other names. */
export function noteToMidi(name) {
  const m = /^([A-Ga-g])(#|s|b)?(-?\d)$/.exec(name);
  if (!m) return null;
  const acc = m[2] === 'b' ? -1 : m[2] ? 1 : 0;
  return (parseInt(m[3], 10) + 1) * 12 + STEPS[m[1].toUpperCase()] + acc;
}

export const midiToHz = midi => 440 * Math.pow(2, (midi - 69) / 12);

/**
 * Pitch of a steady tone in x[from .. from+len), searched within ±3% (about half a semitone) of `expected` Hz.
 * Correlates the signal with itself one period later, then 4, 16, ... periods later (up to about 80 ms),
 * each step narrowing the answer; the last step resolves well under one cent.
 */
export function detectHz(x, sr, expected, from, len) {
  const target = Math.max(4, Math.floor(0.08 * expected));
  const maxLag = Math.ceil(target * sr / expected * 1.04);
  const n = Math.min(len, x.length - from) - maxLag - 1;
  if (n < sr * 0.05) return null;
  const corr = lag => {
    let ab = 0, aa = 0, bb = 0;
    for (let i = from; i < from + n; i++) { const a = x[i], b = x[i + lag]; ab += a * b; aa += a * a; bb += b * b; }
    return ab / Math.sqrt(aa * bb || 1);
  };
  /** Best lag (fractional) between lo and hi samples. */
  const peakLag = (lo, hi) => {
    let best = -Infinity, bestLag = lo;
    const c = [];
    for (let lag = lo - 1; lag <= hi + 1; lag++) { c[lag] = corr(lag); if (lag >= lo && lag <= hi && c[lag] > best) { best = c[lag]; bestLag = lag; } }
    const y0 = c[bestLag - 1], y1 = c[bestLag], y2 = c[bestLag + 1];
    const denom = y0 - 2 * y1 + y2;
    return bestLag + (denom ? (y0 - y2) / (2 * denom) : 0);
  };
  let periods = 1;
  let period = peakLag(Math.max(2, Math.floor(sr / expected * 0.97)), Math.ceil(sr / expected * 1.03));
  while (periods < target) {
    periods = Math.min(periods * 4, target);
    // stay within a third of a period of the prediction, so a neighbouring period can't be picked
    period = peakLag(Math.floor(periods * period - period * 0.35), Math.ceil(periods * period + period * 0.35)) / periods;
  }
  return sr / period;
}

/** How strongly the signal repeats at the period of `hz` (0..1), just after the attack. */
function periodicity(x, onset, hz) {
  const from = onset + Math.floor(0.1 * SR), n = Math.floor(0.25 * SR);
  const centre = SR / hz;
  let best = 0;
  for (let lag = Math.floor(centre * 0.97); lag <= Math.ceil(centre * 1.03); lag++) {
    if (from + n + lag >= x.length) break;
    let ab = 0, aa = 0, bb = 0;
    for (let i = from; i < from + n; i++) { const a = x[i], b = x[i + lag]; ab += a * b; aa += a * a; bb += b * b; }
    best = Math.max(best, ab / Math.sqrt(aa * bb || 1));
  }
  return best;
}

/**
 * Octaves between the file's name and what it actually sounds like (0 when the name is right).
 * DAWs disagree on octave numbers: Logic calls middle C "C3", most others "C4".
 * A tone repeats at its own period and at every multiple of it, so the true octave is the highest one
 * at which the signal still repeats strongly.
 */
export function octaveOffset(x, onset, midi) {
  const scores = [-1, 0, 1, 2].map(o => ({ o, c: periodicity(x, onset, midiToHz(midi + 12 * o)) }));
  const top = Math.max(...scores.map(s => s.c));
  return scores.filter(s => s.c >= 0.9 * top).pop().o;
}

/**
 * How far the recording is from its named note, in cents: the median over the first second of sustain.
 * detectHz only searches about half a semitone either side of the name, so a reading further out than
 * that is noise or a different note. When most readings are like that, `ok` is false and nothing is retuned.
 */
export function measureCents(x, onset, midi) {
  const expected = midiToHz(midi);
  const found = [];
  for (const at of [0.15, 0.35, 0.55, 0.75, 0.95]) {
    const hz = detectHz(x, SR, expected, onset + Math.floor(at * SR), Math.floor(0.4 * SR));
    if (hz && Number.isFinite(hz) && hz > 0) found.push(1200 * Math.log2(hz / expected));
  }
  const near = found.filter(c => Math.abs(c) <= 60).sort((a, b) => a - b);
  if (!near.length || near.length * 2 < found.length) return { cents: 0, ok: false };
  return { cents: near[Math.floor(near.length / 2)], ok: true };
}

const db = x => 20 * Math.log10(Math.max(x, 1e-9));
const lin = d => Math.pow(10, d / 20);

function decode(file) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 29 });
  return new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.byteLength / 4));
}

/** Decode a recording and find its level and attack. */
function analyse(file) {
  const x = decode(file);
  let peak = 0;
  for (const v of x) peak = Math.max(peak, Math.abs(v));
  let onset = 0;
  while (onset < x.length && Math.abs(x[onset]) < peak * 0.05) onset++;
  return { x, peak, onset };
}

function convert(file, out, midi, { x, peak, onset }) {
  const start = Math.max(0, onset / SR - PRE_ROLL);
  const a = onset, b = Math.min(x.length, onset + SR);
  let sum = 0;
  for (let i = a; i < b; i++) sum += x[i] * x[i];
  const rms = Math.sqrt(sum / Math.max(b - a, 1));
  const gain = Math.min(lin(TARGET_RMS_DB) / rms, lin(PEAK_CEILING_DB) / peak);
  // retune by resampling: play the recording slightly faster or slower so it lands on the named note
  const { cents, ok } = measureCents(x, onset, midi);
  const ratio = Math.pow(2, -cents / 1200);
  const dur = (x.length / SR - start) / ratio;
  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-i', file,
    '-af', [
      `aresample=${SR}`, `atrim=start=${start.toFixed(4)}`, 'asetpts=PTS-STARTPTS',
      `asetrate=${(SR * ratio).toFixed(3)}`, `aresample=${SR}`,
      `volume=${gain.toFixed(4)}`, `afade=t=out:st=${(dur - FADE_OUT).toFixed(3)}:d=${FADE_OUT}`,
    ].join(','),
    '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '96k', out,
  ]);
  return { dur, cents, ok, gainDb: db(gain), peakDb: db(peak * gain) };
}

/** Drum hit: trimmed to its attack and to where it has died away, levelled by peak. No retuning. */
function convertHit(file, out, { x, peak, onset }) {
  const start = Math.max(0, onset / SR - PRE_ROLL);
  let end = x.length;
  const floor = peak * lin(HIT_TAIL_DB);
  while (end > onset && Math.abs(x[end - 1]) < floor) end--;
  const dur = Math.min(x.length / SR, end / SR + HIT_FADE) - start;
  const gain = lin(HIT_PEAK_DB) / peak;
  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-i', file,
    '-af', [
      `aresample=${SR}`, `atrim=start=${start.toFixed(4)}:duration=${dur.toFixed(4)}`, 'asetpts=PTS-STARTPTS',
      `volume=${gain.toFixed(4)}`, `afade=t=out:st=${Math.max(0, dur - HIT_FADE).toFixed(3)}:d=${HIT_FADE}`,
    ].join(','),
    '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '96k', out,
  ]);
  return { dur, gainDb: db(gain) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!existsSync(SRC)) { console.error(`No ${SRC} folder.`); process.exit(1); }
  const manifest = {};
  for (const set of readdirSync(SRC, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort()) {
    const files = readdirSync(join(SRC, set)).filter(f => /\.(wav|aiff?|flac)$/i.test(f));
    if (!files.length) continue;
    const outDir = join(OUT, set);
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    if (HIT_SETS[set]) {
      const ids = [];
      for (const f of files) {
        const id = hitId(set, f.replace(/\.[^.]+$/, ''));
        if (!id) { console.warn(`  skipped ${set}/${f}: use one of ${Object.values(HIT_SETS[set]).map(n => n[0]).join(', ')}`); continue; }
        if (ids.includes(id)) { console.warn(`  skipped ${set}/${f}: another file is already the ${id}`); continue; }
        const a = analyse(join(SRC, set, f));
        if (db(a.peak) < SILENT_DB) { console.warn(`  skipped ${set}/${f}: the file is silent`); continue; }
        const r = convertHit(join(SRC, set, f), join(outDir, `${id}.mp3`), a);
        ids.push(id);
        console.log(`  ${set}/${f} → ${id}.mp3  ${r.dur.toFixed(2)} s  gain ${r.gainDb.toFixed(1)} dB`);
      }
      if (ids.length) manifest[set] = ids.sort();
      continue;
    }
    const takes = [];
    for (const f of files) {
      // a trailing ".1" (Logic's or Finder's copy number, as in G2.1.wav) is ignored
      const named = noteToMidi(f.replace(/\.[^.]+$/, '').replace(/\.\d+$/, ''));
      if (named == null) { console.warn(`  skipped ${set}/${f}: name is not a note like E2, F#2 or Bb3`); continue; }
      const twin = takes.find(k => k.named === named);
      if (twin) { console.warn(`  skipped ${set}/${f}: ${twin.f} is already that note`); continue; }
      const a = analyse(join(SRC, set, f));
      if (db(a.peak) < SILENT_DB) { console.warn(`  skipped ${set}/${f}: the file is silent`); continue; }
      takes.push({ f, named, a, octave: octaveOffset(a.x, a.onset, named) });
    }
    // one naming convention per folder: go with what most files say
    const votes = takes.map(k => k.octave).sort((p, q) => p - q);
    const octave = votes.length ? votes[Math.floor(votes.length / 2)] : 0;
    if (octave) console.log(`  ${set}: recordings sound ${Math.abs(octave)} octave(s) ${octave > 0 ? 'above' : 'below'} their file names; using what they sound like`);
    for (const k of takes) if (k.octave !== octave) {
      const d = k.octave - octave;
      console.warn(`  check ${set}/${k.f}: it seems to sound ${Math.abs(d)} octave(s) ${d > 0 ? 'higher' : 'lower'} than the rest of the folder suggests; is the name right?`);
    }
    const midis = [];
    for (const { f, named, a } of takes) {
      const midi = named + 12 * octave;
      const r = convert(join(SRC, set, f), join(outDir, `${midi}.mp3`), midi, a);
      midis.push(midi);
      if (!r.ok) console.warn(`  check ${set}/${f}: its pitch does not match its name (or could not be measured); it was not retuned. Is the name right?`);
      console.log(`  ${set}/${f} → ${midi}.mp3  ${r.dur.toFixed(2)} s  was ${r.cents >= 0 ? '+' : ''}${r.cents.toFixed(1)} cents  gain ${r.gainDb.toFixed(1)} dB  peak ${r.peakDb.toFixed(1)} dB`);
    }
    if (midis.length) manifest[set] = midis.sort((p, q) => p - q);
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Wrote ${MANIFEST}`);
}
