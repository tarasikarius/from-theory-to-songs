// Which instrument a widget's play buttons sound with: piano (the default) or guitar.
// Each widget keeps its own choice, so switching one widget leaves the others as they are; nothing is remembered.
// Clicking the fretboard always sounds as guitar and clicking the piano keys as piano, whatever is chosen here.
import { field, select } from './dom';
import { t } from './strings';

export type Lead = 'pluck' | 'keys';

export class SoundChoice {
  /** Voice for scales, chords and intervals played from this widget's buttons. */
  voice: Lead = 'keys';

  /** A "Sound" select for this widget's control row. */
  field(): HTMLLabelElement {
    return field(t('sound'), select(
      [{ value: 'keys', label: t('soundPiano') }, { value: 'pluck', label: t('soundGuitar') }],
      this.voice, v => { this.voice = v as Lead; }));
  }
}
