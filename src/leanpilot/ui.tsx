import type { ReactNode } from 'react'
import Icon from './Icons'

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="lp-heading"><div>{eyebrow && <span className="lp-eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}
export function EmptyState({ title, text, action, icon = 'library' }: { title: string; text: string; action?: ReactNode; icon?: 'library' | 'plan' | 'progress' | 'compass' | 'search' }) {
  return <section className="lp-card lp-empty"><span className="lp-empty-icon"><Icon name={icon} /></span><h3>{title}</h3><p>{text}</p>{action && <div className="lp-empty-action">{action}</div>}</section>
}
export function ProgressMeter({ value, total, label }: { value: number; total: number; label: string }) {
  const percent = total ? Math.round(value / total * 100) : 0
  return <div className="lp-meter"><div><span>{label}</span><strong>{percent}%</strong></div><progress aria-label={label} max={Math.max(1, total)} value={value} /></div>
}
export function Skeleton({ label = 'กำลังโหลดข้อมูลการเรียน' }: { label?: string }) {
  return <div className="lp-skeleton-page" role="status" aria-live="polite"><span className="lp-sr">{label}</span><div className="lp-skeleton lp-skeleton-title" /><div className="lp-skeleton lp-skeleton-hero" /><div className="lp-grid">{[0, 1].map(key => <div className="lp-card" key={key}><div className="lp-skeleton lp-skeleton-title" /><div className="lp-skeleton" /><div className="lp-skeleton" /></div>)}</div></div>
}
export function SectionHeading({ title, action, caption }: { title: string; action?: ReactNode; caption?: string }) {
  return <div className="lp-section-title"><div><h2>{title}</h2>{caption && <p className="lp-muted">{caption}</p>}</div>{action}</div>
}
