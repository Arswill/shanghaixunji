/**
 * Local dev middleware for `/api/tts`.
 *
 * This is the Vite dev-server counterpart of the Vercel Serverless Function in
 * `api/tts.ts`. Both share the same dialect map and DashScope CosyVoice API
 * contract.
 *
 * Unlike `api/tts.ts` (which receives a Web `Request`), the Vite middleware
 * gets a raw Node `IncomingMessage`, so we read and parse the body ourselves.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'

const DEFAULT_VOICE = 'longxiaochun_v2'
const DASHSCOPE_TTS_ENDPOINT =
  'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/text-to-audio'

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

interface TTSRequestBody {
  text: string
  province: string
}

export default async function ttsHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

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

  // Read body
  let body = ''
  for await (const chunk of req) {
    body += chunk
  }

  let parsed: TTSRequestBody
  try {
    parsed = JSON.parse(body) as TTSRequestBody
  } catch {
    res.statusCode = 400
    res.end(Buffer.from(JSON.stringify({ error: 'Invalid JSON' }), 'utf-8'))
    return
  }

  const { text, province } = parsed
  if (!text || !province) {
    res.statusCode = 400
    res.end(Buffer.from(JSON.stringify({ error: 'Missing text or province' }), 'utf-8'))
    return
  }

  // Check API Key
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    console.log('[tts] No DASHSCOPE_API_KEY configured, returning offline mode')
    res.statusCode = 200
    res.end(Buffer.from(JSON.stringify({ error: 'not configured', offline: true }), 'utf-8'))
    return
  }

  // Build dialect instruction
  const dialectInstruction = DIALECT_MAP[province] || '请用普通话表达'
  const instruction = `${dialectInstruction}，请保留该方言的词汇与语调特色，以古朴庄重的语气朗读：${text}`

  console.log('[tts] Province:', province, '| Dialect:', dialectInstruction, '| Text length:', text.length)

  try {
    const response = await fetch(DASHSCOPE_TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-DataInspection': 'enable',
      },
      body: JSON.stringify({
        model: 'cosyvoice-v3.5-plus',
        input: { text: instruction },
        parameters: {
          voice: DEFAULT_VOICE,
          format: 'mp3',
          sample_rate: 22050,
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      console.error('[tts] DashScope API error:', response.status, errText)
      res.statusCode = 502
      res.end(Buffer.from(JSON.stringify({ error: `DashScope API error: ${response.status}` }), 'utf-8'))
      return
    }

    const data = (await response.json()) as {
      output?: { audio?: { url?: string } }
      message?: string
    }

    const audioUrl = data.output?.audio?.url
    if (!audioUrl) {
      console.error('[tts] No audio URL in response')
      res.statusCode = 502
      res.end(Buffer.from(JSON.stringify({ error: 'No audio URL in response' }), 'utf-8'))
      return
    }

    console.log('[tts] Success! Audio URL:', audioUrl.slice(0, 80) + '...')
    res.statusCode = 200
    res.end(Buffer.from(JSON.stringify({ audioUrl }), 'utf-8'))
  } catch (e) {
    console.error('[tts] Request failed:', e)
    res.statusCode = 500
    res.end(Buffer.from(JSON.stringify({ error: 'TTS request failed' }), 'utf-8'))
  }
}
