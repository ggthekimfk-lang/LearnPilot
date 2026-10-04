import assert from 'node:assert/strict'

// In-memory PDF bytes with a ToUnicode map exercise the actual PDF.js parser,
// including Thai text, without platform font dependencies or saved artifacts.
export function pdfFixture(pages) {
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
