import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { checkOrigins } from '../scripts/check-origins.mjs'
import { corsHeaders } from '../supabase/functions/_shared/cors.ts'

const origin = 'https://frontend.example'
async function withBackend(brokenPost, run) {
  const server = createServer((req, res) => {
    const headers = corsHeaders(new Request('http://backend.example', { headers: { Origin: req.headers.origin } }), origin)
    const allowed = !!headers['Access-Control-Allow-Origin']
    if (brokenPost && req.method === 'POST') delete headers['Access-Control-Allow-Origin']
    res.writeHead(allowed ? (req.method === 'OPTIONS' ? 200 : 401) : 403, headers)
    res.end()
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    await run(`http://127.0.0.1:${server.address().port}`)
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
}

test('deployment checker verifies preflight, authenticated boundary and rejection of untrusted origins', async () => {
  await withBackend(false, endpoint => checkOrigins(endpoint, [origin]))
})
test('deployment checker catches missing CORS on POST even when preflight passes', async () => {
  await withBackend(true, endpoint => assert.rejects(checkOrigins(endpoint, [origin]), /POST origin\/auth check failed/))
})
