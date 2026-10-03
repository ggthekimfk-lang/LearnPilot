import test from 'node:test'
import assert from 'node:assert/strict'
import { recoverAnswers, answersDiffer } from '../src/leanpilot/quiz-draft.ts'
const questions = [{ id: 'q1', choices: ['A','B','C','D'] }, { id: 'q2', choices: ['A','B'] }]
test('failed saves survive reopening and only valid selections for this attempt are restored', () => {
  const restored = recoverAnswers(JSON.stringify({ q1: 2, q2: 1, other: 0 }), { q1: 0 }, questions)
  assert.deepEqual(restored, { q1: 2, q2: 1 })
  assert.equal(answersDiffer(restored, { q1: 0 }), true)
  assert.equal(answersDiffer(restored, { q2: 1, q1: 2 }), false)
})
test('malformed or out-of-range cached answers cannot replace server selections', () => {
  for (const raw of ['broken', 'null', '[]', '{"q1":-1,"q2":2}', '{"q1":"1","q2":0.5}']) {
    assert.deepEqual(recoverAnswers(raw, { q1: 0 }, questions), { q1: 0 })
  }
})
