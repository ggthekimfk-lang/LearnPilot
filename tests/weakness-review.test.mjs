import test from 'node:test'
import assert from 'node:assert/strict'
import { reviewTopics } from '../src/leanpilot/weakness-review.ts'
const item = (id, concept, selected = 1) => ({ question_id: id, concept_id: concept, selected, correct: 0 })
test('review groups actual mistakes, counts correct answers and ignores duplicate evidence', () => {
  const topics = reviewTopics({ feedback: [item('1','a'), item('2','a',0), item('3','b'), item('4','b'), item('4','b'), item('5','c',0)] })
  assert.deepEqual(topics.map(t => [t.id, t.total, t.mistakes.length]), [['b',2,2], ['a',2,1]])
})
test('perfect and withdrawn-empty results do not invent weak topics', () => {
  assert.deepEqual(reviewTopics({ feedback: [item('1','a',0)] }), [])
  assert.deepEqual(reviewTopics({ feedback: [] }), [])
})

test('strength assessment respects sample size and exact 60/80 percent boundaries', async () => {
  const { assessTopics } = await import('../src/leanpilot/weakness-review.ts')
  const feedback = [
    ...Array.from({length:5}, (_,i) => item('s'+i,'strong',i<4?0:1)),
    ...Array.from({length:5}, (_,i) => item('d'+i,'developing',i<3?0:1)),
    ...Array.from({length:5}, (_,i) => item('w'+i,'weak',i<2?0:1)),
    item('n1','small',0),item('n2','small',0)
  ]
  assert.deepEqual(assessTopics({feedback}).map(t => [t.id,t.correct,t.status]), [
    ['strong',4,'strong'],['developing',3,'developing'],['weak',2,'review'],['small',2,'insufficient']
  ])
})
