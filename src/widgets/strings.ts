// Widget UI strings. Language is taken from <html lang>.
type Dict = Record<string, string>;

const en: Dict = {
  root: 'Root', chordRoot: 'Root', key: 'Key', scale: 'Scale', chord: 'Chord', interval: 'Interval', tuning: 'Tuning',
  labels: 'Labels', degrees: 'Degrees', notes: 'Notes', play: 'Play', stop: 'Stop', playScale: 'Play scale',
  playChord: 'Play chord', arpeggio: 'Arpeggio', drone: 'Drone', droneOn: 'Drone on', inversion: 'Inversion',
  rootPos: 'Root position', inv1: '1st inversion', inv2: '2nd inversion', inv3: '3rd inversion',
  formula: 'Formula', standard: 'Standard (EADGBE)', dropD: 'Drop D (DADGBE)',
  melodic: 'One after another', harmonic: 'Together', semitones: 'semitones', semitone: 'semitone',
  tempo: 'Tempo', bpm: 'BPM', loop: 'Loop', progression: 'Progression', edit: 'Numerals (space-separated)',
  badNumeral: 'Could not read this numeral:', preset: 'Preset', custom: 'Custom',
  beats: 'Beats per bar', subdivision: 'Subdivision', quarters: 'Quarters', eighths: '8ths', triplets: 'Triplets',
  sixteenths: '16ths', shuffle: 'Shuffle', backbeat: 'Click only on 2 & 4', start: 'Start',
  hear: 'Play question', again: 'Hear again', next: 'Next', correct: 'Correct!', wrong: 'Not quite — it was',
  score: 'Score', reset: 'Reset', direction: 'Direction', up: 'Ascending', down: 'Descending', together: 'Harmonic',
  whatInterval: 'Which interval is this?', whatChord: 'Which chord quality is this?', whatScale: 'Which scale is this?',
  whatProg: 'Which progression is this?', pressPlay: 'Press “Play question” to begin.',
  check: 'Check', question: 'Question',
  qIntervalUp: 'Which note is a {iv} above {n}?', qIntervalName: 'What is the interval from {a} up to {b}?',
  qTriad: 'Which notes spell {c}?', qDiatonic: 'In the key of {k}, which chord is {num}?',
  qNumeral: 'In the key of {k}, which numeral is {c}?', qDegree: 'In {k} major, which note is degree {d}?',
  qKeySig: 'How many sharps or flats does {k} major have?', qFunction: 'What is the function of {num} in a major key?',
  qRelative: 'What is the relative minor of {k} major?', qSignature: 'Which note is the signature note of {m}?',
  none: 'none', sharps: '{n} sharp(s)', flats: '{n} flat(s)',
  tonic: 'Tonic', subdominant: 'Subdominant', dominant: 'Dominant',
  major: 'major', minor: 'minor', relMinor: 'Relative minor', signature: 'Key signature', chordsInKey: 'Chords in the key',
  noSharps: 'no sharps or flats', kick: 'Kick', snare: 'Snare', hat: 'Hi-hat', riff: 'Riff (chug)', clear: 'Clear',
  clickFret: 'Click any fret or key to hear it.', majorKey: 'Major key', minorKey: 'Minor key', mode: 'Mode',
  sevenths: '7th chords', seconds: 's',
  // scales
  's.major': 'Major', 's.naturalMinor': 'Natural minor', 's.harmonicMinor': 'Harmonic minor', 's.melodicMinor': 'Melodic minor',
  's.minorPentatonic': 'Minor pentatonic', 's.majorPentatonic': 'Major pentatonic', 's.blues': 'Blues scale',
  's.lydian': 'Lydian', 's.ionian': 'Ionian (major)', 's.mixolydian': 'Mixolydian', 's.dorian': 'Dorian',
  's.aeolian': 'Aeolian (natural minor)', 's.phrygian': 'Phrygian', 's.locrian': 'Locrian', 's.phrygianDominant': 'Phrygian dominant',
  // chords
  'c.maj': 'Major', 'c.min': 'Minor', 'c.dim': 'Diminished', 'c.aug': 'Augmented', 'c.5': 'Power chord (5)',
  'c.sus2': 'sus2', 'c.sus4': 'sus4', 'c.add9': 'add9', 'c.madd9': 'm(add9)', 'c.maj7': 'maj7', 'c.7': '7 (dominant)',
  'c.m7': 'm7', 'c.m7b5': 'm7b5 (half-diminished)', 'c.dim7': 'dim7', 'c.mMaj7': 'm(maj7)', 'c.7sus4': '7sus4', 'c.m9': 'm9', 'c.9': '9',
  // intervals
  'i.P1': 'Perfect unison', 'i.m2': 'Minor 2nd', 'i.M2': 'Major 2nd', 'i.m3': 'Minor 3rd', 'i.M3': 'Major 3rd',
  'i.P4': 'Perfect 4th', 'i.TT': 'Tritone', 'i.P5': 'Perfect 5th', 'i.m6': 'Minor 6th', 'i.M6': 'Major 6th',
  'i.m7': 'Minor 7th', 'i.M7': 'Major 7th', 'i.P8': 'Perfect octave',
};

