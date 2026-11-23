import type { SignalCardSignal } from './SignalCard'

export interface CeoSignal extends SignalCardSignal {
  primary?: boolean
  metric_text?: string
  metrics?: {
    loan_to_share_pct?: number
    net_loan_growth_ytd_pct?: number
    share_growth_ytd_pct?: number
    pipeline_90day_usd?: number
    [key: string]: unknown
  }
}

export interface TrustWidgets {
  ncua_exam_readiness: { score: number; next_window?: string; state: string }
  pipeline_health: { state: string; summary: string }
  open_audit_issues: { state: string; open_count?: number; summary: string }
  lineage_on_demand: { state: string; summary: string }
}

export interface PrioritySignalsData {
  signals: CeoSignal[]
  trust: {
    data_trust_score: number
    validated_at?: string
    widgets: TrustWidgets
  }
}
