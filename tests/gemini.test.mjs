import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generate } from '../supabase/functions/_shared/gemini.ts'

test('shared Gemini provider keeps model configuration and supports configurable output limits and deadlines', async () => {
  const previousFetch = globalThis.fetch
  const previousDeno = globalThis.Deno
  const deadline = AbortSignal.timeout(10000)
  const calls = []
  globalThis.Deno = { env: { get: key => ({ GEMINI_MODEL: 'models/test-model', GEMINI_API_KEY: 'fake-test-key' })[key] } }
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) })
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ thought: true, text: 'do not expose this' }, { text: '{"answer":"ok"}' }] } }] })
  }
  try {
    assert.deepEqual(await generate('question', { type: 'object' }, 'generation instructions', { maxOutputTokens: 4000, signal: deadline }), { answer: 'ok' })
    assert.match(calls[0].url, /models\/test-model:generateContent/)
    assert.equal(calls[0].body.generationConfig.maxOutputTokens, 4000)
    assert.equal(calls[0].body.systemInstruction.parts[0].text, 'generation instructions')
    assert.equal(calls[0].options.signal.aborted, false)
    await generate('source', { type: 'object' }, 'summary instructions')
    assert.equal(calls[1].body.generationConfig.maxOutputTokens, 12000, 'existing analysis budget remains')
  } finally { globalThis.fetch = previousFetch; globalThis.Deno = previousDeno }
})
test('shared provider rejects partial responses and redacts the server API key from errors', async () => {
  const previousFetch = globalThis.fetch
  const previousDeno = globalThis.Deno
  globalThis.Deno = { env: { get: key => ({ GEMINI_MODEL: 'test-model', GEMINI_API_KEY: 'secret-test-key' })[key] } }
  try {
    globalThis.fetch = async () => Response.json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{}' }] } }] })
    await assert.rejects(generate('source', {}, 'test'), /incomplete/)
    globalThis.fetch = async () => Response.json({ error: { message: 'Rejected key secret-test-key' } }, { status: 400 })
    await assert.rejects(generate('source', {}, 'test'), e => e.message.includes('[REDACTED]') && !e.message.includes('secret-test-key') && e.message.includes('(model: test-model)'))
  } finally { globalThis.fetch = previousFetch; globalThis.Deno = previousDeno }
})


test('429 retains provider quota details and model, redacts secrets, and does not retry quota failures', async () => {
  const previousFetch = globalThis.fetch
  const previousDeno = globalThis.Deno
  let calls = 0
  globalThis.Deno = { env: { get: key => ({ GEMINI_MODEL: 'test-model', GEMINI_API_KEY: 'secret-test-key' })[key] } }
  globalThis.fetch = async () => {
    calls++
    return Response.json({ error: { message: 'Quota exceeded: GenerateRequestsPerDay. Please retry in 40s. secret-test-key' } }, { status: 429 })
  }
  try {
    await assert.rejects(generate('source', {}, 'test'), e => e.message.startsWith('Gemini HTTP 429:') && e.message.includes('GenerateRequestsPerDay') && e.message.includes('retry in 40s') && e.message.includes('(model: test-model)') && !e.message.includes('secret-test-key'))
    assert.equal(calls, 1)
  } finally { globalThis.fetch = previousFetch; globalThis.Deno = previousDeno }
})
