import type { Creature } from '../data/creatures.schema'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResult {
  content: string
  isOffline: boolean
}

/**
 * Optional context used by the rule-based fallback so it can react to bond
 * level, mood and shared memory instead of returning identical answers.
 */
export interface FallbackContext {
  personality?: string
  level?: string
  levelLabel?: string
  score?: number
  mood?: string
  moodLabel?: string
  lastGiftLabel?: string
  memorySummary?: string
}

/**
 * Send a chat message to the creature via the serverless `/api/chat` proxy.
 *
 * The API key lives on the server and is never exposed to the browser. When the
 * server signals `offline: true` (no API key configured) or the request fails,
 * we fall back to a rule-based response generator so the experience keeps
 * working. The fallback can optionally receive bond/memory context to make its
 * replies feel less static.
 */
export async function sendChatMessage(
  creature: Creature,
  messages: ChatMessage[],
  systemPrompt?: string,
  fallbackContext?: FallbackContext,
): Promise<ChatResult> {
  // Only forward user/assistant turns to the server. UI-only `system` notices
  // (e.g. the offline banner) must not be sent to the model.
  const history = messages.filter((m) => m.role !== 'system')
  const bodyMessages = systemPrompt
    ? [{ role: 'system' as const, content: systemPrompt }, ...history]
    : history

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creature, messages: bodyMessages }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = (await response.json()) as { content: string; offline?: boolean }

    if (data.offline) {
      return {
        content: generateFallbackResponse(creature, history, fallbackContext),
        isOffline: true,
      }
    }

    return { content: data.content, isOffline: false }
  } catch (e) {
    console.warn('Chat API call failed, using fallback:', e)
    return {
      content: generateFallbackResponse(creature, history, fallbackContext),
      isOffline: true,
    }
  }
}

/**
 * Stream a chat reply token-by-token via Server-Sent Events.
 *
 * Calls `onToken` for each token chunk as it arrives from the server, giving
 * the UI a live typewriter effect driven by the model itself. If the server
 * signals `offline: true`, the stream fails, or the environment cannot read a
 * stream, we fall back to the rule-based generator — so callers always get a
 * complete `ChatResult`.
 *
 * This is the streaming-capable companion to `sendChatMessage`. Components
 * that don't need streaming can keep using `sendChatMessage` unchanged.
 */
export async function streamChatMessage(
  creature: Creature,
  messages: ChatMessage[],
  systemPrompt: string | undefined,
  onToken: (token: string) => void,
  fallbackContext?: FallbackContext,
): Promise<ChatResult> {
  const history = messages.filter((m) => m.role !== 'system')
  const bodyMessages = systemPrompt
    ? [{ role: 'system' as const, content: systemPrompt }, ...history]
    : history

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ creature, messages: bodyMessages, stream: true }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    // No readable body (e.g. server fell back to non-streaming) — reuse the
    // non-streaming JSON contract instead.
    if (!response.body) {
      const data = (await response.json().catch(() => ({
        content: '',
      }))) as { content: string; offline?: boolean }
      if (data.offline) {
        return {
          content: generateFallbackResponse(creature, history, fallbackContext),
          isOffline: true,
        }
      }
      if (data.content) onToken(data.content)
      return { content: data.content, isOffline: false }
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let content = ''
    let offline = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (!payload || payload === '[DONE]') continue
        try {
          const evt = JSON.parse(payload) as {
            token?: string
            offline?: boolean
            error?: string
          }
          if (evt.offline) {
            offline = true
            continue
          }
          if (evt.error) throw new Error(evt.error)
          if (evt.token) {
            content += evt.token
            onToken(evt.token)
          }
        } catch {
          // Ignore malformed SSE frames.
        }
      }
    }

    if (offline || !content) {
      const fallback = generateFallbackResponse(creature, history, fallbackContext)
      if (!content) onToken(fallback)
      return { content: content || fallback, isOffline: true }
    }
    return { content, isOffline: false }
  } catch (e) {
    console.warn('Chat stream failed, using fallback:', e)
    return {
      content: generateFallbackResponse(creature, history, fallbackContext),
      isOffline: true,
    }
  }
}

/**
 * Smart fallback that generates creature-appropriate responses without an API.
 * Uses pattern matching plus optional bond context to give relevant answers.
 */
