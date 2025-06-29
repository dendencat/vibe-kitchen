// Test setup file for AI Restaurant Battle
import { vi } from 'vitest';

// Mock DOM APIs
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'requestAnimationFrame', {
  value: vi.fn((callback: FrameRequestCallback) => {
    return setTimeout(() => callback(Date.now()), 16);
  }),
  writable: true,
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: vi.fn(),
  writable: true,
});

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
}));

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36)),
  },
  writable: true,
});

// Global test utilities
global.createMockElement = (id: string) => {
  const element = document.createElement('div');
  element.id = id;
  document.body.appendChild(element);
  return element;
};

global.createMockCanvas = (id: string) => {
  const canvas = document.createElement('canvas');
  canvas.id = id;
  canvas.width = 600;
  canvas.height = 400;
  document.body.appendChild(canvas);
  return canvas;
};