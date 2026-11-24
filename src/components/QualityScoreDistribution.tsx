export interface QualityBand {
  band: string
  pct: number
}

export interface QualityScoreDistributionData {
  bands: QualityBand[]
  title?: string
  footnote?: string
}

export default function QualityScoreDistribution({ data }: { data: QualityScoreDistributionData }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <p className="text-xs font-semibold text-text-muted mb-3">{data.title ?? 'Quality-Score Distribution (agents)'}</p>
      <div className="space-y-2.5">
        {data.bands.map(q => (
          <div key={q.band} className="flex items-center gap-3">
            <span className="text-[11px] text-text w-16 flex-shrink-0 tabular-nums">{q.band}</span>
            <div className="flex-1 bg-surface-2 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${q.band === '<60' || q.band === '60–69' ? 'bg-warning-400' : 'bg-brand'}`}
                style={{ width: `${q.pct * 2}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-text-muted tabular-nums w-8 text-right">{q.pct}%</span>
          </div>
        ))}
      </div>
      {data.footnote && <p className="text-[10px] text-text-subtle mt-3">{data.footnote}</p>}
    </div>
  )
}
