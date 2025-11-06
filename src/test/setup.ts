import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock $env/static/public for tests
vi.mock('$env/static/public', () => ({
  PUBLIC_POCKETBASE_URL: 'http://127.0.0.1:8090',
}));

// Provide a noop ResizeObserver for jsdom-based tests
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  value: ResizeObserverStub,
  writable: false,
});
