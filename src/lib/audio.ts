// Web Audio engine: recorded samples for the pluck (guitar), keys (piano) and bass voices, the
// kick, snare and hat, and the riff chug (each with a synth fallback until it loads), and a tiny synth
// for pad, drone and metronome click.
import { midiToFreq } from './theory';
import sampleManifest from '../data/samples.json';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function audio(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

const out = () => { audio(); return master!; };
export const now = () => audio().currentTime;

export type Voice = 'pluck' | 'keys' | 'bass' | 'pad';

// ---- Samples -------------------------------------------------------------------------------
// public/samples/<set>/<id>.mp3, listed in src/data/samples.json (both written by scripts/build-samples.mjs).
// Pitched sets are named by MIDI number (clean/40.mp3), the drum kit by hit (drums/kick.mp3).
// A set is used only once every file in it has loaded, so a widget never mixes sample and synth sounds.

type SampleId = number | string;
interface Sample { buffer: AudioBuffer; offset: number }
interface SampleSet { ids: SampleId[]; midis: number[]; samples: Map<SampleId, Sample>; state: 'idle' | 'loading' | 'ready' | 'failed' }

/** Which sample set plays which voice. */
const VOICE_SET: Partial<Record<Voice, string>> = { pluck: 'clean', keys: 'piano', bass: 'bass' };
/** The set that holds drum hits, named by Drum id. */
const DRUM_SET = 'drums';
/**
 * Drum hits are levelled to a -6 dB peak; these set the balance of the kit, close to the synth's
 * (kick 0.9, snare about 0.6, hat 0.16 peak). Set by calculation, not by ear.
 */
const DRUM_GAIN: Record<string, number> = { kick: 1.8, snare: 1.3, hat: 0.35 };
/** The set that holds palm-muted riff notes, and their level (synth chug peaks at 0.35). Set by calculation, not by ear. */
const CHUG_SET = 'chug';
const CHUG_GAIN = 1.7;
/** Samples are levelled to about -20 dB RMS (peaks at most -6 dB); this brings them up to the synth voices. */
const SAMPLE_GAIN = 4;

const sampleSets = new Map<string, SampleSet>(
  Object.entries(sampleManifest as Record<string, SampleId[]>).map(([name, ids]) => [
    name,
    { ids, midis: ids.filter((id): id is number => typeof id === 'number'), samples: new Map(), state: 'idle' },
  ]),
);

async function loadSet(name: string, set: SampleSet): Promise<void> {
  set.state = 'loading';
  try {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    // an offline context can decode before the first user gesture, without starting audio
    const decoder = new OfflineAudioContext(1, 1, 44100);
    await Promise.all(set.ids.map(async id => {
      const res = await fetch(`${base}/samples/${name}/${id}.mp3`);
      if (!res.ok) throw new Error(`sample ${name}/${id}: HTTP ${res.status}`);
      const buffer = await decoder.decodeAudioData(await res.arrayBuffer());
      // skip the encoder's leading padding so the attack starts on time
      const d = buffer.getChannelData(0);
      let peak = 0;
      for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
      let i = 0;
      while (i < d.length && Math.abs(d[i]) < peak * 0.05) i++;
      set.samples.set(id, { buffer, offset: Math.max(0, i / buffer.sampleRate - 0.003) });
    }));
    set.state = 'ready';
  } catch (err) {
    set.state = 'failed'; // the synth keeps playing
    console.warn('Samples not loaded, using the synth:', err);
  }
}

/** Start loading every sample set in the background. Safe to call repeatedly and before any user gesture. */
export function warmSamples(): void {
  if (typeof OfflineAudioContext === 'undefined') return;
  for (const [name, set] of sampleSets) if (set.state === 'idle') void loadSet(name, set);
}

/** True when the voice will play from samples right now. */
export function hasSamples(voice: Voice): boolean {
  const name = VOICE_SET[voice];
  return !!name && sampleSets.get(name)?.state === 'ready';
}

/** Nearest recorded note and the playback rate that shifts it to `midi`. */
export function nearestSample(midis: number[], midi: number): { base: number; rate: number } {
  let base = midis[0];
  for (const m of midis) if (Math.abs(m - midi) < Math.abs(base - midi)) base = m;
  return { base, rate: Math.pow(2, (midi - base) / 12) };
}

/** Start a sample at time t. Returns the nodes and how long it rings, or null if the voice has no loaded samples. */
function startSample(voice: Voice, midi: number, t: number, gain: number): { src: AudioBufferSourceNode; g: GainNode; ring: number } | null {
  const name = VOICE_SET[voice];
  return name ? startFromSet(name, midi, t, gain * SAMPLE_GAIN) : null;
}

/** Start the nearest sample of a pitched set at time t, shifted to `midi`; null if the set has not loaded. */
function startFromSet(name: string, midi: number, t: number, gain: number): { src: AudioBufferSourceNode; g: GainNode; ring: number } | null {
  const set = sampleSets.get(name);
  if (!set || set.state !== 'ready' || !set.midis.length) return null;
  const { base, rate } = nearestSample(set.midis, midi);
  const s = set.samples.get(base)!;
  const ac = audio();
  const src = ac.createBufferSource();
  src.buffer = s.buffer;
  src.playbackRate.value = rate;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t);
  src.connect(g).connect(out());
  src.start(t, s.offset);
  return { src, g, ring: (s.buffer.duration - s.offset) / rate };
}

