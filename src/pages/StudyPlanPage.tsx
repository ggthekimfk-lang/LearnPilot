import type { Page } from '../components/layout/BottomNav'
import PageHeader from '../components/layout/PageHeader'

interface StudyPlanPageProps {
  onNavigate: (page: Page) => void
}

function StudyPlanPage({ onNavigate }: StudyPlanPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 page-transition">
      <PageHeader title="Study Plan" onBack={() => onNavigate('home')} />

      {/* Personalized Study Plan Card */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B9B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Personalized Study Plan</h2>
              <p className="text-xs text-gray-500 mt-1">
                Based on your weak topics, exam date, and available time.
              </p>
            </div>
          </div>

          {/* Exam Date */}
          <div className="mt-4 bg-warning-light rounded-xl p-3 flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div>
              <p className="text-xs text-gray-500">Exam Date</p>
              <p className="text-sm font-bold text-gray-800">Apr 28, 2025 (7 days left)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="px-5 mt-5">
        <h3 className="text-base font-bold text-gray-800 mb-3">Today's Tasks</h3>

        <div className="space-y-3 stagger-children">
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B9B6B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Review Transport Layer (Theory)</p>
            </div>
            <span className="text-xs text-gray-400 font-medium">30 min</span>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B9B6B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Practice Quiz (Layer 3)</p>
            </div>
            <span className="text-xs text-gray-400 font-medium">20 min</span>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B9B6B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Review Network Layer (Notes)</p>
            </div>
            <span className="text-xs text-gray-400 font-medium">25 min</span>
          </div>
        </div>
      </div>

      {/* View Full Plan Button */}
      <div className="px-5 mt-6">
        <button
          id="btn-view-full-plan"
          className="w-full py-4 bg-primary text-white font-bold text-sm rounded-2xl shadow-lg hover:bg-primary-dark active:scale-[0.98] transition-all"
          style={{ boxShadow: '0 6px 20px rgba(11, 155, 107, 0.25)' }}
        >
          View Full Plan
        </button>
      </div>
    </div>
  )
}

export default StudyPlanPage
