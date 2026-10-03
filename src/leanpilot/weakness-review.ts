import type { Result } from './types.ts'

export function assessTopics(result: Result) {
  const topics = new Map<string, { id: string; total: number; mistakes: Result['feedback'] }>()
  const seen = new Set<string>()
  for (const item of result.feedback) {
    if (seen.has(item.question_id)) continue
    seen.add(item.question_id)
    const topic = topics.get(item.concept_id) || { id: item.concept_id, total: 0, mistakes: [] }
    topic.total++
    if (item.selected !== item.correct) topic.mistakes.push(item)
    topics.set(item.concept_id, topic)
  }
  return [...topics.values()].map(topic => {
    const correct = topic.total - topic.mistakes.length
    const status: 'insufficient' | 'strong' | 'review' | 'developing' = topic.total < 3 ? 'insufficient' : correct / topic.total >= .8 ? 'strong' : correct / topic.total < .6 ? 'review' : 'developing'
    return { ...topic, correct, status }
  })
}

export function reviewTopics(result: Result) {
  return assessTopics(result).filter(topic => topic.mistakes.length).sort((a, b) => b.mistakes.length - a.mistakes.length)
}
