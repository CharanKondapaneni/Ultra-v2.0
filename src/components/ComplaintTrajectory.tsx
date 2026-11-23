import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

export interface ComplaintTrajectoryData {
  complaintTrajectory90Days: { date: string; complaints: number }[]
}

export default function ComplaintTrajectory({ data }: { data: ComplaintTrajectoryData }) {
  const points = data.complaintTrajectory90Days.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    complaints: d.complaints,
  }))

  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-5">
      <h3 className="text-sm font-semibold text-text mb-1">90-Day Complaint Trajectory</h3>
      <p className="text-xs text-text-subtle mb-4">Member complaints trending upward</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={points} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="complaintGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-critical-700)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--color-critical-700)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-text-subtle)' }} axisLine={false} tickLine={false} interval={2} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-subtle)' }} axisLine={false} tickLine={false} domain={[30, 90]} />
          <Tooltip
            formatter={(value) => [value, 'Complaints']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border-subtle)' }}
          />
          <Area
            type="monotone"
            dataKey="complaints"
            stroke="var(--color-critical-700)"
            strokeWidth={2}
            fill="url(#complaintGrad)"
            dot={{ r: 3, fill: 'var(--color-critical-700)', strokeWidth: 2, stroke: 'var(--color-surface)' }}
            activeDot={{ r: 5, fill: 'var(--color-critical-700)' }}
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
