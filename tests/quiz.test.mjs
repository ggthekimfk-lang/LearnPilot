import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validate } from '../supabase/functions/analyze-content/validation.ts'
import { generateQuiz, checkQuiz, questionTypes, quizSchema, quizPassages } from '../supabase/functions/analyze-content/quiz.ts'
export const source = Array.from({ length: 20 }, (_, i) => `Stage ${i + 1} checks input ${i + 1} before producing output ${i + 1}. Skipping that check allows invalid input ${i + 1} into output ${i + 1}.`).join('\n')
export const lesson = { summary: { overview: 'Validation stages', references: [], points: [{ text: 'Check input before output', references: [] }] }, concepts: [{ id: 'doc:c1', name: 'Validation', description: 'Check inputs before outputs', references: [] }] }
export function questions(id = 'doc') {
  return Array.from({ length: 20 }, (_, i) => {
    const excerpt = `Stage ${i + 1} checks input ${i + 1} before producing output ${i + 1}.`
    const start = source.indexOf(excerpt)
    return { concept_id: 'c1', prompt: `At stage ${i + 1}, which action follows the documented dependency?`, choices: [`Check input ${i + 1} before output ${i + 1}`, `Produce output ${i + 1} before checking input ${i + 1}`, `Skip checking input ${i + 1}`, `Check input ${i + 1} only after producing output ${i + 1}`], correct: 0, explanation: excerpt, reference: { document_id: id, chunk_id: 'section-' + (Math.floor(start / 2000) + 1), page: null, section: Math.floor(start / 2000) + 1, excerpt }, difficulty: i < 4 ? 'easy' : i < 12 ? 'medium' : 'hard', questionType: questionTypes[i % questionTypes.length] }
  })
}
function provider(transform = x => x, reviewValid = true) {
  const calls = []
  return { calls, generate: async (input, format, instruction) => {
    calls.push({ input: JSON.parse(input), instruction, format })
    if (format.properties.sufficient) return { sufficient: true, topics: ['Validation stages'], blueprint: 'Cover each stage', reason: '' }
    if (format.properties.valid) return { valid: reviewValid, reason: reviewValid ? '' : 'Repeated reasoning' }
        const parsed = JSON.parse(input)
    const batch = questions().filter(q => q.difficulty === parsed.batch.difficulty).map(q => ({ ...q, reference: { passage_id: parsed.source.find(p => p.text.includes(q.reference.excerpt))?.passage_id ?? parsed.source.find(p => p.section === q.reference.section).passage_id } }))
    return { questions: transform(batch) }
  } }
}
test('sample source traverses planning, 20-item generation, grounded validation and semantic review; keys move with choices', async () => {
  const p = provider()
  const result = await generateQuiz(source, 'doc', lesson, p.generate)
  assert.equal(result.questions.length, 20)
  checkQuiz(result)
  assert.equal(p.calls.length, 5)
  assert.equal(p.calls[0].input.source.map(c => c.text).join(''), source)
  assert.ok(p.calls.every(c => !('passages' in c.input)), 'source text is supplied only once per call')
  assert.ok(p.calls.filter(c => c.input.batch).every(c => c.input.existingQuestions.every(q => !('reference' in q) && !('explanation' in q))), 'previous evidence text is not retransmitted for duplicate checks')
  assert.equal(p.calls[1].input.concepts[0].id, 'c1')
  const batches = p.calls.filter(c => c.input.batch)
  assert.deepEqual(batches.map(c => c.input.batch), [{ difficulty: 'easy', count: 4 }, { difficulty: 'medium', count: 8 }, { difficulty: 'hard', count: 8 }])
  assert.deepEqual(batches.map(c => c.input.existingQuestions.length), [0,4,12])
  for (const c of batches) assert.deepEqual(c.format.properties.questions.items.properties.difficulty.enum, [c.input.batch.difficulty])
  assert.deepEqual([0,1,2,3].map(key => result.questions.filter(q => q.correct === key).length), [5,5,5,5])
  result.questions.forEach((q, i) => {
    assert.equal(q.choices[q.correct], `Check input ${i + 1} before output ${i + 1}`)
    assert.equal(q.reference.status, 'verified')
    assert.equal(source.slice(q.reference.start, q.reference.end), q.reference.excerpt)
    if (i > 1) assert.ok(q.correct !== result.questions[i-1].correct || q.correct !== result.questions[i-2].correct)
  })
})
test('insufficient source stops before generation', async () => {
  let calls = 0
  await assert.rejects(generateQuiz('TCP is reliable.', 'doc', lesson, async () => { calls++; return { sufficient: false } }), /ไม่เพียงพอ/)
  assert.equal(calls, 1)
})
for (const [name, transform] of [
  ['count', qs => qs.slice(0,-1)],
  ['difficulty', qs => qs.map(q => ({ ...q, difficulty: 'easy' }))],
  ['types', qs => qs.map(q => ({ ...q, questionType: 'concept' }))],
  ['evidence', qs => qs.map(q => ({ ...q, reference: { passage_id: 'invented-passage' } }))],
  ['duplicates', qs => qs.map(q => ({ ...q, prompt: 'SAME?' }))],
  ['key', qs => qs.map(q => ({ ...q, correct: 4 }))],
]) test(`rejects ${name} after bounded repair`, async () => {
  const p = provider(transform)
  await assert.rejects(generateQuiz(source, 'doc', lesson, p.generate), /ตรวจคุณภาพ/)
  assert.ok(p.calls.length <= 9)
  assert.ok(p.calls.some(c => c.input.revision))
})
test('semantic review blocks unsupported or ambiguous questions', async () => {
  const p = provider(x => x, false)
  await assert.rejects(generateQuiz(source, 'doc', lesson, p.generate), /Repeated reasoning/)
  assert.equal(p.calls.length, 9)
})


