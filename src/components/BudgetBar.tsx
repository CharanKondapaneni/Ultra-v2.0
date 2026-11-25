export interface BudgetBarProps {
  pct: string
}

export default function BudgetBar({ pct }: BudgetBarProps) {
  const v = parseInt(pct)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-surface-2 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${v >= 95 ? 'bg-critical-400' : v >= 85 ? 'bg-warning-400' : 'bg-success-400'}`}
          style={{ width: pct }}
        />
      </div>
      <span className={`text-[10px] font-bold ${v >= 95 ? 'text-critical-600' : v >= 85 ? 'text-warning-600' : 'text-success-600'}`}>{pct}</span>
    </div>
  )
}
