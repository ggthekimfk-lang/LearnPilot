import type { Page } from '../components/layout/BottomNav'
import CircularProgress from '../components/ui/CircularProgress'

interface HomeProps {
  onNavigate: (page: Page) => void
}

function Home({ onNavigate }: HomeProps) {
  return (
    <div className="page-transition pb-24">
      {/* Top Header */}
      <div className="bg-white px-5 pt-5 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Hello,</p>
            <h1 className="text-xl font-bold text-gray-900">
              Good morning, Student! 👋
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Let's reach your goal together!
            </p>
          </div>
          <button
            id="btn-profile-avatar"
            onClick={() => onNavigate('profile')}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-colors"
          >
            <img src="/mascot.jpg" alt="Profile" className="w-full h-full object-cover" />
          </button>
        </div>

        {/* Exam Info Card */}
        <div className="mt-4 bg-primary-light rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B9B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Next Exam</p>
            <p className="text-sm font-bold text-gray-800">Computer Networks</p>
            <p className="text-xs text-gray-500">Apr 28, 2025</p>
          </div>
          <div className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
            7 days left
          </div>
        </div>
      </div>

      {/* Study Progress */}
      <div className="px-5 mt-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-800">Study Progress</h3>
          <div className="mt-4 flex items-center gap-5">
            <CircularProgress percentage={42} size={80} strokeWidth={7} label="3 / 7 topics completed" />
            <div className="flex-1 text-sm text-gray-500">
              <p className="font-semibold text-gray-700">3 / 7 topics completed</p>
              <p className="mt-1 text-xs">Keep it up! You're making progress.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mt-5">
        <div className="grid grid-cols-3 gap-3">
          <button
            id="btn-upload-material"
            onClick={() => onNavigate('add-material')}
            className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm hover:shadow-md active:scale-[0.97] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E88E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center leading-tight">Upload Learning Material</span>
          </button>

          <button
            id="btn-ai-summary"
            onClick={() => onNavigate('summary')}
            className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm hover:shadow-md active:scale-[0.97] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B9B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center leading-tight">AI Summary</span>
          </button>

          <button
            id="btn-take-quiz"
            onClick={() => onNavigate('quiz')}
            className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm hover:shadow-md active:scale-[0.97] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-warning-light flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center leading-tight">Take Quiz</span>
          </button>
        </div>
      </div>

      {/* Today's Study Plan */}
      <div className="px-5 mt-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800">Today's Study Plan</h3>
            <button className="text-xs font-semibold text-primary hover:underline">View All</button>
          </div>

          <div className="space-y-3 stagger-children">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Computer Networks - Layer 3</p>
              </div>
              <span className="text-xs text-gray-400">45 min</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Quiz Layer 1 - 2</p>
              </div>
              <span className="text-xs text-gray-400">20 min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
