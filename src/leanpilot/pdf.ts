import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
GlobalWorkerOptions.workerSrc = workerUrl

export async function extractPdf(file: File): Promise<string> {
  if (file.size > 20 * 1024 * 1024) throw new Error('PDF ต้องไม่เกิน 20 MB')
  const data = new Uint8Array(await file.arrayBuffer())
  if (!new TextDecoder().decode(data.subarray(0, 5)).startsWith('%PDF-')) throw new Error('ไฟล์นี้ไม่ใช่ PDF ที่ถูกต้อง')
  const loading = getDocument({ data })
  const doc = await loading.promise
  try {
    let source = ''
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber)
      const content = await page.getTextContent()
      const text = content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('').trim()
      if (text) source += `\n[PDF หน้า ${pageNumber}]\n${text}\n`
      if (source.length > 100000) throw new Error('ข้อความที่แยกได้เกิน 100,000 ตัวอักษร กรุณาแบ่ง PDF')
    }
    if (source.replace(/\[PDF หน้า \d+\]/g, '').trim().length < 200) throw new Error('PDF ไม่มี text layer หรือมีข้อความน้อยเกินไป ยังไม่รองรับเอกสารสแกน กรุณาวางข้อความแทน')
    return source.trim()
  } finally { await loading.destroy() }
}
