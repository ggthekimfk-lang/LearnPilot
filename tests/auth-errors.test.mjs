import { test } from 'node:test'
import assert from 'node:assert/strict'
import { authErrorMessage } from '../src/leanpilot/auth-errors.ts'

test('disabled Google provider points to existing password login and provider setup', () => {
  assert.match(authErrorMessage({ message: 'Unsupported provider: provider is not enabled' }), /Google.*อีเมลและรหัสผ่าน/)
  assert.match(authErrorMessage({ code: 'provider_disabled', message: 'Disabled' }), /Supabase/)
})
test('other-email signup delivery restrictions and invalid credentials have distinct guidance', () => {
  assert.match(authErrorMessage({ code: 'email_address_not_authorized', message: 'Email address not authorized' }), /Custom SMTP/)
  assert.match(authErrorMessage({ message: 'Email address "test@example.com" cannot be used as it is not authorized' }), /Custom SMTP/)
  assert.match(authErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' }), /อีเมลหรือรหัสผ่านไม่ถูกต้อง/)
  assert.match(authErrorMessage({ message: 'Email not confirmed' }), /ส่งอีเมลยืนยันอีกครั้ง/)
})
test('email quota is distinct from generic throttling and does not promise an unsupported reset time', () => {
  const result = authErrorMessage({ code: 'over_email_send_rate_limit', status: 429, message: 'email rate limit exceeded' })
  assert.match(result, /อีเมลยืนยันถึงขีดจำกัด/)
  assert.match(result, /บัญชีเดิม/)
  assert.doesNotMatch(result, /60|หนึ่งนาที|สมัครสำเร็จ/)
  assert.equal(authErrorMessage({ message: 'Email rate limit exceeded' }), result)
  assert.match(authErrorMessage({ status: 429, message: 'Too many requests' }), /คำขอมากเกินไป/)
})
test('unconfirmed email guides verification without another signup; other errors remain informative', () => {
  assert.match(authErrorMessage({ code: 'email_not_confirmed', message: 'Email not confirmed' }), /ไม่ต้องสมัครบัญชีเดิมซ้ำ/)
  assert.equal(authErrorMessage({ message: 'Invalid API key' }), 'Invalid API key')
})
