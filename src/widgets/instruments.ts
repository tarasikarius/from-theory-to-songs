// <fret-board> and <piano-keys>: display a set of pitch classes and play notes on click.
import { TUNINGS, fretMidi, midiToPc, pretty } from '../lib/theory';
import { playNote } from '../lib/audio';
import { s } from './dom';

export interface Mark { name: string; label: string; index: number }
export type Marks = Map<number, Mark>;
export type LabelMode = 'degree' | 'note';

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

abstract class Instrument extends HTMLElement {
  marks: Marks = new Map();
  labelMode: LabelMode = 'degree';
  /** Optional: restrict highlighting to exact MIDI notes instead of all octaves. */
  exact: Set<number> | null = null;
  connectedCallback() { this.render(); }
  show(marks: Marks, labelMode: LabelMode = this.labelMode, exact: number[] | null = null) {
    this.marks = marks;
    this.labelMode = labelMode;
    this.exact = exact ? new Set(exact) : null;
    this.render();
  }
  protected markFor(midi: number): Mark | undefined {
    if (this.exact && !this.exact.has(midi)) return undefined;
    return this.marks.get(midiToPc(midi));
  }
  protected text(m: Mark): string { return pretty(this.labelMode === 'degree' ? m.label : m.name); }
  /** Briefly light up a note that is being played. */
  flash(midi: number, delayMs = 0) {
    window.setTimeout(() => {
      this.querySelectorAll(`[data-midi="${midi}"]`).forEach(el => {
        el.classList.add('is-sounding');
        window.setTimeout(() => el.classList.remove('is-sounding'), 260);
      });
    }, delayMs);
  }
  abstract render(): void;
}

export class FretBoard extends Instrument {
  tuning: number[] = TUNINGS.standard;
  frets = 15;

  static get observedAttributes() { return ['tuning', 'frets']; }
  attributeChangedCallback(name: string, _o: string, v: string) {
    if (name === 'tuning') this.tuning = TUNINGS[v] ?? TUNINGS.standard;
    if (name === 'frets') this.frets = parseInt(v, 10) || 15;
    if (this.isConnected) this.render();
  }
  setTuning(id: string) { this.tuning = TUNINGS[id] ?? TUNINGS.standard; this.render(); }

  render() {
    const W = 760, padL = 34, padR = 12, padT = 16, rowH = 26;
    const H = padT + rowH * 6 + 26;
    const n = this.frets;
    const fretW = (W - padL - padR) / n;
    const x = (f: number) => padL + f * fretW;
    const y = (str: number) => padT + (5 - str) * rowH + rowH / 2; // string 0 (low) at the bottom
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fb', role: 'img', 'aria-label': 'Guitar fretboard' });

    svg.append(s('rect', { x: padL, y: padT + rowH / 2 - 6, width: W - padL - padR, height: rowH * 5 + 12, class: 'fb-wood', rx: 3 }));
    for (const f of [3, 5, 7, 9, 15]) {
      if (f <= n) svg.append(s('circle', { cx: x(f) - fretW / 2, cy: padT + rowH * 3, r: 5, class: 'fb-inlay' }));
    }
    if (n >= 12) {
      svg.append(s('circle', { cx: x(12) - fretW / 2, cy: padT + rowH * 2, r: 5, class: 'fb-inlay' }));
      svg.append(s('circle', { cx: x(12) - fretW / 2, cy: padT + rowH * 4, r: 5, class: 'fb-inlay' }));
    }
    for (let f = 0; f <= n; f++) {
      svg.append(s('line', { x1: x(f), x2: x(f), y1: padT + rowH / 2 - 6, y2: padT + rowH * 5.5 + 6, class: f === 0 ? 'fb-nut' : 'fb-fret' }));
      if (f > 0) svg.append(s('text', { x: x(f) - fretW / 2, y: H - 6, class: 'fb-num' }, String(f)));
    }
    for (let str = 0; str < 6; str++) {
      svg.append(s('line', { x1: padL, x2: W - padR, y1: y(str), y2: y(str), class: 'fb-string', 'stroke-width': 2.4 - str * 0.3 }));
    }
    for (let str = 0; str < 6; str++) {
      for (let f = 0; f <= n; f++) {
        const midi = fretMidi(this.tuning, str, f);
        const cx = f === 0 ? padL - 17 : x(f) - fretW / 2;
        const mark = this.markFor(midi);
        const g = s('g', {
          class: 'fb-pos' + (mark ? ' is-on' : '') + (mark && mark.index === 0 ? ' is-root' : ''),
          'data-midi': midi, tabindex: mark ? 0 : -1, role: 'button',
          'aria-label': `${SHARP_NAMES[midiToPc(midi)]}, string ${6 - str}, fret ${f}`,
          onClick: () => { playNote(midi, { voice: 'pluck' }); this.flash(midi); },
          onKeydown: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playNote(midi); this.flash(midi); } },
        });
        g.append(s('rect', { x: cx - fretW / 2 + 1, y: y(str) - rowH / 2, width: Math.max(fretW - 2, 14), height: rowH, class: 'fb-hit' }));
        if (mark) {
          g.append(s('circle', { cx, cy: y(str), r: 10.5, class: 'fb-dot' }));
          g.append(s('text', { x: cx, y: y(str) + 3.8, class: 'fb-lab' }, this.text(mark)));
        } else if (f === 0) {
          g.append(s('text', { x: cx, y: y(str) + 3.8, class: 'fb-open' }, pretty(SHARP_NAMES[midiToPc(midi)])));
        }
        svg.append(g);
      }
    }
    this.replaceChildren(svg);
  }
}

