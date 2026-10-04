import './pdf-compat'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerUrl from './pdf.worker.ts?worker&url'
import { extractPdfText } from './pdf-text'
import { readPdfFile } from './pdf-file'
GlobalWorkerOptions.workerSrc = workerUrl

export async function extractPdf(file: File): Promise<string> {
  const data = await readPdfFile(file)
  const assetBase = new URL(`${import.meta.env.BASE_URL}pdfjs/`, window.location.href).href
  const loading = getDocument({
    data,
    cMapUrl: `${assetBase}cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${assetBase}standard_fonts/`,
    // Text extraction should use the same bundled metrics on every device.
    useSystemFonts: false,
  })
  try {
    const doc = await loading.promise
    return await extractPdfText(doc)
  } catch (error) {
    if (error instanceof Error && error.name === 'PasswordException') {
      throw new Error('PDF นี้มีรหัสผ่าน กรุณาปลดรหัสผ่านแล้วเลือกไฟล์อีกครั้ง', { cause: error })
    }
    if (error instanceof Error && error.name === 'InvalidPDFException') {
      throw new Error('ไฟล์ PDF เสียหายหรืออ่านไม่ได้ กรุณาดาวน์โหลดไฟล์ใหม่', { cause: error })
    }
    throw error
  } finally { await loading.destroy() }
}
