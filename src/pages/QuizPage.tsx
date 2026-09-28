import { useState } from 'react'
import type { Page } from '../components/layout/BottomNav'
import PageHeader from '../components/layout/PageHeader'

interface QuizPageProps {
  onNavigate: (page: Page) => void
}

interface Question {
  question: string
  options: string[]
  answer: number
}

const questions: Question[] = [
  {
    question: 'Which layer of the OSI model is responsible for end-to-end communication?',
    options: ['A. Physical Layer', 'B. Network Layer', 'C. Transport Layer', 'D. Data Link Layer'],
    answer: 2,
  },
  {
    question: 'What protocol is used for reliable data transmission?',
    options: ['A. UDP', 'B. TCP', 'C. ICMP', 'D. ARP'],
    answer: 1,
  },
  {
    question: 'Which device operates at Layer 3 of the OSI model?',
    options: ['A. Hub', 'B. Switch', 'C. Router', 'D. Repeater'],
    answer: 2,
  },
  {
    question: 'What is the purpose of DNS?',
    options: [
      'A. Encrypt data',
      'B. Translate domain names to IP',
      'C. Route packets',
      'D. Compress files',
    ],
    answer: 1,
  },
  {
    question: 'Which protocol operates at the Application layer?',
    options: ['A. TCP', 'B. IP', 'C. HTTP', 'D. Ethernet'],
    answer: 2,
  },
  {
    question: 'What does ARP stand for?',
    options: [
      'A. Application Resolution Protocol',
      'B. Address Resolution Protocol',
      'C. Automated Routing Protocol',
      'D. Advanced Resource Protocol',
    ],
    answer: 1,
  },
  {
    question: 'Which layer handles data compression and encryption?',
    options: ['A. Session', 'B. Transport', 'C. Presentation', 'D. Application'],
    answer: 2,
  },
  {
    question: 'What is the default subnet mask for Class C?',
    options: ['A. 255.0.0.0', 'B. 255.255.0.0', 'C. 255.255.255.0', 'D. 255.255.255.255'],
    answer: 2,
  },
  {
    question: 'Which protocol is connectionless?',
    options: ['A. TCP', 'B. FTP', 'C. UDP', 'D. SMTP'],
    answer: 2,
  },
  {
    question: 'How many layers does the OSI model have?',
    options: ['A. 4', 'B. 5', 'C. 6', 'D. 7'],
    answer: 3,
  },
]

function QuizPage({ onNavigate }: QuizPageProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  const handleAnswer = (index: number) => {
    if (showFeedback) return
    setSelectedAnswer(index)
    setShowFeedback(true)
  }

  const handleNext = () => {
    if (currentQuestion === questions.length - 1) {
      onNavigate('quiz-results')
      return
    }
    setCurrentQuestion((prev) => prev + 1)
    setSelectedAnswer(null)
    setShowFeedback(false)
  }

  return (
    <div className="min-h-screen bg-white page-transition">
      <PageHeader
        title="Quiz"
        onBack={() => onNavigate('home')}
        rightElement={
          <span className="text-xs font-semibold text-gray-500">
            {currentQuestion + 1} / {questions.length}
          </span>
        }
      />

      {/* Progress Bar */}
      <div className="px-5 py-2">
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="px-5 py-4">
        <h2 className="text-base font-bold text-gray-800 leading-relaxed">
          {currentQuestion + 1}. {question.question}
        </h2>
      </div>

      {/* Options */}
      <div className="px-5 space-y-3 stagger-children">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index
          const isCorrect = index === question.answer

          let bgColor = 'bg-white'
          let borderColor = 'border-gray-200'
          let textColor = 'text-gray-700'
          let radioColor = 'border-gray-300'

          if (showFeedback) {
            if (isCorrect) {
              bgColor = 'bg-primary-light'
              borderColor = 'border-primary'
              textColor = 'text-primary-dark'
              radioColor = 'border-primary bg-primary'
            } else if (isSelected && !isCorrect) {
              bgColor = 'bg-danger-light'
              borderColor = 'border-danger'
              textColor = 'text-danger'
              radioColor = 'border-danger'
            } else {
              bgColor = 'bg-white'
              borderColor = 'border-gray-100'
              textColor = 'text-gray-400'
            }
          } else if (isSelected) {
            bgColor = 'bg-primary-light'
            borderColor = 'border-primary'
            textColor = 'text-primary-dark'
            radioColor = 'border-primary'
          }

          return (
            <button
              key={index}
              id={`quiz-option-${index}`}
              onClick={() => handleAnswer(index)}
              disabled={showFeedback}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 ${bgColor} ${borderColor} transition-all duration-200 ${
                !showFeedback ? 'hover:border-primary/50 hover:bg-primary-light/50 active:scale-[0.98]' : ''
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${radioColor}`}>
                {showFeedback && isCorrect && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className={`text-sm font-medium ${textColor} text-left`}>{option}</span>
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className="px-5 mt-4 animate-slideUp">
          {selectedAnswer === question.answer ? (
            <div className="bg-primary-light rounded-2xl p-4 flex items-center gap-3">
              <span className="text-lg">🎉</span>
              <p className="text-sm font-semibold text-primary">You got this!</p>
            </div>
          ) : (
            <div className="bg-danger-light rounded-2xl p-4 flex items-center gap-3">
              <span className="text-lg">💡</span>
              <p className="text-sm font-semibold text-danger">
                The correct answer is {question.options[question.answer]}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Next Button */}
      {showFeedback && (
        <div className="px-5 mt-5 pb-8 animate-slideUp">
          <button
            id="btn-quiz-next"
            onClick={handleNext}
            className="w-full py-4 bg-primary text-white font-bold text-sm rounded-2xl shadow-lg hover:bg-primary-dark active:scale-[0.98] transition-all"
            style={{ boxShadow: '0 6px 20px rgba(11, 155, 107, 0.25)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default QuizPage
