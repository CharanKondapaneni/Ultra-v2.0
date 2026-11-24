import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Area, ComposedChart } from 'recharts'

interface TooltipEntry {
  dataKey?: string
  name?: string
  value?: number
  color?: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-text mb-0.5">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export interface SurgeDataPoint {
  week: string
  y2023: number
  y2024: number
  y2025: number
  capacity: number
}

export interface MultiYearSurgeChartData {
  surgeOverlay: SurgeDataPoint[]
  title?: string
  subtitle?: string
  callout?: string
}

export default function MultiYearSurgeChart({ data }: { data: MultiYearSurgeChartData }) {
  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h3 className="text-sm font-bold text-text mb-1">{data.title ?? 'Q4 Contact Volume — Multi-Year Overlay'}</h3>
      {data.subtitle && <p className="text-[11px] text-text-subtle mb-3">{data.subtitle}</p>}
      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={data.surgeOverlay} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-subtle)' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Area type="monotone" dataKey="capacity" name="Staffing capacity" stroke="var(--color-text-subtle)" fill="var(--color-border)" fillOpacity={0.5} strokeDasharray="4 4" />
          <Line type="monotone" dataKey="y2023" name="2023" stroke="var(--color-border)" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="y2024" name="2024" stroke="var(--color-info-300)" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="y2025" name="2025 (projected)" stroke="var(--color-brand)" strokeWidth={2.5} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
      {data.callout && (
        <div className="mt-2 rounded-lg bg-critical-500/[0.05] px-3 py-2">
          <p className="text-[10px] text-critical-600 font-semibold">→ {data.callout}</p>
        </div>
      )}
    </div>
  )
}
