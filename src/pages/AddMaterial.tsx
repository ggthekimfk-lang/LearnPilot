import type { Page } from '../components/layout/BottomNav'
import PageHeader from '../components/layout/PageHeader'

interface AddMaterialProps {
  onNavigate: (page: Page) => void
}

function AddMaterial({ onNavigate }: AddMaterialProps) {
  return (
    <div className="min-h-screen bg-white page-transition">
      <PageHeader title="Add Learning Material" onBack={() => onNavigate('home')} />

      {/* Description */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <img src="/mascot.jpg" alt="Mascot" className="w-12 h-12 rounded-full" />
          <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-sm p-3">
            <p className="text-sm text-gray-600">
              Upload your notes or paste the content. I'll take care of the rest!
            </p>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="px-5 space-y-3 stagger-children">
        {/* Upload PDF */}
        <button
          id="btn-upload-pdf"
          className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <div className="w-12 h-12 bg-danger-light rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-800">Upload PDF</p>
            <p className="text-xs text-gray-500 mt-0.5">From your device</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Paste Text */}
        <button
          id="btn-paste-text"
          className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <div className="w-12 h-12 bg-accent-light rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E88E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-800">Paste Text</p>
            <p className="text-xs text-gray-500 mt-0.5">From notes or document</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Take Photo */}
        <button
          id="btn-take-photo"
          className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0B9B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-800">Take Photo</p>
            <p className="text-xs text-gray-500 mt-0.5">From your notes</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default AddMaterial
