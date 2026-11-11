// <scale-explorer>, <chord-explorer>, <interval-explorer>, <circle-of-fifths>
import {
  CHORDS, CIRCLE_MAJOR, ROOTS, SCALES, SIMPLE_INTERVALS, simpleInterval, chordMidi, chordNotes, chordSymbol, diatonicChords,
  keySignature, noteName, noteToMidi, parseNote, pc, pcMap, pretty, relativeMinor, scaleNotes, transposeBy,
  type Note,
} from '../lib/theory';
import { playChord, playSequence, startDrone } from '../lib/audio';
import { Widget, button, field, h, s, select } from './dom';
import { FretBoard, PianoKeys, type LabelMode, type Marks } from './instruments';
import { t } from './strings';

const rootOptions = () => ROOTS.map(r => ({ value: r, label: pretty(r) }));

/** Lowest MIDI for a root so that sequences sit in a comfortable guitar range (E2..D#3). */
export function rootMidi(root: Note, low = 40): number {
  let m = noteToMidi(root, 2);
  while (m < low) m += 12;
  while (m >= low + 12) m -= 12;
  return m;
}

function instruments(host: HTMLElement, showPiano: boolean) {
  const fb = new FretBoard();
  const pk = showPiano ? new PianoKeys() : null;
  const wrap = h('div', { class: 'w-instruments' }, h('div', { class: 'w-scroll' }, fb), pk && h('div', { class: 'w-scroll' }, pk));
  host.append(wrap);
  return {
    fb, pk,
    show(marks: Marks, mode: LabelMode, exact: number[] | null = null) {
      fb.show(marks, mode, null);
      pk?.show(marks, mode, exact);
    },
    flash(midis: number[], step: number) {
      midis.forEach((m, i) => { fb.flash(m, i * step * 1000); pk?.flash(m, i * step * 1000); });
    },
  };
}

export class ScaleExplorer extends Widget {
  private stopDrone: (() => void) | null = null;
  disconnectedCallback() { this.stopDrone?.(); this.stopDrone = null; }

  build() {
    let root = this.attr('root', 'A');
    let scale = this.attr('scale', 'minorPentatonic');
    let mode: LabelMode = this.attr('labels', 'degree') as LabelMode;
    const scales = this.list('scales', Object.keys(SCALES).filter(k => k !== 'ionian' && k !== 'aeolian'));
    if (!scales.includes(scale)) scales.unshift(scale);
    const lockRoot = this.hasAttribute('lock-root');

    const info = h('p', { class: 'w-info', 'aria-live': 'polite' });
    const droneBtn = button(t('drone'), () => {
      if (this.stopDrone) { this.stopDrone(); this.stopDrone = null; }
      else this.stopDrone = startDrone(rootMidi(parseNote(root), 36));
      droneBtn.classList.toggle('is-active', !!this.stopDrone);
      droneBtn.setAttribute('aria-pressed', String(!!this.stopDrone));
      droneBtn.textContent = this.stopDrone ? t('droneOn') : t('drone');
    });
    const restartDrone = () => {
      if (!this.stopDrone) return;
      this.stopDrone();
      this.stopDrone = startDrone(rootMidi(parseNote(root), 36));
    };

    const controls = h('div', { class: 'w-controls' },
      !lockRoot && field(t('root'), select(rootOptions(), root, v => { root = v; restartDrone(); update(); })),
      scales.length > 1 && field(t('scale'), select(scales.map(id => ({ value: id, label: t('s.' + id) })), scale, v => { scale = v; update(); })),
      field(t('labels'), select([{ value: 'degree', label: t('degrees') }, { value: 'note', label: t('notes') }], mode, v => { mode = v as LabelMode; update(); })),
      field(t('tuning'), select([{ value: 'standard', label: t('standard') }, { value: 'dropD', label: t('dropD') }], this.attr('tuning', 'standard'), v => inst.fb.setTuning(v))),
      h('div', { class: 'w-actions' },
        button(t('playScale'), () => {
          const r = parseNote(root);
          const base = rootMidi(r, 45);
          const notes = scaleNotes(r, scale);
          const midis = notes.map(n => base + ((pc(n) - pc(r) + 12) % 12));
          midis.push(base + 12);
          playSequence(midis, 0.3);
          inst.flash(midis, 0.3);
        }, 'w-primary'),
        droneBtn),
    );
    this.append(controls, info);
    const inst = instruments(this, !this.hasAttribute('no-piano'));
    if (this.hasAttribute('tuning')) inst.fb.setTuning(this.attr('tuning'));

    const update = () => {
      const r = parseNote(root);
      const notes = scaleNotes(r, scale);
      inst.show(pcMap(notes, SCALES[scale]), mode);
      info.replaceChildren(
        h('strong', {}, `${pretty(root)} ${t('s.' + scale)}`), ' — ',
        h('span', { class: 'w-mono' }, notes.map(n => pretty(noteName(n))).join(' ')), ' · ',
        h('span', { class: 'w-mono w-dim' }, SCALES[scale].map(pretty).join(' ')),
      );
    };
    update();
  }
}

