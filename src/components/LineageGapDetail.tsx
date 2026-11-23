import { motion } from 'framer-motion'
import { AlertTriangle, GitCompareArrows, FileWarning, CheckCircle2, ArrowRight } from 'lucide-react'

export interface LineageGapDetailData {
  gap_id:        string
  figure_name:   string
  dashboard:     string
  risk_level:    string
  gap_reason:    string
  break_at_stage: string        // stage_key where the trace breaks e.g. 'gl'
  gl_account?: {
    account_number: string
    account_name:   string
    account_type:   string
  }
  reconciliation?: {
    recon_date:    string
    gl_balance:    number
    sub_ledger_balance: number
    variance:      number
    variance_pct:  number
    reconciled:    boolean
    notes?:        string
  }
}

const riskStyles: Record<string, { border: string; bg: string; icon: typeof AlertTriangle; iconColor: string; chip: string }> = {
  high:   { border: 'border-critical-200', bg: 'bg-critical-50',  icon: AlertTriangle,      iconColor: 'text-critical-500', chip: 'bg-critical-100 text-critical-800' },
  medium: { border: 'border-warning-200',  bg: 'bg-warning-50',   icon: FileWarning,        iconColor: 'text-warning-500',  chip: 'bg-warning-100 text-warning-800' },
  low:    { border: 'border-border',       bg: 'bg-surface-2',    icon: GitCompareArrows,   iconColor: 'text-text-muted',   chip: 'bg-bg text-text-muted' },
}

const STAGE_LABELS: Record<string, string> = {
  core:      'Jack Henry Core',
  ledger:    'Thought Machine Ledger',
  gl:        'General Ledger',
  snowflake: 'Snowflake',
  tableau:   'Tableau',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default function LineageGapDetail({ data }: { data: LineageGapDetailData }) {
  const style = riskStyles[data.risk_level] ?? riskStyles.medium
  const Icon  = style.icon
  const r     = data.reconciliation

  return (
    <motion.div
      key={data.gap_id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border ${style.border} ${style.bg} p-4`}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5 mb-3">
        <div className={`mt-0.5 ${style.iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-bold text-text leading-tight">{data.figure_name}</p>
            <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${style.chip}`}>
              {data.risk_level} risk
            </span>
          </div>
          <p className="text-[10px] text-text-subtle mt-0.5">{data.dashboard}</p>
        </div>
      </div>

      {/* Break location */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {Object.keys(STAGE_LABELS).map((key, idx, arr) => {
          const isBreak = key === data.break_at_stage
          const isAfterBreak = arr.indexOf(key) > arr.indexOf(data.break_at_stage)
          return (
            <div key={key} className="flex items-center gap-1">
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                isBreak
                  ? 'bg-critical-100 border-critical-200 text-critical-800'
                  : isAfterBreak
                  ? 'bg-surface border-border-subtle text-text-subtle opacity-40'
                  : 'bg-surface border-border-subtle text-text-muted'
              }`}>
                {STAGE_LABELS[key]}
              </span>
              {idx < arr.length - 1 && (
                <ArrowRight className={`w-3 h-3 flex-shrink-0 ${isBreak ? 'text-critical-400' : isAfterBreak ? 'text-border opacity-40' : 'text-text-subtle'}`} />
              )}
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-text-muted mb-3 leading-snug">{data.gap_reason}</p>

      {/* GL account */}
      {data.gl_account && (
        <div className="bg-surface rounded-lg border border-border-subtle px-3 py-2 mb-2">
          <p className="text-[9px] uppercase tracking-wide font-semibold text-text-subtle mb-0.5">GL Account</p>
          <p className="text-[11px] font-semibold text-text">{data.gl_account.account_name}</p>
          <p className="text-[9.5px] text-text-muted">{data.gl_account.account_number} · {data.gl_account.account_type}</p>
        </div>
      )}

      {/* Reconciliation variance */}
      {r && (
        <div className="bg-surface rounded-lg border border-border-subtle px-3 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] uppercase tracking-wide font-semibold text-text-subtle">Last Reconciliation · {r.recon_date}</p>
            <div className="flex items-center gap-1">
              {r.reconciled
                ? <><CheckCircle2 className="w-3 h-3 text-success-500" /><span className="text-[9px] text-success-600 font-semibold">Reconciled</span></>
                : <><AlertTriangle className="w-3 h-3 text-critical-500" /><span className="text-[9px] text-critical-600 font-semibold">Unreconciled</span></>
              }
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[8.5px] text-text-subtle">GL Balance</p>
              <p className="text-[11px] font-bold text-text">{fmt(r.gl_balance)}</p>
            </div>
            <div>
              <p className="text-[8.5px] text-text-subtle">Sub-Ledger</p>
              <p className="text-[11px] font-bold text-text">{fmt(r.sub_ledger_balance)}</p>
            </div>
            <div>
              <p className="text-[8.5px] text-text-subtle">Variance</p>
              <p className={`text-[11px] font-bold ${r.variance !== 0 ? 'text-critical-600' : 'text-success-600'}`}>
                {fmt(Math.abs(r.variance))} ({(r.variance_pct * 100).toFixed(1)}%)
              </p>
            </div>
          </div>
          {r.notes && <p className="text-[9.5px] text-text-muted mt-1.5 leading-snug">{r.notes}</p>}
        </div>
      )}
    </motion.div>
  )
}
