import { useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { client } from './api'
import type { Snapshot } from './types'
import './account.css'

type Props = {
  user: User
  snapshot: Snapshot
  busy: boolean
  online: boolean
  run: (action: () => Promise<void>) => Promise<void>
  notify: (text: string) => void
  settings: () => void
  logout: () => void
}

export default function Account({ user, snapshot, busy, online, run, notify, settings, logout }: Props) {
  const [name, setName] = useState(String(user.user_metadata.display_name || ''))
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const displayName = String(user.user_metadata.display_name || user.email?.split('@')[0] || 'ผู้เรียน')
  const completed = snapshot.plans.flatMap(plan => plan.tasks).filter(task => task.status === 'completed').length
  const submitName = (event: FormEvent) => {
    event.preventDefault()
    void run(async () => {
      const { error } = await client!.auth.updateUser({ data: { display_name: name.trim() } })
      if (error) throw error
      notify('บันทึกชื่อที่แสดงแล้ว')
    })
  }
  const submitPassword = (event: FormEvent) => {
    event.preventDefault()
    void run(async () => {
      if (password !== confirmation) throw new Error('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      const { error } = await client!.auth.updateUser({ password })
      if (error) throw error
      setPassword(''); setConfirmation('')
      notify('เปลี่ยนรหัสผ่านแล้ว')
    })
  }
  return <>
    <div className="lp-heading"><div><span className="lp-eyebrow">YOUR PERSONAL SPACE</span><h1>บัญชีของฉัน</h1><p>จัดการข้อมูลส่วนตัวและดูภาพรวมการเรียนของคุณ</p></div></div>
    <section className="lp-card lp-profile-hero">
      <span className="lp-profile-avatar" aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</span>
      <div><h2>{displayName}</h2><p className="lp-profile-email">{user.email || 'ไม่มีอีเมล'}</p><span className="lp-tag">{user.email_confirmed_at ? 'ยืนยันอีเมลแล้ว' : 'ยังไม่ยืนยันอีเมล'}</span></div>
    </section>
    <div className="lp-profile-stats" aria-label="ภาพรวมการเรียน">
      <section className="lp-card"><strong>{snapshot.courses.length}</strong><span>วิชาของฉัน</span></section>
      <section className="lp-card"><strong>{snapshot.attempts.filter(attempt => attempt.result).length}</strong><span>แบบทดสอบที่ส่ง</span></section>
      <section className="lp-card"><strong>{completed}</strong><span>กิจกรรมที่เสร็จ</span></section>
    </div>
    <div className="lp-grid">
      <form className="lp-card" onSubmit={submitName}><h2>ข้อมูลส่วนตัว</h2><label>ชื่อที่แสดง<input value={name} onChange={event => setName(event.target.value)} autoComplete="nickname" maxLength={80} required /></label><label>อีเมลบัญชี<input type="email" value={user.email || ''} readOnly /></label><p className="lp-muted">อีเมลนี้ใช้สำหรับเข้าสู่ระบบ</p><button disabled={busy || !online || !name.trim()}>บันทึกข้อมูล</button></form>
      <form className="lp-card" onSubmit={submitPassword}><h2>ความปลอดภัย</h2><p>ตั้งรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร</p><label>รหัสผ่านใหม่<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label><label>ยืนยันรหัสผ่านใหม่<input type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="new-password" minLength={8} required /></label><button disabled={busy || !online}>เปลี่ยนรหัสผ่าน</button></form>
    </div>
    {!online && <p role="status" className="lp-alert">เชื่อมต่ออินเทอร์เน็ตเพื่อแก้ไขข้อมูลบัญชี</p>}
    <section className="lp-card"><h2>การตั้งค่าการเรียน</h2><p>วันละ {snapshot.preferences.minutes} นาที · {snapshot.preferences.language === 'th' ? 'ภาษาไทย' : 'English'} · {snapshot.preferences.timezone}</p><button className="lp-secondary" onClick={settings}>ตั้งค่าเวลาเรียนและข้อมูล offline</button></section>
    <section className="lp-card"><h2>ออกจากระบบ</h2><p>ข้อมูลที่ดาวน์โหลดและกิจกรรมที่รอ sync บนอุปกรณ์นี้จะถูกล้าง{user.created_at && ` · สมาชิกตั้งแต่ ${new Date(user.created_at).toLocaleDateString('th-TH', { timeZone: snapshot.preferences.timezone })}`}</p>{loggingOut ? <><p role="status">{navigator.onLine ? 'ต้องการออกจากบัญชีนี้หรือไม่?' : 'ขณะนี้ offline กิจกรรมที่ยังไม่ sync จะถูกล้างด้วย'}</p><div className="lp-actions"><button disabled={busy} onClick={logout}>ยืนยันออกจากระบบ</button><button className="lp-secondary" disabled={busy} onClick={() => setLoggingOut(false)}>ยกเลิก</button></div></> : <button className="lp-secondary" disabled={busy} onClick={() => setLoggingOut(true)}>ออกจากระบบ</button>}</section>
  </>
}
