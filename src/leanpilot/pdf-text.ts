type TextDocument = { numPages: number; getPage(page: number): Promise<{ getTextContent(): Promise<{ items: unknown[] }> }> }

export async function extractPdfText(doc: TextDocument): Promise<string> {
  let source = ''
  let readableLength = 0
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber)
    const content = await page.getTextContent()
    const text = content.items.map(item => {
      if (!item || typeof item !== 'object' || !('str' in item) || typeof item.str !== 'string') return ''
      return item.str + ('hasEOL' in item && item.hasEOL ? '\n' : ' ')
    }).join('').trim()
    readableLength += text.length
    source += `\n[PDF หน้า ${pageNumber}]\n${text || '[เนื้อหาบางส่วนไม่มีข้อความที่อ่านได้ อาจเป็นภาพหรือเอกสารสแกน]'}\n`
    if (source.length > 100000) throw new Error('ข้อความที่แยกได้เกิน 100,000 ตัวอักษร กรุณาแบ่ง PDF')
  }
  if (readableLength < 200) throw new Error('PDF ไม่มี text layer หรือมีข้อความน้อยเกินไป ยังไม่รองรับเอกสารสแกน กรุณาวางข้อความแทน')
  return source.trim()
}
