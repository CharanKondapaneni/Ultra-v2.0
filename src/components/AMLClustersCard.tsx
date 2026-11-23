export interface AmlCluster {
  cluster_id: string
  pattern: string
  total_amount: string
  accounts_involved: number
  risk_score: number
  sar_filed: boolean
}

export interface AMLClustersCardData {
  aml_clusters: {
    count: number
    severity: string
    clusters: AmlCluster[]
  }
}

export default function AMLClustersCard({ data }: { data: AMLClustersCardData }) {
  const { aml_clusters } = data
  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text">BSA/AML Clusters</h3>
          <p className="text-xs text-text-subtle mt-0.5">{aml_clusters.count} suspicious activity clusters</p>
        </div>
        <span className="px-2 py-1 rounded-full bg-critical-50 text-critical-800 text-[10px] font-semibold uppercase">
          {aml_clusters.severity}
        </span>
      </div>
      <div className="space-y-3">
        {aml_clusters.clusters.map(c => (
          <div key={c.cluster_id} className="p-3 rounded-lg bg-critical-50/50 border border-critical-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-text-subtle">{c.cluster_id}</span>
              <span className="text-[10px] font-bold text-critical-600">Risk: {c.risk_score}</span>
            </div>
            <p className="text-xs text-text font-medium mb-1">{c.pattern}</p>
            <div className="flex items-center justify-between text-[10px] text-text-muted">
              <span>{c.total_amount} | {c.accounts_involved} accounts</span>
              <span className={`font-medium ${c.sar_filed ? 'text-critical-500' : 'text-warning-500'}`}>
                {c.sar_filed ? 'SAR Filed' : 'Preliminary'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