export class ChordExplorer extends Widget {
  build() {
    let root = this.attr('root', 'C');
    let chord = this.attr('chord', 'maj');
    let inversion = 0;
    let mode: LabelMode = 'degree';
    const chords = this.list('chords', Object.keys(CHORDS));
    if (!chords.includes(chord)) chords.unshift(chord);

    const info = h('p', { class: 'w-info', 'aria-live': 'polite' });
    const invSelect = select([], '0', v => { inversion = parseInt(v, 10); update(); }, t('inversion'));
    const midis = () => chordMidi(chordNotes(parseNote(root), chord), 3, inversion).map(m => (m < 48 ? m + 12 : m));
    const fitted = () => { let m = midis(); while (Math.max(...m) > 72) m = m.map(x => x - 12); while (Math.min(...m) < 48) m = m.map(x => x + 12); return m; };

    const controls = h('div', { class: 'w-controls' },
      field(t('chordRoot'), select(rootOptions(), root, v => { root = v; update(); })),
      chords.length > 1 && field(t('chord'), select(chords.map(id => ({ value: id, label: t('c.' + id) })), chord, v => { chord = v; inversion = 0; update(); })),
      field(t('inversion'), invSelect),
      field(t('labels'), select([{ value: 'degree', label: t('degrees') }, { value: 'note', label: t('notes') }], mode, v => { mode = v as LabelMode; update(); })),
      h('div', { class: 'w-actions' },
        button(t('playChord'), () => { playChord(fitted(), { voice: 'keys', dur: 1.8 }); inst.flash(fitted(), 0); }, 'w-primary'),
        button(t('arpeggio'), () => { playSequence(fitted(), 0.28, { voice: 'keys' }); inst.flash(fitted(), 0.28); })),
    );
    this.append(controls, info);
    const inst = instruments(this, true);

    const update = () => {
      const r = parseNote(root);
      const notes = chordNotes(r, chord);
      const degs = CHORDS[chord].degrees;
      const names = ['rootPos', 'inv1', 'inv2', 'inv3'].slice(0, notes.length);
      invSelect.replaceChildren(...names.map((n, i) => h('option', { value: String(i) }, t(n))));
      invSelect.value = String(inversion);
      inst.show(pcMap(notes, degs), mode, fitted());
      const order = notes.map((_, i) => notes[(i + inversion) % notes.length]);
      const sym = chordSymbol(r, chord) + (inversion ? '/' + noteName(order[0]) : '');
      info.replaceChildren(
        h('strong', {}, pretty(sym)), ' — ',
        h('span', { class: 'w-mono' }, order.map(n => pretty(noteName(n))).join(' ')), ' · ',
        h('span', { class: 'w-mono w-dim' }, degs.map(pretty).join(' ')),
      );
    };
    update();
  }
}

export function intervalTarget(root: Note, id: string): Note {
  return transposeBy(root, simpleInterval(id));
}

