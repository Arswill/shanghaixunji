import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreatureChat } from './CreatureChat'
import { SUGGESTED_QUESTIONS } from './chatPrompts'
import { sendChatMessage } from './chatApi'
import { useBondStore } from '../bond/bondStore'
import type { Creature } from '../data/creatures.schema'

// Mock chatApi. sendChatMessage resolves to { content, isOffline }.
vi.mock('./chatApi', () => ({
  sendChatMessage: vi.fn().mockResolvedValue({
    content: '吾乃毕方，火之兆也。',
    isOffline: false,
  }),
}))

const mockCreature: Creature = {
  id: 'bi-fang',
  name: '毕方',
  pinyin: 'Bì Fāng',
  province: '陕西',
  original_text: '有鸟焉，名曰毕方。',
  source: '《山海经·西山经》',
  translation: 'A fire bird',
  modern_location: '今陕西',
  confidence: 'high',
  confidence_notes: '',
  description: 'Fire bird',
  scroll: '西山经',
  art_description: 'crane',
}

/**
 * jsdom does not implement the Web Speech API. Provide a minimal mock so the
 * voice button can be exercised without a real browser.
 */
function mockSpeechApi() {
  const speak = vi.fn()
  const cancel = vi.fn()
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    writable: true,
    value: {
      speak,
      cancel,
      getVoices: vi.fn(() => []),
      pending: false,
      speaking: false,
      paused: false,
      onvoiceschanged: null,
      resume: vi.fn(),
      pause: vi.fn(),
    },
  })
  // Must be a regular function (not an arrow) so `new SpeechSynthesisUtterance(...)`
  // works — arrow functions cannot be used as constructors.
  function MockUtterance(this: any, text: string) {
    this.text = text
    this.lang = ''
    this.rate = 1
    this.pitch = 1
    this.volume = 1
    this.voice = null
    this.onstart = null
    this.onend = null
    this.onerror = null
    this.onboundary = null
    this.onpause = null
    this.onresume = null
    this.onmark = null
  }
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    configurable: true,
    writable: true,
    value: vi.fn(MockUtterance as any),
  })
}

