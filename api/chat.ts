import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  chatWithFallback,
  getCorsHeaders,
  getOrderedProviders,
  resolvePrompt,
  streamChat,
  type ChatRequestBody,
} from './_shared'

/**
 * Serverless proxy for LLM chat API.
 *
 * Supports multiple OpenAI-compatible providers (DeepSeek > MiMo > DashScope)
 * with automatic fallback when a provider fails, a 15s upstream timeout, and
 * optional SSE streaming (`stream: true` in the request body).
 *
 * Configure via environment variables:
 *   LLM_PROVIDER=deepseek          (optional explicit primary; else priority order)
 *   DEEPSEEK_API_KEY / MIMO_API_KEY / DASHSCOPE_API_KEY
 *   ALLOWED_ORIGIN=https://shanghaixunji.vercel.app   (CORS; defaults to localhost)
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  for (const [key, value] of Object.entries(getCorsHeaders())) {
    res.setHeader(key, value)
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const providers = getOrderedProviders()

  // No API key configured for any provider: signal offline mode
  if (providers.length === 0) {
    res.status(200).json({ content: '', offline: true })
    return
  }

  const { creature, messages, stream } = (req.body ?? {}) as ChatRequestBody

  if (!creature || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Invalid request body' })
    return
  }

  const { systemPrompt, userMessages } = resolvePrompt(creature, messages)

  // Streaming mode: pipe the upstream SSE through to the client token-by-token.
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.status(200)
    const readable = streamChat(providers, systemPrompt, userMessages)
    const reader = readable.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(Buffer.from(value))
      }
    } catch {
      // Upstream error mid-stream — end the response gracefully.
    }
    res.end()
    return
  }

  const result = await chatWithFallback(providers, systemPrompt, userMessages)
  if (result.ok) {
    res.status(200).json({ content: result.content })
  } else if (result.status === 504) {
    res.status(504).json({ error: result.error })
  } else {
    res.status(500).json({ error: result.error })
  }
}
