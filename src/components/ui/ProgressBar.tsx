interface ProgressBarProps {
  percentage: number
  color?: string
  bgColor?: string
  height?: number
  showLabel?: boolean
  label?: string
  labelRight?: string
}

function ProgressBar({
  percentage,
  color = '#0B9B6B',
  bgColor = '#E2E8F0',
  height = 8,
  showLabel = false,
  label,
  labelRight,
}: ProgressBarProps) {
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm text-gray-600">{label}</span>}
          {labelRight && <span className="text-sm font-semibold" style={{ color }}>{labelRight}</span>}
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ backgroundColor: bgColor, height }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