export interface NoteOpts { when?: number; dur?: number; voice?: Voice; gain?: number }

export function playNote(midi: number, opts: NoteOpts = {}): void {
  const ac = audio();
  const t = Math.max(opts.when ?? ac.currentTime, ac.currentTime) + 0.005;
  const voice = opts.voice ?? 'pluck';
  const dur = opts.dur ?? 1.2;
  const peak = (opts.gain ?? 0.22) * (voice === 'bass' ? 1.4 : 1);
  const freq = midiToFreq(midi);

  const sample = startSample(voice, midi, t, peak);
  if (sample) {
    // the recording decays on its own; damp it at the end of the note
    sample.g.gain.setTargetAtTime(0, t + dur, 0.05);
    sample.src.stop(t + dur + 0.4);
    return;
  }
  warmSamples();

  const g = ac.createGain();
  const f = ac.createBiquadFilter();
  f.type = 'lowpass';
  const o1 = ac.createOscillator();
  const o2 = ac.createOscillator();
  o1.frequency.value = freq;
  o2.frequency.value = freq;
  o2.detune.value = 6;

  if (voice === 'pluck') {
    o1.type = 'sawtooth'; o2.type = 'triangle';
    f.frequency.setValueAtTime(Math.min(freq * 8, 9000), t);
    f.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.5, 300), t + dur * 0.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  } else if (voice === 'keys') {
    o1.type = 'triangle'; o2.type = 'sine';
    f.frequency.setValueAtTime(Math.min(freq * 6, 7000), t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
    g.gain.exponentialRampToValueAtTime(peak * 0.4, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  } else if (voice === 'bass') {
    o1.type = 'triangle'; o2.type = 'sine';
    f.frequency.setValueAtTime(900, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  } else {
    o1.type = 'sawtooth'; o2.type = 'sawtooth';
    f.frequency.setValueAtTime(1400, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak * 0.6, t + 0.15);
    g.gain.setValueAtTime(peak * 0.6, t + Math.max(dur - 0.2, 0.2));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
  }
  o1.connect(f); o2.connect(f); f.connect(g); g.connect(out());
  o1.start(t); o2.start(t);
  o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}

/** How long a held note rings before it has died away. Keys: about 9 s at C3, 5 s at C5. Pluck: about 6 s at low E, 3.5 s at high E. */
export function ringTime(midi: number, voice: 'keys' | 'pluck' = 'keys'): number {
  if (voice === 'pluck') return Math.min(8, Math.max(2.5, 6 * Math.pow(2, -(midi - 40) / 30)));
  return Math.min(12, Math.max(3, 9 * Math.pow(2, -(midi - 48) / 28)));
}

/**
 * Held note (piano key or guitar string): sounds until released, and dies away on its own if held long enough.
 * Returns a release function (the damper); calling it more than once is harmless.
 */
export function holdNote(midi: number, opts: { gain?: number; voice?: 'keys' | 'pluck' } = {}): () => void {
  const ac = audio();
  const t = ac.currentTime + 0.005;
  const voice = opts.voice ?? 'keys';
  const peak = opts.gain ?? (voice === 'pluck' ? 0.22 : 0.24);
  const freq = midiToFreq(midi);

  const sample = startSample(voice, midi, t, peak);
  if (sample) {
    let damped = false;
    return () => {
      if (damped) return;
      damped = true;
      const r = Math.max(ac.currentTime, t + 0.03);
      if (r >= t + sample.ring) return; // already rung out
      sample.g.gain.setTargetAtTime(0, r, 0.04);
      sample.src.stop(r + 0.3);
    };
  }
  warmSamples();
  const ring = ringTime(midi, voice);

  const g = ac.createGain();
  const f = ac.createBiquadFilter();
  f.type = 'lowpass';
  const o1 = ac.createOscillator();
  const o2 = ac.createOscillator();
  o1.frequency.value = freq;
  o2.frequency.value = freq;
  o2.detune.value = 6;
  g.gain.setValueAtTime(0.0001, t);
  if (voice === 'pluck') {
    o1.type = 'sawtooth'; o2.type = 'triangle';
    // bright pick attack, then the string mellows as it rings
    f.frequency.setValueAtTime(Math.min(freq * 8, 9000), t);
    f.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.5, 300), t + ring * 0.4);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    g.gain.exponentialRampToValueAtTime(peak * 0.45, t + 0.35);
  } else {
    o1.type = 'triangle'; o2.type = 'sine';
    f.frequency.setValueAtTime(Math.min(freq * 6, 7000), t);
    f.frequency.exponentialRampToValueAtTime(Math.max(freq * 2, 400), t + ring * 0.5);
    // fast attack, quick drop after the hammer strike, then a long tail
    g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    g.gain.exponentialRampToValueAtTime(peak * 0.5, t + 0.3);
  }
  g.gain.exponentialRampToValueAtTime(0.0001, t + ring);
  o1.connect(f); o2.connect(f); f.connect(g); g.connect(out());
  o1.start(t); o2.start(t);
  o1.stop(t + ring + 0.05); o2.stop(t + ring + 0.05);

  let released = false;
  return () => {
    if (released) return;
    released = true;
    const r = Math.max(ac.currentTime, t + 0.03); // let a very short tap still sound
    if (r >= t + ring) return; // already silent
    if (typeof g.gain.cancelAndHoldAtTime === 'function') g.gain.cancelAndHoldAtTime(r);
    else { g.gain.cancelScheduledValues(r); g.gain.setValueAtTime(g.gain.value, r); }
    g.gain.setTargetAtTime(0, r, 0.04);
    o1.stop(r + 0.3); o2.stop(r + 0.3);
  };
}

