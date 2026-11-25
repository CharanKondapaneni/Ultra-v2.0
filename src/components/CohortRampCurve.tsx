import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ScatterChart, Scatter, ZAxis, Cell } from 'recharts'
import ChartTooltip from '@/components/ChartTooltip'
import ScatterTooltip from '@/components/ScatterTooltip'
import type { AdherencePoint } from '@/components/ScatterTooltip'

const topicColor: Record<string, string> = {
  hosting: 'var(--color-critical-500)',
  domains: 'var(--color-warning-500)',
  billing: 'var(--color-success-500)',
}

export interface CohortRampPoint {
  week: string
  cohort: number
  benchmark: number
}

export interface CohortRampCurveData {
  cohortRamp: CohortRampPoint[]
  cohortAdherence?: string
  cohortBenchmark?: string
  kbAdherenceScatter?: AdherencePoint[]
  title?: string
  subtitle?: string
  callout?: string
}

export default function CohortRampCurve({ data }: { data: CohortRampCurveData }) {
  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h3 className="text-sm font-bold text-text mb-1">{data.title ?? 'Handle Time by Week — Cohort vs Benchmark'}</h3>
      {data.subtitle && <p className="text-[11px] text-text-subtle mb-3">{data.subtitle}</p>}
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data.cohortRamp} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-subtle)' }} axisLine={false} tickLine={false} unit="m" />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={9.5} stroke="var(--color-text-subtle)" strokeDasharray="4 4" label={{ value: 'Target 9:30', fontSize: 9, fill: 'var(--color-text-subtle)', position: 'insideBottomRight' }} />
          <Line type="monotone" dataKey="cohort" name="Cohort" stroke="var(--color-brand)" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="benchmark" name="Benchmark" stroke="var(--color-border)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>

      {data.kbAdherenceScatter && data.kbAdherenceScatter.length > 0 && (
        <div className="mt-3 border-t border-border-subtle pt-3">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1">Knowledge-Base Adherence by Agent (flagged by topic)</p>
          <ResponsiveContainer width="100%" height={150}>
            <ScatterChart margin={{ top: 6, right: 12, left: -18, bottom: 2 }}>
              <XAxis type="number" dataKey="adherence" name="Adherence" unit="%" domain={[40, 95]} tick={{ fontSize: 9.5, fill: 'var(--color-text-subtle)' }} axisLine={false} tickLine={false} />
              <YAxis type="number" dataKey="handleTime" name="Handle time" unit="m" domain={[9, 19]} tick={{ fontSize: 9.5, fill: 'var(--color-text-subtle)' }} axisLine={false} tickLine={false} />
              <ZAxis range={[60, 60]} />
              <ReferenceLine x={85} stroke="var(--color-text-subtle)" strokeDasharray="4 4" label={{ value: '85% target', fontSize: 8.5, fill: 'var(--color-text-subtle)', position: 'top' }} />
              <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={data.kbAdherenceScatter}>
                {data.kbAdherenceScatter.map((d, i) => <Cell key={i} fill={topicColor[d.topic] ?? 'var(--color-text-muted)'} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-3 text-[9px] text-text-muted -mt-1">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-critical-500" />Hosting</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning-500" />Domains</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success-500" />Billing</span>
          </div>
        </div>
      )}

      {data.callout && (
        <div className="mt-2 rounded-lg bg-warning-500/[0.06] px-3 py-2">
          <p className="text-[10px] text-warning-700 font-semibold">→ {data.callout}</p>
        </div>
      )}
    </div>
  )
}
