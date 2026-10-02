import { useEffect, useRef, useState } from 'react'
import Icon from './Icons'

import { navigationLabels, navigationGroups } from './navigation-items'
import type { NavigationPage } from './navigation-items'
const learning: NavigationPage[] = ['today', 'library', 'plan', 'progress']
const descriptions: Record<NavigationPage, string> = { today: 'เริ่มต้นวันแห่งการเรียนรู้', library: 'เนื้อหาและสรุปทั้งหมด', plan: 'จัดเวลาให้เป้าหมายของคุณ', progress: 'ติดตามความเข้าใจ', account: 'ข้อมูลและโปรไฟล์', settings: 'ปรับให้เหมาะกับคุณ', tutor: 'เรียนรู้จากสรุปของคุณ', search: 'ค้นหาทั้งพื้นที่เรียนรู้' }

export default function Navigation({ page, onNavigate, email, completed, total, collapsed, onCollapse }: { page: NavigationPage; onNavigate: (page: NavigationPage) => void; email: string; completed: number; total: number; collapsed: boolean; onCollapse: () => void }) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const drawer = useRef<HTMLElement>(null)
  const close = () => { setOpen(false); trigger.current?.focus() }
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawer.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
      if (event.key !== 'Tab') return
      const buttons = drawer.current?.querySelectorAll<HTMLButtonElement>('button')
      if (!buttons?.length) return
      const first = buttons[0], last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keyboard)
    const desktop = window.matchMedia('(min-width: 761px)')
    const resize = () => { if (desktop.matches) setOpen(false) }
    desktop.addEventListener('change', resize)
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', keyboard); desktop.removeEventListener('change', resize) }
  }, [open])
  const navigate = (key: NavigationPage) => { onNavigate(key); if (open) close() }
  const items = (pages: NavigationPage[]) => pages.map(key => <button type="button" key={key} className={`lp-nav-item ${page === key ? 'active' : ''}`} title={collapsed ? navigationLabels[key] : undefined} aria-label={navigationLabels[key]} aria-current={page === key ? 'page' : undefined} onClick={() => navigate(key)}><span className="lp-nav-icon"><Icon name={key} /></span><span className="lp-nav-copy"><strong>{navigationLabels[key]}</strong><small>{descriptions[key]}</small></span>{page === key && <span className="lp-nav-dot" />}</button>)
  const content = <><div className="lp-nav-brand"><span className="lp-nav-logo"><Icon name="compass" /></span><div>LearnPilot<small>YOUR LEARNING COMPANION</small></div></div>{navigationGroups.map(group => <div className="lp-nav-section" key={group.label}><span className="lp-nav-caption">{group.label}</span><nav aria-label={group.label}>{items(group.pages)}</nav></div>)}<div className="lp-nav-goal"><span className="lp-nav-caption">ทีละก้าว สู่เป้าหมาย</span><strong>ทุกกิจกรรมมีความหมาย</strong><p>{total ? `ทำสำเร็จ ${completed} จาก ${total} กิจกรรม` : 'เริ่มจากเพิ่มเนื้อหาที่อยากเรียน'}</p><progress aria-label="กิจกรรมที่ทำสำเร็จ" value={completed} max={Math.max(total, 1)} /><button onClick={() => navigate(total ? 'plan' : 'library')}>{total ? 'ดูแผนการเรียน' : 'ไปที่คลังเนื้อหา'} <span aria-hidden="true">↗</span></button></div><button aria-label="บัญชีผู้ใช้" title={collapsed ? 'บัญชีของฉัน' : undefined} className="lp-nav-user" onClick={() => navigate('account')}><span className="lp-user-monogram">{email.slice(0, 1).toUpperCase() || 'L'}</span><span><strong>บัญชีของฉัน</strong><small>{email}</small></span><span aria-hidden="true">↗</span></button></>
  return <><a className="lp-skip" href="#main-content">ข้ามไปเนื้อหาหลัก</a><aside className="lp-navigation"><button className="lp-collapse" aria-label={collapsed ? "ขยายเมนู" : "ย่อเมนู"} aria-expanded={!collapsed} onClick={onCollapse}>{collapsed ? "›" : "‹"}</button>{content}</aside><button ref={trigger} className="lp-menu-trigger" aria-label="เปิดเมนูนำทาง" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(true)}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button>{open && <div className="lp-drawer-backdrop" onClick={close}><aside ref={drawer} id="mobile-navigation" className="lp-navigation lp-drawer" role="dialog" aria-modal="true" aria-label="เมนูนำทาง" onClick={event => event.stopPropagation()}><button className="lp-drawer-close" aria-label="ปิดเมนู" onClick={close}>×</button>{content}</aside></div>}<nav className="lp-mobile-navigation" aria-label="เมนูหลักมือถือ">{[...learning, 'account' as const].map(key => <button key={key} title={collapsed ? navigationLabels[key] : undefined} aria-label={navigationLabels[key]} aria-current={page === key ? 'page' : undefined} className={page === key ? 'active' : ''} onClick={() => navigate(key)}><span><Icon name={key} /></span>{navigationLabels[key]}</button>)}</nav></>
}
