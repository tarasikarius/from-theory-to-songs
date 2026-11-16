import { FretBoard, PianoKeys } from './instruments';
import { ChordExplorer, CircleOfFifths, IntervalExplorer, KeyWheel, ScaleExplorer } from './explorers';
import { BeatGrid, MetroNome, ProgressionPlayer } from './players';
import { EarTrainer, QuizBox } from './trainers';
import { warmSamples } from '../lib/audio';

const registry: Record<string, CustomElementConstructor> = {
  'fret-board': FretBoard,
  'piano-keys': PianoKeys,
  'scale-explorer': ScaleExplorer,
  'chord-explorer': ChordExplorer,
  'interval-explorer': IntervalExplorer,
  'circle-of-fifths': CircleOfFifths,
  'key-wheel': KeyWheel,
  'progression-player': ProgressionPlayer,
  'metro-nome': MetroNome,
  'beat-grid': BeatGrid,
  'ear-trainer': EarTrainer,
  'quiz-box': QuizBox,
};

for (const [name, ctor] of Object.entries(registry)) {
  if (!customElements.get(name)) customElements.define(name, ctor);
}

// Fetch the instrument samples as soon as the reader starts interacting with the page,
// so they are ready by the time a note is played.
const WARM_EVENTS = ['pointerover', 'touchstart', 'focusin', 'keydown'] as const;
const warm = () => {
  WARM_EVENTS.forEach(e => document.removeEventListener(e, warm));
  warmSamples();
};
WARM_EVENTS.forEach(e => document.addEventListener(e, warm, { passive: true }));