export function playChord(midis: number[], opts: NoteOpts & { strum?: number } = {}): void {
  const t = opts.when ?? now();
  const strum = opts.strum ?? 0.025;
  const gain = (opts.gain ?? 0.2) / Math.sqrt(Math.max(midis.length, 1) / 2);
  midis.forEach((m, i) => playNote(m, { ...opts, when: t + i * strum, gain }));
}

export function playSequence(midis: number[], step = 0.32, opts: NoteOpts = {}): number {
  const t = now() + 0.03;
  midis.forEach((m, i) => playNote(m, { ...opts, when: t + i * step, dur: opts.dur ?? Math.max(step * 1.8, 0.6) }));
  return midis.length * step;
}

/** Sustained drone (root + octave + soft fifth). Returns a stop function. */
export function startDrone(midi: number): () => void {
  const ac = audio();
  const g = ac.createGain();
  const f = ac.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 700;
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.linearRampToValueAtTime(0.16, ac.currentTime + 0.4);
  const oscs = [0, 12, 19].map((off, i) => {
    const o = ac.createOscillator();
    o.type = i === 2 ? 'sine' : 'sawtooth';
    o.frequency.value = midiToFreq(midi + off);
    o.detune.value = i * 4;
    const og = ac.createGain();
    og.gain.value = i === 0 ? 1 : i === 1 ? 0.5 : 0.25;
    o.connect(og).connect(f);
    o.start();
    return o;
  });
  f.connect(g).connect(out());
  return () => {
    const t = ac.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0.0001, t + 0.25);
    oscs.forEach(o => o.stop(t + 0.3));
  };
}