export class PianoKeys extends Instrument {
  from = 48; // C3
  octaves = 2;

  render() {
    const whiteW = 30, H = 112, blackW = 18, blackH = 68;
    const count = this.octaves * 7 + 1;
    const W = count * whiteW + 2;
    const svg = s('svg', { viewBox: `0 0 ${W} ${H + 2}`, class: 'pk', role: 'img', 'aria-label': 'Piano keyboard' });
    const WHITE = [0, 2, 4, 5, 7, 9, 11];
    const BLACK: Record<number, number> = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 }; // after white index → pc
    const key = (midi: number, black: boolean, kx: number) => {
      const mark = this.markFor(midi);
      const w = black ? blackW : whiteW, hh = black ? blackH : H;
      const g = s('g', {
        class: `pk-key ${black ? 'pk-black' : 'pk-white'}` + (mark ? ' is-on' : '') + (mark && mark.index === 0 ? ' is-root' : ''),
        'data-midi': midi, role: 'button', tabindex: mark ? 0 : -1, 'aria-label': SHARP_NAMES[midiToPc(midi)],
        onClick: () => { playNote(midi, { voice: 'keys' }); this.flash(midi); },
        onKeydown: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playNote(midi, { voice: 'keys' }); this.flash(midi); } },
      });
      g.append(s('rect', { x: kx, y: 1, width: w, height: hh, rx: 3, class: 'pk-rect' }));
      if (mark) {
        g.append(s('circle', { cx: kx + w / 2, cy: hh - 15, r: black ? 8 : 10, class: 'pk-dot' }));
        g.append(s('text', { x: kx + w / 2, y: hh - 11.5, class: 'pk-lab' + (black ? ' pk-lab-s' : '') }, this.text(mark)));
      } else if (!black && midiToPc(midi) === 0) {
        g.append(s('text', { x: kx + w / 2, y: hh - 8, class: 'pk-c' }, `C${Math.floor(midi / 12) - 1}`));
      }
      return g;
    };
    const blacks: SVGElement[] = [];
    for (let i = 0; i < count; i++) {
      const oct = Math.floor(i / 7), wi = i % 7;
      const midi = this.from + oct * 12 + WHITE[wi];
      svg.append(key(midi, false, 1 + i * whiteW));
      if (wi in BLACK && i < count - 1) {
        blacks.push(key(this.from + oct * 12 + BLACK[wi], true, 1 + (i + 1) * whiteW - blackW / 2));
      }
    }
    blacks.forEach(b => svg.append(b));
    this.replaceChildren(svg);
  }
}