const uk: Dict = {
  root: 'Тоніка', chordRoot: 'Основний тон', key: 'Тональність', scale: 'Гама', chord: 'Акорд', interval: 'Інтервал', tuning: 'Стрій',
  labels: 'Підписи', degrees: 'Ступені', notes: 'Ноти', play: 'Грати', stop: 'Стоп', playScale: 'Зіграти гаму',
  playChord: 'Зіграти акорд', arpeggio: 'Арпеджіо', drone: 'Бурдон', droneOn: 'Бурдон звучить', inversion: 'Обернення',
  rootPos: 'Основний вид', inv1: '1-ше обернення', inv2: '2-ге обернення', inv3: '3-тє обернення',
  formula: 'Формула', standard: 'Стандартний (EADGBE)', dropD: 'Drop D (DADGBE)',
  melodic: 'По черзі', harmonic: 'Разом', semitones: 'півтонів', semitone: 'півтон',
  tempo: 'Темп', bpm: 'уд/хв', loop: 'По колу', progression: 'Послідовність', edit: 'Ступені (через пробіл)',
  badNumeral: 'Не вдалося прочитати ступінь:', preset: 'Шаблон', custom: 'Своя',
  beats: 'Долей у такті', subdivision: 'Дроблення', quarters: 'Чверті', eighths: 'Вісімки', triplets: 'Тріолі',
  sixteenths: 'Шістнадцяті', shuffle: 'Шафл', backbeat: 'Клік лише на 2 і 4', start: 'Старт',
  hear: 'Зіграти завдання', again: 'Ще раз', next: 'Далі', correct: 'Правильно!', wrong: 'Не зовсім — це',
  score: 'Рахунок', reset: 'Скинути', direction: 'Напрямок', up: 'Вгору', down: 'Вниз', together: 'Гармонічно',
  whatInterval: 'Який це інтервал?', whatChord: 'Який це акорд?', whatScale: 'Яка це гама?',
  whatProg: 'Яка це послідовність?', pressPlay: 'Натисніть «Зіграти завдання», щоб почати.',
  check: 'Перевірити', question: 'Питання',
  qIntervalUp: 'Яка нота лежить на інтервал «{iv}» вище від {n}?', qIntervalName: 'Який інтервал від {a} вгору до {b}?',
  qTriad: 'З яких нот складається {c}?', qDiatonic: 'У тональності {k} який акорд є {num}?',
  qNumeral: 'У тональності {k} який ступінь має акорд {c}?', qDegree: 'У {k} мажорі яка нота є {d} ступенем?',
  qKeySig: 'Скільки дієзів або бемолів у {k} мажорі?', qFunction: 'Яка функція акорду {num} у мажорі?',
  qRelative: 'Який паралельний мінор у {k} мажору?', qSignature: 'Яка характерна нота ладу: {m}?',
  none: 'жодного', sharps: 'дієзів: {n}', flats: 'бемолів: {n}',
  tonic: 'Тоніка', subdominant: 'Субдомінанта', dominant: 'Домінанта',
  major: 'мажор', minor: 'мінор', relMinor: 'Паралельний мінор', signature: 'Ключові знаки', chordsInKey: 'Акорди тональності',
  noSharps: 'без знаків', kick: 'Бочка', snare: 'Малий', hat: 'Хай-хет', riff: 'Риф (чаг)', clear: 'Очистити',
  clickFret: 'Натисніть на лад або клавішу, щоб почути ноту.', majorKey: 'Мажор', minorKey: 'Мінор', mode: 'Лад',
  sevenths: 'Септакорди', seconds: 'с',
  's.major': 'Мажор', 's.naturalMinor': 'Натуральний мінор', 's.harmonicMinor': 'Гармонічний мінор', 's.melodicMinor': 'Мелодичний мінор',
  's.minorPentatonic': 'Мінорна пентатоніка', 's.majorPentatonic': 'Мажорна пентатоніка', 's.blues': 'Блюзова гама',
  's.lydian': 'Лідійський', 's.ionian': 'Іонійський (мажор)', 's.mixolydian': 'Міксолідійський', 's.dorian': 'Дорійський',
  's.aeolian': 'Еолійський (натуральний мінор)', 's.phrygian': 'Фригійський', 's.locrian': 'Локрійський', 's.phrygianDominant': 'Фригійський домінантовий',
  'c.maj': 'Мажорний', 'c.min': 'Мінорний', 'c.dim': 'Зменшений', 'c.aug': 'Збільшений', 'c.5': 'Пауер-акорд (5)',
  'c.sus2': 'sus2', 'c.sus4': 'sus4', 'c.add9': 'add9', 'c.madd9': 'm(add9)', 'c.maj7': 'maj7', 'c.7': '7 (домінантсептакорд)',
  'c.m7': 'm7', 'c.m7b5': 'm7b5 (напівзменшений)', 'c.dim7': 'dim7', 'c.mMaj7': 'm(maj7)', 'c.7sus4': '7sus4', 'c.m9': 'm9', 'c.9': '9',
  'i.P1': 'Чиста прима', 'i.m2': 'Мала секунда', 'i.M2': 'Велика секунда', 'i.m3': 'Мала терція', 'i.M3': 'Велика терція',
  'i.P4': 'Чиста кварта', 'i.TT': 'Тритон', 'i.P5': 'Чиста квінта', 'i.m6': 'Мала секста', 'i.M6': 'Велика секста',
  'i.m7': 'Мала септима', 'i.M7': 'Велика септима', 'i.P8': 'Чиста октава',
};

const dicts: Record<string, Dict> = { en, uk };

export function t(key: string, vars: Record<string, string | number> = {}): string {
  const lang = (typeof document !== 'undefined' && document.documentElement.lang) || 'en';
  let s = (dicts[lang] ?? en)[key] ?? en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
