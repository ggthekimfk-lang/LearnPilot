import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validate, chunks } from '../supabase/functions/analyze-content/validation.ts'
const source = 'TCP provides reliable transport. UDP is connectionless.'.repeat(5)
const reference = { section: 1, excerpt: 'TCP provides reliable transport.' }
const good = () => ({ summary: { overview: 'TCP', references: [reference], points: [{ text: 'Reliable', references: [reference] }] },
  concepts: [{ id: 'c1', name: 'TCP', description: 'Reliable transport', references: [reference] }],
  questions: [{ concept_id: 'c1', prompt: 'Which transport is reliable?', choices: ['TCP', 'UDP', 'Neither', 'Both'], correct: 0, explanation: 'TCP is reliable.', reference }] })
test('chunks are stable and valid grounded output passes', () => { assert.equal(chunks('x'.repeat(4001)).length, 3); assert.deepEqual(validate(good(), source), good()) })
test('fabricated excerpt or wrong section is rejected', () => { const a=good(); a.questions[0].reference={ section: 2, excerpt: 'Invented evidence' }; assert.throws(() => validate(a,source), /Reference/) })
test('duplicate choices, duplicate questions, orphan concepts and invalid answer keys are rejected', () => {
  for (const mutate of [a => a.questions[0].choices[1]='TCP', a => a.questions.push(a.questions[0]), a => a.questions[0].concept_id='c9', a => a.questions[0].correct=4]) { const a=good(); mutate(a); assert.throws(() => validate(a,source)) }
})
test('missing summary evidence and empty output are rejected', () => { const a=good(); a.summary.references=[]; assert.throws(() => validate(a,source)); assert.throws(() => validate({},source)) })
