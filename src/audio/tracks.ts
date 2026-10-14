import { note_to_midi, parse_pattern, parse_sequence } from './notes';

/**
 * Original pop loops written for the game in a compact tracker format.
 * Each token is a 16th note; see `notes.ts` for the syntax.
 */

export interface ChordBar {
  root: string;
  notes: string[];
}

export interface TrackDefinition {
  id: string;
  bpm: number;
  /** 0..0.4 — delays every second 16th note for a shuffle feel. */
  swing: number;
  progression: ChordBar[];
  lead: { wave: OscillatorType; gain: number; notes: string; echo: number };
  bass: { wave: OscillatorType; gain: number; pattern: string; cutoff: number };
  chords: { wave: OscillatorType; gain: number; pattern: string; mode: 'stab' | 'arp' };
  drums: { kick: string; snare: string; hat: string; gain: number };
}

export type Voice = 'lead' | 'bass' | 'chord' | 'kick' | 'snare' | 'hat';

export interface StepEvent {
  voice: Voice;
  midi: number;
  length: number;
  velocity: number;
}

export interface CompiledTrack {
  definition: TrackDefinition;
  steps: number;
  /** Events indexed by step. */
  timeline: StepEvent[][];
}

const STEPS_PER_BAR = 16;

export const TRACKS: TrackDefinition[] = [
  {
    id: 'sakuraPop',
    bpm: 124,
    swing: 0,
    progression: [
      { root: 'F2', notes: ['F4', 'A4', 'C5'] },
      { root: 'G2', notes: ['G4', 'B4', 'D5'] },
      { root: 'E2', notes: ['E4', 'G4', 'B4'] },
      { root: 'A2', notes: ['A4', 'C5', 'E5'] },
      { root: 'F2', notes: ['F4', 'A4', 'C5'] },
      { root: 'G2', notes: ['G4', 'B4', 'D5'] },
      { root: 'E2', notes: ['E4', 'G4', 'B4'] },
      { root: 'A2', notes: ['A4', 'C5', 'E5'] },
    ],
    lead: {
      wave: 'square',
      gain: 0.07,
      echo: 0.3,
      notes: `
        E5 - G5 - A5 - - - C6 - A5 - G5 - E5 - |
        D5 - - - G5 - D5 - B4 - D5 - G5 - - - |
        E5 - G5 - B5 - - - A5 - G5 - E5 - D5 - |
        C5 - - - E5 - - - A4 - - - . . . . |
        A5 - - - G5 - A5 - C6 - - - A5 - G5 - |
        B5 - - - A5 - G5 - D5 - - - G5 - A5 - |
        B5 - - - G5 - E5 - G5 - B5 - D6 - - - |
        C6 - - - B5 - - - A5 - - - . . . .`,
    },
    bass: { wave: 'triangle', gain: 0.32, pattern: 'R.R.O.R.R.R.O.R.', cutoff: 900 },
    chords: { wave: 'triangle', gain: 0.05, pattern: '..x...x...x...x.', mode: 'stab' },
    drums: {
      kick: 'X.....x.X...x...',
      snare: '....X.......X...',
      hat: 'x.X.x.X.x.X.x.X.',
      gain: 0.5,
    },
  },
  {
    id: 'kitchenBounce',
    bpm: 108,
    swing: 0.18,
    progression: [
      { root: 'A2', notes: ['A3', 'C4', 'E4', 'G4'] },
      { root: 'D2', notes: ['D4', 'F#4', 'A4', 'C5'] },
      { root: 'A2', notes: ['A3', 'C4', 'E4', 'G4'] },
      { root: 'D2', notes: ['D4', 'F#4', 'A4', 'C5'] },
      { root: 'F2', notes: ['F3', 'A3', 'C4', 'E4'] },
      { root: 'E2', notes: ['E3', 'G#3', 'B3', 'D4'] },
      { root: 'A2', notes: ['A3', 'C4', 'E4', 'G4'] },
      { root: 'E2', notes: ['E3', 'G#3', 'B3', 'D4'] },
    ],
    lead: {
      wave: 'sawtooth',
      gain: 0.045,
      echo: 0.2,
      notes: `
        A4 . C5 . D5 - C5 A4 . . G4 . A4 - - - |
        . . F#5 - E5 . D5 . C5 - A4 . . . . . |
        A4 . C5 . D5 - E5 . G5 - E5 . D5 - C5 - |
        D5 - - - . . A4 . C5 . D5 - - - . . |
        E5 - - . E5 . F5 . E5 . C5 . A4 - - - |
        G#4 - - - B4 - - - D5 - - - E5 - - - |
        A5 . G5 . E5 . D5 . E5 - G5 . A5 - - - |
        . . B4 . D5 . E5 . G#5 - - - . . . .`,
    },
    bass: { wave: 'sawtooth', gain: 0.22, pattern: 'R..ROR..R.F.ORR.', cutoff: 600 },
    chords: { wave: 'square', gain: 0.03, pattern: '...x..x....x..x.', mode: 'stab' },
    drums: {
      kick: 'X.....x...X.....',
      snare: '....X..x....X...',
      hat: 'XxXxXxXxXxXxXxXx',
      gain: 0.5,
    },
  },
  {
    id: 'neonDiner',
    bpm: 112,
    swing: 0,
    progression: [
      { root: 'A2', notes: ['A3', 'C4', 'E4'] },
      { root: 'F2', notes: ['F3', 'A3', 'C4'] },
      { root: 'C3', notes: ['G3', 'C4', 'E4'] },
      { root: 'G2', notes: ['G3', 'B3', 'D4'] },
      { root: 'A2', notes: ['A3', 'C4', 'E4'] },
      { root: 'F2', notes: ['F3', 'A3', 'C4'] },
      { root: 'C3', notes: ['G3', 'C4', 'E4'] },
      { root: 'G2', notes: ['G3', 'B3', 'D4'] },
    ],
    lead: {
      wave: 'sawtooth',
      gain: 0.05,
      echo: 0.35,
      notes: `
        E5 - - - E5 - D5 - C5 - - - A4 - - - |
        C5 - - - C5 - D5 - E5 - F5 - E5 - D5 - |
        E5 - - - G5 - - - E5 - D5 - C5 - - - |
        D5 - - - - - - - B4 - C5 - D5 - - - |
        A5 - - - G5 - E5 - G5 - - - A5 - - - |
        A5 - G5 - F5 - E5 - F5 - - - C5 - - - |
        G5 - - - E5 - G5 - C6 - - - B5 - G5 - |
        D6 - - - B5 - - - G5 - - - . . . .`,
    },
    bass: { wave: 'square', gain: 0.16, pattern: 'RORORORORORORORO', cutoff: 700 },
    chords: { wave: 'triangle', gain: 0.045, pattern: 'x-------x-------', mode: 'stab' },
    drums: {
      kick: 'X...X...X...X...',
      snare: '....X.......X...',
      hat: '..x...x...x...x.',
      gain: 0.5,
    },
  },
  {
    id: 'lunchRush',
    bpm: 150,
    swing: 0,
    progression: [
      { root: 'G2', notes: ['G4', 'B4', 'D5'] },
      { root: 'E2', notes: ['E4', 'G4', 'B4'] },
      { root: 'C3', notes: ['C5', 'E5', 'G5'] },
      { root: 'D3', notes: ['D4', 'F#4', 'A4'] },
      { root: 'G2', notes: ['G4', 'B4', 'D5'] },
      { root: 'E2', notes: ['E4', 'G4', 'B4'] },
      { root: 'C3', notes: ['C5', 'E5', 'G5'] },
      { root: 'D3', notes: ['D4', 'F#4', 'A4'] },
    ],
    lead: {
      wave: 'square',
      gain: 0.06,
      echo: 0.15,
      notes: `
        G5 . B5 . D6 . B5 . G5 . A5 . B5 - - - |
        E5 . G5 . B5 . G5 . E5 . F#5 . G5 - - - |
        C6 . B5 . A5 . G5 . E5 . G5 . A5 - - - |
        D6 - - - C6 - B5 - A5 - - - F#5 - - - |
        B5 . B5 . D6 . B5 . A5 . G5 . A5 - B5 - |
        G5 . G5 . B5 . G5 . F#5 . E5 . F#5 - G5 - |
        E6 - - - D6 - C6 - B5 - C6 - D6 - - - |
        D6 - C6 - B5 - A5 - G5 - - - . . . .`,
    },
    bass: { wave: 'triangle', gain: 0.34, pattern: 'RORORORORORORORO', cutoff: 1200 },
    chords: { wave: 'square', gain: 0.025, pattern: 'xxxxxxxxxxxxxxxx', mode: 'arp' },
    drums: {
      kick: 'X...x...X...x...',
      snare: '....X.......X..x',
      hat: 'x.x.x.x.x.x.x.x.',
      gain: 0.45,
    },
  },
];

