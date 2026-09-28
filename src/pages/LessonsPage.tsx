import type { Page } from '../components/layout/BottomNav'
import ProgressBar from '../components/ui/ProgressBar'

interface LessonsPageProps {
  onNavigate: (page: Page) => void
}

const lessons = [
  {
    title: 'Computer Networks',
    subtitle: 'OSI Model & TCP/IP',
    progress: 42,
    icon: '🌐',
    color: '#0B9B6B',
    topics: 7,
    completedTopics: 3,
  },
  {
    title: 'Database Systems',
    subtitle: 'SQL & Normalization',
    progress: 70,
    icon: '🗄️',
    color: '#1E88E5',
    topics: 5,
    completedTopics: 3,
  },
  {
    title: 'Web Development',
    subtitle: 'HTML, CSS & JavaScript',
    progress: 30,
    icon: '🌍',
    color: '#F59E0B',
    topics: 8,
    completedTopics: 2,
  },
  {
    title: 'Data Structures',
    subtitle: 'Arrays, Trees & Graphs',
    progress: 0,
    icon: '📊',
    color: '#8B5CF6',
    topics: 6,
    completedTopics: 0,
  },
]

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
        {lessons.map((lesson) => (
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
        ))}
      </div>
    </div>
  )
}

export default LessonsPage
