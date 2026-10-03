import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Result, Reference } from './types'

export default function QuizAnswerReview({ result, reference, issue }: {
  result: Result; reference: (ref: Reference) => ReactNode; issue: (id: string) => ReactNode
}) {
  const [filter, setFilter] = useState<'all' | 'mistakes'>('all')
  const mistakes = result.feedback.filter(f => f.selected !== f.correct)
  const items = filter === 'mistakes' ? mistakes : result.feedback
  return <section className="lp-answer-section" aria-label="ตรวจทานคำตอบ">
    <div className="lp-review-header"><div><h2>ตรวจทานคำตอบ</h2><p>เลือกข้อเพื่อดูคำตอบ เฉลย และแหล่งอ้างอิง</p></div><div className="lp-review-filters" role="group" aria-label="กรองคำตอบ"><button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>ทั้งหมด {result.feedback.length}</button><button aria-pressed={filter === 'mistakes'} onClick={() => setFilter('mistakes')}>ข้อที่พลาด {mistakes.length}</button></div></div>
    {!items.length && <div className="lp-card">{result.total ? 'ไม่มีข้อที่ตอบผิดในชุดนี้ ✓' : 'ยังไม่มีข้อที่ใช้ประเมินได้'}</div>}
    {items.map(f => {
      const correct = f.selected === f.correct
      const number = result.feedback.indexOf(f) + 1
      return <details className={`lp-card lp-answer-accordion ${correct ? 'is-correct' : 'is-mistake'}`} key={f.question_id}>
        <summary><span className="lp-answer-number">{String(number).padStart(2, '0')}</span><span className="lp-answer-prompt">{f.prompt}</span><span className={`lp-tag ${correct ? '' : 'danger'}`}>{correct ? '✓ ถูกต้อง' : 'ควรทบทวน'}</span><span className="lp-answer-chevron" aria-hidden="true">⌄</span></summary>
        <div className="lp-answer-content"><div className="lp-review-choices">{f.choices.map((choice, i) => <div key={i} className={`lp-review-choice ${i === f.correct ? 'correct' : i === f.selected ? 'incorrect' : ''}`}><span><b>{String.fromCharCode(65 + i)}.</b> {choice}</span>{i === f.correct && <strong>✓ คำตอบที่ถูก</strong>}{i === f.selected && <strong>คำตอบของคุณ</strong>}</div>)}</div><div className="lp-answer-review"><strong>เหตุผลของคำตอบ</strong><p>{f.explanation}</p></div>{reference(f.reference)}{issue(f.question_id)}</div>
      </details>
    })}
  </section>
}
