import { TRACKS } from '../audio/tracks';
import { h } from './dom';

let pickerCounter = 0;

/**
 * Radio group for choosing background music (plus "off").
 */
export class TrackPicker {
  readonly root: HTMLElement;
  private readonly inputs = new Map<string, HTMLInputElement>();

  /**
   * @param onChange - Called with the chosen track id (`off` for silence).
   */
  constructor(private readonly onChange: (id: string) => void) {
    pickerCounter += 1;
    const name = `bgm-${pickerCounter}`;
    const option = (id: string, titleKey: string, moodKey: string | null, icon: string) => {
      const input = h('input', {
        className: 'visually-hidden',
        attrs: { type: 'radio', name, value: id },
        on: { change: () => this.onChange(id) },
      });
      this.inputs.set(id, input);
      return h(
        'label',
        { className: 'track-option', dataset: { track: id } },
        input,
        h('span', { className: 'track-icon', text: icon, attrs: { 'aria-hidden': 'true' } }),
        h(
          'span',
          { className: 'track-text' },
          h('strong', { i18n: titleKey }),
          moodKey ? h('small', { i18n: moodKey }) : null
        ),
        h('span', { className: 'eq', attrs: { 'aria-hidden': 'true' } }, h('i'), h('i'), h('i'))
      );
    };
    const icons = ['🌸', '🍳', '🌃', '⚡'];
    this.root = h(
      'div',
      { className: 'track-picker', attrs: { role: 'radiogroup' } },
      ...TRACKS.map((track, i) =>
        option(
          track.id,
          `tracks.${track.id}.name`,
          `tracks.${track.id}.mood`,
          icons[i % icons.length]
        )
      ),
      option('off', 'musicOff', null, '🔇')
    );
  }

  /**
   * Reflects the selected track without firing `onChange`.
   * @param id - Selected track id.
   */
  set_value(id: string): void {
    this.inputs.forEach((input, key) => {
      input.checked = key === id;
      input.closest('.track-option')?.classList.toggle('active', key === id);
    });
  }
}
