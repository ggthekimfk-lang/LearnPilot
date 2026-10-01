import type { Page } from '../components/layout/BottomNav'
import ProgressBar from '../components/ui/ProgressBar'

interface LessonsPageProps {
  onNavigate: (page: Page) => void
}

interface Lesson {
  title: string
  subtitle: string
  progress: number
  icon: string
  color: string
  topics: number
  completedTopics: number
}

const lessons: Lesson[] = []

function LessonsPage({ onNavigate }: LessonsPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 page-transition">
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-5">
        <h1 className="text-xl font-bold text-gray-900">My Lessons 📚</h1>
        <p className="text-sm text-gray-500 mt-1">Continue learning from your courses.</p>
      </div>

      {/* Lessons List */}
      <div className="px-5 mt-4 space-y-3 stagger-children">
        {lessons.length > 0 ? (
          lessons.map((lesson) => (
            <button
              key={lesson.title}
              id={`lesson-${lesson.title.toLowerCase().replace(/\s/g, '-')}`}
              onClick={() => onNavigate('summary')}
              className="w-full bg-white rounded-2xl p-4 shadow-sm text-left hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${lesson.color}15` }}
                >
                  {lesson.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-800">{lesson.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{lesson.subtitle}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>

              <ProgressBar
                percentage={lesson.progress}
                color={lesson.color}
                height={6}
              />
              <p className="text-[11px] text-gray-400 mt-2">
                {lesson.completedTopics} / {lesson.topics} topics · {lesson.progress}%
              </p>
            </button>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-lg font-bold text-gray-800">ยังไม่มีบทเรียน</h2>
            <p className="text-sm text-gray-500 mt-2">
              เพิ่ม Study Material เพื่อเริ่มสร้างบทเรียนของคุณ
            </p>
            <button
              onClick={() => onNavigate('add-material')}
              className="mt-6 px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl active:scale-[0.98] transition-all"
            >
              เพิ่มเนื้อหาเลย
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default LessonsPage
