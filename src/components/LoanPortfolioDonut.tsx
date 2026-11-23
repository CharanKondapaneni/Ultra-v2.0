import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

function ramp(i: number, n: number) {
  const t = n <= 1 ? 0 : i / (n - 1)
  const a = [0x00, 0x30, 0x87]
  const b = [0xc2, 0xa2, 0x4c]
  const m = a.map((c, k) => Math.round(c + (b[k] - c) * t))
  return `rgb(${m[0]},${m[1]},${m[2]})`
}

export interface LoanPortfolioData {
  title: string
  source: string
  asOf: string
  confidence: number
  total: string
  totalLabel: string
  segments: { name: string; pct: number }[]
}

export default function LoanPortfolioDonut({ data }: { data: LoanPortfolioData }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-[130px] h-[130px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.segments} dataKey="pct" nameKey="name"
              innerRadius={44} outerRadius={62} paddingAngle={2}
              startAngle={90} endAngle={-270} animationDuration={900}
            >
              {data.segments.map((s, i) => (
                <Cell key={s.name} fill={ramp(i, data.segments.length)} stroke="var(--color-surface)" strokeWidth={1.5} />
              ))}
            </Pie>
            <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border-subtle)' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[17px] font-bold text-text leading-none tabular-nums">{data.total}</span>
          <span className="text-[8.5px] text-text-subtle mt-0.5">{data.totalLabel}</span>
        </div>
      </div>
      <div className="flex-1 space-y-1">
        {data.segments.map((s, i) => (
          <div key={s.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: ramp(i, data.segments.length) }} />
            <span className="text-[10.5px] text-text-muted flex-1 truncate">{s.name}</span>
            <span className="text-[10.5px] font-semibold text-text tabular-nums">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
