import { FretBoard, PianoKeys } from './instruments';
import { ChordExplorer, CircleOfFifths, IntervalExplorer, KeyWheel, ScaleExplorer } from './explorers';
import { BeatGrid, MetroNome, ProgressionPlayer } from './players';
import { EarTrainer, QuizBox } from './trainers';

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
