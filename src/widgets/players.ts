// <progression-player>, <metro-nome>, <beat-grid>
import { ROOTS, parseNote, pc, pretty, romanToChord, type KeyChord } from '../lib/theory';
import { click, drum, now, playChord, playNote, scheduler, type Drum } from '../lib/audio';
import { Widget, button, field, h, select } from './dom';
import { rootMidi } from './explorers';
import { t } from './strings';

export const PROGRESSIONS: { id: string; numerals: string }[] = [
  { id: 'I–V–vi–IV', numerals: 'I V vi IV' },
  { id: 'vi–IV–I–V', numerals: 'vi IV I V' },
  { id: 'I–IV–V–IV', numerals: 'I IV V IV' },
  { id: 'I–vi–IV–V', numerals: 'I vi IV V' },
  { id: 'ii–V–I', numerals: 'ii7 V7 Imaj7 Imaj7' },
  { id: 'i–bVII–bVI–bVII', numerals: 'i bVII bVI bVII' },
  { id: 'i–bVI–bIII–bVII', numerals: 'i bVI bIII bVII' },
  { id: 'I–bVII–IV', numerals: 'I bVII IV I' },
  { id: 'i–iv–V', numerals: 'i iv V i' },
  { id: 'I–IV–iv–I', numerals: 'I IV iv I' },
  { id: 'bVI–bVII–I', numerals: 'i bVI bVII I' },
  { id: 'I–V7/vi–vi–IV', numerals: 'I V7/vi vi IV' },
];

/** Compact voicing: every chord tone placed in a fixed window, so chords connect smoothly. */
export function voice(ch: KeyChord, low = 55): number[] {
  const out = ch.notes.map(n => { let m = low + ((pc(n) - (low % 12) + 12) % 12); return m; });
  return [...new Set(out)].sort((a, b) => a - b);
}

export class ProgressionPlayer extends Widget {
  private stop: (() => void) | null = null;
  disconnectedCallback() { this.stop?.(); this.stop = null; }

  build() {
    let key = this.attr('tonic', 'C');
    let numerals = this.list('numerals', ['I', 'V', 'vi', 'IV']);
    let tempo = parseInt(this.attr('tempo', '92'), 10);
    const beats = parseInt(this.attr('beats', '4'), 10);
    const editable = this.hasAttribute('editable');
    const presets = this.hasAttribute('presets');
    let chords: KeyChord[] = [];

    const chips = h('div', { class: 'pp-chords' });
    const err = h('p', { class: 'w-error', role: 'alert', hidden: true });
    const input = h('input', {
      type: 'text', value: numerals.join(' '), spellcheck: false, autocapitalize: 'off', autocomplete: 'off',
      onInput: () => { numerals = input.value.trim().split(/\s+/).filter(Boolean); update(); },
    });
    const tempoOut = h('output', {}, String(tempo));
    const tempoIn = h('input', {
      type: 'range', min: 50, max: 180, value: tempo,
      onInput: () => { tempo = parseInt(tempoIn.value, 10); tempoOut.textContent = String(tempo); },
    });
    const playBtn = button(t('play'), () => (this.stop ? halt() : start()), 'w-primary');

    const halt = () => {
      this.stop?.(); this.stop = null;
      playBtn.textContent = t('play');
      chips.querySelectorAll('.is-current').forEach(e => e.classList.remove('is-current'));
    };
    const start = () => {
      if (!chords.length) return;
      playBtn.textContent = t('stop');
      this.stop = scheduler(() => 60 / tempo, (i, time) => {
        if (!chords.length) return;
        const beat = i % beats;
        const idx = Math.floor(i / beats) % chords.length;
        const ch = chords[idx];
        const beatDur = 60 / tempo;
        if (beat === 0) {
          playNote(rootMidi(ch.root, 36), { when: time, voice: 'bass', dur: beatDur * beats * 0.95 });
          playChord(voice(ch), { when: time, voice: 'pluck', dur: beatDur * beats, gain: 0.2 });
          window.setTimeout(() => {
            if (!this.stop) return;
            chips.querySelectorAll('.pp-chord').forEach((e, j) => e.classList.toggle('is-current', j === idx));
          }, Math.max(0, (time - now()) * 1000));
        } else {
          playChord(voice(ch), { when: time, voice: 'pluck', dur: beatDur * 1.2, gain: 0.09 });
        }
        click(time, false, true);
      });
    };

    const controls = h('div', { class: 'w-controls' },
      field(t('key'), select(ROOTS.map(r => ({ value: r, label: pretty(r) })), key, v => { key = v; update(); })),
      presets && field(t('preset'), select(
        PROGRESSIONS.map(p => ({ value: p.numerals, label: pretty(p.id.replace(/b(?=[IV])/g, '♭')) })), numerals.join(' '),
        v => { numerals = v.split(' '); input.value = v; update(); })),
      (editable || presets) && field(t('edit'), input),
      h('label', { class: 'w-field' }, h('span', { class: 'w-label' }, `${t('tempo')}: `, tempoOut, ` ${t('bpm')}`), tempoIn),
      h('div', { class: 'w-actions' }, playBtn),
    );
    this.append(controls, chips, err);

    const update = () => {
      const tonic = parseNote(key);
      const next: KeyChord[] = [];
      err.hidden = true;
      for (const n of numerals) {
        try { next.push(romanToChord(n, tonic)); }
        catch { err.textContent = `${t('badNumeral')} ${n}`; err.hidden = false; }
      }
      chords = next;
      chips.replaceChildren(...chords.map(ch => h('button', {
        type: 'button', class: 'pp-chord',
        onClick: () => {
          playNote(rootMidi(ch.root, 36), { voice: 'bass', dur: 1.6 });
          playChord(voice(ch), { voice: 'pluck', dur: 1.8 });
        },
      }, h('span', { class: 'pp-num' }, pretty(ch.numeral)), h('span', { class: 'pp-sym' }, pretty(ch.symbol)))));
      if (this.stop && !chords.length) halt();
    };
    update();
  }
}

