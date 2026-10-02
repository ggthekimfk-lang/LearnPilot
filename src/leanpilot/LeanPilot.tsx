import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { analyze, client, loadSnapshot, rpc } from './api'
import { clearPrivate, events, queueEvent, readSaved, removeEvent, saveOffline } from './offline'
import { emptySnapshot } from './types'
import type { Attempt, Material, Plan, Reference, Snapshot, Task } from './types'
import './leanpilot.css'
import './design.css'
import './stitch.css'
import Icon from './Icons'
import Account from './Account'

type Page = 'today' | 'library' | 'plan' | 'progress' | 'settings' | 'account'
const labels: Record<Page, string> = { today: 'วันนี้', library: 'คลังเนื้อหา', plan: 'แผนเรียน', progress: 'ความก้าวหน้า', settings: 'ตั้งค่า', account: 'บัญชีของฉัน' }

const statusLabels = { queued: 'รอวิเคราะห์', extracting: 'กำลังแยกข้อความ', analyzing: 'กำลังวิเคราะห์', ready: 'พร้อมเรียน', failed: 'วิเคราะห์ไม่สำเร็จ' }
const taskLabels = { pending: 'ยังไม่เริ่ม', in_progress: 'กำลังเรียน', completed: 'เสร็จแล้ว', skipped: 'ข้ามแล้ว' }
const message = (e: unknown) => e instanceof Error ? e.message : 'ไม่สามารถทำรายการได้ กรุณาลองใหม่'
const localDate = (timezone: string) => new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

