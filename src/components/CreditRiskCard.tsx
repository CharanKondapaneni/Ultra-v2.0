export interface CreditRiskCardData {
  title: string
  overallScore: string
  delinquencyRate30Day: number
  delinquencyRate60Day: number
  delinquencyRate90Day: number
  chargeOffRate: number
  comparedToIndustry: string
}

export default function CreditRiskCard({ data }: { data: CreditRiskCardData }) {
  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text">{data.title}</h3>
        <span className="px-2 py-0.5 rounded-full bg-success-50 text-success-800 text-[10px] font-semibold">
          {data.overallScore}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 rounded-lg bg-surface-2">
          <p className="text-lg font-bold text-text">{(data.delinquencyRate30Day * 100).toFixed(1)}%</p>
          <p className="text-[10px] text-text-muted">30-Day Delinquency</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-surface-2">
          <p className="text-lg font-bold text-text">{(data.delinquencyRate60Day * 100).toFixed(1)}%</p>
          <p className="text-[10px] text-text-muted">60-Day Delinquency</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-surface-2">
          <p className="text-lg font-bold text-text">{(data.delinquencyRate90Day * 100).toFixed(1)}%</p>
          <p className="text-[10px] text-text-muted">90-Day Delinquency</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-surface-2">
          <p className="text-lg font-bold text-text">{(data.chargeOffRate * 100).toFixed(2)}%</p>
          <p className="text-[10px] text-text-muted">Charge-Off Rate</p>
        </div>
      </div>
      <p className="text-[11px] text-text-subtle mt-3 text-center">{data.comparedToIndustry}</p>
    </div>
  )
}
