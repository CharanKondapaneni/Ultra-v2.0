import { ResponsiveContainer, LineChart, Line } from 'recharts'

const NAVY = 'var(--color-brand)'

export interface KpiCardData {
  id: string
  label: string
  value: string
  delta: string
  positive: boolean
  spark: number[]
}

export default function KpiCard({ kpi }: { kpi: KpiCardData }) {
  const data = kpi.spark.map((v, i) => ({ i, v }))
  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-[10px] font-medium text-text-subtle uppercase tracking-wide">{kpi.label}</p>
      <p className="text-[22px] font-bold text-text leading-none mt-1 tabular-nums">{kpi.value}</p>
      <div className="flex items-end justify-between mt-1.5">
        <span className={`text-[10px] font-semibold ${kpi.positive ? 'text-success-600' : 'text-warning-600'}`}>{kpi.delta}</span>
        <div className="w-16 h-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 3, right: 0, left: 0, bottom: 0 }}>
              <Line type="monotone" dataKey="v" stroke={NAVY} strokeWidth={1.75} dot={false} animationDuration={900} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
