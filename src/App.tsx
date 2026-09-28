import { useState } from 'react'

import Sidebar, { type Page } from './components/layout/Sidebar'

import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import AITutor from './pages/AITutor'
import Quiz from './pages/Quiz'
import Progress from './pages/Progress'
import Settings from './pages/Settings'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />

      case 'courses':
        return <Courses />

      case 'tutor':
        return <AITutor />

      case 'quiz':
        return <Quiz />

      case 'progress':
        return <Progress />

      case 'settings':
        return <Settings />

      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {renderPage()}
    </div>
  )
}

export default App