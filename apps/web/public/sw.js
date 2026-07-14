/**
 * Service Worker — 山海寻迹 PWA 离线缓存
 *
 * 策略：
 * 1. Precache：核心 app shell（install 时缓存）
 * 2. Cache-first：静态资源（favicon/manifest/icons）
 * 3. Stale-while-revalidate：图片/音频/3D 模型（大文件，不常变）
 * 4. Network-first：API 请求（/api/*）
 * 5. Network-first + offline fallback：导航请求（HTML）
 */

const CACHE_VERSION = 'shx-v2'
const CACHE_SHELL = `${CACHE_VERSION}-shell`
const CACHE_RUNTIME = `${CACHE_VERSION}-runtime`

// ─── Precache 清单（仅含 public/ 下确定存在的文件）───
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
  '/icon-512.jpg',
  '/robots.txt',
  '/sitemap.xml',
]

// ─── Install：预缓存 app shell ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => {
      // 逐个添加，跳过失败的（如开发环境下 /index.html 不在 public/）
      return Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url)),
      )
    }).then(() => self.skipWaiting()),
  )
})

// ─── Activate：清理旧缓存 + 接管客户端 ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      )
    }).then(() => self.clients.claim()),
  )
})

// ─── Fetch：分层缓存策略 ───
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 只处理同源 GET 请求
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return
  }

  // 1. API 请求 → Network-first（不缓存敏感数据）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: '离线模式：AI 对话暂不可用' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } },
        )
      }),
    )
    return
  }

  // 2. 导航请求（HTML）→ Network-first + 离线回退
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_RUNTIME).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/') || caches.match('/index.html')
          })
        }),
    )
    return
  }

  // 3. 静态资源（JS/CSS/字体）→ Stale-while-revalidate
  if (
    url.pathname.startsWith('/assets/') &&
    (url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.woff'))
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE_RUNTIME).then((cache) => cache.put(request, clone))
            }
            return response
          })
          .catch(() => cached)
        return cached || fetchPromise
      }),
    )
    return
  }

  // 4. 媒体资源（图片/音频/模型）→ Cache-first（大文件，不常变）
  if (
    url.pathname.match(/\.(jpg|jpeg|png|webp|gif|svg|mp3|wav|ogg|glb|gltf)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_RUNTIME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      }),
    )
    return
  }

  // 5. 其他请求 → 尝试缓存，回退网络
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request)
    }),
  )
})

// ─── Message：支持手动更新 ───
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
