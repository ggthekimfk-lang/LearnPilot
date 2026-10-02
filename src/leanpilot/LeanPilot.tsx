import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { analyze, client, loadSnapshot, rpc } from './api'
import { authErrorMessage } from './auth-errors'
import { clearPrivate, events, queueEvent, readSaved, removeEvent, saveOffline } from './offline'
import { emptySnapshot } from './types'
import type { Material, Plan, Snapshot, Task } from './types'
import './leanpilot.css'

import './auth.css'
import Icon from './Icons'
import Navigation from './Navigation'
import { navigationLabels } from './navigation-items'

import Account from './Account'

import { Dashboard, Analytics, SearchPage, TutorPage } from './WorkspacePages'
import { Skeleton } from './ui'
import type { NavigationPage } from './navigation-items'
import './navigation.css'
import './workspace.css'

const Library = lazy(() => import('./Library'))
const StudyPlanner = lazy(() => import('./StudyPlanner'))
const Settings = lazy(() => import('./Settings'))
const LearningContent = lazy(() => import('./LearningContent'))
const Quiz = lazy(() => import('./LearningQuiz'))

type Page = NavigationPage

const taskLabels = { pending: 'ยังไม่เริ่ม', in_progress: 'กำลังเรียน', completed: 'เสร็จแล้ว', skipped: 'ข้ามแล้ว' }
const message = (e: unknown) => e instanceof Error ? e.message : 'ไม่สามารถทำรายการได้ กรุณาลองใหม่'
const localDate = (timezone: string) => new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

