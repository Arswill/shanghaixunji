/**
 * Local dev middleware for `/api/chat`.
 *
 * This is the Vite dev-server counterpart of the Vercel Serverless Function in
 * `api/chat.ts`. Both import the shared logic from `api/_shared.ts` so the
 * provider fallback, timeout, streaming and CORS behaviour stays identical
 * between local development and production.
 *
 * Unlike `api/chat.ts` (which receives a parsed `req.body` from Vercel), the
 * Vite middleware gets a raw Node `IncomingMessage`, so we read and parse the
 * body ourselves before delegating to the shared helpers.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  chatWithFallback,
  getCorsHeaders,
  getOrderedProviders,
  resolvePrompt,
  streamChat,
  type ChatRequestBody,
} from '../../api/_shared'

export default async function chatHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  for (const [key, value] of Object.entries(getCorsHeaders())) {
    res.setHeader(key, value)
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end(Buffer.from(JSON.stringify({ error: 'Method not allowed' }), 'utf-8'))
    return
  }

  // Node IncomingMessage has no `.body` — read the stream manually.
  let body = ''
  for await (const chunk of req) {
    body += chunk
  }

  let parsed: ChatRequestBody
  try {
    parsed = JSON.parse(body) as ChatRequestBody
  } catch {
    res.statusCode = 400
    res.end(Buffer.from(JSON.stringify({ error: 'Invalid JSON' }), 'utf-8'))
    return
  }

  const { creature, messages, stream } = parsed

  const providers = getOrderedProviders()

  if (providers.length === 0) {
    console.log('[chat] No API key configured, returning offline mode')
    res.statusCode = 200
    res.end(Buffer.from(JSON.stringify({ content: '', offline: true }), 'utf-8'))
    return
  }

  if (!creature || !Array.isArray(messages)) {
    res.statusCode = 400
    res.end(Buffer.from(JSON.stringify({ error: 'Invalid request body' }), 'utf-8'))
    return
  }

  console.log(
    '[chat] Providers:',
    providers.map((p) => p.name).join(' > '),
    '| Creature:',
    creature.name,
    '| Messages:',
    messages.length,
    '| Stream:',
    !!stream
  )

  const { systemPrompt, userMessages } = resolvePrompt(creature, messages)

  // Streaming mode: pipe the upstream SSE through to the client token-by-token.
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.statusCode = 200
    const readable = streamChat(providers, systemPrompt, userMessages)
    const reader = readable.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(Buffer.from(value))
      }
    } catch (e) {
      console.error('[chat] stream error:', e)
    }
    res.end()
    return
  }

  const result = await chatWithFallback(providers, systemPrompt, userMessages)
  if (result.ok) {
    console.log('[chat] Success! Content length:', result.content.length)
    res.statusCode = 200
    res.end(Buffer.from(JSON.stringify({ content: result.content }), 'utf-8'))
  } else if (result.status === 504) {
    console.error('[chat] Timeout:', result.error)
    res.statusCode = 504
    res.end(Buffer.from(JSON.stringify({ error: result.error }), 'utf-8'))
  } else {
    console.error('[chat] Failure:', result.error)
    res.statusCode = 500
    res.end(Buffer.from(JSON.stringify({ error: result.error }), 'utf-8'))
  }
}
