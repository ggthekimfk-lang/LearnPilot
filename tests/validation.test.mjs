import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validate, chunks, sourceChunks, schema } from '../supabase/functions/analyze-content/validation.ts'
const passage = 'TCP provides reliable transport.'
function good(excerpt = passage, section = 1) {
  const ref = () => ({ section, excerpt })
  return { summary: { overview: 'TCP', references: [ref()], points: [{ text: 'Reliable', references: [ref()] }] }, concepts: [{ id: 'c1', name: 'TCP', description: 'Reliable transport', references: [ref()] }], questions: [{ concept_id: 'c1', prompt: 'Which transport is reliable?', choices: ['TCP', 'UDP', 'Neither', 'Both'], correct: 0, explanation: 'TCP is reliable.', reference: ref() }] }
}
function verified(source, quote = passage, section = 1) {
  const input = good(quote, section)
  const result = validate(input, source)
  const r = result.summary.references[0]
  assert.equal(r.status, 'verified')
  assert.equal(source.slice(r.start, r.end), r.excerpt)
  assert.equal(result.summary.verification_warnings.length, 0)
  assert.equal(input.summary.references[0].status, undefined, 'does not mutate AI output')
  return r
}
test('1 quote within one chunk', () => { verified(passage); assert.equal(chunks('x'.repeat(4001)).length, 3) })
test('2 quote at end of chunk', () => verified('x'.repeat(2000 - passage.length) + passage))
test('3 quote at beginning of next chunk found from neighbor', () => assert.equal(verified('x'.repeat(2000) + passage).section, 2))
test('4 quote spans two chunks, including a split inside a word', () => {
  const r = verified('x'.repeat(1990) + passage)
  assert.equal(r.section, 1); assert.equal(r.end_section, 2)
  verified('x'.repeat(1990) + passage, passage, 2)
})
test('5 PDF line break in sentence', () => verified('TCP provides\nreliable transport.'))
test('6 whitespace variants', () => verified('TCP\u00a0  provides\r\nreliable\ttransport.'))
test('7 fabricated quotation stays unverified', () => {
  const result = validate(good('Invented evidence'), passage)
  assert.equal(result.summary.references[0].status, 'unverified')
  assert.equal(result.summary.references[0].start, undefined)
  assert.ok(result.summary.verification_warnings.length)
})
test('8 one invalid reference does not fail remaining analysis', () => {
  const a = good(); a.summary.references.push({ section: 1, excerpt: 'Invented evidence' })
  const result = validate(a, passage)
  assert.equal(result.summary.references[0].status, 'verified')
  assert.equal(result.summary.references[1].status, 'unverified')
  assert.equal(result.questions[0].reference.status, 'verified')
  assert.equal(result.summary.verification_warnings.length, 1)
})
test('9 Thai PDF Unicode and cross chunk', () => {
  const quote = 'การเรียนรู้ต้องใช้หลักฐานจากต้นฉบับ'
  verified('[PDF หน้า 1]\n' + 'ก'.repeat(1980) + quote, quote)
  verified('การเรียนรู้\nต้องใช้หลักฐานจากต้นฉบับ', 'การเรียนรู้ ต้องใช้หลักฐานจากต้นฉบับ')
})
test('10 English PDF and Unicode NFC with source offsets', () => {
  verified('[PDF หน้า 1]\n' + passage)
  const r = verified('A cafe\u0301 has reliable transport.', 'A café has reliable transport.')
  assert.equal(r.excerpt, 'A cafe\u0301 has reliable transport.')
})
test('invalid IDs/pages are never repaired into trusted references', () => {
  for (const overrides of [{ document_id: 'fake' }, { chunk_id: 'fake' }, { page: 99 }, { section: 99 }]) {
    const a = good(); const meta = sourceChunks(passage, 'doc')[0]
    a.summary.references[0] = { ...a.summary.references[0], document_id: 'doc', chunk_id: meta.chunk_id, page: meta.page, ...overrides }
    const r = validate(a, passage, 'doc').summary.references[0]
    assert.equal(r.status, 'unverified')
  }
  const a = good(); for (const r of [a.summary.references[0], a.summary.points[0].references[0], a.concepts[0].references[0], a.questions[0].reference]) Object.assign(r, { document_id: 'doc', chunk_id: 'section-1', page: null })
  assert.equal(validate(a, passage, 'doc').summary.references[0].status, 'verified')
  assert.ok(schema.properties.summary.properties.references.items.required.includes('document_id'))
})
test('changed facts, punctuation, list markers and remote sections are unverified', () => {
  for (const quote of ['TCP provides unreliable transport.', 'TCP provides reliable transport!', 'TCP provides transport.', 'TCP provides reliable transport. invented']) assert.equal(validate(good(quote), passage).summary.references[0].status, 'unverified')
  assert.equal(validate(good(), 'x'.repeat(4000) + passage).summary.references[0].status, 'unverified')
  assert.equal(validate(good('Chapter goal: Learn networking'), 'Chapter goal:\n▪ Learn networking').summary.references[0].status, 'unverified')
})
test('missing evidence warns; invalid analysis and malformed questions still fail', () => {
  const a = good(); a.summary.references = []
  assert.equal(validate(a, passage).summary.verification_warnings.length, 1)
  assert.throws(() => validate({}, passage), /Invalid analysis/)
  for (const mutate of [a => a.questions[0].choices[1] = 'TCP', a => a.questions.push(a.questions[0]), a => a.questions[0].concept_id = 'c9', a => a.questions[0].correct = 4]) { const a = good(); mutate(a); assert.throws(() => validate(a, passage)) }
})
test('declared occurrence wins over repeated neighbor; ambiguous neighbors warn', () => {
  assert.equal(verified(passage.padEnd(2000, 'x') + passage, passage, 2).section, 2)
  const text = passage.padEnd(2000, 'x') + 'x'.repeat(2000) + passage
  assert.equal(validate(good(passage, 2), text).summary.references[0].status, 'unverified')
})

test('malformed references are warnings and synthetic page markers are not evidence', () => {
  const a = good(); a.questions[0].reference = null
  assert.equal(validate(a, passage).questions[0].reference.status, 'unverified')
  const b = good(); delete b.summary.references
  assert.deepEqual(validate(b, passage).summary.references, [])
  assert.equal(validate(good('[PDF หน้า 1]'), '[PDF หน้า 1]\n' + passage).summary.references[0].status, 'unverified')
})


test('reported garbled overview quote on a 50-section source warns without rejecting the lesson', () => {
  const source = passage.padEnd(2000, ' ') + 'Lesson content. '.repeat(6400).slice(0, 98000);
  assert.equal(chunks(source).length, 50);
  const input = good();
  input.questions = [];
  input.summary.references = [{ section: 1, excerpt: 'I am doing = d:14,11-4,111-n_nlalu-iladnlaEj five-) mln7vilnfil49', document_id: 'doc', chunk_id: 'section-1', page: null }];
  const result = validate(input, source, 'doc', 'summary');
  assert.equal(result.summary.overview, 'TCP');
  assert.equal(result.summary.references[0].status, 'unverified');
  assert.ok(result.summary.verification_warnings.some(w => w.location === 'สรุปภาพรวม อ้างอิง 1'));
  assert.equal(result.summary.references[0].start, undefined);
});
