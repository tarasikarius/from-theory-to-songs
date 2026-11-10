// Tiny Web Audio synth: plucked string, keys, drone, metronome click and drum hits. No samples.
import { midiToFreq } from './theory';

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

export interface NoteOpts { when?: number; dur?: number; voice?: Voice; gain?: number }

export function playNote(midi: number, opts: NoteOpts = {}): void {
  const ac = audio();
  const t = Math.max(opts.when ?? ac.currentTime, ac.currentTime) + 0.005;
  const voice = opts.voice ?? 'pluck';
  const dur = opts.dur ?? 1.2;
  const peak = (opts.gain ?? 0.22) * (voice === 'bass' ? 1.4 : 1);
  const freq = midiToFreq(midi);

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

export function drum(kind: Drum, when: number, midi = 40): void {
  const ac = audio();
  const t = Math.max(when, ac.currentTime);
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
