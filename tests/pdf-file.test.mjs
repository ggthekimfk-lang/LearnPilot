import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readPdfFile } from '../src/leanpilot/pdf-file.ts'
import { extractPdfText } from '../src/leanpilot/pdf-text.ts'

test('PDF selection validates bytes regardless of filename or mobile provider MIME type', async () => {
  for (const type of ['', 'application/octet-stream', 'application/pdf']) {
    const file = new File(['\uFEFF\n%PDF-1.7\n'], 'lesson', { type })
    assert.ok((await readPdfFile(file)).length > 5)
  }
  await assert.rejects(readPdfFile(new File(['plain text'], 'fake.pdf', { type: 'application/pdf' })), /ไม่ใช่ PDF/)
  await assert.rejects(readPdfFile(new File([], 'empty.pdf')), /ไม่ใช่ PDF/)
  await assert.rejects(readPdfFile({ size: 20 * 1024 * 1024 + 1, arrayBuffer() { throw new Error('must not read oversized file') } }), /20 MB/)
})

test('older mobile file APIs use FileReader and report provider errors and cancellation', async () => {
  const previous = globalThis.FileReader
  try {
    let outcome = 'success'
    globalThis.FileReader = class {
      readAsArrayBuffer() {
        if (outcome === 'success') { this.result = new TextEncoder().encode('%PDF-1.7').buffer; this.onload() }
        if (outcome === 'error') this.onerror()
        if (outcome === 'abort') this.onabort()
      }
    }
    assert.equal((await readPdfFile({ size: 8 })).length, 8)
    outcome = 'error'
    await assert.rejects(readPdfFile({ size: 8 }), /ดาวน์โหลดไฟล์ลงเครื่อง/)
    outcome = 'abort'
    await assert.rejects(readPdfFile({ size: 8 }), /ยกเลิก/)
  } finally {
    if (previous === undefined) delete globalThis.FileReader
    else globalThis.FileReader = previous
  }
})

test('page memory is released on success, extraction errors and text limit errors', async () => {
  for (const mode of ['success', 'error', 'oversized']) {
    let released = 0
    const doc = { numPages: 2, getPage: async () => ({
      getTextContent: async () => {
        if (mode === 'error') throw new Error('broken page')
        return { items: [{ str: 'a'.repeat(mode === 'oversized' ? 100001 : 200) }] }
      },
      cleanup: () => { released++ },
    }) }
    if (mode === 'success') { await extractPdfText(doc); assert.equal(released, 2) }
    else { await assert.rejects(extractPdfText(doc)); assert.equal(released, 1) }
  }
})
