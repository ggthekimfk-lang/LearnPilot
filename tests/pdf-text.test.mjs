import { resolve } from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { extractPdfText } from '../src/leanpilot/pdf-text.ts'
import { generateLearning } from '../supabase/functions/analyze-content/learning.ts'

import { pdfFixture } from './fixtures/pdf.mjs'

const english = 'Protocols define message format and order. TCP provides reliable transport. '
const thai = 'โปรโตคอลกำหนดรูปแบบและลำดับข้อความ TCP ส่งข้อมูลอย่างเชื่อถือได้ '
const cases = [
  ['short PDF', [english.repeat(4)], 'TCP'],
  ['long multipage PDF', Array(30).fill(english.repeat(30)), 'TCP'],
  ['multiple topics PDF', [english.repeat(4), 'UDP is connectionless. '.repeat(15)], 'UDP'],
  ['Thai PDF', [thai.repeat(6)], 'โปรโตคอล'],
  ['English PDF', [english.repeat(6)], 'Protocols'],
  ['formula PDF', ['Transmission delay = L/R. L is packet length in bits. R is rate in bits per second. '.repeat(4)], 'L/R'],
  ['table/list PDF', ['Protocol | Property\nTCP | reliable\nUDP | connectionless\n1. Send\n2. Receive\n'.repeat(4)], 'UDP'],
  ['boundary PDF', [english.repeat(50)], 'TCP'],
]
for (const [name, pages, expected] of cases) test(`actual PDF.js extraction and summary path: ${name}`, async () => {
  const loading = getDocument({ data: pdfFixture(pages), useSystemFonts: false, standardFontDataUrl: resolve('node_modules/pdfjs-dist/standard_fonts') + '/'  })
  try {
    const doc = await loading.promise
    const source = await extractPdfText(doc)
    assert.equal(doc.numPages, pages.length)
    assert.ok(source.includes(expected))
    assert.ok(source.includes(`[PDF หน้า ${pages.length}]`))
    let finalCalls = 0
    const result = await generateLearning(source, 'doc', async (_, format) => {
      if (format.properties.valid) return { valid: true, reason: '' }
      if (format.properties.notes) return { notes: expected }
      finalCalls++
      return { summary: { overview: expected, sections: [{ title: 'หัวข้อสำคัญ', items: [expected] }], references: [], points: [{ text: expected, references: [] }] }, concepts: [{ id: 'c1', name: expected, description: expected, references: [] }], questions: [] }
    })
    assert.equal(finalCalls, 1)
    assert.equal(result.questions.length, 0)
  } finally { await loading.destroy() }
})
test('blank PDF pages preserve reading limitations without accepting scans as readable text', async () => {
  const loading = getDocument({ data: pdfFixture([english.repeat(4), '']), useSystemFonts: false, standardFontDataUrl: resolve('node_modules/pdfjs-dist/standard_fonts') + '/'  })
  try {
    const source = await extractPdfText(await loading.promise)
    assert.match(source, /เนื้อหาบางส่วนไม่มีข้อความที่อ่านได้/)
  } finally { await loading.destroy() }
  await assert.rejects(extractPdfText({ numPages: 10, getPage: async () => ({ getTextContent: async () => ({ items: [] }) }) }), /ไม่มี text layer/)
})