const SUBDIVS: Record<string, number[]> = {
  quarters: [0], eighths: [0, 0.5], triplets: [0, 1 / 3, 2 / 3], sixteenths: [0, 0.25, 0.5, 0.75], shuffle: [0, 2 / 3],
};

export class MetroNome extends Widget {
  private stop: (() => void) | null = null;
  disconnectedCallback() { this.stop?.(); this.stop = null; }

  build() {
    let bpm = parseInt(this.attr('bpm', '80'), 10);
    let beats = parseInt(this.attr('beats', '4'), 10);
    let sub = this.attr('subdivision', 'quarters');
    let backbeat = this.hasAttribute('backbeat');
    const dots = h('div', { class: 'mn-dots', 'aria-hidden': 'true' });
    const out = h('output', {}, String(bpm));
    const slider = h('input', { type: 'range', min: 40, max: 220, value: bpm, onInput: () => { bpm = parseInt(slider.value, 10); out.textContent = String(bpm); } });
    const bb = h('input', { type: 'checkbox', checked: backbeat, onChange: () => { backbeat = bb.checked; } });
    const drawDots = () => dots.replaceChildren(...Array.from({ length: beats }, (_, i) => h('span', { class: 'mn-dot' }, String(i + 1))));
    const btn = button(t('start'), () => {
      if (this.stop) {
        this.stop(); this.stop = null; btn.textContent = t('start');
        dots.querySelectorAll('.is-current').forEach(e => e.classList.remove('is-current'));
        return;
      }
      btn.textContent = t('stop');
      this.stop = scheduler(() => 60 / bpm, (i, time) => {
        const beat = i % beats;
        const dur = 60 / bpm;
        const audible = !backbeat || beat % 2 === 1;
        if (audible) click(time, !backbeat && beat === 0);
        if (!backbeat) for (const off of SUBDIVS[sub].slice(1)) click(time + off * dur, false, true);
        window.setTimeout(() => {
          if (!this.stop) return;
          dots.querySelectorAll('.mn-dot').forEach((e, j) => e.classList.toggle('is-current', j === beat));
        }, Math.max(0, (time - now()) * 1000));
      });
    }, 'w-primary');
    this.append(
      h('div', { class: 'w-controls' },
        h('label', { class: 'w-field' }, h('span', { class: 'w-label' }, `${t('tempo')}: `, out, ` ${t('bpm')}`), slider),
        field(t('beats'), select([2, 3, 4, 5, 6, 7].map(n => ({ value: String(n), label: String(n) })), String(beats), v => { beats = parseInt(v, 10); drawDots(); })),
        field(t('subdivision'), select(Object.keys(SUBDIVS).map(k => ({ value: k, label: t(k) })), sub, v => { sub = v; })),
        h('label', { class: 'w-check' }, bb, t('backbeat')),
        h('div', { class: 'w-actions' }, btn)),
      dots);
    drawDots();
  }
}

