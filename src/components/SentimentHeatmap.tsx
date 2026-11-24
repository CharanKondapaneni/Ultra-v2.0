export interface SentimentBrandRow {
  brand: string
  positive: number
  neutral: number
  negative: number
}

export interface SentimentHeatmapData {
  rows: SentimentBrandRow[]
  title?: string
}

export default function SentimentHeatmap({ data }: { data: SentimentHeatmapData }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <p className="text-xs font-semibold text-text-muted mb-3">{data.title ?? 'Sentiment Heatmap by Brand'}</p>
      <div className="space-y-2.5">
        {data.rows.map(s => (
          <div key={s.brand}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-text font-medium">{s.brand}</span>
              <span className="text-[10px] text-text-muted tabular-nums">{s.negative}% neg</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden">
              <div className="bg-success-400" style={{ width: `${s.positive}%` }} />
              <div className="bg-text-subtle" style={{ width: `${s.neutral}%` }} />
              <div className="bg-critical-400" style={{ width: `${s.negative}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 text-[9px] text-text-muted">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success-400" />Positive</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-text-subtle" />Neutral</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-critical-400" />Negative</span>
      </div>
    </div>
  )
}