export function generateFallbackResponse(
  creature: Creature,
  messages: ChatMessage[],
  ctx?: FallbackContext,
): string {
  const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content || ''
  const q = lastUserMsg.toLowerCase()

  let answer = ''

  // Pattern: who are you
  if (q.includes('你是谁') || q.includes('你叫什么') || q.includes('你是')) {
    answer = `吾乃${creature.name}，载于${creature.source}。${creature.description.slice(0, 40)}……世人见吾，皆知异事将至。`
  }
  // Pattern: appearance
  else if (q.includes('长什么样') || q.includes('样子') || q.includes('外貌') || q.includes('形')) {
    answer = extractAppearanceFromText(creature)
  }
  // Pattern: abilities
  else if (q.includes('能力') || q.includes('本领') || q.includes('会什么') || q.includes('能做什么')) {
    answer = extractAbilityFromText(creature)
  }
  // Pattern: location
  else if (q.includes('在哪') || q.includes('住') || q.includes('哪里') || q.includes('栖息')) {
    answer = `吾居于${creature.modern_location}。古时此地属${creature.scroll}所载之域，山川灵秀，正宜修行。`
  }
  // Pattern: yellow emperor / 黄帝
  else if (q.includes('黄帝') || q.includes('蚩尤') || q.includes('帝')) {
    answer = `上古之事，悠远矣。${creature.source}载吾之名，然彼时天地混沌，神人杂处，黄帝之事……吾于${creature.scroll}中有所闻，不便尽言。`
  }
  // Pattern: eat/diet
  else if (q.includes('吃') || q.includes('食') || q.includes('食物')) {
    if (creature.original_text.includes('食人')) {
      answer = `世人畏吾，皆因${creature.source}有载"是食人"之语。然天地生灵，各有所需，吾之食性，不过顺应天道罢了。`
    } else if (creature.original_text.includes('食之')) {
      answer = `${creature.original_text.match(/食之[^。]*。/)?.[0] || '食吾者，有所宜也。'}此乃天地造化之妙。`
    } else {
      answer = `吾乃神兽，非常俗可比，不似凡间走兽那般贪食。`
    }
  }
  // Default: mysterious response
  else {
    const mysteries = [
      `天地玄黄，宇宙洪荒。吾乃${creature.name}，${creature.scroll}有载。汝之所问，恐非凡人所能尽知也。`,
      `汝问此事……${creature.original_text.slice(0, 20)}……古经所载，不过万一。吾之玄妙，岂是三言两语能道尽？`,
      `吾在${creature.modern_location}已待千年。汝之问题，且容吾思量……天道运行，自有其理，汝不必深究。`,
    ]
    answer = mysteries[Math.floor(Math.random() * mysteries.length)]
  }

  const prefix = buildBondPrefix(ctx)
  const suffix = buildBondSuffix(ctx)
  return `${prefix}${answer}${suffix}`.trim()
}

function buildBondPrefix(ctx?: FallbackContext): string {
  if (!ctx) return ''
  const parts: string[] = []
  if (ctx.levelLabel && ctx.level) {
    if (ctx.level === 'stranger') {
      parts.push('汝是何人？既入吾境，便暂且听之。')
    } else if (ctx.level === 'acquainted') {
      parts.push('又是汝。罢了，吾且答你。')
    } else if (ctx.level === 'bonded') {
      parts.push('吾友，汝来得好。')
    } else if (ctx.level === 'kindred') {
      parts.push('汝知吾，吾亦知汝。')
    }
  }
  if (ctx.moodLabel) {
    if (ctx.mood === 'joyful') parts.push('今日甚慰，吾多言几句。')
    else if (ctx.mood === 'wary') parts.push('吾心犹疑，汝且慎言。')
    else if (ctx.mood === 'listless') parts.push('久未见汝，吾神思倦怠。')
  }
  if (ctx.lastGiftLabel) {
    parts.push(`汝所赠${ctx.lastGiftLabel}，吾尚记得。`)
  }
  return parts.length > 0 ? `${parts.join('')}` : ''
}

function buildBondSuffix(ctx?: FallbackContext): string {
  if (!ctx) return ''
  const parts: string[] = []
  if (ctx.memorySummary) {
    parts.push(`昔时汝曾问：${ctx.memorySummary.slice(0, 30)}……`)
  }
  if ((ctx.score ?? 0) >= 300) {
    parts.push('能至今日，汝吾缘分不浅。')
  }
  return parts.length > 0 ? `${parts.join('')}` : ''
}

function extractAppearanceFromText(creature: Creature): string {
  const text = creature.original_text
  const match = text.match(/其状[^。]*。/)
  if (match) {
    return `古经有云："${match[0]}"吾之形貌，大抵如此。${creature.translation.slice(0, 30)}`
  }
  return `吾之形貌，${creature.source}有载。${creature.description.slice(0, 40)}`
}

function extractAbilityFromText(creature: Creature): string {
  const text = creature.original_text
  // Look for "见则" pattern (omen)
  const omenMatch = text.match(/见则[^。]*。/)
  if (omenMatch) {
    return `"${omenMatch[0]}"此乃吾现世之兆也。${creature.modern_location}之民，多知此理。`
  }
  // Look for "食之" pattern (effect of eating)
  const eatMatch = text.match(/食之[^。]*。/)
  if (eatMatch) {
    return `"${eatMatch[0]}"此乃吾之灵力所赐。然天地之物，皆有其用，非独吾然。`
  }
  return `吾之能，${creature.description.slice(0, 50)}`
}
