export type ScoreArcGaugeStatus = 'green' | 'amber' | 'red'

export interface ScoreArcGaugeData {
  score: number
  maxScore: number
  status?: ScoreArcGaugeStatus | string
}

export default function ScoreArcGauge({ data }: { data: ScoreArcGaugeData }) {
  const { score, maxScore, status } = data
  const pct = (score / maxScore) * 100
  const color =
    status === 'amber' ? 'var(--color-warning-500)'
    : status === 'green' ? 'var(--color-success)'
    : 'var(--color-critical)'

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 120 60" className="w-full h-full">
          <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="var(--color-border)" strokeWidth="8" strokeLinecap="round" />
          <path
            d="M 10 55 A 50 50 0 0 1 110 55"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${pct * 1.57} 157`}
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-0">
          <span className="text-2xl font-bold text-text">{score}</span>
          <span className="text-xs text-text-subtle ml-0.5 mb-1">/{maxScore}</span>
        </div>
      </div>
    </div>
  )
}