export default function LeanPilot() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!client)
  const [snapshot, setSnapshot] = useState<Snapshot>(emptySnapshot)
  const [page, setPage] = useState<Page>('today')
  const [collapsed, setCollapsed] = useState(false)
  const [libraryCourse, setLibraryCourse] = useState('')
  const [tutorMaterial, setTutorMaterial] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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
      await Promise.resolve(); if (!current()) return; setLoading(true)
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
    void load().finally(() => { if (current()) setLoading(false) })
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

  useEffect(() => {
    const main = document.getElementById('main-content')
    if (main) { main.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); if (page === 'search') main.querySelector<HTMLInputElement>('[role=search] input')?.focus() }
  }, [page, selected, attemptId])

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => { if (user && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPage('search'); setSelected(null); setAttemptId(null); document.querySelector<HTMLInputElement>('[role=search] input')?.focus() } }
    window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut)
  }, [user])

  const material = snapshot.materials.find(m => m.id === selected)
  const attempt = snapshot.attempts.find(a => a.id === attemptId)
  const today = localDate(snapshot.preferences.timezone)
  const tasks = snapshot.plans.flatMap(p => p.tasks.map(t => ({ ...t, plan: p })))
  const completed = tasks.filter(t => t.status === 'completed').length
  const due = tasks.filter(t => t.date && t.date <= today && ['pending', 'in_progress'].includes(t.status))

  const startQuiz = (m: Material) => run(async () => {
    await analyze(m.id, 'quiz')
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
    <div className="lp-row"><span className={`lp-tag ${t.kind === 'quiz' ? 'info' : ''}`}>{t.kind === 'quiz' ? 'ทดสอบ' : 'ทบทวน'} · {t.minutes} นาที</span><span>{taskLabels[t.status]} {t.locked && '🔒'}</span></div>
    <h3>{t.title}</h3><p>{t.reason}</p><small>{t.date || 'รอจัดเวลา — เวลาเรียนไม่พอ'}</small>
    <div className="lp-actions">
      {t.status === 'pending' && <button onClick={() => void changeTask(t, t.plan, 'in_progress')} disabled={busy}>เริ่มกิจกรรม</button>}
      {t.status === 'in_progress' && <><button onClick={() => { setSelected(t.content_id); setAttemptId(null) }}>เปิดเนื้อหา</button>{t.kind === 'quiz' ? <button disabled={!online || busy} onClick={() => { const m = snapshot.materials.find(m => m.id === t.content_id); if (m) void startQuiz(m) }}>เริ่ม quiz</button> : <button onClick={() => void changeTask(t, t.plan, 'completed')} disabled={busy}>เรียนเสร็จแล้ว</button>}</>}
      {['pending', 'in_progress'].includes(t.status) && <details className="lp-task-options"><summary>จัดการกิจกรรม</summary><div className="lp-actions">{['pending', 'in_progress'].includes(t.status) && <button className="lp-secondary" disabled={busy} onClick={() => void changeTask(t, t.plan, 'skipped')}>ข้าม</button>}
      {t.status === 'pending' && online && <><button className="lp-secondary" disabled={busy} onClick={() => void run(async () => { await rpc('lp_task_edit', { p_plan: t.plan.id, p_task: t.id, p_date: t.date, p_locked: !t.locked }); await refresh() })}>{t.locked ? 'ปลดล็อก' : 'ล็อก'}</button><label className="lp-date">เลื่อนวัน<input aria-label={`เลื่อน ${t.title}`} type="date" value={t.date || ''} disabled={busy} onChange={e => void run(async () => { await rpc('lp_task_edit', { p_plan: t.plan.id, p_task: t.id, p_date: e.target.value || null, p_locked: t.locked }); await refresh() })} /></label></>}
    </div></details>}</div>
  </article>

  if (!authReady) return <main className="lp-app lp-main"><Skeleton label="กำลังโหลดบัญชี" /></main>
  if (!session) return <Auth clearFeedback={() => { setError(''); setNotice('') }} notice={notice} error={error} busy={busy} run={run} setNotice={setNotice} />

  const lessonNeighbor = (m: Material, offset: number) => {
    const lessons = snapshot.materials.filter(lesson => lesson.course_id === m.course_id).sort((a, b) => a.created_at.localeCompare(b.created_at))
    const neighbor = lessons[lessons.findIndex(lesson => lesson.id === m.id) + offset]
    return neighbor ? () => { setSelected(neighbor.id); setAttemptId(null); window.scrollTo({ top: 0, behavior: 'instant' }) } : undefined
  }
  const activePage = selected ? 'library' : page
  const navigate = (next: Page) => { setPage(next); setSelected(null); setAttemptId(null); window.scrollTo({ top: 0, behavior: 'instant' }) }
  return <div className={`lp-app ${collapsed ? 'lp-nav-collapsed' : ''} ${attempt && !attempt.result ? 'lp-focus-mode' : ''}`}>
    <Navigation page={activePage} onNavigate={navigate} email={session.user.email || ''} completed={completed} total={tasks.length} collapsed={collapsed} onCollapse={() => setCollapsed(value => !value)} />
    <div className="lp-workspace"><header className="lp-topbar"><div className="lp-header-inner">
      <div className="lp-location"><span>พื้นที่การเรียนรู้</span><span aria-hidden="true">/</span><strong><Icon name={activePage} />{navigationLabels[activePage]}{selected && <span> / เนื้อหา</span>}</strong></div>
      <div className="lp-row lp-account"><button className="lp-header-search" aria-label="ค้นหาทั้งระบบ" onClick={() => navigate('search')}><Icon name="search" /><span>ค้นหาในพื้นที่เรียนรู้</span></button><span className={`lp-connection ${online ? '' : 'offline'}`}>{online ? '● ออนไลน์' : '○ Offline'}{syncCount > 0 && ` · รอ sync ${syncCount}`}</span><button className="lp-avatar" aria-label="เปิดบัญชีของฉัน" onClick={() => navigate('account')}>{session.user.email?.slice(0, 1).toUpperCase()}</button></div>
    </div></header><main id="main-content" tabIndex={-1} className="lp-main" data-page={material ? 'content' : page}>
        {error && <div className="lp-alert error" role="alert">{error}<button aria-label="ปิดข้อความผิดพลาด" onClick={() => setError('')}>×</button></div>}
        {notice && <div className="lp-alert" role="status">{notice}<button aria-label="ปิดข้อความ" onClick={() => setNotice('')}>×</button></div>}
        {!online && <div className="lp-alert">{downloaded ? 'กำลังอ่านข้อมูลที่บันทึกไว้ คะแนนและแผนจะอัปเดตเมื่อออนไลน์' : 'ยังไม่มีข้อมูลที่ดาวน์โหลดไว้ กรุณาออนไลน์แล้วบันทึกในตั้งค่า'}</div>}
        {update && <div className="lp-alert">มีเวอร์ชันใหม่พร้อมใช้งาน <button disabled={!!attempt && !attempt.result} onClick={() => { const reload = () => window.location.reload(); navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true }); update.postMessage({ type: 'SKIP_WAITING' }) }}>อัปเดตแอป</button>{attempt && !attempt.result && <small>ส่ง quiz หรือออกจาก quiz ก่อนอัปเดต</small>}</div>}
        <Suspense fallback={<Skeleton />}>{loading ? <Skeleton /> : <>{page === 'plan' && !material && <CapacityNotice snapshot={snapshot} />}{attempt && material ? <Quiz onPlan={() => navigate('plan')} onProgress={() => navigate('progress')} key={attempt.id} attempt={attempt} material={material} busy={busy} online={online} run={run} refresh={refresh} onBack={() => setAttemptId(null)} report={(entity, description) => run(async () => { await rpc('lp_report', { p_content: material.id, p_entity: entity, p_description: description }); setNotice('ส่งรายงานแล้ว รอผู้ดูแลตรวจสอบ') })} /> : material ? <LearningContent key={material.id} userId={user!} position={snapshot.materials.filter(m => m.course_id === material.course_id).sort((a, b) => a.created_at.localeCompare(b.created_at)).findIndex(m => m.id === material.id) + 1} total={snapshot.materials.filter(m => m.course_id === material.course_id).length} previous={lessonNeighbor(material, -1)} next={lessonNeighbor(material, 1)} draft={snapshot.attempts.find(a => a.content_id === material.id && !a.result) ? () => setAttemptId(snapshot.attempts.find(a => a.content_id === material.id && !a.result)!.id) : undefined} material={material} busy={busy} online={online} onBack={() => { setLibraryCourse(material.course_id); navigate('library') }} startQuiz={() => void startQuiz(material)} retry={() => void run(async () => { await analyze(material.id); await refresh() })} report={description => void run(async () => { await rpc('lp_report', { p_content: material.id, p_entity: 'summary', p_description: description }); setNotice('ส่งรายงานแล้ว') })} /> : <>
          {page === 'today' && <Dashboard snapshot={snapshot} due={due} completed={completed} tasks={tasks} navigate={navigate} open={id => { setSelected(id); setAttemptId(null) }} taskCard={taskCard} name={String(session.user.user_metadata.display_name || session.user.email?.split('@')[0] || '')} />}
          {page === 'search' && <SearchPage userId={user!} snapshot={snapshot} open={id => { setSelected(id); setAttemptId(null) }} openAttempt={(content, attempt) => { setSelected(content); setAttemptId(attempt) }} openCourse={id => { setLibraryCourse(id); navigate('library') }} navigate={navigate} />}
          {page === 'tutor' && <TutorPage snapshot={snapshot} initialMaterial={tutorMaterial} onChoose={setTutorMaterial} startQuiz={m => void startQuiz(m)} busy={busy} online={online} navigate={navigate} />}
          {page === 'library' && <Library key={libraryCourse} initialCourse={libraryCourse} snapshot={snapshot} busy={busy} online={online} run={run} refresh={refresh} open={setSelected} />}
          {page === 'plan' && <StudyPlanner snapshot={snapshot} today={today} busy={busy} online={online} settings={() => navigate('settings')} library={() => navigate('library')} undo={plan => void run(async () => { await rpc('lp_undo_plan', { p_plan: plan.id }); await refresh() })} taskCard={taskCard} history={plan => <PlanHistory plan={plan} />} />}
          {page === 'progress' && <Analytics snapshot={snapshot} completed={completed} navigate={navigate} openAttempt={(content, attempt) => { setSelected(content); setAttemptId(attempt) }} />}
          {page === 'account' && <Account user={session.user} snapshot={snapshot} busy={busy} online={online} run={run} notify={setNotice} settings={() => setPage('settings')} logout={() => void run(async () => { const { error } = await client!.auth.signOut({ scope: 'local' }); if (error) throw error; clearPrivate(); setSnapshot(emptySnapshot); setSession(null); setPage('today') })} />}
          {page === 'settings' && <Settings key={JSON.stringify(snapshot.preferences)} snapshot={snapshot} busy={busy} online={online} run={run} refresh={refresh} email={session.user.email || ''} download={() => { if (user) { saveOffline(user, snapshot); setDownloaded(true); setNotice('บันทึกสรุป ต้นฉบับ และแผนล่าสุดแล้ว') } }} downloaded={downloaded} install={installPrompt ? async () => { await installPrompt.prompt(); setInstallPrompt(null) } : null} logout={() => void run(async () => { clearPrivate(); setSnapshot(emptySnapshot); const { error } = await client!.auth.signOut({ scope: 'local' }); if (error) throw error; setSession(null) })} clearDownload={() => { if (user) localStorage.removeItem(`leanpilot:${user}:saved`); setDownloaded(false); setNotice('ล้างเนื้อหา offline แล้ว กิจกรรมที่รอ sync ยังคงอยู่') }} />}
        </>}
      </>}</Suspense> </main><footer className="lp-footer">LearnPilot · พื้นที่การเรียนรู้ที่สงบและมีสมาธิ</footer>
    </div>
  </div>
}

