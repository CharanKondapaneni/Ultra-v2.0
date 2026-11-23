import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'

const NAVY = 'var(--color-brand)'
const GOLD = '#C2A24C'

export interface AssetGrowthData {
  title: string
  source: string
  asOf: string
  confidence: number
  series: { q: string; assets: number }[]
  inflectionPeriod: string
  inflectionLabel: string
}

export default function AssetGrowthChart({ data }: { data: AssetGrowthData }) {
  const inflection = data.series.find(p => p.q === data.inflectionPeriod)
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data.series} margin={{ top: 16, right: 20, left: -6, bottom: 0 }}>
        <defs>
          <linearGradient id="assetFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={NAVY} stopOpacity={0.18} />
            <stop offset="100%" stopColor={NAVY} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
        <XAxis dataKey="q" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
          axisLine={false} tickLine={false}
          domain={[1.3, 1.6]}
          tickFormatter={(v: number) => `$${v.toFixed(2)}B`}
          width={54}
        />
        <Tooltip
          formatter={(v) => [`$${v}B`, 'Total assets']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border-subtle)' }}
        />
        <Area type="monotone" dataKey="assets" stroke={NAVY} strokeWidth={2.5} fill="url(#assetFill)" animationDuration={900} />
        {inflection && (
          <ReferenceDot
            x={inflection.q} y={inflection.assets} r={5} fill={GOLD}
            stroke="var(--color-surface)" strokeWidth={2}
            label={{ value: data.inflectionLabel, position: 'top', fontSize: 11, fontWeight: 600, fill: '#8a6d1f' }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
