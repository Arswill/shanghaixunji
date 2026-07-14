/**
 * CosyVoice 方言 TTS 前端服务
 *
 * 安全设计：API Key 仅存于服务端环境变量（DASHSCOPE_API_KEY），
 * 前端通过 /api/tts 代理调用，不暴露密钥。
 *
 * 方言映射：省份 → CosyVoice 自然语言方言指令
 * （CosyVoice 通过指令文本控制方言，非独立 voice ID）
 */

/** 省份 → 方言指令映射（与 pipelines/tts/dialect_map.json 同步） */
const DIALECT_MAP: Record<string, string> = {
  北京: '请用普通话表达',
  天津: '请用天津话表达',
  河北: '请用河北话表达',
  山西: '请用山西话表达',
  辽宁: '请用东北话表达',
  吉林: '请用东北话表达',
  黑龙江: '请用东北话表达',
  上海: '请用上海话表达',
  江苏: '请用吴语表达',
  浙江: '请用吴语表达',
  安徽: '请用安徽话表达',
  福建: '请用闽南话表达',
  江西: '请用江西话表达',
  山东: '请用山东话表达',
  河南: '请用河南话表达',
  湖北: '请用湖北话表达',
  湖南: '请用湖南话表达',
  广东: '请用广东话表达',
  广西: '请用广西话表达',
  海南: '请用海南话表达',
  重庆: '请用重庆话表达',
  四川: '请用四川话表达',
  贵州: '请用贵州话表达',
  云南: '请用云南话表达',
  西藏: '请用藏语表达',
  陕西: '请用陕西话表达',
  甘肃: '请用甘肃话表达',
  青海: '请用青海话表达',
  宁夏: '请用宁夏话表达',
  新疆: '请用新疆话表达',
  内蒙古: '请用蒙古语表达',
  台湾: '请用台湾话表达',
  香港: '请用粤语表达',
  澳门: '请用粤语表达',
}

/** 获取省份的方言指令 */
export function getDialectInstruction(province: string): string {
  return DIALECT_MAP[province] || '请用普通话表达'
}

/** 获取省份的方言显示名（用于 UI 标签） */
export function getDialectLabel(province: string): string {
  const instruction = DIALECT_MAP[province]
  if (!instruction || instruction === '请用普通话表达') return '普通话'
  // 提取方言名：去掉"请用"和"话表达"
  const match = instruction.match(/请用(.+?)表达/)
  return match ? match[1] : '普通话'
}

/** 获取预生成的方言音频 URL（从 manifest 或已知映射） */
export function getDialectAudioUrl(creatureId: string, province: string): string | null {
  // V2 格式：{creature_id}__{province}.mp3
  return `/assets/audio/${creatureId}__${province}.mp3`
}

/** TTS 请求参数 */
export interface TTSRequest {
  text: string
  province: string
  creatureId?: string
}

/** TTS 响应 */
export interface TTSResult {
  /** 音频 URL（来自 DashScope 或预生成文件），空字符串表示无音频需走 Web Speech */
  audioUrl: string
  /** 方言显示名 */
  dialectLabel: string
  /** 是否为预生成的 demo 音频（非实时调用） */
  isDemo: boolean
}

/**
 * 验证音频 URL 是否真的可播放（HEAD 请求检查 Content-Type）
 * 防止 SPA 路由把 404 返回为 HTML 导致 Audio 元素静默失败
 */
async function validateAudioUrl(url: string): Promise<boolean> {
  try {
    const resp = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    if (!resp.ok) return false
    const contentType = resp.headers.get('Content-Type') || ''
    // 音频文件应该是 audio/* 或 application/octet-stream
    // 排除 text/html（SPA fallback 返回的 index.html）
    if (contentType.includes('text/html')) return false
    if (contentType.startsWith('audio/')) return true
    if (contentType.includes('octet-stream')) return true
    // 未知类型也尝试播放（有些服务器不返回正确的 Content-Type）
    return resp.ok
  } catch {
    return false
  }
}

/**
 * 调用方言 TTS 服务
 *
 * 优先级：
 * 1. 预生成方言音频（V2 格式 {creatureId}__{province}.mp3）— 验证文件存在且为音频
 * 2. /api/tts 代理调用 DashScope CosyVoice（实时生成）
 * 3. Web Speech API 回退（浏览器内置 TTS，普通话）
 */
export async function speakDialect(req: TTSRequest): Promise<TTSResult> {
  const dialectLabel = getDialectLabel(req.province)

  // 1. 预生成方言音频 — 先验证文件是否真的存在且可播放
  if (req.creatureId && req.province) {
    const dialectUrl = getDialectAudioUrl(req.creatureId, req.province)
    if (dialectUrl) {
      const isValid = await validateAudioUrl(dialectUrl)
      if (isValid) {
        return { audioUrl: dialectUrl, dialectLabel, isDemo: true }
      }
      console.info(`[TTS] 预生成音频不可用: ${dialectUrl}，尝试实时生成`)
    }
  }

  // 2. 调用 /api/tts 代理
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: req.text,
        province: req.province,
      }),
    })

    if (response.ok) {
      const data = (await response.json()) as { audioUrl?: string; error?: string }
      if (data.audioUrl) {
        return { audioUrl: data.audioUrl, dialectLabel, isDemo: false }
      }
    }
  } catch (e) {
    console.warn('[TTS] /api/tts 代理调用失败，回退到 Web Speech API:', e)
  }

  // 3. Web Speech API 回退（无方言效果，仅普通话）
  return { audioUrl: '', dialectLabel, isDemo: false }
}

/**
 * 播放音频 URL，返回可控制的 Audio 元素
 * 播放失败时调用 onError 回调
 */
export function playAudioUrl(url: string, onError?: () => void): HTMLAudioElement {
  const audio = new Audio(url)
  audio.play().catch((e) => {
    console.warn('[TTS] 音频播放失败:', e)
    onError?.()
  })
  return audio
}

/**
 * 使用 Web Speech API 朗读文本（回退方案）
 * 返回一个 stop 函数
 */
export function speakWithWebAPI(text: string, lang = 'zh-CN', rate = 0.85): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return () => {}
  }

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = rate
  utterance.pitch = 0.9
  window.speechSynthesis.speak(utterance)

  return () => window.speechSynthesis.cancel()
}
