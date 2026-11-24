export interface ShiftCoverageRow {
  shift: string
  scheduled: number
  required: number
  gap?: number
}

export interface ShiftCoverageBarData {
  rows: ShiftCoverageRow[]
  title?: string
}

export default function ShiftCoverageBar({ data }: { data: ShiftCoverageBarData }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-3">
        {data.title ?? 'Shift Coverage vs Required'}
      </p>
      <div className="space-y-2.5">
        {data.rows.map(s => {
          const pct = Math.round((s.scheduled / s.required) * 100)
          return (
            <div key={s.shift} className="flex items-center gap-3">
              <span className="text-[11px] text-text w-32 flex-shrink-0">{s.shift}</span>
              <div className="flex-1 bg-surface-2 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${pct >= 98 ? 'bg-success-400' : pct >= 90 ? 'bg-warning-400' : 'bg-critical-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-text-muted tabular-nums w-24 text-right">
                {s.scheduled}/{s.required}{(s.gap ?? 0) > 0 ? ` · −${s.gap}` : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
