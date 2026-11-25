export interface AdherencePoint {
  agent: string
  handleTime: number
  adherence: number
  topic: string
}

export interface ScatterTooltipProps {
  active?: boolean
  payload?: { payload: AdherencePoint }[]
}

export default function ScatterTooltip({ active, payload }: ScatterTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-surface border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-text capitalize">{d.topic} · adherence {d.adherence}%</p>
      <p className="text-text-muted">Handle time {Math.floor(d.handleTime)}:{String(Math.round((d.handleTime % 1) * 60)).padStart(2, '0')}</p>
    </div>
  )
}
