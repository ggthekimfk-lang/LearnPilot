import { useState } from 'react'

interface QuizProps {
    studyText: string
}

interface Question {
    question: string
    options: string[]
    answer: number
}

const questions: Question[] = [
    {
        question: 'What is 12 × 8?',
        options: ['86', '96', '108', '112'],
        answer: 1,
    },
    {
        question: 'What is 15 × 4?',
        options: ['50', '55', '60', '65'],
        answer: 2,
    },
    {
        question: 'What is 100 ÷ 5?',
        options: ['10', '15', '20', '25'],
        answer: 2,
    },
    {
        question: 'What is 9 × 7?',
        options: ['56', '63', '72', '81'],
        answer: 1,
    },
    {
        question: 'What is 50 + 25?',
        options: ['65', '70', '75', '80'],
        answer: 2,
    },
]

function Quiz({ studyText }: QuizProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [score, setScore] = useState(0)
    const [finished, setFinished] = useState(false)

    const question = questions[currentQuestion]

    const handleAnswer = (index: number) => {
        if (selectedAnswer !== null) return

        setSelectedAnswer(index)

        if (index === question.answer) {
            setScore((prev) => prev + 1)
        }
    }

    const handleNext = () => {
        if (selectedAnswer === null) return

        if (currentQuestion === questions.length - 1) {
            setFinished(true)
            return
        }

        setCurrentQuestion((prev) => prev + 1)
        setSelectedAnswer(null)
    }

    const handleRestart = () => {
        setCurrentQuestion(0)
        setSelectedAnswer(null)
        setScore(0)
        setFinished(false)
    }

    if (finished) {
        return (
            <main className="flex-1 p-8">
                <div className="max-w-3xl">
                    <div className="rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-200">
                        <div className="text-5xl">🎉</div>

                        <h2 className="mt-4 text-3xl font-bold text-slate-900">
                            Quiz Complete!
                        </h2>

                        <p className="mt-3 text-slate-500">
                            คุณได้คะแนน
                        </p>

                        <p className="mt-2 text-5xl font-bold text-blue-600">
                            {score} / {questions.length}
                        </p>

                        <button
                            onClick={handleRestart}
                            className="mt-8 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="flex-1 p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">
                    Quiz 📝
                </h2>

                <p className="mt-2 text-slate-500">
                    Test your knowledge and improve your skills.
                </p>
            </div>

            {/* Study Material */}
            <div className="mb-6 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">
                    📚 Study Material
                </h3>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="whitespace-pre-wrap text-slate-700">
                        {studyText || 'ยังไม่มี Study Material'}
                    </p>
                </div>
            </div>

            {/* Quiz Card */}
            <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        Question {currentQuestion + 1} of {questions.length}
                    </span>

                    <span className="text-sm font-medium text-blue-600">
                        Mathematics
                    </span>
                </div>

                <h3 className="mt-6 text-xl font-bold text-slate-900">
                    {question.question}
                </h3>

                <div className="mt-6 grid gap-3">
                    {question.options.map((option, index) => {
                        const isSelected = selectedAnswer === index
                        const isCorrect = index === question.answer

                        let className =
                            'w-full rounded-xl border p-4 text-left transition '

                        if (selectedAnswer === null) {
                            className +=
                                'border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                        } else if (isCorrect) {
                            className +=
                                'border-green-500 bg-green-50 text-green-700'
                        } else if (isSelected) {
                            className +=
                                'border-red-500 bg-red-50 text-red-700'
                        } else {
                            className +=
                                'border-slate-200 opacity-60'
                        }

                        return (
                            <button
                                key={option}
                                onClick={() => handleAnswer(index)}
                                className={className}
                            >
                                {String.fromCharCode(65 + index)}. {option}
                            </button>
                        )
                    })}
                </div>

                {selectedAnswer !== null && (
                    <div className="mt-5 rounded-xl bg-slate-50 p-4">
                        {selectedAnswer === question.answer ? (
                            <p className="font-medium text-green-600">
                                ✅ ถูกต้อง!
                            </p>
                        ) : (
                            <p className="font-medium text-red-600">
                                ❌ ยังไม่ถูก
                            </p>
                        )}
                    </div>
                )}

                <button
                    onClick={handleNext}
                    disabled={selectedAnswer === null}
                    className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {currentQuestion === questions.length - 1
                        ? 'Finish Quiz'
                        : 'Next Question →'}
                </button>
            </div>
        </main>
    )
}

export default Quiz