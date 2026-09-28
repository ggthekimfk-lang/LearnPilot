import type { Page } from '../components/layout/BottomNav'
import PageHeader from '../components/layout/PageHeader'
import CircularProgress from '../components/ui/CircularProgress'
import ProgressBar from '../components/ui/ProgressBar'

interface ProgressPageProps {
  onNavigate: (page: Page) => void
}

const subjects = [
  { name: 'Computer Networks', percentage: 42, color: '#0B9B6B' },
  { name: 'Database Systems', percentage: 70, color: '#1E88E5' },
  { name: 'Web Development', percentage: 30, color: '#F59E0B' },
  { name: 'Data Structures', percentage: 0, color: '#94A3B8' },
]

function ProgressPage({ onNavigate }: ProgressPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 page-transition">
      <PageHeader title="My Progress" onBack={() => onNavigate('home')} />

      {/* Overall Progress */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">Overall Progress</h3>
          <div className="flex justify-center mb-3">
            <CircularProgress
              percentage={42}
              size={110}
              strokeWidth={9}
              color="#0B9B6B"
              bgColor="#E2E8F0"
              label="3 / 7 topics completed"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">3 / 7 topics completed</p>
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="px-5 mt-5">
        <h3 className="text-base font-bold text-gray-800 mb-3">Subject Breakdown</h3>

        <div className="space-y-3 stagger-children">
          {subjects.map((subject) => (
            <div key={subject.name} className="bg-white rounded-2xl p-4 shadow-sm">
              <ProgressBar
                percentage={subject.percentage}
                color={subject.color}
                height={8}
                showLabel
                label={subject.name}
                labelRight={`${subject.percentage}%`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProgressPage
