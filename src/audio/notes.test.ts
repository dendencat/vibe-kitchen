import { describe, expect, it } from 'vitest';
import { midi_to_frequency, note_to_midi, parse_pattern, parse_sequence } from './notes';

describe('notes', () => {
  it('converts note names to MIDI', () => {
    expect(note_to_midi('C4')).toBe(60);
    expect(note_to_midi('A4')).toBe(69);
    expect(note_to_midi('F#3')).toBe(54);
    expect(note_to_midi('Bb5')).toBe(82);
    expect(() => note_to_midi('H2')).toThrow('Invalid note');
  });

  it('converts MIDI to frequency', () => {
    expect(midi_to_frequency(69)).toBe(440);
    expect(midi_to_frequency(81)).toBe(880);
  });

  it('parses sequences with ties, rests and bar lines', () => {
    expect(parse_sequence('C4 - - . | E4 . - G4')).toEqual({
      steps: 8,
      events: [
        { step: 0, midi: 60, length: 3 },
        { step: 4, midi: 64, length: 1 },
        { step: 7, midi: 67, length: 1 },
      ],
    });
    expect(parse_sequence('- C4').events).toEqual([{ step: 1, midi: 60, length: 1 }]);
  });

  it('parses rhythm patterns with accents and holds', () => {
    expect(parse_pattern('X.x-R-..O')).toEqual([
      { step: 0, velocity: 1, length: 1, symbol: 'X' },
      { step: 2, velocity: 0.7, length: 2, symbol: 'x' },
      { step: 4, velocity: 0.7, length: 2, symbol: 'R' },
      { step: 8, velocity: 0.7, length: 1, symbol: 'O' },
    ]);
    expect(parse_pattern('-x')).toHaveLength(1);
  });
});
