import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, TrendingDown, ChevronRight, Info } from 'lucide-react'

export interface SignalConfidence { score: number }
export interface BriefingSignal {
  id: string
  title: string
  severity: 'critical' | 'warning' | string
  bucket: string
  description?: string
  sources?: string[]
  source?: string
  metric_text?: string
  confidence?: SignalConfidence
  chipText?: string
}

export interface FinanceBriefingSignalsData {
  signals: BriefingSignal[]
  visible?: boolean
}

const ILLUSTRATIVE_NOTICE =
  'This brief uses illustrative data modelled on publicly available credit-union benchmarks. It does not represent actual USSFCU financials.'

const severityConfig = {
  critical: {
    label: 'Critical',
    accent: 'bg-critical-500',
    iconBg: 'bg-critical-50',
    icon: AlertTriangle,
    iconColor: 'text-critical-500',
    badge: 'text-critical-800 bg-critical-50',
  },
  warning: {
    label: 'Warning',
    accent: 'bg-warning-500',
    iconBg: 'bg-warning-50',
    icon: TrendingDown,
    iconColor: 'text-warning-500',
    badge: 'text-warning-800 bg-warning-50',
  },
}

function colorFor(score: number) {
  if (score >= 90) return '#16a34a'
  if (score >= 75) return '#d97706'
  return '#dc2626'
}

interface SignalTileProps {
  signal: BriefingSignal
  index: number
  onClick?: () => void
}

function SignalTile({ signal, index, onClick }: SignalTileProps) {
  const cfg = severityConfig[signal.severity as keyof typeof severityConfig] || severityConfig.warning
  const Icon = cfg.icon

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
      onClick={onClick}
      className="flex-1 min-w-0 relative overflow-hidden rounded-xl bg-surface border border-border-subtle/80 text-left cursor-pointer group hover:shadow-[0_4px_16px_rgba(0,48,135,0.07)] hover:border-brand/15 transition-all duration-200"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${cfg.accent}`} />
      <div className="px-3.5 py-2.5 h-full flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <div className={`w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center ${cfg.iconBg}`}>
              <Icon className={`w-3 h-3 ${cfg.iconColor}`} />
            </div>
            <span className="truncate text-[9.5px] font-semibold uppercase tracking-wide text-text-subtle">{signal.bucket}</span>
          </div>
          <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        <p className="text-[12px] font-semibold text-text leading-snug line-clamp-2 mb-1 group-hover:text-brand transition-colors" title={signal.description}>
          {signal.title}
        </p>

        <p className="text-[9.5px] text-text-subtle leading-snug truncate mb-1">
          <span className="font-semibold">Sources:</span>{' '}
          {(signal.sources ?? (signal.source ? [signal.source] : [])).join(' · ')}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="text-[10px] text-text-subtle font-medium truncate">{signal.metric_text}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {signal.confidence && (
              <span className="text-[10px] font-semibold tabular-nums" style={{ color: colorFor(signal.confidence.score) }}>
                {signal.confidence.score}%
              </span>
            )}
            <ChevronRight className="w-3 h-3 text-text-subtle group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </motion.button>
  )
}

export default function FinanceBriefingSignals({ data }: { data: FinanceBriefingSignalsData }) {
  const { signals, visible = true } = data

  if (!signals || signals.length === 0) return null

  const handleClick = (signal: BriefingSignal) => {
    if (!signal.chipText) return
    window.dispatchEvent(new CustomEvent('fiona:chip', { detail: signal.chipText }))
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 'auto' }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="mb-3"
        >
          <p className="mb-2.5 flex items-start gap-1.5 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-[10.5px] leading-snug text-text-muted">
            <Info className="mt-[1px] h-3.5 w-3.5 flex-shrink-0 text-brand" />
            <span>{ILLUSTRATIVE_NOTICE}</span>
          </p>


          <div className="flex flex-col sm:flex-row gap-3">
            {signals.slice(0, 3).map((signal, idx) => (
              <SignalTile key={signal.id} signal={signal} index={idx} onClick={() => handleClick(signal)} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
