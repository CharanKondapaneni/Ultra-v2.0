import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const heatColor = (r: number) => r >= 25 ? 'bg-critical-500' : r >= 12 ? 'bg-warning-400' : 'bg-success-400'
const heatText  = (r: number) => r >= 25 ? 'text-critical-600' : r >= 12 ? 'text-warning-600' : 'text-success-600'

export interface DisclosureDay {
  day: string
  rate: number
  macro?: boolean
}

export interface ShiftSkipRow {
  shift: string
  skipRate: number
}

export interface DisclosureTimelineHeatmapData {
  disclosureByDay: DisclosureDay[]
  shiftHeatmap: ShiftSkipRow[]
  title?: string
  subtitle?: string
  referenceLabel?: string
  referenceDay?: string
  callout?: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: DisclosureDay }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-surface border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-text mb-0.5">{label} — {d.rate}% completed</p>
      {d.macro && <p className="text-critical-600 font-medium">Macro moved disclosure to step 7</p>}
    </div>
  )
}

export default function DisclosureTimelineHeatmap({ data }: { data: DisclosureTimelineHeatmapData }) {
  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h3 className="text-sm font-bold text-text mb-1">{data.title ?? 'Disclosure Completion Rate by Day'}</h3>
      {data.subtitle && <p className="text-[11px] text-text-subtle mb-3">{data.subtitle}</p>}
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data.disclosureByDay} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
          <XAxis dataKey="day" tick={{ fontSize: 9.5, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis domain={[70, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-subtle)' }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip content={<CustomTooltip />} />
          {data.referenceDay && (
            <ReferenceLine
              x={data.referenceDay}
              stroke="var(--color-critical-500)"
              strokeDasharray="4 4"
              label={{ value: data.referenceLabel ?? 'Change', fontSize: 9, fill: 'var(--color-critical-500)', position: 'top' }}
            />
          )}
          <Line type="monotone" dataKey="rate" stroke="var(--color-brand)" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-3 border-t border-border-subtle pt-3">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Skip Rate by Shift</p>
        <div className="space-y-1.5">
          {data.shiftHeatmap.map(s => (
            <div key={s.shift} className="flex items-center gap-2">
              <span className="text-[11px] text-text w-28 flex-shrink-0">{s.shift}</span>
              <div className="flex-1 bg-surface-2 rounded-full h-2.5 overflow-hidden">
                <div className={`h-full rounded-full ${heatColor(s.skipRate)}`} style={{ width: `${s.skipRate * 2.8}%` }} />
              </div>
              <span className={`text-[10px] font-bold tabular-nums w-8 text-right ${heatText(s.skipRate)}`}>{s.skipRate}%</span>
            </div>
          ))}
        </div>
      </div>
      {data.callout && (
        <div className="mt-3 rounded-lg bg-critical-500/[0.05] px-3 py-2">
          <p className="text-[10px] text-critical-600 font-semibold">→ {data.callout}</p>
        </div>
      )}
    </div>
  )
}
