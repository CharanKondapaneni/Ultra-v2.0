import BudgetBar from '@/components/BudgetBar'

const slColor = (sl: string) => {
  const v = parseInt(sl)
  if (v >= 80) return 'text-success-600'
  if (v >= 75) return 'text-warning-600'
  return 'text-critical-600'
}

export interface StaffingScenario {
  label: string
  notes?: string
  serviceLevel: string
  cost: string
  budget_impact: string
  highlight?: boolean
}

export interface StaffingScenarioTableData {
  scenarios: StaffingScenario[]
  title?: string
  source?: string
  recommendationNote?: string
}

export default function StaffingScenarioTable({ data }: { data: StaffingScenarioTableData }) {
  const recommended = data.scenarios.find(s => s.highlight)
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border-subtle">
        <p className="text-xs font-semibold text-text-muted">{data.title ?? 'Staffing Scenarios vs Service Level Impact'}</p>
        {data.source && <p className="text-[10px] text-text-subtle mt-0.5">{data.source}</p>}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface-2">
            <th className="text-left px-4 py-2.5 font-semibold text-text-muted text-[10px] uppercase tracking-wider">Scenario</th>
            <th className="text-center px-3 py-2.5 font-semibold text-text-muted text-[10px] uppercase tracking-wider">Service Level</th>
            <th className="text-center px-3 py-2.5 font-semibold text-text-muted text-[10px] uppercase tracking-wider">Cost</th>
            <th className="text-left px-4 py-2.5 font-semibold text-text-muted text-[10px] uppercase tracking-wider">Q4 Budget</th>
          </tr>
        </thead>
        <tbody>
          {data.scenarios.map(s => (
            <tr
              key={s.label}
              className={`border-t border-border-subtle ${s.highlight ? 'bg-brand/[0.04]' : 'hover:bg-surface-2/60'} transition-colors`}
            >
              <td className="px-4 py-3">
                <div className={`font-semibold ${s.highlight ? 'text-brand' : 'text-text'}`}>
                  {s.label}
                  {s.highlight && (
                    <span className="ml-2 text-[9px] font-bold uppercase tracking-wide bg-brand/10 text-brand rounded px-1.5 py-0.5">Recommended</span>
                  )}
                </div>
                {s.notes && <div className="text-[10px] text-text-muted mt-0.5">{s.notes}</div>}
              </td>
              <td className={`px-3 py-3 text-center font-bold text-sm ${slColor(s.serviceLevel)}`}>{s.serviceLevel}</td>
              <td className="px-3 py-3 text-center font-medium text-text-muted">{s.cost}</td>
              <td className="px-4 py-3 min-w-[120px]"><BudgetBar pct={s.budget_impact} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {(data.recommendationNote ?? recommended) && (
        <div className="px-4 py-2.5 border-t border-border-subtle bg-brand/[0.04]">
          <p className="text-[10px] text-brand font-semibold">
            → {data.recommendationNote ?? `${recommended?.label} delivers ${recommended?.serviceLevel} at a cost of ${recommended?.cost}.`}
          </p>
        </div>
      )}
    </div>
  )
}
