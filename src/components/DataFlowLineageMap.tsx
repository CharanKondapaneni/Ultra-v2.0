import { motion } from 'framer-motion'
import { Database, Cpu, TrendingUp, Monitor, AlertTriangle, ArrowRight, ChevronRight, type LucideIcon } from 'lucide-react'

const stageIcons: Record<string, LucideIcon> = {
  core:      Database,
  ledger:    Cpu,
  gl:        TrendingUp,
  snowflake: Database,
  tableau:   Monitor,
}

const riskStyles: Record<string, { badge: string; row: string }> = {
  high:   { badge: 'text-critical-800 bg-critical-50 border-critical-100', row: 'hover:bg-critical-50/60' },
  medium: { badge: 'text-warning-800 bg-warning-50 border-warning-100',   row: 'hover:bg-warning-50/60' },
  low:    { badge: 'text-text-muted bg-surface border-border-subtle',      row: 'hover:bg-surface-2' },
}

export interface LineageStage {
  key:       string
  name:      string
  subtitle?: string
  detail:    string
}

export interface LineageTransformation {
  label:      string
  documented: boolean
}

export interface LineageGapFigure {
  gap_id:     string
  figure_name: string
  dashboard:  string
  risk_level: string
}

export interface DataFlowLineageData {
  title?: string
  stages: LineageStage[]
  transformations: Record<string, LineageTransformation[]>
  metrics: {
    undocumented_points:      number
    figures_lacking_lineage:  number
    avg_reconstruction_hours: number
    gap_pct?:                 number
  }
  gaps: LineageGapFigure[]
}

interface Props {
  data:           DataFlowLineageData
  activeGapId?:   string | null
  onSelectGap?:   (gap: LineageGapFigure) => void
}

export default function DataFlowLineageMap({ data, activeGapId, onSelectGap }: Props) {
  const { stages = [], transformations = {}, metrics, gaps = [], title } = data

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-surface-2 rounded-xl p-4 border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-text-muted">{title}</p>
        <span className="text-[10px] font-semibold text-critical-800 bg-critical-50 border border-critical-100 px-1.5 py-0.5 rounded">
          {metrics?.undocumented_points ?? '—'} undocumented transforms
        </span>
      </div>

      {/* Flow rail */}
      <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
        {stages.map((stage, idx) => {
          const Icon = stageIcons[stage.key] ?? Database
          const stageTxs = transformations[stage.key] ?? []
          const hasUndocumented = stageTxs.some(t => !t.documented)
          const firstTx = stageTxs[0]
          return (
            <div key={stage.key} className="flex items-stretch gap-1 flex-shrink-0">
              <div className="w-[120px] rounded-lg border border-brand/20 bg-surface p-2.5 flex flex-col">
                <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center mb-1.5">
                  <Icon className="w-3.5 h-3.5 text-brand" />
                </div>
                <p className="text-[11px] font-bold text-text leading-tight">{stage.name}</p>
                {stage.subtitle && <p className="text-[9px] text-text-subtle font-medium leading-tight mt-0.5">{stage.subtitle}</p>}
                <p className="text-[9px] text-text-muted leading-snug mt-1">{stage.detail}</p>
              </div>

              {idx < stages.length - 1 && (
                <div className="flex flex-col items-center justify-center px-1 min-w-[96px]">
                  <ArrowRight className="w-4 h-4 text-text-subtle mb-1.5" />
                  {firstTx && (
                    <div className={`w-full rounded-md border px-1.5 py-1 flex flex-col items-center text-center ${
                      !hasUndocumented
                        ? 'border-success-200 bg-success-50 text-success-800'
                        : 'border-critical-200 bg-critical-50 text-critical-800'
                    }`}>
                      <div className="flex items-center gap-1">
                        {hasUndocumented && <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />}
                        <span className="text-[8.5px] font-semibold leading-tight">{firstTx.label}</span>
                      </div>
                      <span className="text-[7.5px] uppercase tracking-wide font-bold leading-tight mt-0.5">
                        {hasUndocumented ? `${stageTxs.filter(t => !t.documented).length} gap(s)` : 'Documented'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="bg-surface rounded-lg p-2 border border-border-subtle">
          <p className="text-[9px] uppercase text-text-subtle font-semibold">Figures w/o lineage</p>
          <p className="text-[13px] font-bold text-critical-600">{metrics?.figures_lacking_lineage ?? '—'}</p>
        </div>
        <div className="bg-surface rounded-lg p-2 border border-border-subtle">
          <p className="text-[9px] uppercase text-text-subtle font-semibold">Reconstruct / figure</p>
          <p className="text-[13px] font-bold text-warning-600">{metrics?.avg_reconstruction_hours ?? '—'} hrs</p>
        </div>
        <div className="bg-surface rounded-lg p-2 border border-border-subtle">
          <p className="text-[9px] uppercase text-text-subtle font-semibold">Undocumented transforms</p>
          <p className="text-[13px] font-bold text-brand">{metrics?.undocumented_points ?? '—'}</p>
        </div>
      </div>

      {/* Clickable gap figures */}
      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle mb-1.5">
          Highest-risk untraced figures
          {onSelectGap && <span className="ml-1 normal-case font-normal text-text-subtle/70">· click to investigate</span>}
        </p>
        <div className="space-y-1">
          {gaps.map(f => {
            const style = riskStyles[f.risk_level] ?? riskStyles.medium
            const isActive = activeGapId === f.gap_id
            return (
              <button
                key={f.gap_id}
                onClick={() => onSelectGap?.(f)}
                disabled={!onSelectGap}
                className={`w-full text-left flex items-center justify-between bg-surface rounded-lg px-2.5 py-1.5 border transition-all
                  ${isActive
                    ? 'border-brand/40 ring-1 ring-brand/20 bg-brand/5'
                    : `border-border-subtle ${style.row}`}
                  disabled:cursor-default`}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-text truncate">{f.figure_name}</p>
                  <p className="text-[9px] text-text-subtle">{f.dashboard}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${style.badge}`}>
                    {f.risk_level}
                  </span>
                  {onSelectGap && <ChevronRight className={`w-3 h-3 transition-colors ${isActive ? 'text-brand' : 'text-text-subtle'}`} />}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
