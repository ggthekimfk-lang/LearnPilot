import { resolve } from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { extractPdfText } from '../src/leanpilot/pdf-text.ts'
import { generateLearning } from '../supabase/functions/analyze-content/learning.ts'

// In-memory PDF bytes with a ToUnicode map exercise the actual PDF.js parser,
// including Thai text, without platform font dependencies or saved artifacts.
function pdfFixture(pages) {
  const chars = [...new Set(pages.join('').split(''))]
  assert.ok(chars.length < 255)
  const codes = new Map(chars.map((char, i) => [char, (i + 1).toString(16).padStart(2, '0')]))
  const stream = text => `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`
  const cmap = `/CIDInit /ProcSet findresource begin 12 dict begin begincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /TestUnicode def /CMapType 2 def\n1 begincodespacerange <00> <FF> endcodespacerange\n${chars.length} beginbfchar\n${chars.map(char => `<${codes.get(char)}> <${char.charCodeAt(0).toString(16).padStart(4, '0')}>`).join('\n')}\nendbfchar endcmap CMapName currentdict /CMap defineresource pop end end`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${5 + i * 2} 0 R`).join(' ')}] >>`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding /ToUnicode 4 0 R /FirstChar 0 /LastChar 255 /Widths [${Array(256).fill(600).join(' ')}] >>`,
    stream(cmap),
  ]
  for (const [i, page] of pages.entries()) {
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${6 + i * 2} 0 R >>`)
    const lines = page.match(/[\s\S]{1,80}/g) ?? []
    objects.push(stream('BT /F1 9 Tf 12 TL 20 770 Td\n' + lines.map(line => `<${line.split('').map(c => codes.get(c)).join('')}> Tj T*`).join('\n') + '\nET'))
  }
  let text = '%PDF-1.7\n'
  const offsets = [0]
  for (const [i, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(text)); text += `${i + 1} 0 obj\n${object}\nendobj\n`
  }
  const xref = Buffer.byteLength(text)
  text += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Uint8Array(Buffer.from(text))
}
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
