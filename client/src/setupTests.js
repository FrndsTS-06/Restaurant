import '@testing-library/jest-dom';

// Resolve relative fetch URLs in jsdom test runner
const originalFetch = globalThis.fetch;
if (originalFetch) {
  globalThis.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith('/')) {
      input = `http://localhost:5000${input}`;
    }
    return originalFetch(input, init);
  };
}

const OriginalRequest = globalThis.Request;
if (OriginalRequest) {
  globalThis.Request = class extends OriginalRequest {
    constructor(input, init) {
      if (typeof input === 'string' && input.startsWith('/')) {
        input = `http://localhost:5000${input}`;
      }
      super(input, init);
    }
  };
}

const root = (new Function('return this'))();
const raf = (cb) => setTimeout(cb, 0);
const caf = (id) => clearTimeout(id);

globalThis.requestAnimationFrame = raf;
globalThis.cancelAnimationFrame = caf;
if (typeof window !== 'undefined') {
  window.requestAnimationFrame = raf;
  window.cancelAnimationFrame = caf;
}
if (typeof global !== 'undefined') {
  global.requestAnimationFrame = raf;
  global.cancelAnimationFrame = caf;
}
if (typeof process !== 'undefined') {
  process.requestAnimationFrame = raf;
  process.cancelAnimationFrame = caf;
}
if (root) {
  root.requestAnimationFrame = raf;
  root.cancelAnimationFrame = caf;
}

// Polyfill ResizeObserver for jsdom test runner
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver || MockResizeObserver;
if (typeof window !== 'undefined') {
  window.ResizeObserver = window.ResizeObserver || MockResizeObserver;
}

// Polyfill IntersectionObserver for jsdom test runner
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver = globalThis.IntersectionObserver || MockIntersectionObserver;
if (typeof window !== 'undefined') {
  window.IntersectionObserver = window.IntersectionObserver || MockIntersectionObserver;
}


