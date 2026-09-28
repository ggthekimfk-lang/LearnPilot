import type { Page } from '../components/layout/BottomNav'
import PageHeader from '../components/layout/PageHeader'
import ProgressBar from '../components/ui/ProgressBar'

interface WeakTopicsProps {
  onNavigate: (page: Page) => void
}

const weakTopics = [
  { name: 'Transport Layer', percentage: 45, priority: 'High Priority', priorityColor: '#EF4444', priorityBg: '#FEF2F2', barColor: '#EF4444' },
  { name: 'Network Layer', percentage: 70, priority: 'Medium', priorityColor: '#F59E0B', priorityBg: '#FFFBEB', barColor: '#F59E0B' },
  { name: 'Application Layer', percentage: 80, priority: 'Good', priorityColor: '#22C55E', priorityBg: '#F0FDF4', barColor: '#22C55E' },
  { name: 'Physical Layer', percentage: 90, priority: 'Good', priorityColor: '#22C55E', priorityBg: '#F0FDF4', barColor: '#22C55E' },
]

function WeakTopics({ onNavigate }: WeakTopicsProps) {
  return (
    <div className="min-h-screen bg-gray-50 page-transition">
      <PageHeader title="Weak Topics" onBack={() => onNavigate('quiz-results')} />

      {/* Info Card */}
      <div className="px-5 mt-4">
        <div className="bg-accent-light rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E88E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Based on your quiz results, these topics need more practice.
          </p>
        </div>
      </div>

      {/* Topics List */}
      <div className="px-5 mt-5 space-y-3 stagger-children">
        {weakTopics.map((topic) => (
          <div key={topic.name} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-800">{topic.name}</span>
              <span
                className="text-[11px] font-semibold px-3 py-1 rounded-full"
                style={{ color: topic.priorityColor, backgroundColor: topic.priorityBg }}
              >
                {topic.priority}
              </span>
            </div>
            <ProgressBar
              percentage={topic.percentage}
              color={topic.barColor}
              height={8}
              showLabel={false}
            />
            <p className="text-xs text-gray-400 mt-2 text-right">{topic.percentage}%</p>
          </div>
        ))}
      </div>

      {/* Tip */}
      <div className="px-5 mt-6 pb-8">
        <div className="bg-primary-light rounded-2xl p-4 flex items-start gap-3">
          <span className="text-lg">💡</span>
          <p className="text-sm text-gray-600">
            Focus on weak topics to improve your overall score!
          </p>
        </div>
      </div>
    </div>
  )
}

export default WeakTopics
