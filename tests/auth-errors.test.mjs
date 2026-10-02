import { test } from 'node:test'
import assert from 'node:assert/strict'
import { authErrorMessage } from '../src/leanpilot/auth-errors.ts'
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
