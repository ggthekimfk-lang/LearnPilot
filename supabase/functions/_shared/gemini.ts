import { retryUnavailable } from '../analyze-content/retry.ts'

export async function generate(input: string, format: Record<string, unknown>, instruction: string, options: { maxOutputTokens?: number; signal?: AbortSignal } = {}) {
  const model = Deno.env.get('GEMINI_MODEL')!.trim().replace(/^models\//, '')
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error('GEMINI_MODEL ไม่ถูกต้อง กรุณาใช้ Model code จาก Google AI Studio')
  const signal = options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(90000)]) : AbortSignal.timeout(90000)
  const response = await retryUnavailable(() => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', signal,
    headers: { 'x-goog-api-key': Deno.env.get('GEMINI_API_KEY')!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: instruction }] },
      contents: [{ role: 'user', parts: [{ text: input }] }],
      generationConfig: { maxOutputTokens: options.maxOutputTokens ?? 12000, responseMimeType: 'application/json', responseJsonSchema: format } }),
  }))
  if (!response.ok) {
    if (response.status === 404) throw new Error(`Gemini HTTP 404: ไม่พบโมเดล ${model} หรือโมเดลนี้ไม่รองรับ generateContent กรุณาตรวจ GEMINI_MODEL`)
    // Read only the provider error message; never persist request headers or the full response.
    if (response.status === 400 || response.status === 429 || response.status === 503) {
      const failure = await response.json().catch(() => null)
      const apiKey = Deno.env.get('GEMINI_API_KEY')!
      const detail = typeof failure?.error?.message === 'string'
        ? failure.error.message.split(apiKey).join('[REDACTED]').slice(0, 1000)
        : 'คำขอไม่ถูกต้อง แต่ผู้ให้บริการไม่ได้ส่งรายละเอียด'
      throw new Error(`Gemini HTTP ${response.status}: ${detail} (model: ${model})${response.status === 503 ? ' — ระบบลองซ้ำแล้ว แต่โมเดลยังไม่พร้อมให้บริการ กรุณาลองใหม่ภายหลัง' : ''}`)
    }
    throw new Error(`Gemini HTTP ${response.status}`)
  }
  const data = await response.json()
  const candidate = data.candidates?.[0]
  if (candidate?.finishReason !== 'STOP') throw new Error('AI output incomplete or blocked')
  const text = candidate.content?.parts?.filter((part: { thought?: boolean; text?: string }) => !part.thought && typeof part.text === 'string').map((part: { text: string }) => part.text).join('')
  if (!text) throw new Error('AI refused or returned no output')
  return JSON.parse(text)
}


