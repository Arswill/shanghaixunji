/**
 * Shared chat-proxy logic used by both the Vercel Serverless Function
 * (`api/chat.ts`) and the local dev middleware (`apps/web/dev-server.ts`).
 *
 * This module is deliberately free of any framework types (no Vercel / Node
 * `http` types) — it relies only on standard Web APIs available in both the
 * Vercel Node runtime and the Vite SSR environment: `fetch`, `ReadableStream`,
 * `TextEncoder`/`TextDecoder` and `AbortSignal`.
 *
 * Provider priority order: DeepSeek > MiMo > DashScope.
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatCreature {
  name: string
  source: string
  description: string
  original_text: string
  modern_location: string
}

export interface ChatRequestBody {
  creature: ChatCreature
  messages: ChatMessage[]
  /** When true, the server streams the reply back as SSE. */
  stream?: boolean
}

export type ProviderName = 'deepseek' | 'mimo' | 'dashscope'

export interface ProviderConfig {
  name: ProviderName
  endpoint: string
  model: string
  apiKey: string | undefined
}

/** Provider definitions in priority order (DeepSeek > MiMo > DashScope). */
const PROVIDER_ORDER: ReadonlyArray<Omit<ProviderConfig, 'apiKey'>> = [
  {
    name: 'deepseek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
  },
  {
    name: 'mimo',
    endpoint: 'https://api.xiaomimimo.com/v1/chat/completions',
    model: 'mimo-v2-flash',
  },
  {
    name: 'dashscope',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen-max',
  },
]

const API_KEY_ENV: Record<ProviderName, string> = {
  deepseek: 'DEEPSEEK_API_KEY',
  mimo: 'MIMO_API_KEY',
  dashscope: 'DASHSCOPE_API_KEY',
}

/** Upstream request timeout (ms). */
export const UPSTREAM_TIMEOUT_MS = 15000

export function buildSystemPrompt(creature: ChatCreature): string {
  return (
    `你是《山海经》中的神兽${creature.name}，载于${creature.source}。` +
    '请以第一人称、文言文与白话交织的风格回答。' +
    '回答不超过100字。' +
    `你的描述：${creature.description}。` +
    `原文：${creature.original_text}。` +
    `今地：${creature.modern_location}。`
  )
}

/**
 * Resolve the system prompt and user messages from the incoming request.
 *
 * If the client already sent a system message (e.g. with bond/memory context),
 * use it; otherwise build the default prompt from the creature fields.
 */
export function resolvePrompt(
  creature: ChatCreature,
  messages: ChatMessage[]
): { systemPrompt: string; userMessages: ChatMessage[] } {
  let systemPrompt = buildSystemPrompt(creature)
  let userMessages = messages
  if (messages[0]?.role === 'system') {
    systemPrompt = messages[0].content
    userMessages = messages.slice(1)
  }
  return { systemPrompt, userMessages }
}

/**
 * Return the first configured provider in priority order, honouring an
 * explicit `LLM_PROVIDER` selection when it has an API key. Returns `null`
 * when no provider is configured. Kept as a convenience helper.
 */
export function getProviderConfig(): ProviderConfig | null {
  return getOrderedProviders()[0] ?? null
}

/**
 * Return all configured providers sorted by priority (DeepSeek > MiMo >
 * DashScope). If `LLM_PROVIDER` explicitly selects a configured provider, it
 * is tried first, followed by the remaining configured providers in priority
 * order. Providers without an API key are skipped.
 */
export function getOrderedProviders(): ProviderConfig[] {
  const configured = PROVIDER_ORDER.map((def) => ({
    ...def,
    apiKey: process.env[API_KEY_ENV[def.name]],
  })).filter((p): p is ProviderConfig => Boolean(p.apiKey))

  const explicit = (process.env.LLM_PROVIDER || '').toLowerCase()
  if (explicit === 'deepseek' || explicit === 'mimo' || explicit === 'dashscope') {
    const primary = configured.find((p) => p.name === explicit)
    if (primary) {
      return [primary, ...configured.filter((p) => p.name !== explicit)]
    }
  }
  return configured
}

/**
 * Resolve the allowed CORS origin from the environment.
 *
 * In production set `ALLOWED_ORIGIN` to the deployed domain (e.g.
 * `https://shanghaixunji.vercel.app`). Defaults to the Vite dev server origin
 * so local development keeps working.
 */
