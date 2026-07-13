import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CreatureAmbience } from './CreatureAmbience'

function createMockAudioContext(): AudioContext {
  return {
    state: 'running',
    sampleRate: 44100,
    currentTime: 0,
    resume: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    destination: {} as AudioDestinationNode,
    createOscillator: vi.fn(() => ({
      type: 'sine',
      frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(function (this: ReturnType<typeof createMockOscillator>) {
        return this
      }),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    })),
    createGain: vi.fn(() => ({
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      connect: vi.fn(function (this: ReturnType<typeof createMockGain>) {
        return this
      }),
      disconnect: vi.fn(),
    })),
    createBiquadFilter: vi.fn(() => ({
      type: 'lowpass',
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: vi.fn(function (this: ReturnType<typeof createMockFilter>) {
        return this
      }),
      disconnect: vi.fn(),
    })),
    createBuffer: vi.fn((_: number, length: number, sampleRate: number) => ({
      length,
      sampleRate,
      getChannelData: vi.fn(() => new Float32Array(length)),
    })),
    createBufferSource: vi.fn(() => ({
      buffer: null,
      loop: false,
      connect: vi.fn(function (this: ReturnType<typeof createMockBufferSource>) {
        return this
      }),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    })),
  } as unknown as AudioContext
}

function createMockOscillator() {
  return {
    type: 'sine',
    frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(function () {
      return this
    }),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
  }
}

function createMockGain() {
  return {
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    },
    connect: vi.fn(function () {
      return this
    }),
    disconnect: vi.fn(),
  }
}

function createMockFilter() {
  return {
    type: 'lowpass',
    frequency: { value: 0 },
    Q: { value: 0 },
    connect: vi.fn(function () {
      return this
    }),
    disconnect: vi.fn(),
  }
}

function createMockBufferSource() {
  return {
    buffer: null,
    loop: false,
    connect: vi.fn(function () {
      return this
    }),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
  }
}

let mockCtx: AudioContext

beforeEach(() => {
  mockCtx = createMockAudioContext()
  vi.stubGlobal(
    'AudioContext',
    function () {
      return mockCtx
    } as unknown as typeof AudioContext,
  )
  vi.stubGlobal(
    'webkitAudioContext',
    function () {
      return mockCtx
    } as unknown as typeof AudioContext,
  )
  vi.useFakeTimers()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('CreatureAmbience', () => {
  it('renders play button with personality label', () => {
    render(<CreatureAmbience personality="ferocious" />)
    expect(screen.getByTestId('ambience-toggle')).toBeInTheDocument()
    expect(screen.getByText('凶猛')).toBeInTheDocument()
  })

  it('toggles play and pause', () => {
    render(<CreatureAmbience personality="auspicious" />)
    const button = screen.getByTestId('ambience-toggle')

    expect(button).toHaveTextContent('▶ 氛围音')
    fireEvent.click(button)
    expect(button).toHaveTextContent('■ 暂停氛围')

    fireEvent.click(button)
    expect(button).toHaveTextContent('▶ 氛围音')
  })

  it('shows unsupported message when AudioContext is unavailable', () => {
    vi.unstubAllGlobals()
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('webkitAudioContext', undefined)

    render(<CreatureAmbience personality="mysterious" />)
    fireEvent.click(screen.getByTestId('ambience-toggle'))
    expect(screen.getByText(/当前环境不支持 Web Audio/)).toBeInTheDocument()
  })
})