export class IntervalExplorer extends Widget {
  build() {
    let root = this.attr('root', 'C');
    let iv = this.attr('interval', 'P5');
    const info = h('p', { class: 'w-info', 'aria-live': 'polite' });
    const buttons = h('div', { class: 'w-chips', role: 'group', 'aria-label': t('interval') });
    const pair = () => { const b = rootMidi(parseNote(root), 48); return [b, b + simpleInterval(iv).semis]; };
    for (const id of SIMPLE_INTERVALS) {
      buttons.append(h('button', {
        type: 'button', class: 'w-chip', 'data-id': id, title: t('i.' + id),
        onClick: () => { iv = id; update(); playSequence(pair(), 0.45, { voice: 'keys' }); inst.flash(pair(), 0.45); },
      }, id));
    }
    const controls = h('div', { class: 'w-controls' },
      field(t('chordRoot'), select(rootOptions(), root, v => { root = v; update(); })),
      h('div', { class: 'w-actions' },
        button(t('melodic'), () => { playSequence(pair(), 0.45, { voice: 'keys' }); inst.flash(pair(), 0.45); }, 'w-primary'),
        button(t('harmonic'), () => { playChord(pair(), { voice: 'keys', strum: 0, dur: 1.8 }); inst.flash(pair(), 0); })),
    );
    this.append(controls, buttons, info);
    const inst = instruments(this, true);
    const update = () => {
      const r = parseNote(root);
      const target = intervalTarget(r, iv);
      const marks = pcMap([r, target], ['1', iv === 'TT' ? 'TT' : iv]);
      if (iv === 'P1' || iv === 'P8') marks.set(pc(r), { name: noteName(r), label: '1', index: 0 });
      inst.show(marks, 'note', pair());
      buttons.querySelectorAll('.w-chip').forEach(b => {
        const on = (b as HTMLElement).dataset.id === iv;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      const n = simpleInterval(iv).semis;
      info.replaceChildren(
        h('strong', {}, `${t('i.' + iv)} (${iv})`), ' — ',
        h('span', { class: 'w-mono' }, `${pretty(noteName(r))} → ${pretty(noteName(target))}`),
        ` · ${n} ${n === 1 ? t('semitone') : t('semitones')}`,
      );
    };
    update();
  }
}

const SHARP_ORDER = ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'];
const FLAT_ORDER = ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'];

export class CircleOfFifths extends Widget {
  build() {
    let key = this.attr('tonic', 'C');
    const size = 340, c = size / 2;
    const svg = s('svg', { viewBox: `0 0 ${size} ${size}`, class: 'cof', role: 'group', 'aria-label': 'Circle of fifths' });
    const panel = h('div', { class: 'cof-panel', 'aria-live': 'polite' });
    const seg = (i: number, r1: number, r2: number) => {
      const a0 = ((i - 0.5) * 30 - 90) * Math.PI / 180, a1 = ((i + 0.5) * 30 - 90) * Math.PI / 180;
      const p = (r: number, a: number) => `${c + r * Math.cos(a)} ${c + r * Math.sin(a)}`;
      return `M ${p(r1, a0)} A ${r1} ${r1} 0 0 1 ${p(r1, a1)} L ${p(r2, a1)} A ${r2} ${r2} 0 0 0 ${p(r2, a0)} Z`;
    };
    CIRCLE_MAJOR.forEach((k, i) => {
      const a = (i * 30 - 90) * Math.PI / 180;
      const rel = noteName(relativeMinor(parseNote(k)));
      const g = s('g', {
        class: 'cof-seg', 'data-key': k, role: 'button', tabindex: 0, 'aria-label': `${k} ${t('major')}`,
        onClick: () => { key = k; update(); playChord(chordMidi(chordNotes(parseNote(k), 'maj'), 3), { voice: 'keys', dur: 1.4 }); },
        onKeydown: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); key = k; update(); } },
      });
      g.append(s('path', { d: seg(i, 108, 164), class: 'cof-outer' }));
      g.append(s('path', { d: seg(i, 62, 108), class: 'cof-inner' }));
      g.append(s('text', { x: c + 136 * Math.cos(a), y: c + 136 * Math.sin(a) + 6, class: 'cof-maj' }, pretty(k)));
      g.append(s('text', { x: c + 85 * Math.cos(a), y: c + 85 * Math.sin(a) + 4.5, class: 'cof-min' }, pretty(rel) + 'm'));
      svg.append(g);
    });
    this.append(h('div', { class: 'cof-wrap' }, svg, panel));

    const update = () => {
      svg.querySelectorAll('.cof-seg').forEach(g => g.classList.toggle('is-active', (g as SVGElement).dataset.key === key));
      const tonic = parseNote(key);
      const sig = keySignature(tonic);
      const acc = sig > 0 ? SHARP_ORDER.slice(0, sig) : FLAT_ORDER.slice(0, -sig);
      const sigText = sig === 0 ? t('noSharps') : `${Math.abs(sig)}${sig > 0 ? '♯' : '♭'}: ${acc.map(pretty).join(' ')}`;
      const chords = diatonicChords(tonic, 'major');
      panel.replaceChildren(
        h('h4', {}, `${pretty(key)} ${t('major')}`),
        h('dl', {},
          h('dt', {}, t('signature')), h('dd', {}, sigText),
          h('dt', {}, t('notes')), h('dd', { class: 'w-mono' }, scaleNotes(tonic, 'major').map(n => pretty(noteName(n))).join(' ')),
          h('dt', {}, t('relMinor')), h('dd', {}, pretty(noteName(relativeMinor(tonic))) + ' ' + t('minor')),
          h('dt', {}, t('chordsInKey')),
          h('dd', {}, h('span', { class: 'w-chips' }, ...chords.map(ch => h('button', {
            type: 'button', class: 'w-chip', title: ch.numeral,
            onClick: () => playChord(chordMidi(ch.notes, 3), { voice: 'keys', dur: 1.4 }),
          }, h('small', {}, pretty(ch.numeral)), ' ', pretty(ch.symbol))))),
        ),
      );
    };
    update();
  }
}