export function getCorsHeaders(): Record<string, string> {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

/** Build the upstream request body for a given provider. */
export function buildUpstreamBody(
  provider: ProviderConfig,
  systemPrompt: string,
  userMessages: ChatMessage[],
  stream: boolean
): string {
  return JSON.stringify({
    model: provider.model,
    messages: [{ role: 'system', content: systemPrompt }, ...userMessages],
    temperature: 0.8,
    max_tokens: 200,
    stream,
  })
}

export interface ChatSuccess {
  ok: true
  content: string
}

export interface ChatFailure {
  ok: false
  status: number
  error: string
}

/** True for AbortSignal.timeout / fetch abort errors (→ 504). */
function isTimeoutError(e: unknown): boolean {
  return (
    e instanceof Error &&
    (e.name === 'TimeoutError' || e.name === 'AbortError')
  )
}

/**
 * Call providers in priority order until one succeeds (non-streaming).
 * On failure, automatically tries the next configured provider; only returns
 * a failure once every provider has been exhausted.
 */
export async function chatWithFallback(
  providers: ProviderConfig[],
  systemPrompt: string,
  userMessages: ChatMessage[]
): Promise<ChatSuccess | ChatFailure> {
  if (providers.length === 0) {
    return { ok: false, status: 200, error: 'offline' }
  }

  let lastError: ChatFailure = {
    ok: false,
    status: 500,
    error: 'No providers attempted',
  }

  for (const provider of providers) {
    try {
      const res = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: buildUpstreamBody(provider, systemPrompt, userMessages, false),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        lastError = {
          ok: false,
          status: res.status,
          error: `LLM API error (${provider.model}): ${res.status} ${errText}`.trim(),
        }
        continue // try next provider
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const content = data.choices?.[0]?.message?.content ?? ''
      return { ok: true, content }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      lastError = {
        ok: false,
        status: isTimeoutError(e) ? 504 : 500,
        error: isTimeoutError(e)
          ? `LLM API timeout (${provider.model})`
          : `LLM API error (${provider.model}): ${message}`,
      }
      continue // try next provider
    }
  }

  return lastError
}

/**
 * Parse a single `data:` line from an OpenAI-compatible SSE chunk and return
 * the delta content, or `null` for non-content / keepalive lines.
 */
function parseSseDelta(line: string): string | null {
  if (!line.startsWith('data:')) return null
  const payload = line.slice(5).trim()
  if (!payload || payload === '[DONE]') return null
  try {
    const json = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>
    }
    return json.choices?.[0]?.delta?.content ?? null
  } catch {
    return null
  }
}

/**
 * Stream the reply from the first provider that connects successfully.
 *
 * Returns a `ReadableStream<Uint8Array>` emitting SSE frames shaped as
 * `data: {"token":"..."}\n\n`. If no provider can connect, a final
 * `data: {"error":"..."}\n\n` frame is emitted. Once streaming has started
 * from a provider, mid-stream errors end the stream gracefully rather than
 * switching providers (which would corrupt the partial output).
 */
export function streamChat(
  providers: ProviderConfig[],
  systemPrompt: string,
  userMessages: ChatMessage[]
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      if (providers.length === 0) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ offline: true })}\n\n`)
        )
        controller.close()
        return
      }

      for (const provider of providers) {
        try {
          const res = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${provider.apiKey}`,
            },
            body: buildUpstreamBody(provider, systemPrompt, userMessages, true),
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
          })

          if (!res.ok || !res.body) {
            // Connection-level failure — try the next provider.
            continue
          }

          // Connected successfully: stream only from this provider.
          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              // Keep the last (possibly partial) line in the buffer.
              buffer = lines.pop() ?? ''
              for (const line of lines) {
                const delta = parseSseDelta(line)
                if (delta) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ token: delta })}\n\n`)
                  )
                }
              }
            }
            if (buffer) {
              const delta = parseSseDelta(buffer)
              if (delta) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ token: delta })}\n\n`)
                )
              }
            }
          } catch (e) {
            // Mid-stream error (e.g. timeout): end gracefully without
            // switching providers, since partial output has already been sent.
            console.error(`[streamChat] mid-stream error (${provider.model}):`, e)
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
          return
        } catch (e) {
          // Pre-connection failure (network/timeout) — try next provider.
          console.error(`[streamChat] provider ${provider.model} failed:`, e)
          continue
        }
      }

      // Every provider failed to connect.
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ error: 'All providers failed' })}\n\n`)
      )
      controller.close()
    },
  })
}
