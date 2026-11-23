import { motion } from 'framer-motion'
import { AlertTriangle, TrendingDown, Activity, ChevronRight, LineChart, ClipboardCheck, CheckCircle2 } from 'lucide-react'
import type { ComponentType } from 'react'

export interface InsightSignal {
  id: string
  title: string
  severity?: string
  trend?: string
  badgeLabel?: string
  metric_text?: string
  confidence?: { score: number }
  chipText?: string
}

interface SeverityStyle {
  accent: string
  iconBg: string
  icon: ComponentType<{ className?: string }>
  iconColor: string
  badge: string
  badgeLabel: string
}

const severityConfig: Record<string, SeverityStyle> = {
  critical: {
    accent: 'bg-critical-500',
    iconBg: 'bg-critical-50',
    icon: AlertTriangle,
    iconColor: 'text-critical-500',
    badge: 'text-critical-800 bg-critical-50',
    badgeLabel: 'Critical',
  },
  warning: {
    accent: 'bg-warning-500',
    iconBg: 'bg-warning-50',
    icon: TrendingDown,
    iconColor: 'text-warning-500',
    badge: 'text-warning-800 bg-warning-50',
    badgeLabel: 'Warning',
  },
  info: {
    accent: 'bg-info-500',
    iconBg: 'bg-info-50',
    icon: Activity,
    iconColor: 'text-info-500',
    badge: 'text-info-800 bg-info-50',
    badgeLabel: 'Info',
  },
  watch: {
    accent: 'bg-text-subtle',
    iconBg: 'bg-surface-2',
    icon: LineChart,
    iconColor: 'text-text-muted',
    badge: 'text-text-muted bg-surface-2',
    badgeLabel: 'Watch',
  },
  review: {
    accent: 'bg-indigo-500',
    iconBg: 'bg-indigo-50',
    icon: ClipboardCheck,
    iconColor: 'text-indigo-500',
    badge: 'text-indigo-700 bg-indigo-50',
    badgeLabel: 'Review',
  },
  healthy: {
    accent: 'bg-success-500',
    iconBg: 'bg-success-50',
    icon: CheckCircle2,
    iconColor: 'text-success-500',
    badge: 'text-success-800 bg-success-50',
    badgeLabel: 'Healthy',
  },
}

function colorFor(score: number) {
  if (score >= 90) return '#16a34a'
  if (score >= 75) return '#d97706'
  return '#dc2626'
}

export interface InsightMiniCardProps {
  signal: InsightSignal
  onClick?: () => void
  index?: number
}

export default function InsightMiniCard({ signal, onClick, index = 0 }: InsightMiniCardProps) {
  const variantKey = String(signal.severity || signal.trend || 'info').toLowerCase()
  const config = severityConfig[variantKey] || severityConfig.info
  const Icon = config.icon

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
      onClick={onClick}
      className="flex-1 min-w-0 relative overflow-hidden rounded-xl bg-surface border border-border-subtle/80 text-left cursor-pointer group hover:shadow-[0_4px_16px_color-mix(in_srgb,var(--color-brand)_7%,transparent)] hover:border-brand/15 transition-all duration-200"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${config.accent}`} />

      <div className="px-3.5 py-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${config.iconBg}`}>
            <Icon className={`w-3 h-3 ${config.iconColor}`} />
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${config.badge}`}>
            {signal.badgeLabel || config.badgeLabel}
          </span>
        </div>

        <p className="text-[12px] font-semibold text-text leading-snug line-clamp-2 mb-1 group-hover:text-brand transition-colors">
          {signal.title}
        </p>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-text-subtle font-medium truncate">
            {signal.metric_text ?? ''}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {signal.confidence && (
              <span
                className="text-[10px] font-semibold tabular-nums"
                style={{ color: colorFor(signal.confidence.score) }}
              >
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