type Run = (action: () => Promise<void>) => Promise<void>
function Auth({ busy, error, notice, run, setNotice, clearFeedback }: { busy: boolean; error: string; notice: string; run: Run; setNotice: (s: string) => void; clearFeedback: () => void }) {
  const [register, setRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const submitting = useRef(false)
  const resendConfirmation = () => {
    if (busy || submitting.current) return
    submitting.current = true
    void run(async () => {
      if (!client) throw new Error('ยังไม่ได้ตั้งค่า Supabase กรุณาดู README')
      const { error } = await client.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).href } })
      if (error) throw new Error(authErrorMessage(error))
      setNotice('ส่งคำขออีเมลยืนยันแล้ว หากบัญชียังรอยืนยัน กรุณาตรวจกล่องจดหมายและสแปม แล้วเปิดลิงก์ยืนยันก่อนเข้าสู่ระบบ')
    }).finally(() => { submitting.current = false })
  }
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy || submitting.current) return
    submitting.current = true
    const data = new FormData(e.currentTarget)
    void run(async () => {
      if (!client) throw new Error('ยังไม่ได้ตั้งค่า Supabase กรุณาดู README')
      const credentials = { email: String(data.get('email')).trim(), password: String(data.get('password')) }
      const result = register ? await client.auth.signUp({ ...credentials, options: { emailRedirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).href } }) : await client.auth.signInWithPassword(credentials)
      if (result.error) throw new Error(authErrorMessage(result.error))
      if (register && !result.data.session) {
        setRegister(false)
        setNotice('ส่งคำขอสมัครแล้ว กรุณาตรวจกล่องจดหมายและสแปมเพื่อยืนยันอีเมล จากนั้นเข้าสู่ระบบด้วยบัญชีเดิม ไม่ต้องสมัครซ้ำ')
      }
    }).finally(() => { submitting.current = false })
  }
    return <main className="lp-app lp-auth lp-auth-simple">
    <section className="lp-auth-story"><div className="lp-brand"><span><Icon name="compass" /></span>LearnPilot</div><span className="lp-eyebrow">CALM AI LEARNING WORKSPACE</span><h2>เรียนอย่างมีทิศทาง<br /><em>เติบโตในจังหวะของคุณ</em></h2><p>จากเอกสารที่มี สู่ความเข้าใจที่ชัดขึ้น ให้ AI ช่วยสรุป ทดสอบ และวางแผนให้พอดีกับชีวิต</p><div className="lp-auth-steps"><div><span>01</span><div><strong>เพิ่มสิ่งที่คุณอยากเรียน</strong><small>เอกสาร PDF ข้อความ และโน้ตของคุณ</small></div></div><div><span>02</span><div><strong>เปลี่ยนเนื้อหาเป็นความเข้าใจ</strong><small>สรุป AI และแบบทดสอบจากบทเรียน</small></div></div><div><span>03</span><div><strong>เดินต่อด้วยแผนที่เหมาะกับคุณ</strong><small>ทบทวนจากหลักฐาน ตามเวลาที่มี</small></div></div></div></section>
    <form className="lp-card lp-auth-card" onSubmit={submit} aria-busy={busy}>
      <a className="lp-brand" href="#"><span><Icon name="compass" /></span> LearnPilot</a>
      <div className="lp-auth-tabs" role="group" aria-label="บัญชีผู้ใช้">
        <button type="button" aria-pressed={!register} disabled={busy} onClick={() => { setRegister(false); setShowPassword(false); clearFeedback() }}>เข้าสู่ระบบ</button>
        <button type="button" aria-pressed={register} disabled={busy} onClick={() => { setRegister(true); setShowPassword(false); clearFeedback() }}>สมัครสมาชิก</button>
      </div>
      <h1>{register ? 'เริ่มเรียนกับ LearnPilot' : 'เข้าสู่ระบบ'}</h1>
      <p>{register ? 'สร้างบัญชีด้วยอีเมลและรหัสผ่าน' : 'ใช้อีเมลและรหัสผ่านที่สมัครไว้'}</p>
      {!client && <div className="lp-alert" role="alert">ยังไม่พร้อมเชื่อมต่อระบบ กรุณาติดต่อผู้ดูแล</div>}
      {error && <p role="alert" className="lp-error">{error}</p>}
      {notice && <p role="status" className="lp-auth-notice">{notice}</p>}
      <label htmlFor="lp-auth-email">อีเมล</label>
      <input id="lp-auth-email" type="email" name="email" value={email} onChange={e => { setEmail(e.target.value); clearFeedback() }} autoComplete="username" placeholder="name@example.com" autoCapitalize="none" spellCheck={false} required disabled={busy} />
      <label htmlFor="lp-auth-password">รหัสผ่าน</label>
      <div className="lp-password-field">
        <input id="lp-auth-password" type={showPassword ? 'text' : 'password'} name="password" minLength={register ? 8 : undefined} autoComplete={register ? 'new-password' : 'current-password'} placeholder={register ? 'อย่างน้อย 8 ตัวอักษร' : 'รหัสผ่านของคุณ'} required disabled={busy} />
        <button type="button" aria-controls="lp-auth-password" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'ซ่อน' : 'แสดง'}</button>
      </div>
      <button type="submit" className="lp-auth-submit" disabled={busy || !client}>{busy ? 'กำลังดำเนินการ…' : register ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'}</button>
      <p className="lp-auth-help">{register ? 'หากมีบัญชีแล้ว เลือกเข้าสู่ระบบด้านบน ไม่ต้องสมัครซ้ำ' : 'หากเพิ่งสมัคร ให้ยืนยันอีเมลจากข้อความที่ได้รับก่อนเข้าสู่ระบบ'}</p>
      {!register && <button type="button" className="lp-link" disabled={busy || !client || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())} onClick={resendConfirmation}>ส่งอีเมลยืนยันอีกครั้ง</button>}
    </form>
  </main>
}

