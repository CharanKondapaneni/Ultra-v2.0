const ftlColor = (v: number) =>
  v >= 1.0 ? 'text-success-600' : v >= 0.9 ? 'text-warning-600' : 'text-critical-600'

const covStyle = (c: string) =>
  c === 'Adequate'
    ? 'text-success-600 bg-success-500/10'
    : 'text-critical-600 bg-critical-500/10'

export interface ForceToLoadRow {
  queue: string
  brand: string
  ftl: number
  coverage: string
}

export interface ForceToLoadTableData {
  rows: ForceToLoadRow[]
}

export default function ForceToLoadTable({ data }: { data: ForceToLoadTableData }) {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface-2">
            <th className="text-left px-4 py-2.5 font-semibold text-text-muted text-[10px] uppercase tracking-wider">Queue</th>
            <th className="text-left px-3 py-2.5 font-semibold text-text-muted text-[10px] uppercase tracking-wider">Brand</th>
            <th className="text-center px-3 py-2.5 font-semibold text-text-muted text-[10px] uppercase tracking-wider">Force-to-Load</th>
            <th className="text-left px-4 py-2.5 font-semibold text-text-muted text-[10px] uppercase tracking-wider">Coverage</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map(r => (
            <tr key={r.queue} className="border-t border-border-subtle hover:bg-surface-2/60 transition-colors">
              <td className="px-4 py-3 font-semibold text-text">{r.queue}</td>
              <td className="px-3 py-3 text-text-muted">{r.brand}</td>
              <td className={`px-3 py-3 text-center font-bold text-sm tabular-nums ${ftlColor(r.ftl)}`}>{r.ftl.toFixed(2)}</td>
              <td className="px-4 py-3">
                <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${covStyle(r.coverage)}`}>{r.coverage}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
