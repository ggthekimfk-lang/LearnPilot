import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Material, Reference, Result } from './types'
import { assessTopics, reviewTopics } from './weakness-review'

export default function WeaknessReview({ result, material, reference, onLesson }: {
  result: Result; material: Material; reference: (ref: Reference) => ReactNode; onLesson: () => void
}) {
  const topics = reviewTopics(result)
  const assessments = assessTopics(result)
  const labels = { strong: 'ทำได้ดีในชุดนี้', review: 'ควรทบทวน', developing: 'กำลังพัฒนา', insufficient: 'ยังประเมินไม่ได้' }
  const [selected, setSelected] = useState<string | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (selected) { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }) }
  }, [selected])
  const topic = topics.find(t => t.id === selected)
  const concept = material.concepts.find(c => c.id === selected)
  const name = (id: string) => material.concepts.find(c => c.id === id)?.name || 'หัวข้อจากแบบทดสอบ'
  return <section aria-label="ผลรายหัวข้อและสิ่งที่ควรทบทวน" className="lp-weakness-review">
    {assessments.length > 0 && <>
      <div className="lp-heading"><div><h2>สิ่งที่ทำได้ดีและจุดที่ควรพัฒนา</h2><p>ประเมินจากคำถามไม่ซ้ำในชุดนี้เท่านั้น ต้องมีอย่างน้อย 3 ข้อต่อหัวข้อ โดยผลสะสมดูได้ในหน้าความก้าวหน้า</p></div></div>
      <div className="lp-grid lp-topic-grid">{assessments.map(t => <article className="lp-card" key={t.id}>
        <span className={`lp-tag ${t.status === 'strong' ? '' : t.status === 'insufficient' ? 'info' : 'warning'}`}>{labels[t.status]}</span>
        <h3>{name(t.id)}</h3><div className="lp-topic-score"><span>ตอบถูก {t.correct} / {t.total} ข้อ</span><strong>{Math.round(t.correct / t.total * 100)}%</strong></div><div className="lp-topic-meter" aria-hidden="true"><span style={{ width: `${t.correct / t.total * 100}%` }} /></div>
        <p className="lp-muted">{t.status === 'strong' ? 'ตอบถูกอย่างน้อย 80% รักษาความเข้าใจด้วยการทบทวน ผลนี้ยังไม่ยืนยันการจำระยะยาว' : t.status === 'insufficient' ? 'มีคำถามน้อยกว่า 3 ข้อ จึงยังสรุปจุดแข็งหรือจุดอ่อนไม่ได้' : t.status === 'review' ? 'ตอบถูกน้อยกว่า 60% ลองอ่านเนื้อหาและเฉลยที่เกี่ยวข้องอีกครั้ง' : 'ตอบถูกตั้งแต่ 60% แต่ยังไม่ถึง 80% ทบทวนข้อที่พลาดเพื่อเติมความเข้าใจ'}</p>
        {t.mistakes.length > 0 ? <button className="lp-secondary" aria-expanded={selected === t.id} onClick={() => setSelected(t.id)}>ดูข้อที่ควรทบทวน →</button> : <button className="lp-link" onClick={onLesson}>อ่านสรุปบทเรียน →</button>}
      </article>)}</div>
    </>}
    {topics.length ? <>
      {topic && <article id="lp-topic-review" className="lp-card lp-topic-review">
        <button className="lp-link" onClick={() => setSelected(null)}>← กลับรายการหัวข้อ</button>
        <h2 tabIndex={-1} ref={heading}>ทบทวน {name(topic.id)}</h2>
        <p className="lp-muted">คำอธิบายและเฉลยจากบทเรียนเดิม ไม่สร้างเนื้อหาใหม่</p>
        {concept?.description && <><h3>ทำความเข้าใจหัวข้อนี้</h3><p>{concept.description}</p></>}
        {!!concept?.references.length && <><h3>อ่านจากต้นฉบับ</h3>{concept.references.map((ref, i) => <div key={i}>{reference(ref)}</div>)}</>}
        <h3>ข้อที่ควรกลับไปทำความเข้าใจ</h3>
        {topic.mistakes.map((item, i) => <section className="lp-review-mistake" key={item.question_id}>
          <h4>{i + 1}. {item.prompt}</h4>
          <div className="lp-answer-review"><p>คำตอบของคุณ: {item.choices[item.selected] ?? 'ไม่มีคำตอบ'}</p><p><strong>คำตอบที่ถูก: {item.choices[item.correct]}</strong></p></div>
          <p>{item.explanation}</p>{reference(item.reference)}
        </section>)}
        <p className="lp-muted">ลองอธิบายเหตุผลของคำตอบด้วยคำของคุณเอง การอ่านหน้านี้ไม่เพิ่มคะแนนความเข้าใจ</p>
        <button onClick={onLesson}>อ่านสรุปบทเรียนเต็ม →</button>
      </article>}
    </> : <div className="lp-card"><h3>{result.total ? 'ตอบถูกทุกข้อในชุดนี้' : 'ยังไม่มีข้อที่ใช้ประเมินได้'}</h3><p>{result.total ? 'ยังกลับไปอ่านสรุปเพื่อทบทวนได้ ผลชุดนี้ยังไม่ยืนยันการจำระยะยาว' : 'คำถามอาจถูกถอนออก กรุณาดูข้อความในผลทดสอบ'}</p><button className="lp-secondary" onClick={onLesson}>อ่านสรุปบทเรียน</button></div>}
  </section>
}
