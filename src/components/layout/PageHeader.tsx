interface PageHeaderProps {
  title: string
  onBack?: () => void
  rightElement?: React.ReactNode
}

function PageHeader({ title, onBack, rightElement }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      {onBack ? (
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-1"
          id="btn-back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      ) : (
        <div className="w-9" />
      )}
      
      <h1 className="text-base font-bold text-gray-800 absolute left-1/2 -translate-x-1/2">
        {title}
      </h1>

      {rightElement || <div className="w-9" />}
    </div>
  )
}

export default PageHeader
