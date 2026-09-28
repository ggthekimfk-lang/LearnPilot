import type { Page } from '../components/layout/BottomNav'
import CircularProgress from '../components/ui/CircularProgress'

interface QuizResultsProps {
  onNavigate: (page: Page) => void
}

function QuizResults({ onNavigate }: QuizResultsProps) {
  const score = 8
  const total = 10
  const percentage = Math.round((score / total) * 100)

  return (
    <div className="min-h-screen bg-white page-transition">
      {/* Header */}
      <div className="flex items-center px-5 py-4">
        <button
          onClick={() => onNavigate('home')}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-gray-800">Quiz Results</h1>
        <div className="w-9" />
      </div>

      {/* Results Card */}
      <div className="px-5 mt-4">
        <div className="bg-gradient-to-br from-primary-light to-primary-50 rounded-3xl p-8 text-center animate-scaleIn">
          <div className="inline-block bg-primary text-white text-lg font-black px-6 py-2 rounded-2xl mb-6 shadow-lg"
            style={{ boxShadow: '0 6px 20px rgba(11, 155, 107, 0.3)' }}
          >
            Great Job!
          </div>

          <div className="flex justify-center mb-4">
            <CircularProgress
              percentage={percentage}
              size={120}
              strokeWidth={10}
              color="#0B9B6B"
              bgColor="#D1FAE5"
            />
          </div>

          <p className="text-sm text-gray-600 mt-2">
            <span className="font-bold text-gray-800">{score}</span> / {total} correct
          </p>
        </div>
      </div>

      {/* View Details */}
      <div className="px-5 mt-5">
        <button
          id="btn-view-details"
          onClick={() => onNavigate('weak-topics')}
          className="w-full text-center text-sm font-semibold text-primary py-3 hover:underline transition"
        >
          View Details
        </button>
      </div>

      {/* Continue Button */}
      <div className="px-5 mt-3 pb-8">
        <button
          id="btn-results-continue"
          onClick={() => onNavigate('weak-topics')}
          className="w-full py-4 bg-primary text-white font-bold text-sm rounded-2xl shadow-lg hover:bg-primary-dark active:scale-[0.98] transition-all"
          style={{ boxShadow: '0 6px 20px rgba(11, 155, 107, 0.25)' }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default QuizResults
