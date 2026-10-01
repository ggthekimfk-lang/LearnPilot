export type Ref = { section: number; excerpt: string }
export type Analysis = {
  summary: { overview: string; references: Ref[]; points: { text: string; references: Ref[] }[] }
  concepts: { id: string; name: string; description: string; references: Ref[] }[]
  questions: { concept_id: string; prompt: string; choices: string[]; correct: number; explanation: string; reference: Ref }[]
}
const string = { type: 'string' }
const object = (properties: Record<string, unknown>) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false })
const array = (items: unknown) => ({ type: 'array', items })
const ref = object({ section: { type: 'integer' }, excerpt: string })
export const schema = object({
  summary: object({ overview: string, references: array(ref), points: array(object({ text: string, references: array(ref) })) }),
  concepts: array(object({ id: string, name: string, description: string, references: array(ref) })),
  questions: array(object({ concept_id: string, prompt: string, choices: array(string), correct: { type: 'integer' }, explanation: string, reference: ref })),
})
export function chunks(source: string): string[] {
  // The source UI uses exactly the same boundaries as the worker.
  return source.match(/[\s\S]{1,2000}/g) || []
}
export function validate(value: unknown, source: string): Analysis {
  const a = value as Analysis
  const sections = chunks(source)
  const refs = (rs: Ref[]) => {
    if (!Array.isArray(rs) || !rs.length) throw new Error('Missing references')
    for (const r of rs) if (!Number.isInteger(r.section) || typeof r.excerpt !== 'string' || r.excerpt.trim().length < 8 || !sections[r.section - 1]?.includes(r.excerpt)) throw new Error('Reference not found in source')
  }
  if (!a?.summary?.overview || !Array.isArray(a.summary.points) || !a.summary.points.length || !Array.isArray(a.concepts) || !a.concepts.length || a.concepts.length > 10 || !Array.isArray(a.questions) || !a.questions.length || a.questions.length > 30) throw new Error('Invalid analysis shape')
  refs(a.summary.references)
  a.summary.points.forEach(p => { if (!p.text) throw new Error('Empty summary'); refs(p.references) })
  const ids = new Set<string>()
  a.concepts.forEach(c => {
    if (!/^c[0-9]+$/.test(c.id) || ids.has(c.id) || !c.name || !c.description) throw new Error('Invalid concept')
    ids.add(c.id); refs(c.references)
  })
  const prompts = new Set<string>()
  for (const q of a.questions) {
    if (!ids.has(q.concept_id) || !q.prompt || prompts.has(q.prompt.trim().toLowerCase()) || !Array.isArray(q.choices) || q.choices.length !== 4 || new Set(q.choices.map(c => c.trim().toLowerCase())).size !== 4 || q.choices.some(c => typeof c !== 'string' || !c.trim()) || !Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3 || !q.explanation) throw new Error('Invalid or duplicate question')
    prompts.add(q.prompt.trim().toLowerCase()); refs([q.reference])
  }
  return a
}
