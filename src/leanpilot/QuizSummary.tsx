import type { Attempt, Material, Result } from './types'
import { reviewTopics } from './weakness-review'

export default function QuizSummary({ attempt, result, material }: { attempt: Attempt; result: Result; material: Material }) {
  const topics = reviewTopics(result)
  const elapsed = attempt.submitted_at ? Math.floor((Date.parse(attempt.submitted_at) - Date.parse(attempt.created_at)) / 1000) : NaN
  const duration = Number.isFinite(elapsed) && elapsed >= 0 ? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}` : '—'
  const percentage = result.total ? Math.round(result.score / result.total * 100) : 0
  return <section className="lp-card lp-quiz-summary" aria-label="สรุปผลแบบทดสอบ">
    <div className="lp-summary-title"><div><span>ทำแบบทดสอบเสร็จแล้ว</span><h2>{material.title}</h2><p>อีกหนึ่งก้าวของการเรียนรู้ของคุณ</p></div><span className="lp-summary-emblem" aria-hidden="true">✓</span></div>
    {result.notice && <div className="lp-alert">{result.notice} ({result.withdrawn_count} ข้อ)</div>}
    <div className="lp-summary-stats">
      <div className="lp-summary-score"><svg className="lp-score-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" /><circle className="lp-score-fill" cx="60" cy="60" r="52" pathLength="100" strokeDasharray={`${percentage} 100`} /></svg><div><span>คะแนนความแม่นยำ</span><strong>{result.total ? `${percentage}%` : '—'}</strong><p>ตอบถูก {result.score} / {result.total} ข้อ</p></div></div>
      <div><span>◷ ระยะเวลาตั้งแต่เริ่ม</span><strong>{duration}</strong><p>นาที : วินาที · รวมเวลาที่พัก</p></div>
      <div><span>◎ แนวทางต่อไป</span><strong className="lp-summary-status">{!result.total ? 'ยังประเมินไม่ได้' : topics.length ? `ทบทวน ${topics.length} หัวข้อ` : 'รักษาความเข้าใจนี้ไว้'}</strong><p>{topics.length ? 'เริ่มจากข้อที่พลาดในชุดนี้' : 'กลับไปอ่านสรุปเพื่อทบทวน'}</p></div>
    </div>
    {!!topics.length && <div className="lp-summary-topics"><h3>เริ่มทบทวนจากหัวข้อเหล่านี้</h3><div className="lp-actions">{topics.map(topic => <span className="lp-tag warning" key={topic.id}>{material.concepts.find(c => c.id === topic.id)?.name || 'หัวข้อจากแบบทดสอบ'}</span>)}</div><p>แผนทบทวนอัปเดตจากคำตอบของคุณแล้ว</p></div>}
  </section>
}
