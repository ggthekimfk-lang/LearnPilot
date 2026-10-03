import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { createServer } from 'vite'

test('dev function proxy removes browser origin but preserves user authentication', async () => {
  let received
  const backend = createHttpServer((req, res) => {
    received = { origin: req.headers.origin, auth: req.headers.authorization, path: req.url }
    res.setHeader('Content-Type', 'application/json')
    res.end('{}')
  })
  await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve))
  let vite
  try {
    vite = await createServer({ server: { host: '127.0.0.1', port: 0, open: false, proxy: {
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
  }
})