/**
 * Bass note for a pattern symbol relative to the chord root.
 * @param symbol - `R` root, `O` octave, `F` fifth.
 * @param root - Root MIDI note.
 */
function bass_note(symbol: string, root: number): number {
  if (symbol === 'O') return root + 12;
  if (symbol === 'F') return root + 7;
  return root;
}

/**
 * Expands a track definition into a per-step event timeline.
 * @param definition - Track to compile.
 */
export function compile_track(definition: TrackDefinition): CompiledTrack {
  const bars = definition.progression.length;
  const steps = bars * STEPS_PER_BAR;
  const timeline: StepEvent[][] = Array.from({ length: steps }, () => []);
  const push = (step: number, event: StepEvent): void => {
    timeline[step % steps].push(event);
  };

  parse_sequence(definition.lead.notes).events.forEach(({ step, midi, length }) =>
    push(step, { voice: 'lead', midi, length, velocity: 1 })
  );

  const bassHits = parse_pattern(definition.bass.pattern);
  const chordHits = parse_pattern(definition.chords.pattern);
  const drumHits: Array<[Voice, string]> = [
    ['kick', definition.drums.kick],
    ['snare', definition.drums.snare],
    ['hat', definition.drums.hat],
  ];

  definition.progression.forEach((bar, barIndex) => {
    const offset = barIndex * STEPS_PER_BAR;
    const root = note_to_midi(bar.root);
    const chordNotes = bar.notes.map(note_to_midi);

    bassHits.forEach(({ step, length, velocity, symbol }) =>
      push(offset + step, { voice: 'bass', midi: bass_note(symbol, root), length, velocity })
    );

    chordHits.forEach(({ step, length, velocity }, hitIndex) => {
      const notes =
        definition.chords.mode === 'arp' ? [chordNotes[hitIndex % chordNotes.length]] : chordNotes;
      notes.forEach(midi => push(offset + step, { voice: 'chord', midi, length, velocity }));
    });

    drumHits.forEach(([voice, pattern]) =>
      parse_pattern(pattern).forEach(({ step, velocity }) =>
        push(offset + step, { voice, midi: 0, length: 1, velocity })
      )
    );
  });

  return { definition, steps, timeline };
}

/**
 * Finds a track by id.
 * @param id - Track id.
 */
export function find_track(id: string): TrackDefinition | undefined {
  return TRACKS.find(track => track.id === id);
}