test('provider schema avoids expanding an exact 20-item nested structure; count remains server validated', () => {
  const array = quizSchema.properties.questions
  assert.equal(array.minItems, undefined)
  assert.equal(array.maxItems, undefined)
  assert.equal(array.items.properties.reference.type, 'object')
  assert.ok(array.items.required.includes('difficulty'))
  assert.ok(array.items.required.includes('questionType'))
})
test('HTTP 400 is reported as a provider request error without a futile quality repair', async () => {
  let calls = 0
  await assert.rejects(generateQuiz(source, 'doc', lesson, async (_, format) => {
    calls++
    if (format.properties.sufficient) return { sufficient: true, topics: ['Stages'], blueprint: 'Cover stages' }
    throw new Error('Gemini HTTP 400: Request contains an invalid argument.')
  }), /^Error: Gemini HTTP 400:/)
  assert.equal(calls, 2)
})





test('server-derived passages verify across PDF pages, chunk boundaries and Thai text', () => {
  const pdf = '[PDF หน้า 1]\n' + 'หลักการตรวจสอบข้อมูลก่อนใช้งาน '.repeat(90) + '\n[PDF หน้า 2]\n' + 'Validate inputs before producing outputs. '.repeat(25)
  const passages = quizPassages(pdf, 'doc')
  assert.ok(passages.length > 3)
  for (const p of passages) {
    assert.ok(pdf.includes(p.text))
    assert.ok(!p.text.includes('[PDF หน้า'))
    const result = validate({ ...lesson, concepts: lesson.concepts.map(c => ({ ...c, id: 'c1' })), questions: [{ ...questions()[0], reference: { document_id: p.document_id, chunk_id: p.chunk_id, section: p.section, page: p.page, excerpt: p.text } }] }, pdf, 'doc')
    assert.equal(result.questions[0].reference.status, 'verified')
    assert.equal(pdf.slice(result.questions[0].reference.start, result.questions[0].reference.end), p.text.trim())
  }
})
test('wire schema asks the model for an existing passage ID, never a copied quotation or fabricated page', () => {
  const reference = quizSchema.properties.questions.items.properties.reference
  assert.deepEqual(reference.required, ['passage_id'])
  assert.deepEqual(Object.keys(reference.properties), ['passage_id'])
})


