import ScoreArcGauge from '@/components/ScoreArcGauge'
import type { ScoreArcGaugeStatus } from '@/components/ScoreArcGauge'

export interface RegulatoryReadinessCardData {
  title: string
  score: number
  maxScore: number
  status?: ScoreArcGaugeStatus | string
  openFindings: number
  closedFindings: number
  nextExamWindow: string
}

export default function RegulatoryReadinessCard({ data }: { data: RegulatoryReadinessCardData }) {
  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-5">
      <h3 className="text-sm font-semibold text-text mb-4">{data.title}</h3>
      <ScoreArcGauge data={{ score: data.score, maxScore: data.maxScore, status: data.status }} />
      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="p-2 rounded-lg bg-surface-2">
          <p className="text-lg font-bold text-warning-600">{data.openFindings}</p>
          <p className="text-[10px] text-text-muted">Open Findings</p>
        </div>
        <div className="p-2 rounded-lg bg-surface-2">
          <p className="text-lg font-bold text-success-600">{data.closedFindings}</p>
          <p className="text-[10px] text-text-muted">Closed Findings</p>
        </div>
      </div>
      <p className="text-[11px] text-text-subtle mt-3 text-center">Next exam window: {data.nextExamWindow}</p>
    </div>
  )
}