export default function LeanPilot() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!client)
  const [snapshot, setSnapshot] = useState<Snapshot>(emptySnapshot)
  const [page, setPage] = useState<Page>('today')
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'completed'>('all')
  const [online, setOnline] = useState(navigator.onLine)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [syncCount, setSyncCount] = useState(0)
  const [downloaded, setDownloaded] = useState(false)
  const [update, setUpdate] = useState<ServiceWorker | null>(null)
  const [installPrompt, setInstallPrompt] = useState<(Event & { prompt: () => Promise<void> }) | null>(null)
  const identity = useRef({ user: undefined as string | undefined, generation: 0 })
  const user = session?.user.id

  useEffect(() => {
    if (!client) return
    let active = true
    let authObserved = false
    const acceptSession = (value: Session | null) => {
      const nextUser = value?.user.id
      if (identity.current.user !== nextUser) {
        identity.current = { user: nextUser, generation: identity.current.generation + 1 }
        setSnapshot(emptySnapshot); setSelected(null); setAttemptId(null)
        setDownloaded(false); setSyncCount(0); setBusy(false); setError(''); setNotice('')
      }
      setSession(value); setAuthReady(true)
      if (!value) clearPrivate()
    }
    void client.auth.getSession().then(({ data, error }) => {
      if (!active || authObserved) return
      acceptSession(data.session)
      if (error) setError(error.message)
    })
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, value) => {
      authObserved = true
      if (active) acceptSession(value)
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])
  useEffect(() => {
    const connect = () => setOnline(navigator.onLine)
    const install = (event: Event) => { event.preventDefault(); setInstallPrompt(event as Event & { prompt: () => Promise<void> }) }
    window.addEventListener('online', connect); window.addEventListener('offline', connect)
    window.addEventListener('beforeinstallprompt', install)
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      void navigator.serviceWorker.register('/sw.js').then(registration => {
        if (registration.waiting) setUpdate(registration.waiting)
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) setUpdate(worker) })
        })
      }).catch(() => setError('บันทึก app shell ไม่สำเร็จ การใช้งาน offline อาจไม่พร้อม'))
    }
    return () => { window.removeEventListener('online', connect); window.removeEventListener('offline', connect); window.removeEventListener('beforeinstallprompt', install) }
  }, [])

  const refresh = useCallback(async () => {
    if (!user) return
    const generation = identity.current.generation
    const data = await loadSnapshot()
    if (identity.current.user !== user || identity.current.generation !== generation) throw new Error('Session changed')
    setSnapshot(data)
    if (readSaved(user)) { saveOffline(user, data); setDownloaded(true) }
  }, [user])
  const run = useCallback(async (action: () => Promise<void>) => {
    const generation = identity.current.generation
    setBusy(true); setError(''); setNotice('')
    try { await action() } catch (e) { if (identity.current.generation === generation) setError(message(e)) } finally { if (identity.current.generation === generation) setBusy(false) }
  }, [])
  useEffect(() => {
    if (!user) return
    let active = true
    const generation = identity.current.generation
    const current = () => active && identity.current.user === user && identity.current.generation === generation
    const saved = readSaved(user)
    // Downloads are user-scoped. They are loaded only after a matching auth session.
    const load = async () => {
      if (!online) {
        if (current()) { setSnapshot(saved || emptySnapshot); setDownloaded(!!saved); setSyncCount(events(user).length) }
        return
      }
      try {
        for (const event of events(user)) {
          if (!current()) return
          const matched = await rpc<boolean>('lp_task_event', { p_event: event.id, p_plan: event.plan_id, p_task: event.task_id, p_status: event.status })
          if (!current()) return
          removeEvent(user, event.id)
          if (!matched && current()) setNotice('แผนเปลี่ยนระหว่าง offline โหลดแผนล่าสุดแล้ว กรุณาตรวจสอบกิจกรรมที่ค้าง')
        }
        const data = await loadSnapshot()
        if (current()) { setSnapshot(data); setSyncCount(events(user).length); const optedIn = !!readSaved(user); setDownloaded(optedIn); if (optedIn) saveOffline(user, data) }
      } catch (e) { if (current()) { setError(message(e)); if (saved) setSnapshot(saved) } }
    }
    void load()
    return () => { active = false }
  }, [user, online])
  const processing = snapshot.materials.some(m => ['queued', 'analyzing', 'extracting'].includes(m.status))
  useEffect(() => {
    if (!online || !user || !processing) return
    let active = true
    const generation = identity.current.generation
    const timer = window.setInterval(() => { void refresh().catch(e => { if (active && identity.current.generation === generation) setError(message(e)) }) }, 5000)
    return () => { active = false; window.clearInterval(timer) }
  }, [online, user, processing, refresh])

  const material = snapshot.materials.find(m => m.id === selected)
  const attempt = snapshot.attempts.find(a => a.id === attemptId)
  const today = localDate(snapshot.preferences.timezone)
  const tasks = snapshot.plans.flatMap(p => p.tasks.map(t => ({ ...t, plan: p })))
  const completed = tasks.filter(t => t.status === 'completed').length
  const due = tasks.filter(t => t.date && t.date <= today && ['pending', 'in_progress'].includes(t.status))

  const startQuiz = (m: Material) => run(async () => {
    const id = await rpc<string>('lp_start_quiz', { p_content: m.id }); await refresh(); setAttemptId(id); setSelected(m.id)
  })
  const changeTask = (t: Task, p: Plan, status: Task['status']) => run(async () => {
    if (!user) return
    if (online) {
      const matched = await rpc<boolean>('lp_task_event', { p_event: crypto.randomUUID(), p_plan: p.id, p_task: t.id, p_status: status })
      await refresh(); if (!matched) setNotice('โหลดแผนล่าสุดแล้ว กิจกรรมอาจเปลี่ยนไป')
    } else {
      queueEvent(user, t.id, status, p.id); setSyncCount(events(user).length)
      const next = { ...snapshot, plans: snapshot.plans.map(plan => plan.id === p.id ? { ...plan, tasks: plan.tasks.map(task => task.id === t.id ? { ...task, status } : task) } : plan) }
      if (readSaved(user)) saveOffline(user, next); setSnapshot(next); setNotice('บันทึกบนอุปกรณ์แล้ว จะ sync เมื่อออนไลน์')
    }
  })
  const taskCard = (t: Task & { plan: Plan }) => <article className="lp-card lp-task" key={t.id}>
    <div className="lp-row"><span className="lp-tag">{t.kind === 'quiz' ? 'ทดสอบ' : 'ทบทวน'} · {t.minutes} นาที</span><span>{taskLabels[t.status]} {t.locked && '🔒'}</span></div>
    <h3>{t.title}</h3><p>{t.reason}</p><small>{t.date || 'รอจัดเวลา — เวลาเรียนไม่พอ'}</small>
    <div className="lp-actions">
      {t.status === 'pending' && <button onClick={() => void changeTask(t, t.plan, 'in_progress')} disabled={busy}>เริ่มกิจกรรม</button>}
      {t.status === 'in_progress' && <><button onClick={() => { setSelected(t.content_id); setAttemptId(null) }}>เปิดเนื้อหา</button>{t.kind === 'quiz' ? <button disabled={!online || busy} onClick={() => { const m = snapshot.materials.find(m => m.id === t.content_id); if (m) void startQuiz(m) }}>เริ่ม quiz</button> : <button onClick={() => void changeTask(t, t.plan, 'completed')} disabled={busy}>เรียนเสร็จแล้ว</button>}</>}
      {['pending', 'in_progress'].includes(t.status) && <button className="lp-secondary" disabled={busy} onClick={() => void changeTask(t, t.plan, 'skipped')}>ข้าม</button>}
      {t.status === 'pending' && online && <><button className="lp-secondary" disabled={busy} onClick={() => void run(async () => { await rpc('lp_task_edit', { p_plan: t.plan.id, p_task: t.id, p_date: t.date, p_locked: !t.locked }); await refresh() })}>{t.locked ? 'ปลดล็อก' : 'ล็อก'}</button><label className="lp-date">เลื่อนวัน<input aria-label={`เลื่อน ${t.title}`} type="date" value={t.date || ''} disabled={busy} onChange={e => void run(async () => { await rpc('lp_task_edit', { p_plan: t.plan.id, p_task: t.id, p_date: e.target.value || null, p_locked: t.locked }); await refresh() })} /></label></>}
    </div>
  </article>

  if (!authReady) return <main className="lp-app lp-center"><p role="status">กำลังโหลดบัญชี…</p></main>
  if (!session) return <Auth notice={notice} error={error} busy={busy} run={run} setNotice={setNotice} />

  return <div className="lp-app">
        <div className="lp-workspace"><header className="lp-topbar"><div className="lp-header-inner">
      <a href="#today" className="lp-brand" onClick={() => { setPage('today'); setSelected(null); setAttemptId(null) }}><span><Icon name="library" /></span>LearnPilot</a>
      <nav className="lp-desktop-nav" aria-label="เมนูหลัก">{(['today', 'plan', 'library', 'progress', 'account', 'settings'] as Page[]).map(key => <button className={page === key ? 'active' : ''} aria-current={page === key ? 'page' : undefined} key={key} onClick={() => { setPage(key); setSelected(null); setAttemptId(null) }}>{labels[key]}</button>)}</nav>
      <div className="lp-row lp-account"><span className={`lp-connection ${online ? '' : 'offline'}`}>{online ? '● ออนไลน์' : '○ Offline'}{syncCount > 0 && ` · รอ sync ${syncCount}`}</span><button className="lp-avatar" aria-label="เปิดบัญชีของฉัน" onClick={() => { setPage('account'); setSelected(null); setAttemptId(null) }}>{session.user.email?.slice(0, 1).toUpperCase()}</button></div>
    </div></header><main className="lp-main" data-page={material ? 'content' : page}>
        {error && <div className="lp-alert error" role="alert">{error}<button aria-label="ปิดข้อความผิดพลาด" onClick={() => setError('')}>×</button></div>}
        {notice && <div className="lp-alert" role="status">{notice}<button aria-label="ปิดข้อความ" onClick={() => setNotice('')}>×</button></div>}
        {!online && <div className="lp-alert">{downloaded ? 'กำลังอ่านข้อมูลที่บันทึกไว้ คะแนนและแผนจะอัปเดตเมื่อออนไลน์' : 'ยังไม่มีข้อมูลที่ดาวน์โหลดไว้ กรุณาออนไลน์แล้วบันทึกในตั้งค่า'}</div>}
        {update && <div className="lp-alert">มีเวอร์ชันใหม่พร้อมใช้งาน <button disabled={!!attempt && !attempt.result} onClick={() => { const reload = () => window.location.reload(); navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true }); update.postMessage({ type: 'SKIP_WAITING' }) }}>อัปเดตแอป</button>{attempt && !attempt.result && <small>ส่ง quiz หรือออกจาก quiz ก่อนอัปเดต</small>}</div>}
        {page === 'plan' && !material && <CapacityNotice snapshot={snapshot} />}{attempt && material ? <Quiz key={attempt.id} attempt={attempt} material={material} busy={busy} online={online} run={run} refresh={refresh} onBack={() => setAttemptId(null)} report={(entity, description) => run(async () => { await rpc('lp_report', { p_content: material.id, p_entity: entity, p_description: description }); setNotice('ส่งรายงานแล้ว รอผู้ดูแลตรวจสอบ') })} /> : material ? <Content material={material} busy={busy} online={online} onBack={() => setSelected(null)} startQuiz={() => void startQuiz(material)} retry={() => void run(async () => { await analyze(material.id); await refresh() })} report={description => void run(async () => { await rpc('lp_report', { p_content: material.id, p_entity: 'summary', p_description: description }); setNotice('ส่งรายงานแล้ว') })} /> : <>
          {page === 'today' && <>
            <div className="lp-heading"><div><span className="lp-eyebrow"><Icon name="plan" /> {new Date().toLocaleDateString('th-TH', { timeZone: snapshot.preferences.timezone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><h1>พื้นที่เรียนรู้ <em>ของคุณ</em></h1><p>เริ่มจากสิ่งที่ควรทบทวน แล้วตรวจความเข้าใจด้วยคำถามใหม่</p></div><button onClick={() => setPage('library')}>＋ เพิ่มเนื้อหา</button></div>
            <div className="lp-dashboard"><section className="lp-hero"><div><span className="lp-tag">แผนที่พอดีกับเวลาของคุณ</span><h2>{due.length ? `มีกิจกรรมพร้อมเรียน ${due.length} รายการ` : 'ก้าวแรก เริ่มจากเนื้อหาของคุณ'}</h2><p>{due.length ? `วันนี้และงานค้าง รวมประมาณ ${due.reduce((s, t) => s + t.minutes, 0)} นาที · ทยอยทำตามเวลาที่มี` : 'สร้างวิชา เพิ่มเนื้อหา แล้วทำแบบทดสอบเพื่อค้นหาจุดที่ควรทบทวน'}</p><button onClick={() => setPage(due.length ? 'plan' : 'library')}>{due.length ? 'เปิดแผนเรียน →' : 'สร้างวิชาแรก →'}</button></div></section>
            <aside className="lp-overview"><h2>ภาพรวมการเรียนรู้</h2><p>ก้าวเล็ก ๆ ตามเวลาที่เหมาะกับคุณ</p><div className="lp-stats"><article className="lp-card"><span>เวลาเรียนต่อวัน</span><strong>{snapshot.preferences.minutes}<small> นาที</small></strong></article><article className="lp-card"><span>กิจกรรมที่เสร็จแล้ว</span><strong>{completed}<small> รายการ</small></strong></article><article className="lp-card"><span>แบบทดสอบที่ส่ง</span><strong>{snapshot.attempts.filter(a => a.result).length}<small> ครั้ง</small></strong></article></div></aside></div>
            <div className="lp-section-title"><h2>สิ่งที่ควรทำต่อ</h2><button className="lp-link" onClick={() => setPage('plan')}>ดูแผนทั้งหมด →</button></div>
            <div className="lp-grid">{due.length ? due.slice(0, 4).map(taskCard) : <Empty title="ยังไม่มีกิจกรรมวันนี้" text="เมื่อส่งแบบทดสอบครั้งแรก ระบบจะสร้างแผนตามหลักฐานและเวลาว่าง" />}</div>
          </>}
          {page === 'library' && <Library snapshot={snapshot} busy={busy} online={online} run={run} refresh={refresh} open={setSelected} />}
          {page === 'plan' && <><div className="lp-heading"><div><span className="lp-eyebrow">A LITTLE EVERY DAY</span><h1>แผนเรียนของคุณ</h1><p>วันละ {snapshot.preferences.minutes} นาที · {snapshot.preferences.timezone} · กิจกรรมเสร็จไม่เพิ่มคะแนนความเข้าใจ</p></div><button className="lp-secondary" onClick={() => setPage('settings')}>ปรับเวลาว่าง</button></div><div className="lp-plan-toolbar"><span><Icon name="plan" /> กิจกรรมในแผนเรียน</span><div className="lp-filter-pills" role="group" aria-label="กรองสถานะกิจกรรม">{([{ key: 'all', label: 'ทั้งหมด' }, { key: 'todo', label: 'ที่ต้องทำ' }, { key: 'completed', label: 'เสร็จแล้ว' }] as const).map(filter => <button key={filter.key} aria-pressed={taskFilter === filter.key} className={taskFilter === filter.key ? 'active' : ''} onClick={() => setTaskFilter(filter.key)}>{filter.label}</button>)}</div></div>{snapshot.plans.length ? snapshot.plans.map(p => <section key={p.id}><div className="lp-section-title"><h2>{snapshot.courses.find(c => c.id === p.course_id)?.title} <small>เวอร์ชัน {p.version}</small></h2><button className="lp-link" disabled={!online || busy || p.version === 1} onClick={() => void run(async () => { await rpc('lp_undo_plan', { p_plan: p.id }); await refresh() })}>ย้อนกลับแผนก่อนหน้า</button></div><div className="lp-plan-summary"><div><span>ความคืบหน้าของกิจกรรม</span><strong>{p.tasks.filter(t => t.status === 'completed').length} / {p.tasks.length}</strong><progress aria-label="ความคืบหน้าของกิจกรรมในแผน" max={Math.max(1, p.tasks.length)} value={p.tasks.filter(t => t.status === 'completed').length} /></div><div><span>เวลาในแผน</span><strong>{p.tasks.filter(t => t.status !== 'skipped').reduce((sum, t) => sum + t.minutes, 0)} นาที</strong></div><p>{p.reason}</p></div>{p.tasks.some(t => !t.date) && <div className="lp-alert">มี {p.tasks.filter(t => !t.date).length} กิจกรรมรอจัดเวลา กรุณาเพิ่มเวลาหรือปรับเป้าหมาย</div>}<div className="lp-grid">{p.tasks.filter(t => taskFilter === 'all' || (taskFilter === 'completed' ? t.status === 'completed' : ['pending', 'in_progress'].includes(t.status))).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999')).map(t => taskCard({ ...t, plan: p }))}{!p.tasks.some(t => taskFilter === 'all' || (taskFilter === 'completed' ? t.status === 'completed' : ['pending', 'in_progress'].includes(t.status))) && <Empty title="ไม่มีกิจกรรมในหมวดนี้" text="เลือกหมวดอื่นเพื่อดูกิจกรรมในแผนเรียน" />}</div><details className="lp-card"><summary>ประวัติการปรับแผน</summary><PlanHistory plan={p} /></details></section>) : <Empty title="แผนเริ่มจากหลักฐาน" text="เพิ่มเนื้อหาและส่งแบบทดสอบแรก เพื่อสร้างแผน 7 วันหรือจนถึงวันเป้าหมาย" />}</>}
          {page === 'progress' && <><div className="lp-heading"><div><span className="lp-eyebrow">EVIDENCE, NOT GUESSWORK</span><h1>เห็นความเข้าใจของคุณ</h1><p>ใช้คำถามไม่ซ้ำจาก 3 attempts ล่าสุดของเนื้อหาเวอร์ชันเดียวกัน</p></div></div><div className="lp-grid">{snapshot.evidence.length ? snapshot.evidence.map(e => <article className="lp-card" key={e.id}><span className="lp-tag">{e.status}</span><h3>{e.name}</h3><strong className="lp-score">{e.sample ? Math.round(e.correct / e.sample * 100) : '—'}{e.sample > 0 && '%'}</strong><p>ตอบถูก {e.correct} จาก {e.sample} ข้อ {e.sample < 3 && '· ต้องมีหลักฐานอย่างน้อย 3 ข้อ'}</p><p className="lp-muted">ผลนี้สะท้อนชุดคำถามที่ทำ ยังไม่ใช่หลักฐานการจำระยะยาว</p></article>) : <Empty title="ยังไม่มีหลักฐานการเรียน" text="ผลราย concept จะปรากฏเมื่อวิเคราะห์เนื้อหาและทำแบบทดสอบ" />}</div><h2>ประวัติแบบทดสอบ</h2><p>คะแนนต่างชุดอาจมีความยากต่างกัน จึงไม่ใช้คะแนนรวมสรุปว่าความเข้าใจดีขึ้นโดยตรง</p>{snapshot.attempts.filter(a => a.result).map(a => <button className="lp-card lp-attempt" key={a.id} onClick={() => { setSelected(a.content_id); setAttemptId(a.id) }}><span>{snapshot.materials.find(m => m.id === a.content_id)?.title}<small>{new Date(a.created_at).toLocaleString('th-TH', { timeZone: snapshot.preferences.timezone })}</small></span><strong>{a.result?.score}/{a.result?.total} →</strong></button>)}<p className="lp-muted">กิจกรรมที่ทำเสร็จ: {completed} รายการ — นับแยกจากผลทดสอบ</p></>}
          {page === 'account' && <Account user={session.user} snapshot={snapshot} busy={busy} online={online} run={run} notify={setNotice} settings={() => setPage('settings')} logout={() => void run(async () => { const { error } = await client!.auth.signOut({ scope: 'local' }); if (error) throw error; clearPrivate(); setSnapshot(emptySnapshot); setSession(null); setPage('today') })} />}
          {page === 'settings' && <Settings key={JSON.stringify(snapshot.preferences)} snapshot={snapshot} busy={busy} online={online} run={run} refresh={refresh} email={session.user.email || ''} download={() => { if (user) { saveOffline(user, snapshot); setDownloaded(true); setNotice('บันทึกสรุป ต้นฉบับ และแผนล่าสุดแล้ว') } }} downloaded={downloaded} install={installPrompt ? async () => { await installPrompt.prompt(); setInstallPrompt(null) } : null} logout={() => void run(async () => { clearPrivate(); setSnapshot(emptySnapshot); const { error } = await client!.auth.signOut({ scope: 'local' }); if (error) throw error; setSession(null) })} clearDownload={() => { if (user) localStorage.removeItem(`leanpilot:${user}:saved`); setDownloaded(false); setNotice('ล้างเนื้อหา offline แล้ว กิจกรรมที่รอ sync ยังคงอยู่') }} />}
        </>}
      </main><footer className="lp-footer">LearnPilot · พื้นที่การเรียนรู้ที่สงบและมีสมาธิ</footer>
    </div>
    <nav className="lp-bottom" aria-label="เมนูมือถือ">{(['today', 'library', 'plan', 'progress', 'account'] as Page[]).map(key => <button className={page === key && !selected ? 'active' : ''} aria-current={page === key && !selected ? 'page' : undefined} key={key} onClick={() => { setPage(key); setSelected(null); setAttemptId(null) }}><Icon name={key} />{labels[key]}</button>)}</nav>
  </div>
}

type Run = (action: () => Promise<void>) => Promise<void>
function Auth({ busy, error, notice, run, setNotice }: { busy: boolean; error: string; notice: string; run: Run; setNotice: (s: string) => void }) {
  const [register, setRegister] = useState(false)
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const data = new FormData(e.currentTarget)
    void run(async () => {
      if (!client) throw new Error('ยังไม่ได้ตั้งค่า Supabase กรุณาดู README')
      const credentials = { email: String(data.get('email')), password: String(data.get('password')) }
      const result = register ? await client.auth.signUp(credentials) : await client.auth.signInWithPassword(credentials)
      if (result.error) throw result.error
      if (register && !result.data.session) setNotice('สมัครสำเร็จ กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ')
    })
  }
  return <main className="lp-app lp-auth"><section><a className="lp-brand" href="#"><span><Icon name="compass" /></span> LeanPilot</a><span className="lp-eyebrow">YOUR LEARNING COMPASS</span><h1>รู้ว่าควรเรียนอะไรต่อ<br />และรู้ว่าเพราะอะไร</h1><p>เปลี่ยนเนื้อหาของคุณให้เป็นสรุป แบบทดสอบ และแผนเรียนที่ปรับตามหลักฐาน</p><div className="lp-auth-cycle"><span>01<br /><strong>เพิ่มเนื้อหา</strong></span><span>02<br /><strong>ทดสอบ</strong></span><span>03<br /><strong>ปรับแผน</strong></span></div></section><form className="lp-card" onSubmit={submit}><h2>{register ? 'สร้างบัญชี' : 'ยินดีต้อนรับกลับ'}</h2><p>พื้นที่เรียนรู้ส่วนตัวของคุณ</p>{!client && <div className="lp-alert">โปรเจกต์ยังไม่ได้ตั้งค่า backend โปรดตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_PUBLISHABLE_KEY แล้วใช้ migration ตาม README</div>}{error && <p role="alert" className="lp-error">{error}</p>}{notice && <p role="status">{notice}</p>}<label>อีเมล<input type="email" name="email" autoComplete="email" required /></label><label>รหัสผ่าน<input type="password" name="password" minLength={8} autoComplete={register ? 'new-password' : 'current-password'} required /></label><button disabled={busy || !client}>{busy ? 'กำลังดำเนินการ…' : register ? 'สร้างบัญชี' : 'เข้าสู่ระบบ →'}</button><button type="button" className="lp-link" onClick={() => setRegister(!register)}>{register ? 'มีบัญชีแล้ว เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}</button></form></main>
}
function Empty({ title, text }: { title: string; text: string }) { return <div className="lp-card lp-empty"><span className="lp-empty-icon"><Icon name="library" /></span><h3>{title}</h3><p>{text}</p></div> }

function Library({ snapshot, busy, online, run, refresh, open }: { snapshot: Snapshot; busy: boolean; online: boolean; run: Run; refresh: () => Promise<void>; open: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const filteredMaterials = snapshot.materials.filter(m => (!courseFilter || m.course_id === courseFilter) && (m.title + ' ' + (snapshot.courses.find(c => c.id === m.course_id)?.title || '')).toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  const [adding, setAdding] = useState(false)
  const [source, setSource] = useState('')
  const [course, setCourse] = useState(snapshot.courses[0]?.id || '')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [fileBusy, setFileBusy] = useState(false)
  const [importId, setImportId] = useState(() => crypto.randomUUID())
  const createCourse = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const form = e.currentTarget; const data = new FormData(form)
    void run(async () => { const id = await rpc<string>('lp_create_course', { p_title: data.get('title'), p_goal: data.get('goal'), p_target: data.get('date') || null }); setCourse(id); await refresh(); form.reset() })
  }
  return <><div className="lp-heading"><div><span className="lp-eyebrow">MAKE IT YOURS</span><h1>คลังเนื้อหาของคุณ</h1><p>เอกสารจริง สรุปที่อ้างอิงได้ และคำถามเพื่อทดสอบความเข้าใจ</p></div><button disabled={!online} onClick={() => setAdding(!adding)}>{adding ? 'ปิดฟอร์ม' : '＋ เพิ่มเนื้อหา'}</button></div>
    <div className="lp-library-tools"><div className="lp-course-tabs" role="group" aria-label="กรองตามวิชา"><button className={!courseFilter ? 'active' : ''} aria-pressed={!courseFilter} onClick={() => setCourseFilter('')}>ทั้งหมด ({snapshot.materials.length})</button>{snapshot.courses.map(c => <button key={c.id} className={courseFilter === c.id ? 'active' : ''} aria-pressed={courseFilter === c.id} onClick={() => setCourseFilter(c.id)}>{c.title}</button>)}</div><input aria-label="ค้นหาเนื้อหาหรือวิชา" placeholder="ค้นหาเนื้อหาหรือชื่อวิชา…" value={query} onChange={e => setQuery(e.target.value)} /></div><details className="lp-card" open={!snapshot.courses.length}><summary>สร้างวิชาและตั้งเป้าหมาย</summary><form onSubmit={createCourse} className="lp-form-grid"><label>ชื่อวิชา<input name="title" maxLength={200} required placeholder="เช่น ชีววิทยา" /></label><label>เป้าหมาย<input name="goal" required placeholder="สิ่งที่อยากเข้าใจ" /></label><label>วันเป้าหมาย (ถ้ามี)<input name="date" type="date" /></label><button disabled={busy || !online}>สร้างวิชา</button></form></details>
    {adding && <form className="lp-card" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void run(async () => { const id = await rpc<string>('lp_import', { p_course: course, p_title: data.get('title'), p_source: source, p_id: importId }); await refresh(); setAdding(false); setSource(''); setImportId(crypto.randomUUID()); open(id); await analyze(id); await refresh() }) }}><h2>เพิ่มเนื้อหาสำหรับเรียน</h2><p>เนื้อหาจะถูกส่งให้ AI เพื่อสร้างสรุปและคำถาม ผู้ใช้รายอื่นไม่สามารถเข้าถึงได้</p><label>วิชา<select value={course} required onChange={e => setCourse(e.target.value)}><option value="">เลือกวิชา</option>{snapshot.courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label>ชื่อเนื้อหา<input name="title" maxLength={200} required /></label><label>PDF ที่มีข้อความ (ไม่เกิน 20 MB)<input type="file" accept="application/pdf,.pdf" disabled={fileBusy || busy} onChange={e => { const file = e.target.files?.[0]; if (!file) return; setFileBusy(true); void run(async () => { try { const { extractPdf } = await import('./pdf'); setSource(await extractPdf(file)) } finally { setFileBusy(false) } }) }} /></label><label>เนื้อหา {source.length.toLocaleString()} / 100,000 ตัวอักษร<textarea value={source} onChange={e => setSource(e.target.value)} minLength={200} maxLength={100000} rows={9} required placeholder="วางเนื้อหาที่ต้องการเรียน หรือเลือก PDF ด้านบน" /></label><p className="lp-muted">ขั้นต่ำ 200 ตัวอักษร · ยังไม่รองรับ OCR เอกสารสแกน</p><button disabled={busy || fileBusy || !online || !snapshot.courses.length}>บันทึกและวิเคราะห์ →</button></form>}
    <div className="lp-grid">{filteredMaterials.length ? filteredMaterials.map(m => <article className="lp-card" key={m.id}><div className="lp-row"><span className={`lp-tag ${m.status === 'failed' ? 'danger' : ''}`}>{statusLabels[m.status]}</span><span className="lp-muted">v1</span></div><small>{snapshot.courses.find(c => c.id === m.course_id)?.title}</small><h3>{m.title}</h3><p>{m.summary?.overview.slice(0, 130) || 'กำลังเตรียมเนื้อหาสำหรับการเรียนรู้'}</p><div className="lp-actions"><button className="lp-secondary" onClick={() => open(m.id)}>เปิดเนื้อหา →</button><button className="lp-link lp-error" disabled={!online || busy} onClick={() => setDeleteId(m.id)}>ลบ</button></div>{deleteId === m.id && <div className="lp-alert error">ลบต้นฉบับ สรุป คำถาม ผลทดสอบ และกิจกรรมที่เกี่ยวข้อง? <div className="lp-actions"><button disabled={busy} onClick={() => void run(async () => { await rpc('lp_delete_content', { p_content: m.id }); await refresh(); setDeleteId(null) })}>ยืนยันลบ</button><button className="lp-secondary" onClick={() => setDeleteId(null)}>ยกเลิก</button></div></div>}</article>) : <Empty title={snapshot.materials.length ? 'ไม่พบเนื้อหาที่ตรงกัน' : 'ให้เนื้อหาของคุณเป็นจุดเริ่มต้น'} text={snapshot.materials.length ? 'ลองค้นหาด้วยคำอื่น หรือเลือกวิชาทั้งหมด' : 'สร้างวิชาแล้วเพิ่มข้อความหรือ PDF ที่มี text layer เพื่อเริ่มวงจรเรียนรู้'} />}</div>
    <CourseGoals snapshot={snapshot} busy={busy} online={online} run={run} refresh={refresh} />
  </>
}
function CourseGoals({ snapshot, busy, online, run, refresh }: { snapshot: Snapshot; busy: boolean; online: boolean; run: Run; refresh: () => Promise<void> }) {
  return <section><h2>เป้าหมายของแต่ละวิชา</h2>{snapshot.courses.map(c => <details className="lp-card" key={c.id}><summary>{c.title} · {c.target_date || 'แผนเริ่มต้น 7 วัน'}</summary><form className="lp-form-grid" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void run(async () => { await rpc('lp_course_edit', { p_course: c.id, p_goal: data.get('goal'), p_target: data.get('date') || null }); await refresh() }) }}><label>เป้าหมาย<input name="goal" defaultValue={c.goal} required /></label><label>วันเป้าหมาย<input type="date" name="date" defaultValue={c.target_date || ''} /></label><button disabled={busy || !online}>บันทึกและปรับแผน</button></form></details>)}</section>
}
function SourceRef({ reference, material }: { reference: Reference; material: Material }) {
  const section = material.source.slice((reference.section - 1) * 2000, reference.section * 2000)
  return <details className="lp-reference"><summary>↗ อ้างอิงส่วนที่ {reference.section}</summary><blockquote>{reference.excerpt}</blockquote><p className="lp-source">{section}</p></details>
}
function Content({ material: m, busy, online, onBack, startQuiz, retry, report }: { material: Material; busy: boolean; online: boolean; onBack: () => void; startQuiz: () => void; retry: () => void; report: (s: string) => void }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (m.status !== 'analyzing') return
    const timer = window.setInterval(() => setNow(Date.now()), 5000)
    return () => window.clearInterval(timer)
  }, [m.status])
  useEffect(() => {
    if (online && m.status === 'ready') void rpc('lp_summary_viewed', { p_content: m.id }).catch(() => { /* Analytics failure must not block reading. */ })
  }, [m.id, m.status, online])
  return <><button className="lp-link" onClick={onBack}>← กลับ</button><div className="lp-heading"><div><span className="lp-eyebrow">{statusLabels[m.status]} · CONTENT V1</span><h1>{m.title}</h1><p>สรุปจากเนื้อหาของคุณ พร้อมหลักฐานต้นฉบับ</p></div>{m.status === 'ready' && <button disabled={!online || busy} onClick={startQuiz}>ทดสอบความเข้าใจ →</button>}</div>{m.status !== 'ready' ? <div className="lp-card"><h2>{statusLabels[m.status]}</h2><p role="status">{m.error || 'งานถูกบันทึกแล้ว คุณออกจากหน้านี้และกลับมาดูสถานะได้'}</p><button disabled={!online || busy || (m.status === 'analyzing' && !!m.claimed_at && now - new Date(m.claimed_at).getTime() < 300000)} onClick={retry}>เริ่ม / ลองวิเคราะห์ใหม่</button><details><summary>ต้นฉบับ</summary><p className="lp-source">{m.source}</p></details></div> : <><article className="lp-card"><h2>ภาพรวม</h2><p>{m.summary?.overview}</p>{m.summary?.references?.map((r, i) => <SourceRef key={i} reference={r} material={m} />)}<h3>ประเด็นสำคัญ</h3>{m.summary?.points.map((p, i) => <div key={i}><p><strong>{String(i + 1).padStart(2, '0')}.</strong> {p.text}</p>{p.references.map((r, j) => <SourceRef key={j} reference={r} material={m} />)}</div>)}</article><h2>แนวคิดที่ควรรู้</h2><div className="lp-grid">{m.concepts.map(c => <article className="lp-card" key={c.id}><h3>{c.name}</h3><p>{c.description}</p>{c.references.map((r, i) => <SourceRef key={i} reference={r} material={m} />)}</article>)}</div><IssueForm busy={busy || !online} onReport={report} /></>}</>
}
function Quiz({ attempt: a, material, busy, online, run, refresh, onBack, report }: { attempt: Attempt; material: Material; busy: boolean; online: boolean; run: Run; refresh: () => Promise<void>; onBack: () => void; report: (id: string, s: string) => Promise<void> }) {
  const [answers, setAnswers] = useState(a.answers)
  const [index, setIndex] = useState(0)
  const [saved, setSaved] = useState('')
  const q = a.questions[index]
  const select = (answer: number) => {
    const next = { ...answers, [q.id]: answer }; setAnswers(next); setSaved('ยังไม่ได้บันทึก')
    void run(async () => { await rpc('lp_save_draft', { p_attempt: a.id, p_answers: next }); setSaved('บันทึกคำตอบแล้ว'); await refresh() })
  }
  if (a.result) return <><button className="lp-link" onClick={onBack}>← กลับสรุป</button><div className="lp-heading"><div><span className="lp-eyebrow">QUIZ RESULTS</span><h1>ผลทดสอบความเข้าใจ</h1><p>ให้คะแนนฝั่ง server · ปรับแผนเฉพาะกิจกรรมที่ยังไม่เริ่มแล้ว</p></div></div><div className="lp-card lp-result">{a.result.notice && <div className="lp-alert">{a.result.notice} ({a.result.withdrawn_count} ข้อ)</div>}<strong>{a.result.score}<small> / {a.result.total}</small></strong><p>ตอบถูก {a.result.score} จาก {a.result.total} ข้อ</p><p>ดูหลักฐานราย concept ในหน้าความก้าวหน้า และแผนใหม่ในหน้าแผนเรียน</p></div>{a.result.feedback.map((f, i) => <article className="lp-card" key={f.question_id}><span className={`lp-tag ${f.selected === f.correct ? '' : 'danger'}`}>{f.selected === f.correct ? 'ถูกต้อง' : 'ควรทบทวน'}</span><h3>{i + 1}. {f.prompt}</h3><p>คำตอบของคุณ: {f.choices[f.selected]}</p><p><strong>คำตอบที่ถูก: {f.choices[f.correct]}</strong></p><p>{f.explanation}</p><SourceRef reference={f.reference} material={material} /><IssueForm busy={busy || !online} onReport={s => void report(f.question_id, s)} /></article>)}</>
  return <><button className="lp-link" disabled={busy} onClick={onBack}>← ออกจาก quiz (เก็บ draft ที่บันทึกแล้ว)</button><div className="lp-heading"><div><span className="lp-eyebrow">CHECK YOUR UNDERSTANDING</span><h1>ทดสอบความเข้าใจ</h1><p>เฉลยจะแสดงหลังส่งครบทุกข้อ · {a.questions.length < 10 && `มีคำถามใหม่เพียง ${a.questions.length} ข้อจากเนื้อหานี้`}</p></div><span>{index + 1} / {a.questions.length}</span></div><progress max={a.questions.length} value={Object.keys(answers).length} aria-label="จำนวนข้อที่ตอบแล้ว" /><section className="lp-card lp-question"><span className="lp-tag">ข้อที่ {index + 1}</span><h2>{q.prompt}</h2><fieldset><legend className="lp-sr">เลือกหนึ่งคำตอบ</legend>{q.choices.map((choice, i) => <label className={`lp-choice ${answers[q.id] === i ? 'selected' : ''}`} key={i}><input type="radio" name={q.id} checked={answers[q.id] === i} disabled={busy || !online} onChange={() => select(i)} /><span>{String.fromCharCode(65 + i)}.</span>{choice}</label>)}</fieldset><p role="status" className="lp-muted">{saved || 'คำตอบที่บันทึกแล้วสามารถกลับมาทำต่อได้'}</p><div className="lp-row"><button className="lp-secondary" disabled={index === 0 || busy} onClick={() => setIndex(index - 1)}>← ก่อนหน้า</button><button className="lp-secondary" disabled={index === a.questions.length - 1 || busy} onClick={() => setIndex(index + 1)}>ถัดไป →</button></div></section><div className="lp-actions">{a.questions.map((question, i) => <button className={answers[question.id] === undefined ? 'lp-secondary' : ''} key={question.id} aria-label={`ไปข้อ ${i + 1}`} onClick={() => setIndex(i)} disabled={busy}>{i + 1}</button>)}</div><button className="lp-submit" disabled={busy || !online || Object.keys(answers).length !== a.questions.length} onClick={() => void run(async () => { await rpc('lp_submit_quiz', { p_attempt: a.id, p_answers: answers }); await refresh() })}>ส่งคำตอบและปรับแผน →</button></>
}
function IssueForm({ busy, onReport }: { busy: boolean; onReport: (s: string) => void }) {
  return <details className="lp-report"><summary>รายงานเนื้อหาหรือคำถามผิด</summary><form onSubmit={e => { e.preventDefault(); const f = e.currentTarget; onReport(String(new FormData(f).get('issue'))); f.reset() }}><label>สิ่งที่ควรแก้ไข<textarea name="issue" rows={2} maxLength={2000} required /></label><button disabled={busy}>ส่งรายงาน</button></form></details>
}
function PlanHistory({ plan }: { plan: Plan }) {
  const [history, setHistory] = useState<{ version: number; reason: string; trigger: string; created_at: string }[]>([])
  useEffect(() => {
    if (!client || !navigator.onLine) return
    void client.from('lp_plans').select('version,reason,trigger,created_at').eq('course_id', plan.course_id).order('version', { ascending: false }).then(({ data }) => setHistory(data || []))
  }, [plan.course_id, plan.version])
  return <ul>{history.map(h => <li key={h.version}>v{h.version} · {h.trigger.startsWith('attempt:') ? 'ผล quiz ใหม่' : 'เปลี่ยนเวลาว่าง'} — {h.reason}</li>)}</ul>
}
function Settings({ snapshot, busy, online, run, refresh, email, download, downloaded, clearDownload, install, logout }: { snapshot: Snapshot; busy: boolean; online: boolean; run: Run; refresh: () => Promise<void>; email: string; download: () => void; downloaded: boolean; clearDownload: () => void; install: (() => Promise<void>) | null; logout: () => void }) {
  const [days, setDays] = useState(snapshot.preferences.days)
  return <><div className="lp-heading"><div><span className="lp-eyebrow">YOUR TIME, YOUR PACE</span><h1>ตั้งค่าให้เหมาะกับคุณ</h1><p>{email}</p></div></div><form className="lp-card" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void run(async () => { await rpc('lp_preferences_save', { p_settings: { minutes: Number(data.get('minutes')), timezone: data.get('timezone'), days, language: data.get('language') } }); await refresh() }) }}><h2>เวลาเรียนและเป้าหมาย</h2><label>เวลาว่างต่อวัน (นาที)<input name="minutes" type="number" min={10} max={180} defaultValue={snapshot.preferences.minutes} required /></label><label>Timezone<input name="timezone" defaultValue={snapshot.preferences.timezone} required /></label><label>ภาษาที่ต้องการ<select name="language" defaultValue={snapshot.preferences.language}><option value="th">ไทย</option><option value="en">English</option></select></label><fieldset><legend>วันที่เรียนได้</legend><div className="lp-days">{['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((day, i) => <label key={day}><input type="checkbox" checked={days.includes(i)} onChange={e => setDays(e.target.checked ? [...days, i] : days.filter(d => d !== i))} />{day}</label>)}</div></fieldset><p>เปลี่ยนเวลาแล้วระบบจะจัดกิจกรรมในอนาคตใหม่ โดยคงกิจกรรมที่เริ่มแล้วและล็อกไว้</p><button disabled={busy || !online || !days.length}>บันทึกและปรับแผน</button></form><section className="lp-card"><h2>อ่านแบบ offline</h2><p>บันทึกต้นฉบับ สรุป concepts และแผนล่าสุดบนอุปกรณ์นี้ ไม่บันทึกเฉลยหรือ quiz สำหรับ offline การสร้าง AI และส่ง quiz ต้องออนไลน์</p><div className="lp-actions"><button disabled={!online || busy} onClick={() => void run(async () => download())}>{downloaded ? 'อัปเดตข้อมูลที่ดาวน์โหลด' : 'บันทึกไว้บนอุปกรณ์'}</button><button className="lp-secondary" onClick={clearDownload}>ล้างเนื้อหา offline</button></div><p className="lp-muted">ข้อมูลที่ดาวน์โหลดอาจถูก browser ล้างเมื่อพื้นที่ไม่พอ ออกจากระบบจะล้างข้อมูลส่วนตัวและกิจกรรมรอ sync บนอุปกรณ์</p></section><section className="lp-card"><h2>ติดตั้ง LeanPilot</h2>{install ? <button onClick={() => void install()}>ติดตั้งแอป</button> : <p>เปิดเมนู browser แล้วเลือก “ติดตั้งแอป” หรือ “เพิ่มไปยังหน้าจอโฮม” หากอุปกรณ์รองรับ</p>}</section><section className="lp-card"><h2>ข้อมูลของคุณ</h2><p>ต้นฉบับและผลเรียนเก็บใน Supabase ส่วนต้นฉบับจะส่งให้ Gemini เมื่อสั่งวิเคราะห์ ลบเนื้อหาได้ในคลังเนื้อหา การเก็บข้อมูลของผู้ให้บริการและ backup ต้องกำหนดก่อนเปิด production</p><button className="lp-secondary" disabled={busy} onClick={logout}>ออกจากระบบและล้างข้อมูลบนอุปกรณ์</button></section></>
}

function CapacityNotice({ snapshot }: { snapshot: Snapshot }) {
  const totals: Record<string, number> = {};
  for (const t of snapshot.plans.flatMap(p => p.tasks)) if (t.date && t.status !== 'skipped') totals[t.date] = (totals[t.date] || 0) + t.minutes;
  const over = Object.entries(totals).filter(([, minutes]) => minutes > snapshot.preferences.minutes);
  return over.length ? <div className="lp-alert error" role="status">กิจกรรมที่ล็อกหรือเริ่มแล้วเกินเวลาว่างใหม่ใน {over.map(([date, minutes]) => `${date} (${minutes} นาที)`).join(', ')} กรุณาปลดล็อก/เลื่อนงาน หรือเพิ่มเวลาว่าง</div> : null;
}



