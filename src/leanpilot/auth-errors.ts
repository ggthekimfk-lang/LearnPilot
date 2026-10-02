type AuthFailure = { code?: string; status?: number; message: string }
export function authErrorMessage(error: AuthFailure): string {
  if (error.code === 'over_email_send_rate_limit' || /email rate limit exceeded/i.test(error.message)) {
    return 'ระบบส่งอีเมลยืนยันถึงขีดจำกัดแล้ว กรุณาหยุดสมัครหรือขออีเมลซ้ำ หากยืนยันบัญชีแล้วให้เข้าสู่ระบบด้วยบัญชีเดิม หากยังไม่ได้ยืนยัน ให้รอหรือติดต่อผู้ดูแลระบบ'
  }
  if (error.code === 'email_not_confirmed') return 'กรุณายืนยันอีเมลจากข้อความที่ได้รับก่อนเข้าสู่ระบบ ไม่ต้องสมัครบัญชีเดิมซ้ำ'
  if (error.code === 'over_request_rate_limit' || error.status === 429) return 'มีคำขอมากเกินไป กรุณาเว้นช่วงแล้วลองใหม่'
  return error.message
}
