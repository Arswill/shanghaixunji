/**
 * Vercel Serverless Function: /api/tts
 *
 * 代理 DashScope CosyVoice 方言 TTS 请求。
 * DASHSCOPE_API_KEY 仅在服务端读取，不暴露给前端。
 *
 * 请求体: { text: string, province: string }
 * 响应体: { audioUrl: string } 或 { error: string, offline: true }
 */

// 省份 → 方言指令映射（与 pipelines/tts/dialect_map.json 同步）
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

const DEFAULT_VOICE = 'longxiaochun_v2'
const DASHSCOPE_TTS_ENDPOINT =
  'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/text-to-audio'

interface TTSRequestBody {
  text: string
  province: string
}

export default async function handler(
  req: Request
): Promise<Response> {
  // CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    })
  }

  // 检查 API Key
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'DASHSCOPE_API_KEY not configured',
        offline: true,
      }),
      { status: 200, headers }
    )
  }

  // 解析请求体
  let body: TTSRequestBody
  try {
    body = (await req.json()) as TTSRequestBody
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers,
    })
  }

  const { text, province } = body
  if (!text || !province) {
    return new Response(
      JSON.stringify({ error: 'Missing text or province' }),
      { status: 400, headers }
    )
  }

  // 构建方言指令
  const dialectInstruction =
    DIALECT_MAP[province] || '请用普通话表达'
  const instruction = `${dialectInstruction}，请保留该方言的词汇与语调特色，以古朴庄重的语气朗读：${text}`

  try {
    // 调用 DashScope CosyVoice API
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
      console.error('[TTS] DashScope API error:', response.status, errText)
      return new Response(
        JSON.stringify({ error: `DashScope API error: ${response.status}` }),
        { status: 502, headers }
      )
    }

    const data = (await response.json()) as {
      output?: { audio?: { url?: string } }
      message?: string
    }

    const audioUrl = data.output?.audio?.url
    if (!audioUrl) {
      console.error('[TTS] No audio URL in response:', JSON.stringify(data))
      return new Response(
        JSON.stringify({ error: 'No audio URL in response' }),
        { status: 502, headers }
      )
    }

    return new Response(JSON.stringify({ audioUrl }), { status: 200, headers })
  } catch (e) {
    console.error('[TTS] Request failed:', e)
    return new Response(
      JSON.stringify({ error: 'TTS request failed' }),
      { status: 500, headers }
    )
  }
}
