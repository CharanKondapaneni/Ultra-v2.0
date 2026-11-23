import { motion } from 'framer-motion'
import { Users } from 'lucide-react'

const toneStyles: Record<string, string> = {
  good: 'text-success-600',
  warn: 'text-warning-600',
  info: 'text-brand',
}

export interface ComplianceCount {
  id: string
  value: string
  label: string
  tone: string
}

export interface ComplianceBreakdownRow {
  product_type: string
  matched: string | number
  originated: string | number
  withdrawn: string | number
  denied: string | number
}

export interface ComplianceDeepQueryResultData {
  title: string
  query_summary?: string
  total_match: string | number
  counts: ComplianceCount[]
  breakdown: ComplianceBreakdownRow[]
  footnote?: string
}

export default function ComplianceDeepQueryResult({ data }: { data: ComplianceDeepQueryResultData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-surface-2 rounded-xl p-4 border border-border-subtle"
    >
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-brand" />
        <p className="text-xs font-semibold text-text-muted">{data.title}</p>
      </div>
      {data.query_summary && (
        <p className="text-[10px] text-text-subtle mb-3">{data.query_summary}</p>
      )}

      <div className="flex items-stretch gap-2 mb-3">
        <div className="bg-surface rounded-lg border border-border-subtle px-4 py-3 flex flex-col justify-center">
          <span className="text-[26px] font-bold text-text leading-none">{data.total_match}</span>
          <span className="text-[9.5px] text-text-subtle font-medium mt-1">members match</span>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-2">
          {data.counts.map((c) => (
            <div key={c.id} className="bg-surface rounded-lg border border-border-subtle px-2.5 py-2 flex flex-col justify-center">
              <span className={`text-[15px] font-bold leading-none ${toneStyles[c.tone] ?? 'text-text'}`}>{c.value}</span>
              <span className="text-[9px] text-text-subtle font-medium leading-tight mt-1">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border-subtle overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-2">
              <th className="text-left py-2 px-3 font-semibold text-text-muted uppercase tracking-wider text-[9px]">Product Type</th>
              <th className="text-right py-2 px-2 font-semibold text-text-muted uppercase tracking-wider text-[9px]">Matched</th>
              <th className="text-right py-2 px-2 font-semibold text-text-muted uppercase tracking-wider text-[9px]">Originated</th>
              <th className="text-right py-2 px-2 font-semibold text-text-muted uppercase tracking-wider text-[9px]">Withdrawn</th>
              <th className="text-right py-2 px-3 font-semibold text-text-muted uppercase tracking-wider text-[9px]">Denied</th>
            </tr>
          </thead>
          <tbody>
            {data.breakdown.map((row) => (
              <tr key={row.product_type} className="border-b border-border-subtle last:border-0">
                <td className="py-2 px-3 text-text font-medium">{row.product_type}</td>
                <td className="py-2 px-2 text-right font-semibold text-text tabular-nums">{row.matched}</td>
                <td className="py-2 px-2 text-right text-success-600 tabular-nums">{row.originated}</td>
                <td className="py-2 px-2 text-right text-warning-600 tabular-nums">{row.withdrawn}</td>
                <td className="py-2 px-3 text-right text-text-muted tabular-nums">{row.denied}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.footnote && (
        <p className="text-[9.5px] text-text-subtle mt-2.5 leading-snug">{data.footnote}</p>
      )}
    </motion.div>
  )
}
