import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts'

export interface DelinquencySegment {
  id: string
  segment: string
  series: number[]
  flagged: boolean
}

export interface DelinquencyTrendData {
  eyebrow?: string
  quarters: string[]
  parameter: number
  driver?: { vintage: string; channel: string }
  segments: DelinquencySegment[]
}

const SEGMENT_COLORS: Record<string, string> = {
  hil:              'var(--color-critical, #dc2626)',
  first_mortgage:   'var(--color-brand, #003087)',
  heloc:            '#6366f1',
  other_unsecured:  '#f59e0b',
}

function segColor(id: string, idx: number) {
  return SEGMENT_COLORS[id] ?? ['#6366f1', '#f59e0b', '#14b8a6', '#8b5cf6'][idx % 4]
}

function fmtPct(v: number, dp = 1) {
  return `${v.toFixed(dp)}%`
}

const Y_MAX = 2.2

export default function DelinquencyTrend({ data }: { data: DelinquencyTrendData }) {
  const { eyebrow = 'Anomaly Detection', quarters, parameter, driver, segments } = data
  const LAST = quarters.length - 1
  const flagged = segments.find(s => s.flagged) ?? segments[0]
  const crossAt = flagged.series.findIndex(v => v > parameter)
  const chartData = quarters.map((q, i) =>
    Object.fromEntries([['quarter', q], ...segments.map(s => [s.id, s.series[i]])])
  )

  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-subtle mb-0.5">{eyebrow}</p>
          <h3 className="text-sm font-semibold text-text">60-day delinquency by loan segment · eight quarters</h3>
        </div>
        <span className="shrink-0 text-[10px] font-semibold bg-critical-50 text-critical-600 border border-critical-200 rounded-full px-2 py-0.5">
          1 pool outside tolerance
        </span>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg border border-critical-200 bg-critical-50/40 p-3">
          <p className="text-[10px] text-text-subtle mb-1 line-clamp-1">{flagged.segment}</p>
          <p className="text-lg font-bold text-critical-600 tabular-nums">{fmtPct(flagged.series[LAST])}</p>
          <p className="text-[9.5px] text-text-subtle mt-0.5">
            Parameter {fmtPct(parameter)} · {fmtPct(flagged.series[Math.max(LAST - 2, 0)])} two quarters ago
          </p>
          <p className="text-[9.5px] text-critical-600 font-semibold">
            Breach +{(flagged.series[LAST] - parameter).toFixed(1)} pts
          </p>
        </div>
        {segments
          .filter(s => !s.flagged)
          .slice(0, 2)
          .map(s => (
            <div key={s.id} className="rounded-lg border border-border-subtle bg-bg p-3">
              <p className="text-[10px] text-text-subtle mb-1 line-clamp-1">{s.segment}</p>
              <p className="text-lg font-bold text-success-600 tabular-nums">{fmtPct(s.series[LAST])}</p>
              <p className="text-[9.5px] text-text-subtle mt-0.5">Steady across eight quarters</p>
              <p className="text-[9.5px] text-success-600 font-semibold">Inside tolerance</p>
            </div>
          ))}
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-border-subtle bg-bg p-3">
        <ResponsiveContainer width="100%" height={230}>
          <ComposedChart data={chartData} margin={{ top: 14, right: 16, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle, #e5e7eb)" />
            <XAxis
              dataKey="quarter"
              tick={{ fontSize: 10, fill: 'var(--color-text-subtle, #9ca3af)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, Y_MAX]}
              ticks={[0, 0.5, 1, 1.5, 2]}
              tick={{ fontSize: 10, fill: 'var(--color-text-subtle, #9ca3af)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v.toFixed(1)}%`}
            />
            <ReferenceArea y1={parameter} y2={Y_MAX} fill="#dc2626" fillOpacity={0.06} />
            <ReferenceLine
              y={parameter}
              stroke="#dc2626"
              strokeDasharray="4 4"
              label={{ value: `Parameter ${fmtPct(parameter)}`, fill: '#dc2626', fontSize: 9, position: 'insideTopLeft' }}
            />
            <Tooltip
              formatter={(v: unknown, id: unknown) => [fmtPct(Number(v), 2), segments.find(s => s.id === String(id))?.segment ?? String(id)]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border-subtle, #e5e7eb)' }}
            />
            {segments.map((s, i) => (
              <Line
                key={s.id}
                type="monotone"
                dataKey={s.id}
                stroke={segColor(s.id, i)}
                strokeWidth={s.flagged ? 2.75 : 1.5}
                strokeOpacity={s.flagged ? 1 : 0.8}
                dot={s.flagged ? { r: 3, fill: segColor(s.id, i) } : false}
                animationDuration={800}
              />
            ))}
            {crossAt >= 0 && (
              <ReferenceDot
                x={quarters[crossAt]}
                y={flagged.series[crossAt]}
                r={6}
                fill="var(--color-surface, #fff)"
                stroke="#dc2626"
                strokeWidth={2}
                label={{
                  value: `${fmtPct(flagged.series[crossAt])} · past ${fmtPct(parameter)}`,
                  position: 'left',
                  offset: 10,
                  fill: '#dc2626',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px]">
          {segments.map((s, i) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span className="h-0.5 w-3.5 rounded-full" style={{ background: segColor(s.id, i) }} aria-hidden="true" />
              <span className={s.flagged ? 'font-semibold text-critical-600' : 'text-text-muted'}>{s.segment}</span>
              <span className="tabular-nums text-text-subtle">{fmtPct(s.series[LAST])}</span>
            </li>
          ))}
        </ul>
      </div>

      {driver && (
        <p className="mt-3 rounded-lg border border-critical-200/60 bg-critical-50/40 px-3 py-2 text-[11px] leading-relaxed text-text">
          <span className="font-semibold text-critical-600">Where the rise sits: </span>
          {driver.vintage}, through {driver.channel}.
        </p>
      )}

      <p className="mt-2 text-[9.5px] text-text-subtle">
        Quarter-end 60-day delinquency, {quarters[0]} – {quarters[LAST]}. Source: Core banking system (loan servicing and delinquency).
      </p>
    </div>
  )
}
