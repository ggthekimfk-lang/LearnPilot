// Run after npm run build. Playwright may be installed locally or supplied via
// PLAYWRIGHT_MODULE (absolute path to its index.mjs). No backend/account needed.
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { preview } from 'vite'
import { pdfFixture } from '../tests/fixtures/pdf.mjs'

const { chromium, firefox, webkit, devices } = process.env.PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
  : await import('playwright')
const engine = process.env.PDF_BROWSER || 'chromium'
const browserType = { chromium, firefox, webkit }[engine]
assert.ok(browserType, 'PDF_BROWSER must be chromium, firefox or webkit')
const server = await preview({ preview: { host: '127.0.0.1' } })
let browser
try {
  browser = await browserType.launch({ headless: true, ...(process.env.PDF_CHANNEL ? { channel: process.env.PDF_CHANNEL } : {}) })
  console.log(`Browser: ${process.env.PDF_CHANNEL || engine} ${browser.version()}`)
  const base = server.resolvedUrls.local[0]
  const chunk = readdirSync('dist/assets').find(name => /^pdf-[\w-]+\.js$/.test(name))
  assert.ok(chunk, 'production PDF chunk must exist')
  const text = 'โปรโตคอลกำหนดรูปแบบและลำดับข้อความ TCP provides reliable transport. '.repeat(8)
  const bytes = Array.from(pdfFixture([text, text]))
  for (const profile of ['Desktop', 'iPhone 13', 'Pixel 7', 'Blocked workers']) {
    const blockedWorkers = profile === 'Blocked workers'
    const context = await browser.newContext(devices[profile] || {})
    try {
      await context.addInitScript(() => {
        delete Promise.withResolvers
        delete ReadableStream.prototype[Symbol.asyncIterator]
        delete ReadableStream.prototype.values
      })
      if (blockedWorkers) await context.addInitScript(() => {
        globalThis.Worker = class { constructor() { throw new Error('Workers blocked by browser') } }
      })
      const page = await context.newPage()
      const workers = []
      page.on('worker', worker => workers.push(worker.url()))
      await page.goto(base)
      const result = await page.evaluate(async ({ base, chunk, bytes }) => {
        const module = await import(`${base}assets/${chunk}`)
        const { extractPdf } = module
        const outputs = []
        for (const type of ['', 'application/octet-stream', 'application/pdf']) {
          outputs.push(await extractPdf(new File([new Uint8Array(bytes)], 'lesson.PDF', { type })))
        }
        // Exercise the real FileReader fallback in the browser.
        const legacy = new File([new Uint8Array(bytes)], 'legacy.pdf')
        Object.defineProperty(legacy, 'arrayBuffer', { value: undefined })
        outputs.push(await extractPdf(legacy))
        const errors = []
        for (const content of ['not a PDF', '%PDF-1.7\ncorrupt']) {
          try { await extractPdf(new File([content], 'bad.pdf')); errors.push('unexpected success') }
          catch (error) { errors.push(error.message) }
        }
        // A failed loading task must not prevent the next document from opening.
        outputs.push(await extractPdf(new File([new Uint8Array(bytes)], 'retry.pdf')))
        const assets = []
        for (const path of ['cmaps/UniJIS-UTF16-H.bcmap', 'standard_fonts/LiberationSans-Regular.ttf']) {
          const response = await fetch(`${base}pdfjs/${path}`)
          assets.push({ ok: response.ok, type: response.headers.get('content-type'), size: (await response.arrayBuffer()).byteLength })
        }
        return { outputs, errors, assets }
      }, { base, chunk, bytes })
      for (const source of result.outputs) {
        assert.match(source, /โปรโตคอล/)
        assert.match(source, /TCP/)
        assert.match(source, /\[PDF หน้า 2\]/)
      }
      assert.match(result.errors[0], /ไม่ใช่ PDF/)
      assert.match(result.errors[1], /เสียหาย/)
      for (const asset of result.assets) { assert.equal(asset.ok, true); assert.ok(asset.size > 100); assert.doesNotMatch(asset.type, /text\/html/) }
      if (!blockedWorkers) assert.ok(workers.some(url => /pdf\.worker-/.test(url)), 'real PDF worker must start')
      console.log(`PASS ${engine} ${profile}: Thai/English multipage PDF, mobile MIME, FileReader, errors/retry, assets and worker`)
    } finally { await context.close() }
  }
} finally {
  await browser?.close()
  await new Promise(resolve => server.httpServer.close(resolve))
}
