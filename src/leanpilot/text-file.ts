export async function extractTextFile(file: Pick<File, 'size' | 'arrayBuffer'>): Promise<string> {
  if (file.size > 1024 * 1024) throw new Error('ไฟล์ TEXT ต้องไม่เกิน 1 MB')
  let text: string
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()).trim() }
  catch { throw new Error('กรุณาใช้ไฟล์ TEXT ที่บันทึกเป็น UTF-8') }
  if (text.includes('\0')) throw new Error('ไฟล์นี้ไม่ใช่ข้อความธรรมดา')
  if (text.length < 200 || text.length > 100000) throw new Error('เนื้อหา TEXT ต้องมี 200–100,000 ตัวอักษร')
  return text
}
