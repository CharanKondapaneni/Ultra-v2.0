import { motion } from 'framer-motion'
import { AlertTriangle, TrendingDown, type LucideIcon } from 'lucide-react'
import SourceBadge from '@/components/chat/SourceBadge'

const tierFor = (score: number) => score >= 85 ? 'high' : score >= 70 ? 'mid' : 'low'
const colorFor = (tier: string) => ({ high: 'var(--color-conf-high)', mid: 'var(--color-conf-med)', low: 'var(--color-conf-low)' }[tier] ?? 'inherit')

const severityStyles: Record<string, { border: string; bg: string; Icon: LucideIcon; iconClass: string; chip: string }> = {
  critical: { border: 'border-critical-200', bg: 'bg-critical-50', Icon: AlertTriangle, iconClass: 'text-critical-500', chip: 'bg-critical-100 text-critical-800' },
  warning:  { border: 'border-warning-200',  bg: 'bg-warning-50',  Icon: TrendingDown,  iconClass: 'text-warning-500',  chip: 'bg-warning-100 text-warning-800' },
}

export interface GovernanceSignal {
  id: string
  title: string
  severity: string
  description: string
  sources: string[]
  confidence?: { score: number } | null
}

export interface GovernanceSignalsTableData {
  signals: GovernanceSignal[]
}

export default function GovernanceSignalsTable({ data }: { data: GovernanceSignalsTableData }) {
  return (
    <div className="space-y-3">
      {data.signals.map((signal, idx) => {
        const style = severityStyles[signal.severity] ?? severityStyles.warning
        const Icon = style.Icon
        return (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
            className={`rounded-xl border ${style.border} ${style.bg} p-4`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${style.iconClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-text">{signal.title}</h4>
                  <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${style.chip}`}>
                    {signal.severity}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-text-muted mb-2">{signal.description}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {signal.sources.map((s, i) => <SourceBadge key={i} source={s} />)}
                  {signal.confidence && (
                    <span
                      className="ml-auto text-[10px] font-semibold tabular-nums"
                      style={{ color: colorFor(tierFor(signal.confidence.score)) }}
                    >
                      Confidence {signal.confidence.score}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
