import { vi } from 'vitest';

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(callback => {
  return setTimeout(() => callback(performance.now()), 16);
});

// Mock cancelAnimationFrame
global.cancelAnimationFrame = vi.fn(id => {
  clearTimeout(id);
});

// Mock performance.now
if (typeof performance === 'undefined') {
  global.performance = {
    now: vi.fn(() => Date.now())
  } as Performance;
}