import { motion } from 'framer-motion'
import {
  Database, Brain, Headphones, Cog, Users, Monitor,
  MessageCircle, Shield, TrendingUp, Cpu, Star,
  AlertTriangle, Route, FileText, ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface DataSource {
  id: string
  name: string
  description?: string
  icon?: string
  status?: 'connected' | 'partial'
  statusLabel?: string
  lastSync?: string
  recordCount?: number | null
  freshness?: string
  vendorAgnostic?: boolean
}

export interface DataSourcesGridData {
  sources: DataSource[]
  heading?: string
  subtitle?: string
}

const ICON_MAP: Record<string, LucideIcon> = {
  database:        Database,
  brain:           Brain,
  headphones:      Headphones,
  cog:             Cog,
  users:           Users,
  monitor:         Monitor,
  'message-circle': MessageCircle,
  shield:          Shield,
  'trending-up':   TrendingUp,
  cpu:             Cpu,
  star:            Star,
  'alert-triangle': AlertTriangle,
  route:           Route,
  'file-text':     FileText,
  'shield-check':  ShieldCheck,
}

function formatRecordCount(count: number | null | undefined): string {
  if (count == null) return '—'
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`
  return count.toString()
}

function formatSyncTime(isoString: string | undefined, asOf: number | null): string {
  const t = isoString ? new Date(isoString).getTime() : NaN
  if (Number.isNaN(t) || asOf == null) return '—'
  const diffMins = Math.max(0, Math.floor((asOf - t) / 60_000))
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  return `${Math.floor(diffMins / 60)}h ago`
}

export default function DataSourcesGrid({ data }: { data: DataSourcesGridData }) {
  const { sources, heading = 'Connected Data Sources', subtitle } = data
  const syncTimes = sources
    .map(ds => new Date(ds.lastSync ?? NaN).getTime())
    .filter(t => !Number.isNaN(t))
  const asOf = syncTimes.length ? Math.max(...syncTimes) : null

  const resolvedSubtitle = subtitle ?? `${sources.length} integrations powering the AI intelligence layer`

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text mb-1">{heading}</h2>
        <p className="text-sm text-text-subtle">{resolvedSubtitle}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {sources.map((ds, idx) => {
          const Icon = ICON_MAP[ds.icon ?? ''] ?? Database
          return (
            <motion.div
              key={ds.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
              className="bg-surface rounded-xl border border-border-subtle p-5 hover:shadow-md hover:border-border transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand/5 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <span className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                  ds.status === 'connected' ? 'text-success-600' : 'text-warning-600'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    ds.status === 'connected' ? 'bg-success-600' : 'bg-warning-500'
                  }`} />
                  {ds.statusLabel ?? (ds.status === 'connected' ? 'Connected' : 'Partial')}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-text mb-1.5 leading-tight">{ds.name}</h3>
              {ds.vendorAgnostic && (
                <span className="inline-block mb-1.5 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-text-muted">
                  Vendor-agnostic
                </span>
              )}
              <p className="text-xs text-text-muted leading-relaxed mb-4">{ds.description}</p>

              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <div className="text-[10px] text-text-subtle">
                  <span className="font-medium text-text-muted">{formatRecordCount(ds.recordCount)}</span> records
                </div>
                <div className="text-[10px] text-text-subtle">
                  Last sync: <span className="font-medium text-text-muted">{ds.freshness || formatSyncTime(ds.lastSync, asOf)}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
