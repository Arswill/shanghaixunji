import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

// Guard for non-jsdom environments (e.g. @vitest-environment node tests)
const g = (typeof globalThis !== 'undefined' ? globalThis : {}) as any

// jsdom does not implement window.matchMedia. Several components (e.g.
// AppShell via useReducedMotion) query prefers-reduced-motion at runtime, so
// provide a default no-op MediaQueryList stub. Individual tests that need to
// assert specific match states (see useReducedMotion.test.ts) override this.
if (g.window && !g.window.matchMedia) {
  Object.defineProperty(g.window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// jsdom does not implement ResizeObserver. CanvasMap (D3 geo) uses it to
// track container size changes. Provide a no-op stub.
if (g.window && !g.window.ResizeObserver) {
  g.window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Reset the URL hash between tests so hash-based routing state does not
// leak across test cases (jsdom preserves window.location between tests).
afterEach(() => {
  if (g.window) g.window.location.hash = ''
})