const GRID_PRESETS: Record<string, string> = {
  rock: 'hat:x.x.x.x.x.x.x.x.|snare:....x.......x...|kick:x.......x.x.....',
  halftime: 'hat:x.x.x.x.x.x.x.x.|snare:........x.......|kick:x.....x...x.....',
  fourfloor: 'hat:..x...x...x...x.|snare:....x.......x...|kick:x...x...x...x...',
  sixteenths: 'hat:xxxxxxxxxxxxxxxx|snare:....x.......x...|kick:x..x..x...x.x...',
  gallop: 'hat:x...x...x...x...|snare:....x.......x...|kick:x...x...x...x...|riff:x.xxx.xxx.xxx.xx',
  syncopated: 'hat:x.x.x.x.x.x.x.x.|snare:....x.......x...|kick:x.....x.x.....x.|riff:x..x..x.x..x..x.',
  blank: 'hat:................|snare:................|kick:................|riff:................',
};
const ROWS: Drum[] = ['hat', 'snare', 'kick', 'chug'];
const ROW_KEY: Record<string, Drum> = { hat: 'hat', snare: 'snare', kick: 'kick', riff: 'chug' };
const ROW_LABEL: Record<Drum, string> = { hat: 'hat', snare: 'snare', kick: 'kick', chug: 'riff' };

export class BeatGrid extends Widget {
  private stop: (() => void) | null = null;
  disconnectedCallback() { this.stop?.(); this.stop = null; }

  build() {
    const src = this.attr('pattern') || GRID_PRESETS[this.attr('preset', 'rock')] || GRID_PRESETS.rock;
    const steps = parseInt(this.attr('steps', '16'), 10);
    const group = parseInt(this.attr('group', '4'), 10);
    let bpm = parseInt(this.attr('bpm', '100'), 10);
    const grid: Record<Drum, boolean[]> = { hat: [], snare: [], kick: [], chug: [] };
    for (const r of ROWS) grid[r] = Array(steps).fill(false);
    for (const part of src.split('|')) {
      const [name, pat] = part.split(':');
      const row = ROW_KEY[name.trim()];
      if (row) [...pat.trim()].slice(0, steps).forEach((ch, i) => { grid[row][i] = ch === 'x'; });
    }
    const rows = this.hasAttribute('riff') || grid.chug.some(Boolean) ? ROWS : ROWS.slice(0, 3);
    const table = h('div', { class: 'bg-grid', style: `--steps:${steps}` });
    const cells: HTMLElement[][] = [];
    const counts = h('div', { class: 'bg-row bg-counts', 'aria-hidden': 'true' }, h('span', { class: 'bg-name' }));
    for (let i = 0; i < steps; i++) {
      const inBeat = i % group;
      const label = inBeat === 0 ? String(i / group + 1) : group === 4 ? ['', 'e', '&', 'a'][inBeat] : group === 2 ? '&' : '·';
      counts.append(h('span', { class: 'bg-count' + (inBeat === 0 ? ' is-beat' : '') }, label));
    }
    table.append(counts);
    for (const r of rows) {
      const row = h('div', { class: 'bg-row' }, h('span', { class: 'bg-name' }, t(ROW_LABEL[r])));
      cells.push([]);
      for (let i = 0; i < steps; i++) {
        const cell = h('button', {
          type: 'button', class: 'bg-cell' + (i % group === 0 ? ' is-beat' : ''), 'aria-pressed': String(grid[r][i]),
          'aria-label': `${t(ROW_LABEL[r])} ${i + 1}`,
          onClick: () => {
            grid[r][i] = !grid[r][i];
            cell.setAttribute('aria-pressed', String(grid[r][i]));
            if (grid[r][i]) drum(r, now());
          },
        });
        cells[cells.length - 1].push(cell);
        row.append(cell);
      }
      table.append(row);
    }
    const out = h('output', {}, String(bpm));
    const slider = h('input', { type: 'range', min: 50, max: 200, value: bpm, onInput: () => { bpm = parseInt(slider.value, 10); out.textContent = String(bpm); } });
    const btn = button(t('play'), () => {
      if (this.stop) {
        this.stop(); this.stop = null; btn.textContent = t('play');
        table.querySelectorAll('.is-current').forEach(e => e.classList.remove('is-current'));
        return;
      }
      btn.textContent = t('stop');
      this.stop = scheduler(() => 60 / bpm / group, (i, time) => {
        const step = i % steps;
        for (const r of rows) if (grid[r][step]) drum(r, time);
        window.setTimeout(() => {
          if (!this.stop) return;
          cells.forEach(row => row.forEach((c, j) => c.classList.toggle('is-current', j === step)));
        }, Math.max(0, (time - now()) * 1000));
      });
    }, 'w-primary');
    this.append(
      h('div', { class: 'w-controls' },
        h('label', { class: 'w-field' }, h('span', { class: 'w-label' }, `${t('tempo')}: `, out, ` ${t('bpm')}`), slider),
        h('div', { class: 'w-actions' }, btn,
          button(t('clear'), () => { for (const r of rows) grid[r].fill(false); table.querySelectorAll('.bg-cell').forEach(c => c.setAttribute('aria-pressed', 'false')); }))),
      h('div', { class: 'w-scroll' }, table));
  }
}
