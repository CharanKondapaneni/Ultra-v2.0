import { motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import type { ComponentType } from 'react'

const STATE = {
  good:     { label: 'Good',     bg: 'bg-success-500/10',  text: 'text-success-700',  Icon: CheckCircle2 },
  warning:  { label: 'Warning',  bg: 'bg-warning-500/10',  text: 'text-warning-700',  Icon: AlertTriangle },
  critical: { label: 'Critical', bg: 'bg-critical-600/10', text: 'text-critical-600', Icon: AlertTriangle },
}

export interface TrustTileData {
  icon: ComponentType<{ className?: string }>
  name: string
  value: string
  sub?: string
  state: string
  progressPct?: number
}

export default function TrustTile({ data }: { data: TrustTileData }) {
  const { icon: Icon, name, value, sub, state, progressPct } = data
  const s = STATE[state as keyof typeof STATE] ?? STATE.good
  const StateIcon = s.Icon

  return (
    <div className="rounded-xl bg-surface border border-border-subtle flex flex-col p-2.5">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className="w-3 h-3 flex-shrink-0 text-brand" />
          <p className="text-[8.5px] font-semibold text-text-subtle uppercase tracking-wide truncate">{name}</p>
        </div>
        <span className={`inline-flex items-center gap-1 text-[9.5px] font-semibold px-1.5 py-0.5 rounded ${s.bg} ${s.text}`}>
          <StateIcon className="w-2.5 h-2.5" />
          {s.label}
        </span>
      </div>
      <p className="text-[13px] font-bold text-text leading-tight">{value}</p>
      {sub && <p className="text-[9.5px] text-text-subtle mt-0.5 leading-snug">{sub}</p>}
      {progressPct != null && (
        <div className="mt-1.5 h-1 rounded-full bg-surface-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="h-full rounded-full bg-brand"
          />
        </div>
      )}
    </div>
  )
}
