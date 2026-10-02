export type Ref = { section: number; excerpt: string; document_id?: string; chunk_id?: string; page?: number | null; status?: 'verified' | 'unverified'; reason?: string; start?: number; end?: number; end_section?: number }
export type Analysis = {
  summary: { overview: string; references: Ref[]; points: { text: string; references: Ref[] }[]; sections?: { title: string; items: string[] }[]; verification_warnings?: { location: string; reason: string }[] }
  concepts: { id: string; name: string; description: string; references: Ref[] }[]
  questions: { concept_id: string; prompt: string; choices: string[]; correct: number; explanation: string; reference: Ref; difficulty?: 'easy' | 'medium' | 'hard'; questionType?: string }[]
}
const string = { type: 'string' }
const object = <T extends Record<string, unknown>>(properties: T) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false })
const array = (items: unknown) => ({ type: 'array', items })
const ref = object({ document_id: string, chunk_id: string, page: { type: ['integer', 'null'] }, section: { type: 'integer' }, excerpt: string })
export const schema = object({
  summary: object({ overview: string, references: array(ref), points: array(object({ text: string, references: array(ref) })) }),
  concepts: array(object({ id: string, name: string, description: string, references: array(ref) })),
  questions: array(object({ concept_id: string, prompt: string, choices: array(string), correct: { type: 'integer' }, explanation: string, reference: ref })),
})
export function chunks(source: string): string[] {
  // The source UI uses exactly the same boundaries as the worker.
  return source.match(/[\s\S]{1,2000}/g) || []
}
export function sourceChunks(source: string, documentId: string) {
  const pages = [...source.matchAll(/\[PDF หน้า (\d+)\]/g)]
  return chunks(source).map((text, i) => {
    const start = i * 2000
    const page = pages.filter(p => p.index! <= start).at(-1) ?? pages.find(p => p.index! < start + text.length)
    return { document_id: documentId, chunk_id: 'section-' + (i + 1), section: i + 1, page: page ? Number(page[1]) : null, start, end: start + text.length, text }
  })
}
function normalized(text: string) {
  let value = ''
  const positions: { start: number; end: number }[] = []
  for (const part of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)) {
    for (const char of part.segment.normalize('NFC')) {
      const whitespace = /\s/u.test(char)
      if (whitespace && value.endsWith(' ')) { positions[positions.length - 1].end = part.index + part.segment.length; continue }
      const token = whitespace ? ' ' : char
      value += token
      for (let i = 0; i < token.length; i++) positions.push({ start: part.index, end: part.index + part.segment.length })
    }
  }
  return { value, positions }
}
export function validate(value: unknown, source: string, documentId?: string, mode: 'summary' | 'quiz' = 'quiz'): Analysis {
  const a = structuredClone(value) as Analysis
  const sections = sourceChunks(source, documentId ?? 'source')
  const warnings: { location: string; reason: string }[] = []
  const refs = (rs: Ref[], location: string) => {
    if (!Array.isArray(rs) || !rs.length) { warnings.push({ location, reason: 'ไม่พบหลักฐาน' }); return [] }
    for (const [index, r] of rs.entries()) {
      const declared = sections[(r?.section ?? 0) - 1]
      let reason = 'ไม่พบข้อความนี้ในต้นฉบับ'
      if (r && declared && Number.isInteger(r.section) && typeof r.excerpt === 'string' && r.excerpt.trim().length >= 8 && !/\[PDF หน้า \d+\]/.test(r.excerpt) &&
          (!documentId || (r.document_id === documentId && r.chunk_id === declared.chunk_id && r.page === declared.page))) {
        // Preserve original adjacency; do not insert separators between chunks.
        const start = sections[Math.max(0, r.section - 2)].start
        const end = sections[Math.min(sections.length - 1, r.section)].end
        const window = normalized(source.slice(start, end))
        const quote = normalized(r.excerpt).value.trim()
        const local = normalized(declared.text)
        const localAt = local.value.indexOf(quote)
        const localStart = localAt >= 0 ? declared.start + local.positions[localAt].start : null
        let at = window.value.indexOf(quote)
        if (localStart !== null) at = window.positions.findIndex(p => start + p.start === localStart)
        else if (at >= 0 && window.value.indexOf(quote, at + 1) >= 0) at = -1 // Ambiguous neighboring evidence stays unverified.
        if (at >= 0) {
          const from = start + window.positions[at].start
          const to = start + window.positions[at + quote.length - 1].end
          const first = Math.floor(from / 2000) + 1
          const metadata = sections[first - 1]
          const page = [...source.slice(0, from).matchAll(/\[PDF หน้า (\d+)\]/g)].at(-1)
          Object.assign(r, { document_id: metadata.document_id, chunk_id: metadata.chunk_id, page: page ? Number(page[1]) : null, section: first, excerpt: source.slice(from, to), start: from, end: to, end_section: Math.floor((to - 1) / 2000) + 1, status: 'verified' })
          delete r.reason
          continue
        }
      } else reason = 'รูปแบบอ้างอิงหรือ source metadata ไม่ถูกต้อง'
      if (r && typeof r === 'object') {
        for (const key of ['start', 'end', 'end_section', 'document_id', 'chunk_id', 'page'] as const) delete r[key]
        r.status = 'unverified'; r.reason = reason
      } else rs[index] = { section: 0, excerpt: '', status: 'unverified', reason }
      warnings.push({ location: location + ' อ้างอิง ' + (index + 1), reason })
    }
    return rs
  }
  if (typeof a?.summary?.overview !== 'string' || !a.summary.overview.trim() || !Array.isArray(a.summary.points) || !a.summary.points.length || !Array.isArray(a.concepts) || (mode === 'quiz' && !a.concepts.length) || a.concepts.length > 10 || !Array.isArray(a.questions) || (mode === 'quiz' && !a.questions.length) || (mode === 'summary' && a.questions.length) || a.questions.length > 30) throw new Error('Invalid analysis shape')
  if (a.summary.sections !== undefined && (!Array.isArray(a.summary.sections) || a.summary.sections.some(s => typeof s.title !== 'string' || !s.title.trim() || !Array.isArray(s.items) || !s.items.length || s.items.some(t => typeof t !== 'string' || !t.trim())))) throw new Error('Invalid summary sections')
  if (mode === 'summary') {
    const studentText = [a.summary.overview, ...a.summary.points.map(p => p.text), ...(a.summary.sections ?? []).flatMap(s => [s.title, ...s.items]), ...a.concepts.flatMap(c => [c.name, c.description])]
    if (studentText.some(t => typeof t !== 'string' || /(?:chunk[_ -]?id|source[_ -]?id|evidence[_ -]?id|document[_ -]?id|\[PDF หน้า|อ้างอิง(?:จาก)?หน้า|ส่วน\s*\d+\s*\/\s*\d+|\[(?:\d+|citation[^\]]*)\])/i.test(t))) throw new Error('Summary contains technical references')
  }
  a.summary.references = refs(a.summary.references, 'สรุปภาพรวม')
  a.summary.points.forEach((p, i) => { if (!p.text) throw new Error('Empty summary'); p.references = refs(p.references, `ประเด็นสรุป ${i + 1}`) })
  const ids = new Set<string>()
  a.concepts.forEach((c, i) => {
    if (!/^c[0-9]+$/.test(c.id) || ids.has(c.id) || !c.name || !c.description) throw new Error('Invalid concept')
    ids.add(c.id); c.references = refs(c.references, `แนวคิด ${i + 1}`)
  })
  const prompts = new Set<string>()
  for (const [index, q] of a.questions.entries()) {
    if (!ids.has(q.concept_id) || !q.prompt || prompts.has(q.prompt.trim().toLowerCase()) || !Array.isArray(q.choices) || q.choices.length !== 4 || new Set(q.choices.map(c => c.trim().toLowerCase())).size !== 4 || q.choices.some(c => typeof c !== 'string' || !c.trim()) || !Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3 || !q.explanation) throw new Error('Invalid or duplicate question')
    prompts.add(q.prompt.trim().toLowerCase()); q.reference = refs([q.reference], `คำถาม ${index + 1}`)[0]
  }
  a.summary.verification_warnings = warnings
  return a
}