describe('CreatureChat', () => {
  beforeEach(() => {
    mockSpeechApi()
    useBondStore.getState().reset()
    // Reset the chat mock to a stable online default for every test. Tests
    // that need offline / delayed behaviour override it in their own body.
    vi.mocked(sendChatMessage).mockReset()
    vi.mocked(sendChatMessage).mockResolvedValue({
      content: '吾乃毕方，火之兆也。',
      isOffline: false,
    })
  })

  it('renders chat header with creature name', () => {
    render(<CreatureChat creature={mockCreature} />)
    expect(screen.getByText(/与毕方对话/)).toBeInTheDocument()
  })

  it('shows eight suggested questions initially', () => {
    render(<CreatureChat creature={mockCreature} />)
    expect(SUGGESTED_QUESTIONS).toHaveLength(8)
    expect(screen.getByText('你是谁？')).toBeInTheDocument()
    expect(screen.getByText('你的出处是？')).toBeInTheDocument()
    expect(screen.getByText('你和其他神兽什么关系？')).toBeInTheDocument()
  })

  it('sends message on button click', async () => {
    render(<CreatureChat creature={mockCreature} />)
    const input = screen.getByTestId('chat-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: '你好' } })
    fireEvent.click(screen.getByTestId('chat-send'))

    await waitFor(() => {
      expect(screen.getByText('你好')).toBeInTheDocument()
    })
  })

  it('sends message on Enter key', async () => {
    render(<CreatureChat creature={mockCreature} />)
    const input = screen.getByTestId('chat-input')
    fireEvent.change(input, { target: { value: '测试' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('测试')).toBeInTheDocument()
    })
  })

  it('disables send button when input is empty', () => {
    render(<CreatureChat creature={mockCreature} />)
    expect(screen.getByTestId('chat-send')).toBeDisabled()
  })

  it('shows loading indicator while waiting', async () => {
    vi.mocked(sendChatMessage).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ content: '回复', isOffline: false }), 100)
        )
    )

    render(<CreatureChat creature={mockCreature} />)
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: '你好' } })
    fireEvent.click(screen.getByTestId('chat-send'))

    await waitFor(() => {
      expect(screen.getByTestId('chat-loading')).toBeInTheDocument()
    })
  })

  it('shows the online badge by default', () => {
    render(<CreatureChat creature={mockCreature} />)
    expect(screen.getByTestId('chat-mode-badge')).toHaveTextContent('在线模式')
  })

  it('shows offline badge and notice on first offline reply', async () => {
    vi.mocked(sendChatMessage).mockResolvedValueOnce({
      content: '离线回复',
      isOffline: true,
    })

    render(<CreatureChat creature={mockCreature} />)
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: '你好' } })
    fireEvent.click(screen.getByTestId('chat-send'))

    await waitFor(() => {
      expect(screen.getByText('离线模式')).toBeInTheDocument()
    })
    expect(screen.getByText(/当前为离线模式/)).toBeInTheDocument()
    // The reply is revealed via the typewriter, so wait for the full text.
    await waitFor(() => {
      expect(screen.getByText('离线回复')).toBeInTheDocument()
    })
  })

  it('does not repeat the offline notice on subsequent offline replies', async () => {
    vi.mocked(sendChatMessage).mockResolvedValue({
      content: '离线回复',
      isOffline: true,
    })

    render(<CreatureChat creature={mockCreature} />)
    const input = screen.getByTestId('chat-input')
    const send = screen.getByTestId('chat-send')

    fireEvent.change(input, { target: { value: '你好' } })
    fireEvent.click(send)

    await waitFor(() => {
      expect(screen.getByText(/当前为离线模式/)).toBeInTheDocument()
    })
    // Wait for the first reply to finish typing so the input re-enables
    // before we send the second message.
    await waitFor(
      () => {
        expect(input).not.toBeDisabled()
      },
      { timeout: 3000 }
    )

    fireEvent.change(input, { target: { value: '再问' } })
    fireEvent.click(send)

    await waitFor(
      () => {
        expect(screen.getAllByText('离线回复').length).toBeGreaterThanOrEqual(2)
      },
      { timeout: 3000 }
    )
    // Only one offline notice should ever be rendered.
    expect(screen.getAllByText(/当前为离线模式/).length).toBe(1)
  })

  // --- Typewriter effect ---

  it('shows a typing cursor while the assistant reply is being typed', async () => {
    render(<CreatureChat creature={mockCreature} />)
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: '你好' } })
    fireEvent.click(screen.getByTestId('chat-send'))

    await waitFor(() => {
      expect(screen.getByTestId('chat-typing-cursor')).toBeInTheDocument()
    })
  })

  it('disables the input while typing and re-enables when done', async () => {
    render(<CreatureChat creature={mockCreature} />)
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: '你好' } })
    fireEvent.click(screen.getByTestId('chat-send'))

    // Input is disabled while loading / typing.
    await waitFor(() => {
      expect(screen.getByTestId('chat-input')).toBeDisabled()
    })

    // After the reply finishes typing the input becomes usable again.
    await waitFor(
      () => {
        expect(screen.getByTestId('chat-input')).not.toBeDisabled()
      },
      { timeout: 3000 }
    )
  })

  // --- Creature avatar ---

  it('shows the first-character avatar when no image is provided', async () => {
    render(<CreatureChat creature={mockCreature} />)
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: '你好' } })
    fireEvent.click(screen.getByTestId('chat-send'))

    await waitFor(() => {
      expect(screen.getByTestId('chat-avatar-2')).toHaveTextContent('毕')
    })
  })

  it('shows the creature image avatar when an image is provided', async () => {
    const withImage = { ...mockCreature, image: '/assets/images/bi-fang.jpg' }
    render(<CreatureChat creature={withImage} />)
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: '你好' } })
    fireEvent.click(screen.getByTestId('chat-send'))

    await waitFor(() => {
      const avatar = screen.getByTestId('chat-avatar-2')
      expect(avatar.querySelector('img')).toHaveAttribute('alt', '毕方')
    })
  })

  // --- Voice button (Web Speech API) ---

  it('renders a voice button on each assistant reply', async () => {
    render(<CreatureChat creature={mockCreature} />)
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: '你好' } })
    fireEvent.click(screen.getByTestId('chat-send'))

    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: '朗读回复' })
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('speaks the reply via Web Speech when the voice button is clicked', async () => {
    render(<CreatureChat creature={mockCreature} />)
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: '你好' } })
    fireEvent.click(screen.getByTestId('chat-send'))

    const voiceBtn = await screen.findByRole(
      'button',
      { name: '朗读回复' },
      { timeout: 3000 }
    )
    fireEvent.click(voiceBtn)

    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1)
    expect(window.SpeechSynthesisUtterance).toHaveBeenCalledWith('吾乃毕方，火之兆也。')
    // The button switches to the "stop" state while speaking.
    expect(
      screen.getByRole('button', { name: '停止朗读' })
    ).toBeInTheDocument()
  })

  it('stops speaking when the same button is clicked again', async () => {
    render(<CreatureChat creature={mockCreature} />)
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: '你好' } })
    fireEvent.click(screen.getByTestId('chat-send'))

    const voiceBtn = await screen.findByRole(
      'button',
      { name: '朗读回复' },
      { timeout: 3000 }
    )
    fireEvent.click(voiceBtn) // start
    expect(screen.getByRole('button', { name: '停止朗读' })).toBeInTheDocument()

    fireEvent.click(voiceBtn) // stop (same node, now labelled 停止朗读)
    expect(
      screen.getByRole('button', { name: '朗读回复' })
    ).toBeInTheDocument()
    expect(window.speechSynthesis.cancel).toHaveBeenCalled()
  })

  // --- Context follow-ups ---

  it('shows context follow-up suggestions after a reply', async () => {
    render(<CreatureChat creature={mockCreature} />)
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: '你好' } })
    fireEvent.click(screen.getByTestId('chat-send'))

    await waitFor(
      () => {
        expect(screen.getByTestId('chat-followups')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
    // Reply "吾乃毕方，火之兆也。" contains "火" → suggests a fire follow-up.
    expect(screen.getByText('你能掌控火焰吗？')).toBeInTheDocument()
  })

  // --- Bond integration ---

  it('records a chat interaction in the bond store when sending a message', async () => {
    render(<CreatureChat creature={mockCreature} />)
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: '你好' } })
    fireEvent.click(screen.getByTestId('chat-send'))

    await waitFor(() => {
      expect(useBondStore.getState().getBond(mockCreature.id).chatCount).toBe(1)
    })
  })

  it('passes a system prompt with bond context to sendChatMessage', async () => {
    render(<CreatureChat creature={mockCreature} />)
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: '你好' } })
    fireEvent.click(screen.getByTestId('chat-send'))

    await waitFor(() => {
      expect(sendChatMessage).toHaveBeenCalled()
    })

    const [, , systemPrompt] = vi.mocked(sendChatMessage).mock.calls[0]
    expect(typeof systemPrompt).toBe('string')
    expect(systemPrompt).toContain('羁绊')
    expect(systemPrompt).toContain(mockCreature.name)
  })
})
