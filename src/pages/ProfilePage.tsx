import type { Page } from '../components/layout/BottomNav'

interface ProfilePageProps {
  onNavigate: (page: Page) => void
}

function ProfilePage({ onNavigate }: ProfilePageProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 page-transition">
      {/* Profile Header */}
      <div className="bg-white px-5 pt-6 pb-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-3 border-primary/20 mb-3">
          <img src="/mascot.jpg" alt="Profile" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">Learner</h2>
        <p className="text-sm text-gray-500">University Student</p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mt-5">
          <div className="text-center">
            <div className="w-12 h-12 bg-danger-light rounded-xl flex items-center justify-center mx-auto mb-1">
              <span className="text-lg">🔥</span>
            </div>
            <p className="text-lg font-bold text-gray-800">7</p>
            <p className="text-[10px] text-gray-500">Day Streak</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-accent-light rounded-xl flex items-center justify-center mx-auto mb-1">
              <span className="text-lg">📋</span>
            </div>
            <p className="text-lg font-bold text-gray-800">3</p>
            <p className="text-[10px] text-gray-500">Completed Plans</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mx-auto mb-1">
              <span className="text-lg">📚</span>
            </div>
            <p className="text-lg font-bold text-gray-800">4</p>
            <p className="text-[10px] text-gray-500">Subjects</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-5 mt-4 space-y-2 stagger-children">
        <button
          id="btn-my-study-plan"
          onClick={() => onNavigate('study-plan')}
          className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B9B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-700 flex-1 text-left">My Study Plan</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          id="btn-my-progress"
          onClick={() => onNavigate('progress')}
          className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E88E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-700 flex-1 text-left">My Progress</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          id="btn-settings"
          className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-700 flex-1 text-left">Settings</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          id="btn-help"
          className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 bg-warning-light rounded-xl flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-700 flex-1 text-left">Help & Support</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default ProfilePage
