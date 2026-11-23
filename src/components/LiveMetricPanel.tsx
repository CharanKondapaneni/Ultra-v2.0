import { useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'

export interface LiveMetricPanelData {
  label: string
  unit?: string
  value?: number | null
  series?: { t: number; value: number }[] | null
  isCounter?: boolean
  lowerIsBetter?: boolean
}

export default function LiveMetricPanel({ data }: { data: LiveMetricPanelData }) {
  const delta = useMemo(() => {
    if (data.isCounter || !data.series || data.series.length < 2) return null
    const first = data.series[0].value
    const last = data.series[data.series.length - 1].value
    if (!first) return null
    return ((last - first) / Math.abs(first)) * 100
  }, [data.isCounter, data.series])

  const rising = delta != null && delta > 0.5
  const falling = delta != null && delta < -0.5
  const goodDirection = data.lowerIsBetter ? falling : rising
  const badDirection = data.lowerIsBetter ? rising : falling

  return (
    <div className="rounded-lg border border-border-subtle px-3 py-2.5 min-w-0">
      <div className="text-[9.5px] text-text-subtle uppercase tracking-wide truncate">{data.label}</div>

      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span className="text-[17px] font-bold text-text tabular-nums leading-none">
          {typeof data.value === 'number' ? data.value.toLocaleString() : '—'}
        </span>
        {data.unit && <span className="text-[10px] text-text-subtle font-medium">{data.unit}</span>}
      </div>

      {data.isCounter ? (
        <div className="h-[38px] flex items-end">
          <span className="text-[10px] text-text-muted leading-snug">Cumulative today · only climbs</span>
        </div>
      ) : (
        <>
          {/* ResponsiveContainer needs a resolved height — flex column gives 0 without this wrapper */}
          <div className="h-[38px] -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.series ?? []} margin={{ top: 4, right: 4, bottom: 2, left: 4 }}>
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={badDirection ? 'var(--color-warning-600)' : 'var(--color-brand)'}
                  strokeWidth={1.75}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {delta != null && (
            <div
              className={`text-[9px] font-semibold tabular-nums ${
                goodDirection ? 'text-success-600' : badDirection ? 'text-warning-600' : 'text-text-subtle'
              }`}
            >
              {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {Math.abs(delta).toFixed(1)}% over window
            </div>
          )}
        </>
      )}
    </div>
  )
}
