/**
 * Cloudflare Pages Function adapter for the 山海寻迹 chat API.
 *
 * This file mirrors the behaviour of the Vercel serverless function at
 * `api/chat.ts`, but uses the Cloudflare Pages Function entry-point shape
 * (`onRequestPost` / `onRequestOptions`). It reuses the provider-agnostic
 * logic in `api/_shared.ts` completely unchanged.
 *
 * File-based routing on Pages: `functions/api/chat.ts` → `POST|OPTIONS /api/chat`
 * (the same URL the frontend already calls).
 *
 * Environment (configured in the Cloudflare dashboard or via
 * `wrangler pages secret put` / `wrangler pages deploy` vars):
 *   MIMO_API_KEY / DEEPSEEK_API_KEY / DASHSCOPE_API_KEY   (at least one)
 *   LLM_PROVIDER      optional: deepseek | mimo | dashscope
 *   ALLOWED_ORIGIN     optional: CORS origin; defaults to "*" for Pages
 *
 * The shared module reads `process.env`, so before delegating we copy the
 * Cloudflare bindings from `context.env` onto `process.env`. This requires
 * `nodejs_compat` (see `wrangler.toml`) and is what keeps `_shared.ts` and
 * the existing Vercel `api/chat.ts` untouched.
 */
import type { PagesFunction } from '@cloudflare/workers-types'
import {
  chatWithFallback,
  getCorsHeaders,
  getOrderedProviders,
  resolvePrompt,
  streamChat,
  type ChatRequestBody,
} from '../../api/_shared'

/** Bindings exposed to the Pages Function (Dashboard → Settings → Variables). */
interface Env {
  MIMO_API_KEY?: string
  DEEPSEEK_API_KEY?: string
  DASHSCOPE_API_KEY?: string
  ALLOWED_ORIGIN?: string
  LLM_PROVIDER?: string
  [key: string]: string | undefined
}

/**
 * Mirror Cloudflare bindings onto `process.env` so the shared module — which
 * reads `process.env` at call time — behaves identically to the Vercel
 * deployment. Idempotent and safe to call on every request.
 */
function syncEnv(env: Env): void {
  const stringKeys: Array<keyof Env> = [
    'MIMO_API_KEY',
    'DEEPSEEK_API_KEY',
    'DASHSCOPE_API_KEY',
    'LLM_PROVIDER',
  ]
  for (const key of stringKeys) {
    const value = env[key]
    if (typeof value === 'string' && value.length > 0) {
      process.env[key] = value
    }
  }
  // The Pages deployment defaults to a permissive CORS origin. A non-empty
  // ALLOWED_ORIGIN binding (e.g. your custom domain) always takes precedence.
  process.env.ALLOWED_ORIGIN = env.ALLOWED_ORIGIN?.trim() || '*'
}

/** Build a JSON Response with CORS headers attached. */
function json(data: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

/** CORS preflight: answer OPTIONS immediately with 204 No Content. */
export const onRequestOptions: PagesFunction<Env> = async (context) => {
  syncEnv(context.env)
  return new Response(null, { status: 204, headers: getCorsHeaders() })
}

/** Main handler: `POST /api/chat` (non-streaming + SSE streaming). */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  syncEnv(context.env)
  const cors = getCorsHeaders()

  const providers = getOrderedProviders()

  // No provider configured → signal offline mode (mirrors Vercel behaviour).
  if (providers.length === 0) {
    return json({ content: '', offline: true }, 200, cors)
  }

  let body: ChatRequestBody
  try {
    body = (await context.request.json()) as ChatRequestBody
  } catch {
    return json({ error: 'Invalid request body' }, 400, cors)
  }

  const { creature, messages, stream } = body
  if (!creature || !Array.isArray(messages)) {
    return json({ error: 'Invalid request body' }, 400, cors)
  }

  const { systemPrompt, userMessages } = resolvePrompt(creature, messages)

  // Streaming mode: pipe the upstream SSE straight through to the client,
  // token by token, exactly like the Vercel function does.
  if (stream) {
    const readable = streamChat(providers, systemPrompt, userMessages)
    const headers = new Headers(cors)
    headers.set('Content-Type', 'text/event-stream; charset=utf-8')
    headers.set('Cache-Control', 'no-cache, no-transform')
    headers.set('Connection', 'keep-alive')
    return new Response(readable, { status: 200, headers })
  }

  const result = await chatWithFallback(providers, systemPrompt, userMessages)
  if (result.ok) {
    return json({ content: result.content }, 200, cors)
  }
  if (result.status === 504) {
    return json({ error: result.error }, 504, cors)
  }
  return json({ error: result.error }, 500, cors)
}
