import { motion } from 'framer-motion'
import { ClipboardList, GitCompareArrows, FileWarning, ShieldCheck } from 'lucide-react'

export interface GovernanceKpi {
  id:    string
  label: string
  value: string
  sub:   string
  tone:  'red' | 'amber' | 'green'
}

export interface GovernanceKpiCardsData {
  kpis:                  GovernanceKpi[]
  traceability_pct:      number
  traceability_footnote: string
}

const toneStyles: Record<string, string> = {
  red:   'text-critical-600 bg-critical-500/10',
  amber: 'text-warning-600  bg-warning-500/10',
  green: 'text-success-600  bg-success-500/10',
}

const iconMap: Record<string, typeof ClipboardList> = {
  audit:   ClipboardList,
  breaks:  GitCompareArrows,
  parity:  GitCompareArrows,
  lineage: FileWarning,
}

export default function GovernanceKpiCards({ data }: { data: GovernanceKpiCardsData }) {
  const { kpis, traceability_pct, traceability_footnote } = data
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((k, idx) => {
          const Icon = iconMap[k.id] ?? ClipboardList
          return (
            <motion.div
              key={k.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              className="bg-surface rounded-xl border border-border-subtle p-3.5"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${toneStyles[k.tone] ?? toneStyles.amber}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-[17px] font-bold text-text leading-none">{k.value}</p>
              <p className="text-[11px] text-text-muted font-medium mt-1 leading-tight">{k.label}</p>
              <p className="text-[9px] text-text-subtle mt-1">{k.sub}</p>
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2 }}
        className="bg-surface rounded-xl border border-border-subtle p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-brand" />
          <p className="text-xs font-semibold text-text-muted">Audit-Evidence Readiness</p>
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-wide font-semibold text-text-subtle">Traceability coverage</span>
          <span className="text-[12px] font-bold text-text">{traceability_pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-surface-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${traceability_pct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="h-full rounded-full bg-brand"
          />
        </div>
        <p className="text-[10px] text-text-subtle mt-2 leading-snug">{traceability_footnote}</p>
      </motion.div>
    </div>
  )
}
