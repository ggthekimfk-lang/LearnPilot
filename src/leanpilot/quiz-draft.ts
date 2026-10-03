type Answers = Record<string, number>
export const draftKey = (user: string, attempt: string) => `leanpilot:${user}:quiz-draft:${attempt}`

export function recoverAnswers(raw: string | null, server: Answers, questions: { id: string; choices: string[] }[]): Answers {
  try {
    const local: unknown = JSON.parse(raw || 'null')
    if (!local || typeof local !== 'object' || Array.isArray(local)) return server
    const answers = { ...server }
    for (const q of questions) {
      const value = (local as Answers)[q.id]
      if (Number.isInteger(value) && value >= 0 && value < q.choices.length) answers[q.id] = value
    }
    return answers
  } catch { return server }
}

export function answersDiffer(a: Answers, b: Answers) {
  return Object.keys(a).length !== Object.keys(b).length || Object.keys(a).some(id => a[id] !== b[id])
}

export function allowQuizNavigation() {
  return window.dispatchEvent(new Event('leanpilot:before-navigate', { cancelable: true }))
}
