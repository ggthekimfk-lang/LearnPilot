// Mobile file providers may omit or misreport MIME types. Validate the bytes.
export async function readPdfFile(file: File): Promise<Uint8Array> {
  if (file.size > 20 * 1024 * 1024) throw new Error('PDF ต้องไม่เกิน 20 MB')
  const buffer = typeof file.arrayBuffer === 'function'
    ? await file.arrayBuffer()
    : await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(new Error('อ่านไฟล์ไม่ได้ กรุณาดาวน์โหลดไฟล์ลงเครื่องแล้วเลือกอีกครั้ง'))
      reader.onabort = () => reject(new Error('การอ่านไฟล์ถูกยกเลิก กรุณาเลือกไฟล์อีกครั้ง'))
      reader.readAsArrayBuffer(file)
    })
  const data = new Uint8Array(buffer)
  // Like PDF.js, allow a header in the first 1024 bytes (e.g. a leading BOM).
  const header = new TextDecoder('latin1').decode(data.subarray(0, 1024))
  if (!header.includes('%PDF-')) throw new Error('ไฟล์นี้ไม่ใช่ PDF ที่ถูกต้อง')
  return data
}
