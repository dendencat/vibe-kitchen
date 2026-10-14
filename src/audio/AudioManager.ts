import { midi_to_frequency } from './notes';
import { compile_track, find_track, type CompiledTrack, type StepEvent } from './tracks';

export type SoundEffect = 'click' | 'coin' | 'success' | 'error' | 'day' | 'event' | 'fanfare';

/** Scheduling window (seconds) — how far ahead notes are queued. */
const LOOKAHEAD_SECONDS = 0.12;
const SCHEDULER_INTERVAL_MS = 25;
const MUSIC_FADE_SECONDS = 0.35;

export interface TimerApi {
  setInterval(handler: () => void, ms: number): number;
  clearInterval(id: number): void;
}

interface Graph {
  ctx: AudioContext;
  master: GainNode;
  music: GainNode;
  sfx: GainNode;
  echoSend: GainNode;
  noise: AudioBuffer;
}

/**
 * Creates the browser AudioContext, or null when Web Audio is unavailable.
 */
export function create_default_context(): AudioContext | null {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

/**
 * Background music sequencer + sound effects, synthesized with Web Audio.
 * The context is created lazily on the first user gesture (autoplay policy).
 */
export class AudioManager {
  private graph: Graph | null = null;
  private trackId = 'off';
  private step = 0;
  private nextStepTime = 0;
  private timer: number | null = null;
  private musicVolume = 0.6;
  private sfxVolume = 0.7;
  private muted = false;
  private unavailable = false;

  constructor(
    private readonly createContext: () => AudioContext | null = create_default_context,
    private readonly timers: TimerApi = window
  ) {}

  /**
   * Creates/resumes the audio context. Call from a user gesture handler.
   * @returns Whether audio is available.
   */
  unlock(): boolean {
    const graph = this.ensure_graph();
    if (graph && graph.ctx.state === 'suspended') {
      void graph.ctx.resume();
    }
    return graph !== null;
  }

  /**
   * Selects the background track (`off` stops music). Starts playback when audio is unlocked.
   * @param id - Track id from `TRACKS`, or `off`.
   */
  set_track(id: string): void {
    const definition = find_track(id);
    this.trackId = definition ? id : 'off';
    const { graph } = this;
    if (!graph) return;

    this.stop_scheduler();
    this.fade_music(graph, 0, MUSIC_FADE_SECONDS);
    if (!definition) return;
    const track = compile_track(definition);

    // Start the new loop just after the fade-out so tails do not clash.
    this.step = 0;
    this.nextStepTime = graph.ctx.currentTime + MUSIC_FADE_SECONDS;
    graph.music.gain.setValueAtTime(this.effective_music_volume(), this.nextStepTime);
    this.timer = this.timers.setInterval(() => this.schedule(graph, track), SCHEDULER_INTERVAL_MS);
    this.schedule(graph, track);
  }

  /** Currently selected track id (`off` when none). */
  get_track(): string {
    return this.trackId;
  }

  /** Whether the music scheduler is running. */
  is_playing(): boolean {
    return this.timer !== null;
  }

  /**
   * Sets music volume (0..1).
   * @param volume - Linear gain.
   */
  set_music_volume(volume: number): void {
    this.musicVolume = Math.min(1, Math.max(0, volume));
    this.apply_volumes();
  }

  /**
   * Sets sound-effect volume (0..1).
   * @param volume - Linear gain.
   */
  set_sfx_volume(volume: number): void {
    this.sfxVolume = Math.min(1, Math.max(0, volume));
    this.apply_volumes();
  }

  /**
   * Mutes or unmutes everything.
   * @param muted - Mute flag.
   */
  set_muted(muted: boolean): void {
    this.muted = muted;
    this.apply_volumes();
  }

  /** Whether output is muted. */
  is_muted(): boolean {
    return this.muted;
  }

  /** Suspends the audio clock (e.g. while paused or hidden). */
  suspend(): void {
    if (this.graph?.ctx.state === 'running') void this.graph.ctx.suspend();
  }

  /** Resumes the audio clock. */
  resume(): void {
    if (this.graph?.ctx.state === 'suspended') void this.graph.ctx.resume();
  }

  /**
   * Plays a short synthesized sound effect.
   * @param effect - Effect name.
   */
  play_sfx(effect: SoundEffect): void {
    const { graph } = this;
    if (!graph || this.muted || this.sfxVolume === 0) return;
    const t = graph.ctx.currentTime + 0.01;
    const tone = (midi: number, at: number, duration: number, wave: OscillatorType, gain = 0.25) =>
      this.tone(graph, graph.sfx, { midi, time: at, duration, wave, gain });
    switch (effect) {
      case 'click':
        tone(96, t, 0.03, 'square', 0.08);
        break;
      case 'coin':
        tone(83, t, 0.07, 'square', 0.15);
        tone(88, t + 0.07, 0.18, 'square', 0.15);
        break;
      case 'success':
        [72, 76, 79, 84].forEach((midi, i) => tone(midi, t + i * 0.06, 0.12, 'triangle', 0.25));
        break;
      case 'error':
        tone(57, t, 0.1, 'sawtooth', 0.12);
        tone(55, t + 0.11, 0.18, 'sawtooth', 0.12);
        break;
      case 'day':
        [76, 79, 84].forEach((midi, i) => tone(midi, t + i * 0.1, 0.5, 'triangle', 0.22));
        break;
      case 'event':
        tone(76, t, 0.12, 'square', 0.12);
        tone(81, t + 0.12, 0.25, 'square', 0.12);
        break;
      default:
        [72, 76, 79, 84, 88].forEach((midi, i) => tone(midi, t + i * 0.09, 0.3, 'square', 0.14));
        tone(91, t + 0.5, 0.9, 'triangle', 0.25);
    }
  }

  /** Stops music and closes the context. */
  dispose(): void {
    this.stop_scheduler();
    void this.graph?.ctx.close();
    this.graph = null;
  }

  private ensure_graph(): Graph | null {
    if (this.graph || this.unavailable) return this.graph;
    let ctx: AudioContext | null = null;
    try {
      ctx = this.createContext();
    } catch {
      ctx = null;
    }
    if (!ctx) {
      this.unavailable = true;
      return null;
    }

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.ratio.value = 4;
    compressor.connect(ctx.destination);

    const master = ctx.createGain();
    master.connect(compressor);
    const music = ctx.createGain();
    music.connect(master);
    const sfx = ctx.createGain();
    sfx.connect(master);

    // Simple feedback echo for the lead voice
    const echoSend = ctx.createGain();
    const delay = ctx.createDelay(1);
    const feedback = ctx.createGain();
    delay.delayTime.value = 0.28;
    feedback.gain.value = 0.32;
    echoSend.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(music);

    const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    this.graph = { ctx, master, music, sfx, echoSend, noise };
    this.apply_volumes();
    if (this.trackId !== 'off') this.set_track(this.trackId);
    return this.graph;
  }

  private effective_music_volume(): number {
    return this.muted ? 0 : this.musicVolume * 0.8;
  }

  private apply_volumes(): void {
    const { graph } = this;
    if (!graph) return;
    const now = graph.ctx.currentTime;
    graph.music.gain.setTargetAtTime(this.effective_music_volume(), now, 0.05);
    graph.sfx.gain.setTargetAtTime(this.muted ? 0 : this.sfxVolume, now, 0.02);
  }

  private fade_music(graph: Graph, to: number, seconds: number): void {
    const now = graph.ctx.currentTime;
    graph.music.gain.cancelScheduledValues(now);
    graph.music.gain.setValueAtTime(graph.music.gain.value, now);
    graph.music.gain.linearRampToValueAtTime(to, now + seconds);
  }

  private stop_scheduler(): void {
    if (this.timer !== null) {
      this.timers.clearInterval(this.timer);
      this.timer = null;
    }
  }

  private schedule(graph: Graph, track: CompiledTrack): void {
    const stepDuration = 60 / track.definition.bpm / 4;
    while (this.nextStepTime < graph.ctx.currentTime + LOOKAHEAD_SECONDS) {
      const swing = this.step % 2 === 1 ? track.definition.swing * stepDuration : 0;
      track.timeline[this.step].forEach(event =>
        this.play_event(graph, track, event, this.nextStepTime + swing, stepDuration)
      );
      this.nextStepTime += stepDuration;
      this.step = (this.step + 1) % track.steps;
    }
  }

  private play_event(
    graph: Graph,
    track: CompiledTrack,
    event: StepEvent,
    time: number,
    stepDuration: number
  ): void {
    const { definition } = track;
    const duration = event.length * stepDuration;
    switch (event.voice) {
      case 'lead':
        this.tone(graph, graph.music, {
          midi: event.midi,
          time,
          duration: duration * 0.9,
          wave: definition.lead.wave,
          gain: definition.lead.gain,
          echo: definition.lead.echo,
        });
        break;
      case 'bass':
        this.tone(graph, graph.music, {
          midi: event.midi,
          time,
          duration: duration * 0.85,
          wave: definition.bass.wave,
          gain: definition.bass.gain * event.velocity,
          cutoff: definition.bass.cutoff,
        });
        break;
      case 'chord':
        this.tone(graph, graph.music, {
          midi: event.midi,
          time,
          duration: Math.max(duration * 0.8, 0.08),
          wave: definition.chords.wave,
          gain: definition.chords.gain * event.velocity,
          cutoff: 2600,
        });
        break;
      case 'kick':
        this.kick(graph, time, definition.drums.gain * event.velocity);
        break;
      case 'snare':
        this.noise_hit(
          graph,
          time,
          0.16,
          'bandpass',
          1800,
          definition.drums.gain * 0.55 * event.velocity
        );
        this.tone(graph, graph.music, {
          midi: 55,
          time,
          duration: 0.06,
          wave: 'triangle',
          gain: 0.1,
        });
        break;
      default:
        this.noise_hit(
          graph,
          time,
          0.04,
          'highpass',
          7000,
          definition.drums.gain * 0.22 * event.velocity
        );
    }
  }

  private tone(
    graph: Graph,
    destination: AudioNode,
    options: {
      midi: number;
      time: number;
      duration: number;
      wave: OscillatorType;
      gain: number;
      cutoff?: number;
      echo?: number;
    }
  ): void {
    const { ctx } = graph;
    const { midi, time, duration, wave, gain, cutoff, echo } = options;
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(midi_to_frequency(midi), time);

    const env = ctx.createGain();
    const attack = 0.005;
    const release = Math.min(0.12, duration * 0.5);
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(gain, time + attack);
    env.gain.setTargetAtTime(gain * 0.6, time + attack, duration * 0.4);
    env.gain.setTargetAtTime(0, time + duration, release / 3);

    let head: AudioNode = osc;
    if (cutoff) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cutoff;
      osc.connect(filter);
      head = filter;
    }
    head.connect(env);
    env.connect(destination);
    if (echo) {
      const send = ctx.createGain();
      send.gain.value = echo;
      env.connect(send);
      send.connect(graph.echoSend);
    }
    osc.start(time);
    osc.stop(time + duration + release + 0.05);
  }

  private kick(graph: Graph, time: number, gain: number): void {
    const { ctx } = graph;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    env.gain.setValueAtTime(gain, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(env);
    env.connect(graph.music);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  private noise_hit(
    graph: Graph,
    time: number,
    duration: number,
    type: BiquadFilterType,
    frequency: number,
    gain: number
  ): void {
    const { ctx } = graph;
    const source = ctx.createBufferSource();
    source.buffer = graph.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + duration);
    source.connect(filter);
    filter.connect(env);
    env.connect(graph.music);
    source.start(time);
    source.stop(time + duration + 0.02);
  }
}
