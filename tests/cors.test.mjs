import { test } from 'node:test'
import assert from 'node:assert/strict'
import { corsHeaders } from '../supabase/functions/_shared/cors.ts'
const origins = 'https://learn-pilot-blush.vercel.app, http://localhost:4173,http://127.0.0.1:4173'
const request = origin => new Request('https://backend.example/functions/v1/analyze-content', { headers: origin ? { Origin: origin } : {} })
test('each allowed frontend gets one exact request-scoped origin for preflight and error responses', () => {
  for (const origin of origins.split(',').map(s => s.trim())) {
    const headers = corsHeaders(request(origin), origins)
    assert.equal(headers['Access-Control-Allow-Origin'], origin)
    assert.equal(headers.Vary, 'Origin')
    assert.ok(headers['Access-Control-Allow-Headers'].includes('authorization'))
  }
})
test('unknown origins, lookalike domains and ports are not allowed; no wildcard fallback', () => {
  for (const origin of ['https://learn-pilot-blush.vercel.app.evil.example', 'http://localhost:3000', 'null', 'https://evil.example']) {
    assert.equal(corsHeaders(request(origin), origins)['Access-Control-Allow-Origin'], undefined)
  }
  assert.equal(corsHeaders(request('https://evil.example'), '*')['Access-Control-Allow-Origin'], undefined)
  assert.equal(corsHeaders(request(null), origins)['Access-Control-Allow-Origin'], undefined)
})
test('single-origin configuration stays compatible and requests cannot leak another frontend header', () => {
  assert.equal(corsHeaders(request('http://localhost:5173'))['Access-Control-Allow-Origin'], 'http://localhost:5173')
  assert.equal(corsHeaders(request('https://learn-pilot-blush.vercel.app'), origins)['Access-Control-Allow-Origin'], 'https://learn-pilot-blush.vercel.app')
  assert.equal(corsHeaders(request('http://localhost:4173'), origins)['Access-Control-Allow-Origin'], 'http://localhost:4173')
})
