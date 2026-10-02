import './pdf-compat'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerUrl from './pdf.worker.ts?worker&url'
import { extractPdfText } from './pdf-text'
GlobalWorkerOptions.workerSrc = workerUrl

export async function extractPdf(file: File): Promise<string> {
  if (file.size > 20 * 1024 * 1024) throw new Error('PDF ต้องไม่เกิน 20 MB')
  const data = new Uint8Array(await file.arrayBuffer())
  if (!new TextDecoder().decode(data.subarray(0, 5)).startsWith('%PDF-')) throw new Error('ไฟล์นี้ไม่ใช่ PDF ที่ถูกต้อง')
  const loading = getDocument({ data })
  const doc = await loading.promise
  try {
    return await extractPdfText(doc)
  } finally { await loading.destroy() }
}
