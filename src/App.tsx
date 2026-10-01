import { useState } from 'react'

import BottomNav, {
  type Page,
} from './components/layout/BottomNav'

import Welcome from './pages/Welcome'
import Home from './pages/Home'
import LessonsPage from './pages/LessonsPage'
import StudyPlanPage from './pages/StudyPlanPage'
import ProgressPage from './pages/ProgressPage'
import ProfilePage from './pages/ProfilePage'
import AddMaterial from './pages/AddMaterial'
import AISummary from './pages/AISummary'
import QuizPage from './pages/QuizPage'
import QuizResults from './pages/QuizResults'
import WeakTopics from './pages/WeakTopics'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  // เริ่มต้นยังไม่มี Study Material
  const [studyMaterial, setStudyMaterial] = useState<string | null>(null)

  // เก็บ ID ของ Material ที่สร้างใน Supabase
  const [materialId, setMaterialId] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState<Page>('welcome')

  // รับ Text + ID หลังจากบันทึกลง Supabase สำเร็จ
  const handleStudyMaterialSubmit = (
    text: string,
    id: string,
  ) => {
    setStudyMaterial(text)
    setMaterialId(id)
    setCurrentPage('summary')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'welcome':
        return <Welcome onNavigate={setCurrentPage} />

      case 'login':
        return <LoginPage onNavigate={setCurrentPage} />

      case 'register':
        return <RegisterPage onNavigate={setCurrentPage} />

      case 'home':
        return <Home onNavigate={setCurrentPage} />

      case 'lessons':
        return <LessonsPage onNavigate={setCurrentPage} />

      case 'plan':
        return <StudyPlanPage onNavigate={setCurrentPage} />

      case 'progress':
        return <ProgressPage onNavigate={setCurrentPage} />

      case 'profile':
        return <ProfilePage onNavigate={setCurrentPage} />

      case 'add-material':
        return (
          <AddMaterial
            onNavigate={setCurrentPage}
            onSubmit={handleStudyMaterialSubmit}
          />
        )

      case 'summary':
        return (
          <AISummary
            onNavigate={setCurrentPage}
            studyMaterial={studyMaterial}
            materialId={materialId}
          />
        )

      case 'quiz':
        return <QuizPage onNavigate={setCurrentPage} />

      case 'quiz-results':
        return <QuizResults onNavigate={setCurrentPage} />

      case 'weak-topics':
        return <WeakTopics onNavigate={setCurrentPage} />

      case 'study-plan':
        return <StudyPlanPage onNavigate={setCurrentPage} />

      default:
        return <Welcome onNavigate={setCurrentPage} />
    }
  }

  return (
    <div
      className="min-h-screen bg-gray-50 relative mx-auto"
      style={{
        maxWidth: '430px',
        boxShadow: '0 0 60px rgba(0,0,0,0.08)',
      }}
    >
      {renderPage()}

      <BottomNav
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}

export default App