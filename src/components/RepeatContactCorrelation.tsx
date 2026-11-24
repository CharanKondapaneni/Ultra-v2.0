import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import { ArrowRight, Server, Wrench, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const nodeIcon: Record<string, LucideIcon> = { cause: Server, mid: Wrench, effect: RefreshCw }
const nodeStyle: Record<string, string> = {
  cause:  'border-warning-200 bg-warning-500/[0.05] text-warning-600',
  mid:    'border-border bg-surface-2 text-text-muted',
  effect: 'border-critical-200 bg-critical-500/[0.05] text-critical-600',
}

export interface CorrelationStep {
  node: string
  detail?: string
  tone: string
}

export interface RepeatFcrDay {
  day: string
  fcr: number
  reviewNeg: number
}

export interface RepeatContactCorrelationData {
  correlationChain: CorrelationStep[]
  repeatFcr: RepeatFcrDay[]
  title?: string
  subtitle?: string
  chartLabel?: string
  referenceDay?: string
  referenceLabel?: string
  callout?: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: RepeatFcrDay }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-surface border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-text mb-0.5">{label}</p>
      <p className="text-brand">Refund FCR: {d.fcr}%</p>
      <p className="text-critical-500">1-star refund reviews: {d.reviewNeg}</p>
    </div>
  )
}

export default function RepeatContactCorrelation({ data }: { data: RepeatContactCorrelationData }) {
  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h3 className="text-sm font-bold text-text mb-1">{data.title ?? 'Repeat Contact Driver Analysis'}</h3>
      {data.subtitle && <p className="text-[11px] text-text-subtle mb-3">{data.subtitle}</p>}
      <div className="flex items-stretch gap-2 mb-4 flex-wrap">
        {data.correlationChain.map((n, i) => {
          const Icon = nodeIcon[n.tone] ?? Server
          const last = i === data.correlationChain.length - 1
          return (
            <div key={i} className="flex items-center gap-2 flex-1 min-w-[140px]">
              <div className={`flex-1 rounded-lg border px-3 py-2 ${nodeStyle[n.tone] ?? nodeStyle.mid}`}>
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  <p className="text-[10px] font-bold leading-tight">{n.node}</p>
                </div>
                {n.detail && <p className="text-[9px] text-text-muted mt-1 leading-snug">{n.detail}</p>}
              </div>
              {!last && <ArrowRight className="w-4 h-4 text-text-subtle flex-shrink-0" />}
            </div>
          )
        })}
      </div>
      {data.chartLabel && <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1">{data.chartLabel}</p>}
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data.repeatFcr} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="day" tick={{ fontSize: 9.5, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="fcr" domain={[50, 90]} tick={{ fontSize: 10, fill: 'var(--color-text-subtle)' }} axisLine={false} tickLine={false} unit="%" />
          <YAxis yAxisId="rev" orientation="right" domain={[0, 40]} tick={{ fontSize: 9, fill: 'var(--color-critical-500)' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {data.referenceDay && (
            <ReferenceLine
              yAxisId="fcr"
              x={data.referenceDay}
              stroke="var(--color-warning-500)"
              strokeDasharray="4 4"
              label={{ value: data.referenceLabel ?? 'Event', fontSize: 9, fill: 'var(--color-warning-500)', position: 'top' }}
            />
          )}
          <Line yAxisId="fcr" type="monotone" dataKey="fcr" name="Refund FCR" stroke="var(--color-brand)" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line yAxisId="rev" type="monotone" dataKey="reviewNeg" name="1-star refund reviews" stroke="var(--color-critical-500)" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2.5 }} />
        </LineChart>
      </ResponsiveContainer>
      {data.callout && (
        <div className="mt-2 rounded-lg bg-critical-500/[0.05] px-3 py-2">
          <p className="text-[10px] text-critical-600 font-semibold">→ {data.callout}</p>
        </div>
      )}
    </div>
  )
}
