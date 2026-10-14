import { vi } from 'vitest';

/** Records AudioParam automation calls. */
export function fake_param(value = 1) {
  return {
    value,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
}

function node(extra: Record<string, unknown> = {}) {
  return { connect: vi.fn(), disconnect: vi.fn(), ...extra };
}

/**
 * Minimal stand-in for `AudioContext` that counts created nodes.
 */
export class FakeAudioContext {
  currentTime = 0;
  sampleRate = 8000;
  state: AudioContextState = 'suspended';
  destination = node();
  created: Record<string, number> = {};
  oscillators: Array<{ type: string; start: ReturnType<typeof vi.fn> }> = [];
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  suspend = vi.fn(async () => {
    this.state = 'suspended';
  });
  close = vi.fn(async () => {
    this.state = 'closed';
  });

  private count(kind: string): void {
    this.created[kind] = (this.created[kind] ?? 0) + 1;
  }

  createDynamicsCompressor() {
    this.count('compressor');
    return node({ threshold: fake_param(), ratio: fake_param() });
  }

  createGain() {
    this.count('gain');
    return node({ gain: fake_param() });
  }

  createDelay() {
    this.count('delay');
    return node({ delayTime: fake_param() });
  }

  createBuffer(_channels: number, length: number) {
    this.count('buffer');
    const data = new Float32Array(length);
    return { getChannelData: () => data };
  }

  createOscillator() {
    this.count('oscillator');
    const osc = node({ type: 'sine', frequency: fake_param(), start: vi.fn(), stop: vi.fn() });
    this.oscillators.push(osc as unknown as { type: string; start: ReturnType<typeof vi.fn> });
    return osc;
  }

  createBiquadFilter() {
    this.count('filter');
    return node({ type: 'lowpass', frequency: fake_param() });
  }

  createBufferSource() {
    this.count('noise');
    return node({ buffer: null, start: vi.fn(), stop: vi.fn() });
  }
}

/** Manual interval timer for driving the scheduler in tests. */
export class FakeTimers {
  handlers = new Map<number, () => void>();
  private next = 1;

  setInterval = (handler: () => void): number => {
    const id = this.next++;
    this.handlers.set(id, handler);
    return id;
  };

  clearInterval = (id: number): void => {
    this.handlers.delete(id);
  };

  run(): void {
    this.handlers.forEach(handler => handler());
  }
}