export function click(when: number, accent = false, quiet = false): void {
  const ac = audio();
  const t = Math.max(when, ac.currentTime);
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'square';
  o.frequency.value = accent ? 1760 : 1175;
  g.gain.setValueAtTime(quiet ? 0.05 : accent ? 0.3 : 0.18, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g).connect(out());
  o.start(t); o.stop(t + 0.06);
}

let noiseBuf: AudioBuffer | null = null;
function noise(): AudioBuffer {
  const ac = audio();
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

export type Drum = 'kick' | 'snare' | 'hat' | 'chug';

/** Play a recorded drum hit at time t. Returns false when the kit has not loaded or has no such hit. */
function drumSample(kind: Drum, t: number): boolean {
  const set = sampleSets.get(DRUM_SET);
  const s = set?.state === 'ready' ? set.samples.get(kind) : undefined;
  if (!s) return false;
  const ac = audio();
  const src = ac.createBufferSource();
  src.buffer = s.buffer;
  const g = ac.createGain();
  g.gain.value = DRUM_GAIN[kind] ?? 1;
  src.connect(g).connect(out());
  src.start(t, s.offset);
  return true;
}

export function drum(kind: Drum, when: number, midi = 40): void {
  const ac = audio();
  const t = Math.max(when, ac.currentTime);
  if (kind === 'chug' ? startFromSet(CHUG_SET, midi, t, CHUG_GAIN) : drumSample(kind, t)) return;
  warmSamples();
  const g = ac.createGain();
  g.connect(out());
  if (kind === 'kick') {
    const o = ac.createOscillator();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); o.start(t); o.stop(t + 0.25);
  } else if (kind === 'chug') {
    // palm-muted low note: short filtered saw
    const o = ac.createOscillator();
    const f = ac.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 900;
    o.type = 'sawtooth'; o.frequency.value = midiToFreq(midi);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    o.connect(f).connect(g); o.start(t); o.stop(t + 0.15);
  } else {
    const src = ac.createBufferSource();
    src.buffer = noise();
    const f = ac.createBiquadFilter();
    if (kind === 'snare') {
      f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.7;
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      const o = ac.createOscillator();
      const og = ac.createGain();
      o.frequency.value = 190;
      og.gain.setValueAtTime(0.3, t);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      o.connect(og).connect(out()); o.start(t); o.stop(t + 0.1);
    } else {
      f.type = 'highpass'; f.frequency.value = 7000;
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    }
    src.connect(f).connect(g);
    src.start(t); src.stop(t + 0.2);
  }
}

/** Lookahead scheduler: calls onStep(stepIndex, time) for each step; stepDur may change live. */
export function scheduler(stepDur: () => number, onStep: (i: number, t: number) => void): () => void {
  const ac = audio();
  let next = ac.currentTime + 0.08;
  let i = 0;
  const tick = () => {
    while (next < ac.currentTime + 0.12) {
      onStep(i, next);
      next += stepDur();
      i++;
    }
  };
  tick();
  const id = window.setInterval(tick, 25);
  return () => window.clearInterval(id);
}
