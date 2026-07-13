export type AnalyticsEvent =
  | { name: 'province_selected'; province: string }
  | { name: 'creature_discovered'; creatureId: string; rarity: string; isNew: boolean }
  | { name: 'chat_message_sent'; creatureId: string; isOffline: boolean }
  | { name: 'gift_given'; creatureId: string; giftType: string }
  | { name: 'share_card_generated'; type: string }
  | { name: 'dialect_tts_play'; creatureId: string; province: string }
  | { name: 'page_view'; view: string }

type WithTimestamp<T> = T & { timestamp: number }

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'

const QUEUE_KEY = 'shanhai-analytics-queue'
const MAX_QUEUE_SIZE = 200
const FLUSH_THRESHOLD = 20
const FLUSH_INTERVAL_MS = 30_000
const ENDPOINT = '/api/analytics'

function readQueue(): WithTimestamp<AnalyticsEvent>[] {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as WithTimestamp<AnalyticsEvent>[]) : []
  } catch {
    return []
  }
}

function writeQueue(queue: WithTimestamp<AnalyticsEvent>[]) {
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE_SIZE)))
  } catch {
    // Ignore storage errors (private mode, quota exceeded).
  }
}

let isFlushing = false

/**
 * 批量上报队列中的事件到 `/api/analytics` 端点。
 *
 * - 优先使用 `navigator.sendBeacon`（适合页面卸载等场景），失败时回退到 `fetch`。
 * - 发送成功后移除已上报事件；发送失败则保留在队列中，下次重试。
 * - 若端点不存在（404 等）或网络异常，静默跳过，不影响应用主流程。
 */
async function flushQueue(): Promise<void> {
  if (typeof window === 'undefined') return
  if (isFlushing) return
  const queue = readQueue()
  if (queue.length === 0) return

  isFlushing = true
  const payload = JSON.stringify(queue)
  let success = false

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' })
      if (navigator.sendBeacon(ENDPOINT, blob)) {
        success = true
      }
    }
    if (!success) {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      })
      if (res.ok) success = true
    }
  } catch {
    // Network error or endpoint missing: silently retain the queue.
  }

  if (success) {
    // 移除已上报的事件；保留上报期间新加入的事件。
    const currentQueue = readQueue()
    writeQueue(currentQueue.slice(queue.length))
  }

  isFlushing = false
}

export function trackEvent(event: AnalyticsEvent) {
  if (typeof window === 'undefined') return

  // In development, log to console; in production, queue for a privacy-first
  // analytics endpoint (e.g. Plausible, Vercel Analytics, or self-hosted).
  if (isDev) {
    console.debug('[analytics]', event)
  }

  // Persist a small event queue so we can later batch-send or inspect usage.
  const queue = readQueue()
  queue.push({ ...event, timestamp: Date.now() })
  writeQueue(queue)

  // 生产环境：队列超过阈值时触发批量上报。
  if (!isDev && queue.length >= FLUSH_THRESHOLD) {
    void flushQueue()
  }
}

// 生产环境：每 30 秒定时尝试上报队列中的事件。
if (typeof window !== 'undefined' && !isDev) {
  setInterval(() => {
    void flushQueue()
  }, FLUSH_INTERVAL_MS)
}
