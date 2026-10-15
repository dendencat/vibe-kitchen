/**
 * Note parsing helpers for the tracker-style music format.
 */

const PITCH_CLASSES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * Converts a note name such as `C4`, `F#3` or `Bb5` to a MIDI number.
 * @throws Error on malformed names.
 */
export function note_to_midi(name: string): number {
  const match = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!match) throw new Error(`Invalid note: ${name}`);
  const [, letter, accidental, octave] = match;
  const offset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  return (Number(octave) + 1) * 12 + PITCH_CLASSES[letter] + offset;
}

/**
 * Equal-tempered frequency for a MIDI note (A4 = 440 Hz).
 * @param midi - MIDI note number.
 */
export function midi_to_frequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export interface NoteEvent {
  step: number;
  midi: number;
  length: number;
}

/**
 * Tokenizes a sequence string, ignoring `|` bar separators.
 * @param source - Whitespace separated tokens.
 */
function tokenize(source: string): string[] {
  return source.split(/\s+/).filter(token => token.length > 0 && token !== '|');
}

/**
 * Parses a melody string: note names start a note, `-` extends the previous
 * note by one step and `.` is a rest. Each token is one 16th-note step.
 * @param source - Sequence string.
 * @returns Note events and the total step count.
 */
export function parse_sequence(source: string): { events: NoteEvent[]; steps: number } {
  const events: NoteEvent[] = [];
  let current: NoteEvent | null = null;
  const tokens = tokenize(source);
  tokens.forEach((token, step) => {
    if (token === '-') {
      if (current) current.length += 1;
      return;
    }
    if (token === '.') {
      current = null;
      return;
    }
    current = { step, midi: note_to_midi(token), length: 1 };
    events.push(current);
  });
  return { events, steps: tokens.length };
}

export interface PatternHit {
  step: number;
  velocity: number;
  length: number;
}

/**
 * Parses a one-bar rhythm string: `x` hit, `X` accented hit, `-` hold, `.` rest.
 * Bass patterns may also use `R` (root), `O` (octave) and `F` (fifth); the
 * returned `symbol` tells which.
 * @param pattern - Rhythm string without spaces.
 */
export function parse_pattern(pattern: string): Array<PatternHit & { symbol: string }> {
  const hits: Array<PatternHit & { symbol: string }> = [];
  let current: (PatternHit & { symbol: string }) | null = null;
  [...pattern].forEach((symbol, step) => {
    if (symbol === '-') {
      if (current) current.length += 1;
      return;
    }
    if (symbol === '.') {
      current = null;
      return;
    }
    current = { step, velocity: symbol === 'X' ? 1 : 0.7, length: 1, symbol };
    hits.push(current);
  });
  return hits;
}
