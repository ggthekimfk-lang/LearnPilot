import { test } from 'node:test'
import assert from 'node:assert/strict'
import { retryUnavailable } from '../supabase/functions/analyze-content/retry.ts'

test('Gemini 503 retries with backoff and returns recovered response', async () => {
  const statuses = [503, 503, 200]
  const pauses = []
  const result = await retryUnavailable(async () => new Response('{}', { status: statuses.shift() }), async ms => { pauses.push(ms) })
  assert.equal(result.status, 200)
  assert.deepEqual(pauses, [2000, 4000])
})

test('persistent 503 is capped, other errors and network failures are not retried', async () => {
  for (const status of [503, 400, 401, 429]) {
    let calls = 0
    const result = await retryUnavailable(async () => { calls++; return new Response('{}', { status }) }, async () => {})
    assert.equal(result.status, status)
    assert.equal(calls, status === 503 ? 5 : 1)
  }
  let calls = 0
  await assert.rejects(retryUnavailable(async () => { calls++; throw new Error('network failed') }))
  assert.equal(calls, 1)
})


test('a longer temporary outage recovers on the fifth request; persistent outages use bounded exponential delays', async () => {
  for (const finalStatus of [200, 503]) {
    let calls = 0
    const pauses = []
    const response = await retryUnavailable(async () => new Response('{}', { status: ++calls === 5 ? finalStatus : 503 }), async ms => { pauses.push(ms) })
    assert.equal(response.status, finalStatus)
    assert.equal(calls, 5)
    assert.deepEqual(pauses, [2000, 4000, 8000, 16000])
  }
})
