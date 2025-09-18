import '@testing-library/jest-dom/vitest';

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
