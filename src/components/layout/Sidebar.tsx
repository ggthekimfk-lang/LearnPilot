type Page =
    | 'dashboard'
    | 'courses'
    | 'tutor'
    | 'quiz'
    | 'progress'
    | 'settings'
    | 'study'
interface SidebarProps {
    currentPage: Page
    onPageChange: (page: Page) => void
}

const menuItems: { label: string; icon: string; page: Page }[] = [
    { label: 'Dashboard', icon: '🏠', page: 'dashboard' },
    { label: 'My Courses', icon: '📚', page: 'courses' },
    { label: 'AI Tutor', icon: '🤖', page: 'tutor' },
    { label: 'Quiz', icon: '📝', page: 'quiz' },
    { label: 'Progress', icon: '📊', page: 'progress' },
    { label: 'Settings', icon: '⚙️', page: 'settings' },
    { label: 'Add Material', icon: '📄', page: 'study' },
]

function Sidebar({ currentPage, onPageChange }: SidebarProps) {
    return (
        <aside className="w-64 min-h-screen bg-white border-r border-slate-200 p-5">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-blue-600">
                    LearnPilot AI
                </h1>

                <p className="text-xs text-slate-500 mt-1">
                    Smarter Studying
                </p>
            </div>

            <nav className="space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.page}
                        onClick={() => onPageChange(item.page)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${currentPage === item.page
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    )
}

export type { Page }
export default Sidebar