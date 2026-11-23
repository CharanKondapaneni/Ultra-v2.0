export interface RiskSignalAnomaly {
  anomaly_id: string
  pattern: string
  amount_range: string
  risk_score: number
  status: string
}

export interface RiskSignalsTableData {
  transaction_anomalies: {
    severity: string
    count: number
    details: RiskSignalAnomaly[]
  }
}

const STATUS_COLORS: Record<string, string> = {
  escalated:    'bg-critical-50 text-critical-800',
  under_review: 'bg-warning-50 text-warning-800',
  monitoring:   'bg-info-50 text-info-800',
}

const STATUS_LABELS: Record<string, string> = {
  escalated:    'Escalated',
  under_review: 'Under Review',
  monitoring:   'Monitoring',
}

export default function RiskSignalsTable({ data }: { data: RiskSignalsTableData }) {
  const { transaction_anomalies } = data
  const anomalies = transaction_anomalies.details.slice(0, 8)

  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text">Transaction Anomalies</h3>
          <p className="text-xs text-text-subtle mt-0.5">{transaction_anomalies.count} clusters detected this week</p>
        </div>
        <span className="px-2 py-1 rounded-full bg-critical-50 text-critical-800 text-[10px] font-semibold uppercase">
          {transaction_anomalies.severity}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left py-2 px-2 font-semibold text-text-muted uppercase tracking-wider text-[10px]">ID</th>
              <th className="text-left py-2 px-2 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Pattern</th>
              <th className="text-right py-2 px-2 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Amount</th>
              <th className="text-center py-2 px-2 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Risk</th>
              <th className="text-center py-2 px-2 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Status</th>
            </tr>
          </thead>
          <tbody>
            {anomalies.map(a => (
              <tr key={a.anomaly_id} className="border-b border-border-subtle hover:bg-surface-2/50 transition-colors">
                <td className="py-2.5 px-2 text-text-subtle font-mono text-[10px]">{a.anomaly_id}</td>
                <td className="py-2.5 px-2 text-text font-medium text-[11px] max-w-[180px] truncate">{a.pattern}</td>
                <td className="py-2.5 px-2 text-right text-text-muted text-[11px]">{a.amount_range}</td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`inline-block w-8 text-center px-1 py-0.5 rounded text-[10px] font-bold ${
                    a.risk_score >= 90 ? 'bg-critical-100 text-critical-800' :
                    a.risk_score >= 70 ? 'bg-warning-100 text-warning-800' :
                    'bg-surface-2 text-text-muted'
                  }`}>
                    {a.risk_score}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[a.status] ?? 'bg-surface-2 text-text-muted'}`}>
                    {STATUS_LABELS[a.status] ?? a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
