import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { createServer, preview } from 'vite'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('dev function proxy removes browser origin but preserves user authentication', async () => {
  let received
  const backend = createHttpServer((req, res) => {
    received = { origin: req.headers.origin, auth: req.headers.authorization, path: req.url }
    res.setHeader('Content-Type', 'application/json')
    res.end('{}')
  })
  await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve))
  let vite
  const cacheDir = await mkdtemp(join(tmpdir(), 'learnpilot-vite-test-'))
  try {
    vite = await createServer({ cacheDir, server: { host: '127.0.0.1', port: 0, open: false, proxy: {
      '/__supabase/functions/v1/': { target: `http://127.0.0.1:${backend.address().port}` },
    } } })
    await vite.listen()
    const response = await fetch(`http://127.0.0.1:${vite.httpServer.address().port}/__supabase/functions/v1/analyze-content`, {
      method: 'POST', headers: { Origin: 'http://localhost:5173', Authorization: 'Bearer test-user-token' }, body: '{}',
    })
    assert.equal(response.status, 200)
    assert.deepEqual(received, { origin: undefined, auth: 'Bearer test-user-token', path: '/functions/v1/analyze-content' })
  } finally {
    await vite?.close()
    await new Promise(resolve => backend.close(resolve))
    await rm(cacheDir, { recursive: true, force: true })
  }
})

test('production preview proxies functions and preserves authorization, query, body and error responses', async () => {
  let received
  const backend = createHttpServer((req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      received = { origin: req.headers.origin, auth: req.headers.authorization, path: req.url, body }
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end('{"error":"Unauthorized"}')
    })
  })
  await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve))
  let server
  try {
    server = await preview({ server: { proxy: {
      '/__supabase/functions/v1/': { target: `http://127.0.0.1:${backend.address().port}` },
    } }, preview: { host: '127.0.0.1', port: 0, open: false } })
    const response = await fetch(`http://127.0.0.1:${server.httpServer.address().port}/__supabase/functions/v1/analyze-content?mode=quiz`, {
      method: 'POST', headers: { Origin: 'http://localhost:4173', Authorization: 'Bearer preview-token', 'Content-Type': 'application/json' }, body: '{"mode":"quiz"}',
    })
    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), { error: 'Unauthorized' })
    assert.deepEqual(received, { origin: undefined, auth: 'Bearer preview-token', path: '/functions/v1/analyze-content?mode=quiz', body: '{"mode":"quiz"}' })
  } finally {
    await server?.close()
    await new Promise(resolve => backend.close(resolve))
  }
})