function PlanHistory({ plan }: { plan: Plan }) {
  const [history, setHistory] = useState<{ version: number; reason: string; trigger: string; created_at: string }[]>([])
  useEffect(() => {
    if (!client || !navigator.onLine) return
    void client.from('lp_plans').select('version,reason,trigger,created_at').eq('course_id', plan.course_id).order('version', { ascending: false }).then(({ data }) => setHistory(data || []))
  }, [plan.course_id, plan.version])
  return <ul>{history.map(h => <li key={h.version}>v{h.version} · {h.trigger.startsWith('attempt:') ? 'ผล quiz ใหม่' : 'เปลี่ยนเวลาว่าง'} — {h.reason}</li>)}</ul>
}
function CapacityNotice({ snapshot }: { snapshot: Snapshot }) {
  const totals: Record<string, number> = {};
  for (const t of snapshot.plans.flatMap(p => p.tasks)) if (t.date && t.status !== 'skipped') totals[t.date] = (totals[t.date] || 0) + t.minutes;
  const over = Object.entries(totals).filter(([, minutes]) => minutes > snapshot.preferences.minutes);
  return over.length ? <div className="lp-alert error" role="status">กิจกรรมที่ล็อกหรือเริ่มแล้วเกินเวลาว่างใหม่ใน {over.map(([date, minutes]) => `${date} (${minutes} นาที)`).join(', ')} กรุณาปลดล็อก/เลื่อนงาน หรือเพิ่มเวลาว่าง</div> : null;
}


