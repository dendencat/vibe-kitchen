import { describe, expect, it } from 'vitest';
import { parse_sequence } from './notes';
import { compile_track, find_track, TRACKS, type TrackDefinition } from './tracks';

describe('tracks', () => {
  it('ships several distinct upbeat loops', () => {
    expect(TRACKS.length).toBeGreaterThanOrEqual(4);
    expect(new Set(TRACKS.map(t => t.id)).size).toBe(TRACKS.length);
    TRACKS.forEach(track => {
      expect(track.bpm).toBeGreaterThanOrEqual(100);
      expect(track.bpm).toBeLessThanOrEqual(160);
    });
  });

  it.each(TRACKS.map(t => [t.id, t] as const))(
    '%s: melody length matches the progression',
    (_id, track) => {
      expect(parse_sequence(track.lead.notes).steps).toBe(track.progression.length * 16);
      [
        track.bass.pattern,
        track.chords.pattern,
        track.drums.kick,
        track.drums.snare,
        track.drums.hat,
      ].forEach(p => expect(p).toHaveLength(16));
    }
  );

  it('compiles every voice into the timeline', () => {
    const compiled = compile_track(TRACKS[0]);
    expect(compiled.steps).toBe(128);
    const voices = new Set(compiled.timeline.flat().map(e => e.voice));
    expect([...voices].sort()).toEqual(['bass', 'chord', 'hat', 'kick', 'lead', 'snare']);
  });

  it('maps bass symbols to root, octave and fifth', () => {
    const track: TrackDefinition = {
      ...TRACKS[0],
      progression: [{ root: 'C2', notes: ['C4', 'E4', 'G4'] }],
      lead: { ...TRACKS[0].lead, notes: '. . . . . . . . . . . . . . . .' },
      bass: { ...TRACKS[0].bass, pattern: 'R...O...F.......' },
    };
    const bass = compile_track(track)
      .timeline.flat()
      .filter(e => e.voice === 'bass');
    expect(bass.map(e => e.midi)).toEqual([36, 48, 43]);
  });

  it('arpeggiates chords in arp mode', () => {
    const track: TrackDefinition = {
      ...TRACKS[0],
      progression: [{ root: 'C2', notes: ['C4', 'E4', 'G4'] }],
      lead: { ...TRACKS[0].lead, notes: '. . . . . . . . . . . . . . . .' },
      chords: { ...TRACKS[0].chords, pattern: 'xxxx............', mode: 'arp' },
    };
    const chords = compile_track(track)
      .timeline.flat()
      .filter(e => e.voice === 'chord');
    expect(chords.map(e => e.midi)).toEqual([60, 64, 67, 60]);
  });

  it('finds tracks by id', () => {
    expect(find_track('lunchRush')?.bpm).toBe(150);
    expect(find_track('missing')).toBeUndefined();
  });
});
