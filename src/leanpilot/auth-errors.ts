type AuthFailure = { code?: string; status?: number; message: string }
export function authErrorMessage(error: AuthFailure): string {
  if (error.code === 'provider_disabled' || /provider.*(not enabled|disabled)|unsupported provider/i.test(error.message)) return 'การเข้าสู่ระบบด้วย Google ยังไม่พร้อมใช้งาน กรุณาใช้อีเมลและรหัสผ่าน หรือติดต่อผู้ดูแลให้เปิด Google provider ใน Supabase'
  if (error.code === 'email_address_not_authorized' || /email address.*not authorized/i.test(error.message)) return 'ระบบยังส่งอีเมลยืนยันไปยังอีเมลนี้ไม่ได้ ผู้ดูแลต้องตั้งค่า Custom SMTP ใน Supabase เพื่อรองรับอีเมลผู้ใช้ทั่วไป'
  if (error.code === 'invalid_credentials' || /invalid login credentials/i.test(error.message)) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง หากยังไม่เคยสมัคร ให้เลือกสมัครสมาชิกก่อน หากสมัครแล้วให้ใช้อีเมลและรหัสผ่านของบัญชีนั้น'
  if (error.code === 'over_email_send_rate_limit' || /email rate limit exceeded/i.test(error.message)) {
    return 'ระบบส่งอีเมลยืนยันถึงขีดจำกัดแล้ว กรุณาหยุดสมัครหรือขออีเมลซ้ำ หากยืนยันบัญชีแล้วให้เข้าสู่ระบบด้วยบัญชีเดิม หากยังไม่ได้ยืนยัน ให้รอหรือติดต่อผู้ดูแลระบบ'
  }
  if (error.code === 'email_not_confirmed' || /email not confirmed/i.test(error.message)) return 'กรุณายืนยันอีเมลจากข้อความที่ได้รับก่อนเข้าสู่ระบบ ไม่ต้องสมัครบัญชีเดิมซ้ำ หากไม่พบอีเมลให้ตรวจสแปมหรือกดส่งอีเมลยืนยันอีกครั้ง'
  if (error.code === 'over_request_rate_limit' || error.status === 429) return 'มีคำขอมากเกินไป กรุณาเว้นช่วงแล้วลองใหม่'
  return error.message
}
