import test from 'node:test'
import assert from 'node:assert/strict'
import { functionUrl } from '../src/leanpilot/function-url.ts'

const backend = 'https://project.supabase.co'
test('dev, preview and alternate local ports route functions through their own frontend origin', () => {
  const target = new URL(`${backend}/functions/v1/analyze-content?x=1`)
  for (const origin of ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173', 'http://127.0.0.1:4173', 'http://[::1]:5173']) {
    assert.equal(functionUrl(target, backend, origin), `${origin}/__supabase/functions/v1/analyze-content?x=1`)
  }
  assert.equal(functionUrl(target, backend, 'https://learn-pilot-blush.vercel.app'), target.href)
})
test('local routing preserves auth, database and unrelated function URLs', () => {
  for (const address of [`${backend}/auth/v1/token`, `${backend}/rest/v1/lp_courses`, 'https://other.example/functions/v1/analyze-content']) {
    assert.equal(functionUrl(new URL(address), backend, 'http://localhost:4173'), address)
  }
})
