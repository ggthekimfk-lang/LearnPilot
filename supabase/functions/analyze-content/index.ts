import { createClient } from 'npm:@supabase/supabase-js@2.117.2'
import { generateQuiz } from './quiz.ts'
import { generate } from '../_shared/gemini.ts'
import { generateLearning } from './learning.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async request => {
  const cors = corsHeaders(request, Deno.env.get('APP_ORIGIN'))
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  if (request.headers.has('Origin') && !cors['Access-Control-Allow-Origin']) return json({ error: 'Frontend origin is not allowed; check APP_ORIGIN' }, 403)
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!Deno.env.get('GEMINI_API_KEY') || !Deno.env.get('GEMINI_MODEL')) return json({ error: 'ยังไม่ได้ตั้งค่า Gemini ฝั่ง server' }, 503)
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
  if (!token) return json({ error: 'Unauthorized' }, 401)
  const { data: { user }, error: authError } = await db.auth.getUser(token)
  if (authError || !user) return json({ error: 'Unauthorized' }, 401)
  let contentId: string
  let mode: string
  try { const body = await request.json(); contentId = body.content_id; mode = body.mode ?? 'summary'; if (!['summary', 'quiz'].includes(mode)) throw new Error(); if (!/^[0-9a-f-]{36}$/i.test(contentId)) throw new Error() } catch { return json({ error: 'Invalid request' }, 400) }
  const { data: content, error } = await db.rpc(mode === 'quiz' ? 'lp_claim_quiz' : 'lp_claim_analysis', { p_content: contentId, p_owner: user.id, p_model: Deno.env.get('GEMINI_MODEL') })
  if (error) return json({ error: error.message }, 409)
  if (content.ready) return json({ status: 'ready' })
  // Work continues after navigation; the persisted lease permits recovery after a crash.
  const work = async () => {
    const start = Date.now()
    try {
      if (mode === 'summary') {
        const analysis = await generateLearning(content.source, contentId, generate)
        const { error: publishError } = await db.rpc('lp_publish_summary', { p_content: contentId, p_owner: user.id, p_output: analysis, p_latency: Date.now() - start, p_claim: content.analysis_claim })
        if (publishError) throw new Error(publishError.message)
        return
      }
            const analysis = await generateQuiz(content.source, contentId, content, generate)
const { error: publishError } = await db.rpc('lp_publish_quiz', { p_content: contentId, p_owner: user.id, p_output: analysis, p_latency: Date.now() - start, p_claim: content.analysis_claim })
      if (publishError) throw new Error(publishError.message)
    } catch (e) {
      await db.rpc(mode === 'quiz' ? 'lp_fail_quiz' : 'lp_fail_analysis', { p_content: contentId, p_owner: user.id, p_error: e instanceof Error ? e.message : 'Analysis failed', p_claim: content.analysis_claim })
      if (mode === 'quiz') throw e
    }
  }
  if (mode === 'quiz') {
    try { await work(); return json({ status: 'ready' }) } catch (e) { return json({ error: e instanceof Error ? e.message : 'สร้างแบบทดสอบไม่สำเร็จ' }, 422) }
  }
  EdgeRuntime.waitUntil(work())
  return json({ status: 'analyzing' }, 202)
})


