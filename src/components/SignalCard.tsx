import { AlertTriangle, TrendingDown, Users, LineChart, ClipboardCheck, CheckCircle2, ArrowRight, type LucideIcon } from 'lucide-react'
import SourceBadge from '@/components/chat/SourceBadge'

const tierFor = (score: number) => score >= 85 ? 'high' : score >= 70 ? 'mid' : 'low'
const colorFor = (tier: string) => ({ high: 'var(--color-conf-high)', mid: 'var(--color-conf-med)', low: 'var(--color-conf-low)' }[tier] ?? 'inherit')

interface SeverityStyle { border: string; bg: string; Icon: LucideIcon; iconClass: string }

const severityStyles: Record<string, SeverityStyle> = {
  critical: { border: 'border-critical-200', bg: 'bg-critical-50',  Icon: AlertTriangle,  iconClass: 'text-critical-500' },
  warning:  { border: 'border-warning-200',  bg: 'bg-warning-50',   Icon: TrendingDown,   iconClass: 'text-warning-500'  },
  info:     { border: 'border-info-200',     bg: 'bg-info-50',      Icon: Users,          iconClass: 'text-info-500'     },
  review:   { border: 'border-border',       bg: 'bg-surface-2',    Icon: ClipboardCheck, iconClass: 'text-text-subtle'  },
  healthy:  { border: 'border-success-200',  bg: 'bg-success-50',   Icon: CheckCircle2,   iconClass: 'text-success-500'  },
}
const calmStyle: SeverityStyle = { border: 'border-border', bg: 'bg-surface', Icon: LineChart, iconClass: 'text-text-subtle' }

export interface SignalCardSignal {
  id?: string
  title: string
  description?: string
  severity?: string
  affected_count?: number | null
  sources?: readonly string[]
  trend?: string
  confidence?: { score: number } | null
  action?: string
  horizon?: string
}

export interface SignalCardProps {
  signal: SignalCardSignal
  tone?: 'urgent' | 'calm'
  showAction?: boolean
}

export default function SignalCard({ signal, tone = 'urgent', showAction = false }: SignalCardProps) {
  const isCalm = tone === 'calm'
  const style = isCalm ? calmStyle : (severityStyles[String(signal.severity ?? '').toLowerCase()] ?? severityStyles.info)
  const Icon = style.Icon

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${style.iconClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`text-sm font-semibold ${isCalm ? 'text-text-muted' : 'text-text'}`}>{signal.title}</h4>
            {isCalm && signal.horizon && (
              <span className="flex-shrink-0 text-[9.5px] font-semibold uppercase tracking-wide text-text-subtle tabular-nums">{signal.horizon}</span>
            )}
          </div>
          {signal.description && <p className="text-xs leading-relaxed mb-2 text-text-muted">{signal.description}</p>}
          {!isCalm && (signal.affected_count != null || signal.trend) && (
            <div className="flex items-center gap-3 text-xs text-text-muted">
              {signal.affected_count != null && <span className="font-medium">{signal.affected_count.toLocaleString()} members affected</span>}
              {signal.trend && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${signal.trend === 'worsening' ? 'bg-critical-100 text-critical-800' : 'bg-warning-100 text-warning-800'}`}>
                  {signal.trend}
                </span>
              )}
            </div>
          )}
          {showAction && signal.action && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-black/[0.06] bg-white/70 px-2.5 py-1.5">
              <ArrowRight className="mt-[3px] h-3 w-3 flex-shrink-0 text-text-subtle" />
              <p className="text-[11px] leading-snug text-text-muted">
                <span className="font-semibold uppercase tracking-wide text-[9.5px] text-text-subtle">Action</span>{' · '}{signal.action}
              </p>
            </div>
          )}
          {(signal.sources?.length || signal.confidence) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {signal.sources?.map((s, i) => <SourceBadge key={i} source={s} />)}
              {signal.confidence && (
                <span className="ml-auto text-[10px] font-semibold tabular-nums" style={{ color: colorFor(tierFor(signal.confidence.score)) }}>
                  Confidence {signal.confidence.score}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
