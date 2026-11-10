export const LANGS = ['uk', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'uk';

export const ui = {
  en: {
    siteTitle: 'From Theory to Songs',
    tagline: 'A complete course in music theory, harmony, composition and arrangement',
    audience: 'For guitarists (with piano as a second instrument) who write rock, metal and pop.',
    course: 'Course', tools: 'Practice tools', start: 'Start the course', contents: 'Course contents',
    module: 'Module', lesson: 'Lesson', prev: 'Previous', next: 'Next', toc: 'Lessons',
    intro: 'Introduction', appendices: 'Appendices', theme: 'Switch light / dark theme', langName: 'English',
    switchTo: 'Українською', skip: 'Skip to content', lessons: 'lessons',
    toolsIntro: 'Every interactive tool from the course in one place. Use them for daily drills.',
    homeHow: 'How it works',
    homeHow1: 'Read the idea', homeHow1d: 'Each lesson explains one concept in plain words.',
    homeHow2: 'See and hear it', homeHow2d: 'Interactive fretboard, piano, players and ear trainers sit inside the lessons.',
    homeHow3: 'Do the exercises', homeHow3d: 'The exercises are the course. Everything you read should be under your fingers within 24 hours.',
    tEar: 'Ear training', tExplore: 'Explore', tPlay: 'Play along', tQuiz: 'Theory quizzes',
    tIntervals: 'Intervals', tChords: 'Chord qualities', tSevenths: 'Seventh chords', tScales: 'Scales and modes',
    tProgs: 'Progressions', tScaleEx: 'Scales on the fretboard', tChordEx: 'Chord builder', tIntervalEx: 'Interval explorer',
    tCircle: 'Circle of fifths', tProgPlayer: 'Progression player', tMetronome: 'Metronome', tBeat: 'Drum and riff grid',
    tQuizIntervals: 'Intervals and spelling', tQuizHarmony: 'Keys and harmony',
    soundNote: 'Sound is generated in your browser. Turn the volume up, and on a phone switch off silent mode.',
    notFound: 'Page not found', backHome: 'Back to the course',
  },
  uk: {
    siteTitle: 'Від теорії до пісень',
    tagline: 'Повний курс теорії музики, гармонії, композиції та аранжування',
    audience: 'Для гітаристів (з фортепіано як другим інструментом), які пишуть рок, метал і поп.',
    course: 'Курс', tools: 'Тренажери', start: 'Почати курс', contents: 'Зміст курсу',
    module: 'Модуль', lesson: 'Урок', prev: 'Назад', next: 'Далі', toc: 'Уроки',
    intro: 'Вступ', appendices: 'Додатки', theme: 'Перемкнути світлу / темну тему', langName: 'Українська',
    switchTo: 'English', skip: 'Перейти до змісту', lessons: 'уроків',
    toolsIntro: 'Усі інтерактивні інструменти курсу в одному місці. Користуйтеся ними для щоденних вправ.',
    homeHow: 'Як це працює',
    homeHow1: 'Прочитайте ідею', homeHow1d: 'Кожен урок пояснює одне поняття простими словами.',
    homeHow2: 'Побачте й почуйте', homeHow2d: 'Інтерактивний гриф, клавіатура, програвачі та тренажери слуху вбудовані просто в уроки.',
    homeHow3: 'Зробіть вправи', homeHow3d: 'Вправи і є курс. Усе прочитане має опинитися під пальцями протягом 24 годин.',
    tEar: 'Тренування слуху', tExplore: 'Дослідження', tPlay: 'Гра під акомпанемент', tQuiz: 'Тести з теорії',
    tIntervals: 'Інтервали', tChords: 'Види акордів', tSevenths: 'Септакорди', tScales: 'Гами й лади',
    tProgs: 'Послідовності', tScaleEx: 'Гами на грифі', tChordEx: 'Конструктор акордів', tIntervalEx: 'Інтервали',
    tCircle: 'Квінтове коло', tProgPlayer: 'Програвач послідовностей', tMetronome: 'Метроном', tBeat: 'Сітка барабанів і рифу',
    tQuizIntervals: 'Інтервали та запис нот', tQuizHarmony: 'Тональності й гармонія',
    soundNote: 'Звук створюється у вашому браузері. Додайте гучність, а на телефоні вимкніть беззвучний режим.',
    notFound: 'Сторінку не знайдено', backHome: 'Повернутися до курсу',
  },
} as const;

export const moduleTitles: Record<Lang, string[]> = {
  en: [
    'Introduction',
    'Intervals: The Atoms of Music',
    'Scales: Your Melodic Vocabulary',
    'Chords: Building Every Chord You Need',
    'Diatonic Harmony: How Chords Work Together',
    'Rhythm, Meter and Riffcraft',
    'Melody: Writing Lines People Remember',
    'Song Form and Structure',
    'Beyond the Key: Color, Borrowed Chords and Modulation',
    'Arrangement and Production Thinking',
    'Lyrics and the Complete Songwriting Workflow',
    'Appendices',
  ],
  uk: [
    'Вступ',
    'Інтервали: атоми музики',
    'Гами: ваш мелодичний словник',
    'Акорди: як побудувати будь-який акорд',
    'Діатонічна гармонія: як акорди працюють разом',
    'Ритм, метр і мистецтво рифу',
    'Мелодія: лінії, які запам’ятовуються',
    'Форма та структура пісні',
    'За межами тональності: барви, запозичені акорди й модуляція',
    'Аранжування та продюсерське мислення',
    'Тексти та повний процес написання пісні',
    'Додатки',
  ],
};

export const isLang = (x: string | undefined): x is Lang => !!x && (LANGS as readonly string[]).includes(x);
export const other = (lang: Lang): Lang => (lang === 'uk' ? 'en' : 'uk');

/** Prefix a site path with the configured base. */
export function href(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + (path.startsWith('/') ? path : '/' + path);
}
