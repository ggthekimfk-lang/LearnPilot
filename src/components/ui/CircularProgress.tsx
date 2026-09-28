interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  color?: string
  bgColor?: string
  showText?: boolean
  label?: string
}

function CircularProgress({
  percentage,
  size = 100,
  strokeWidth = 8,
  color = '#0B9B6B',
  bgColor = '#E2E8F0',
  showText = true,
  label,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="progress-circle transition-all duration-1000"
          style={{ '--progress-offset': offset } as React.CSSProperties}
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">{percentage}%</span>
          {label && <span className="text-[10px] text-gray-400 mt-0.5">{label}</span>}
        </div>
      )}
    </div>
  )
}

export default CircularProgress
