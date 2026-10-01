import type { Page } from '../components/layout/BottomNav'
import PageHeader from '../components/layout/PageHeader'
import CircularProgress from '../components/ui/CircularProgress'
import ProgressBar from '../components/ui/ProgressBar'

interface ProgressPageProps {
  onNavigate: (page: Page) => void
}

const subjects: { name: string; percentage: number; color: string }[] = []

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
              percentage={0}
              size={110}
              strokeWidth={9}
              color="#0B9B6B"
              bgColor="#E2E8F0"
              label="0 / 0 topics completed"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">0 / 0 topics completed</p>
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="px-5 mt-5">
        <h3 className="text-base font-bold text-gray-800 mb-3">Subject Breakdown</h3>

        {subjects.length > 0 ? (
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
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-base font-bold text-gray-800">ยังไม่มีข้อมูล Progress</h2>
            <p className="text-sm text-gray-500 mt-2">
              เริ่มเรียนเพื่อติดตามความคืบหน้าของคุณ
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressPage
