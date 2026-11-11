// <ear-trainer> and <quiz-box>
import {
  chordMidi, chordNotes, chordSymbol, diatonicChords, intervalName, keySignature, noteName,
  parseNote, pc, pretty, relativeMinor, romanToChord, scaleNotes, SIMPLE_INTERVALS, simpleInterval, type Note,
} from '../lib/theory';
import { now, playChord, playNote, playSequence } from '../lib/audio';
import { Widget, button, field, h, pick, select, shuffle } from './dom';
import { intervalTarget, rootMidi } from './explorers';
import { voice } from './players';
import { t } from './strings';

/** Interval ids used by the trainers: every simple interval except the unison. */
const EAR_INTERVALS = SIMPLE_INTERVALS.filter(i => i !== 'P1');
const DEFAULT_PROGS = ['I V vi IV', 'I IV V IV', 'I vi IV V', 'vi IV I V', 'i bVII bVI bVII', 'I bVII IV I'];
const KEYS = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb'];

interface EarQ { answer: string; play: () => void }

export class EarTrainer extends Widget {
  build() {
    const mode = this.attr('mode', 'intervals');
    const defaults: Record<string, string[]> = {
      intervals: EAR_INTERVALS, chords: ['maj', 'min', 'dim', 'aug'],
      scales: ['major', 'naturalMinor', 'dorian', 'phrygian', 'mixolydian', 'lydian'], progressions: DEFAULT_PROGS,
    };
    const items = mode === 'progressions'
      ? (this.getAttribute('items')?.split('|').map(x => x.trim()).filter(Boolean) ?? defaults.progressions)
      : this.list('items', defaults[mode]);
    let direction = this.attr('direction', 'up');
    let q: EarQ | null = null;
    let answered = false;
    let right = 0, total = 0;

    const label = (id: string) => mode === 'intervals' ? id
      : mode === 'chords' ? t('c.' + id)
      : mode === 'scales' ? t('s.' + id)
      : pretty(id.split(' ').join(' – ').replace(/b(?=[IViv])/g, '♭'));
    const title = (id: string) => mode === 'intervals' ? t('i.' + id) : '';

    const playItem = (id: string, root: number, rootNote: Note) => {
      if (mode === 'intervals') {
        const pair = [root, root + simpleInterval(id).semis];
        if (direction === 'together') playChord(pair, { voice: 'keys', strum: 0, dur: 1.8 });
        else playSequence(direction === 'down' ? pair.reverse() : pair, 0.55, { voice: 'keys', dur: 1.1 });
      } else if (mode === 'chords') {
        playChord(chordMidi(chordNotes(rootNote, id), 3), { voice: 'keys', dur: 2 });
      } else if (mode === 'scales') {
        const notes = scaleNotes(rootNote, id);
        const midis = notes.map(n => root + ((pc(n) - pc(rootNote) + 12) % 12));
        midis.push(root + 12);
        playSequence(midis, 0.3, { voice: 'pluck' });
      } else {
        const t0 = now() + 0.05;
        id.split(' ').forEach((num, i) => {
          const ch = romanToChord(num, rootNote);
          playNote(rootMidi(ch.root, 36), { when: t0 + i * 1.1, voice: 'bass', dur: 1.05 });
          playChord(voice(ch), { when: t0 + i * 1.1, voice: 'pluck', dur: 1.2 });
        });
      }
    };

    const make = (): EarQ => {
      const answer = pick(items);
      const rootNote = parseNote(pick(mode === 'progressions' ? KEYS : ['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'Eb']));
      const root = mode === 'intervals' ? 48 + Math.floor(Math.random() * 12) : rootMidi(rootNote, 45);
      return { answer, play: () => playItem(answer, root, rootNote) };
    };

    const prompt = h('p', { class: 'w-prompt' }, t({ intervals: 'whatInterval', chords: 'whatChord', scales: 'whatScale', progressions: 'whatProg' }[mode] ?? 'whatInterval'));
    const feedback = h('p', { class: 'w-feedback', 'aria-live': 'polite' }, t('pressPlay'));
    const score = h('span', { class: 'w-score' });
    const answers = h('div', { class: 'w-chips w-answers' });
    const playBtn = button(t('hear'), () => {
      if (!q || answered) newQuestion();
      else q.play();
    }, 'w-primary');

    const drawScore = () => { score.textContent = `${t('score')}: ${right}/${total}`; };
    const newQuestion = () => {
      q = make(); answered = false;
      playBtn.textContent = t('again');
      feedback.textContent = '';
      feedback.className = 'w-feedback';
      answers.querySelectorAll('button').forEach(b => { b.className = 'w-chip'; (b as HTMLButtonElement).disabled = false; });
      q.play();
    };
    for (const id of items) {
      answers.append(h('button', {
        type: 'button', class: 'w-chip', disabled: true, 'data-id': id, title: title(id),
        onClick: (e: Event) => {
          if (!q) return;
          const btn = e.currentTarget as HTMLButtonElement;
          if (answered) { playItem(id, 52, parseNote('E')); return; } // compare freely after answering
          answered = true; total++;
          const ok = id === q.answer;
          if (ok) right++;
          btn.classList.add(ok ? 'is-right' : 'is-wrong');
          answers.querySelector(`[data-id="${CSS.escape(q.answer)}"]`)?.classList.add('is-right');
          feedback.textContent = ok ? t('correct') : `${t('wrong')} ${label(q.answer)}${title(q.answer) ? ` (${title(q.answer)})` : ''}.`;
          feedback.className = 'w-feedback ' + (ok ? 'is-right' : 'is-wrong');
          playBtn.textContent = t('next');
          drawScore();
        },
      }, label(id)));
    }
    drawScore();
    this.append(
      prompt,
      h('div', { class: 'w-controls' },
        mode === 'intervals' && field(t('direction'), select(
          [{ value: 'up', label: t('up') }, { value: 'down', label: t('down') }, { value: 'together', label: t('together') }],
          direction, v => { direction = v; })),
        h('div', { class: 'w-actions' }, playBtn,
          button(t('reset'), () => { right = 0; total = 0; drawScore(); }))),
      answers, feedback, score);
  }
}

interface Quiz { text: string; options: string[]; answer: string }

const QUALITIES = ['maj', 'min', 'dim', 'aug'];
const spell = (ns: Note[]) => ns.map(n => pretty(noteName(n))).join(' ');
const uniq = (arr: string[]) => [...new Set(arr)];

function options(answer: string, pool: string[], n = 4): string[] {
  const others = shuffle(uniq(pool).filter(x => x !== answer)).slice(0, n - 1);
  return shuffle([answer, ...others]);
}

const GENERATORS: Record<string, () => Quiz> = {
  'interval-up': () => {
    const root = parseNote(pick(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb', 'F#']));
    const ivs = EAR_INTERVALS.filter(i => i !== 'TT' && i !== 'P8');
    const iv = pick(ivs);
    const ans = pretty(noteName(intervalTarget(root, iv)));
    const pool = ivs.map(i => pretty(noteName(intervalTarget(root, i))));
    return { text: t('qIntervalUp', { iv: `${t('i.' + iv)} (${iv})`, n: pretty(noteName(root)) }), options: options(ans, pool), answer: ans };
  },
  'interval-name': () => {
    const root = parseNote(pick(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb']));
    const ivs = EAR_INTERVALS.filter(i => i !== 'TT' && i !== 'P8');
    const iv = pick(ivs);
    const target = intervalTarget(root, iv);
    const ans = intervalName(root, target);
    return { text: t('qIntervalName', { a: pretty(noteName(root)), b: pretty(noteName(target)) }), options: options(ans, ivs), answer: ans };
  },
  triad: () => {
    const root = parseNote(pick(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb', 'F#', 'Ab']));
    const q = pick(QUALITIES);
    const ans = spell(chordNotes(root, q));
    return { text: t('qTriad', { c: pretty(chordSymbol(root, q)) }), options: options(ans, QUALITIES.map(x => spell(chordNotes(root, x)))), answer: ans };
  },
  seventh: () => {
    const root = parseNote(pick(['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'Eb']));
    const types = ['maj7', '7', 'm7', 'm7b5', 'mMaj7'];
    const q = pick(types);
    const ans = spell(chordNotes(root, q));
    return { text: t('qTriad', { c: pretty(chordSymbol(root, q)) }), options: options(ans, types.map(x => spell(chordNotes(root, x)))), answer: ans };
  },
  diatonic: () => {
    const k = pick(KEYS);
    const chords = diatonicChords(parseNote(k), 'major');
    const ch = pick(chords);
    return { text: t('qDiatonic', { k: `${pretty(k)} ${t('major')}`, num: ch.numeral }), options: options(pretty(ch.symbol), chords.map(c => pretty(c.symbol))), answer: pretty(ch.symbol) };
  },
  'diatonic-minor': () => {
    const k = pick(['A', 'E', 'B', 'F#', 'D', 'G', 'C']);
    const chords = diatonicChords(parseNote(k), 'minor');
    const ch = pick(chords);
    return { text: t('qDiatonic', { k: `${pretty(k)} ${t('minor')}`, num: pretty(ch.numeral) }), options: options(pretty(ch.symbol), chords.map(c => pretty(c.symbol))), answer: pretty(ch.symbol) };
  },
  numeral: () => {
    const k = pick(KEYS);
    const chords = diatonicChords(parseNote(k), 'major');
    const ch = pick(chords);
    return { text: t('qNumeral', { k: `${pretty(k)} ${t('major')}`, c: pretty(ch.symbol) }), options: options(ch.numeral, chords.map(c => c.numeral)), answer: ch.numeral };
  },
  degree: () => {
    const k = pick(KEYS);
    const scale = scaleNotes(parseNote(k), 'major');
    const d = 1 + Math.floor(Math.random() * 6) + 1;
    const ans = pretty(noteName(scale[d - 1]));
    return { text: t('qDegree', { k: pretty(k), d }), options: options(ans, scale.map(n => pretty(noteName(n)))), answer: ans };
  },
  keysig: () => {
    const k = pick(['C', 'G', 'D', 'A', 'E', 'B', 'F', 'Bb', 'Eb', 'Ab']);
    const fmt = (n: number) => n === 0 ? t('none') : n > 0 ? `${n}♯` : `${-n}♭`;
    const ans = fmt(keySignature(parseNote(k)));
    return { text: t('qKeySig', { k: pretty(k) }), options: options(ans, [0, 1, 2, 3, 4, 5, -1, -2, -3, -4].map(fmt)), answer: ans };
  },
  relative: () => {
    const k = pick(['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Ab']);
    const tonic = parseNote(k);
    const ans = pretty(noteName(relativeMinor(tonic))) + 'm';
    const scale = scaleNotes(tonic, 'major');
    return { text: t('qRelative', { k: pretty(k) }), options: options(ans, [1, 2, 3, 5].map(i => pretty(noteName(scale[i])) + 'm')), answer: ans };
  },
  function: () => {
    const map: Record<string, string> = { I: 'tonic', vi: 'tonic', IV: 'subdominant', ii: 'subdominant', V: 'dominant', 'vii°': 'dominant' };
    const num = pick(Object.keys(map));
    return { text: t('qFunction', { num }), options: [t('tonic'), t('subdominant'), t('dominant')], answer: t(map[num]) };
  },
  signature: () => {
    const map: Record<string, string> = { lydian: '♯4', mixolydian: '♭7', dorian: '6', phrygian: '♭2' };
    const m = pick(Object.keys(map));
    return { text: t('qSignature', { m: t('s.' + m) }), options: shuffle(Object.values(map)), answer: map[m] };
  },
  'scale-notes': () => {
    const root = parseNote(pick(['A', 'E', 'D', 'G', 'C', 'B']));
    const ids = ['naturalMinor', 'harmonicMinor', 'dorian', 'phrygian', 'minorPentatonic'];
    const id = pick(ids);
    const ans = spell(scaleNotes(root, id));
    return { text: t('qTriad', { c: `${pretty(noteName(root))} ${t('s.' + id)}` }), options: options(ans, ids.map(x => spell(scaleNotes(root, x)))), answer: ans };
  },
};

export class QuizBox extends Widget {
  build() {
    const types = this.list('types', ['interval-up']).filter(x => x in GENERATORS);
    let q: Quiz;
    let done = false;
    let right = 0, total = 0;
    const text = h('p', { class: 'w-prompt' });
    const opts = h('div', { class: 'w-chips w-answers' });
    const feedback = h('p', { class: 'w-feedback', 'aria-live': 'polite' });
    const score = h('span', { class: 'w-score' });
    const nextBtn = button(t('next'), () => ask(), 'w-primary');
    const drawScore = () => { score.textContent = `${t('score')}: ${right}/${total}`; };
    const ask = () => {
      q = GENERATORS[pick(types)]();
      done = false;
      text.textContent = q.text;
      feedback.textContent = ''; feedback.className = 'w-feedback';
      nextBtn.hidden = true;
      opts.replaceChildren(...q.options.map(o => h('button', {
        type: 'button', class: 'w-chip', 'data-v': o,
        onClick: (e: Event) => {
          if (done) return;
          done = true; total++;
          const ok = o === q.answer;
          if (ok) right++;
          (e.currentTarget as HTMLElement).classList.add(ok ? 'is-right' : 'is-wrong');
          opts.querySelectorAll('button').forEach(b => { if ((b as HTMLElement).dataset.v === q.answer) b.classList.add('is-right'); });
          feedback.textContent = ok ? t('correct') : `${t('wrong')} ${q.answer}.`;
          feedback.className = 'w-feedback ' + (ok ? 'is-right' : 'is-wrong');
          nextBtn.hidden = false;
          drawScore();
          nextBtn.focus();
        },
      }, o)));
    };
    this.append(text, opts, feedback, h('div', { class: 'w-actions' }, nextBtn, score));
    drawScore();
    ask();
  }
}
