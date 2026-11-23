import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

export interface CapitalGaugeData {
  title: string
  note: string
  source: string
  asOf: string
  confidence: number
  status: string
  netWorthRatio: number
  wellCapThreshold: number
}

export default function CapitalGauge({ data }: { data: CapitalGaugeData }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-2">
      <div className="flex items-center gap-1.5 text-success-600 mb-1">
        <ShieldCheck className="w-4 h-4" />
        <span className="text-[11px] font-semibold">{data.status}</span>
      </div>
      <p className="text-[46px] font-bold text-text leading-none tabular-nums">{data.netWorthRatio.toFixed(2)}%</p>
      <p className="text-[10px] text-text-subtle mt-1">Net worth ratio</p>
      <div className="w-full mt-4">
        <div className="relative h-2.5 rounded-full bg-surface-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(data.netWorthRatio / 10) * 100}%` }}
            transition={{ duration: 0.9 }}
            className="h-full rounded-full bg-brand"
          />
          <div className="absolute top-0 bottom-0" style={{ left: `${(data.wellCapThreshold / 10) * 100}%` }}>
            <div className="w-px h-full bg-success-500" />
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-text-subtle">0%</span>
          <span className="text-[9px] font-semibold text-success-600">{data.wellCapThreshold.toFixed(2)}% well-cap</span>
          <span className="text-[9px] text-text-subtle">10%</span>
        </div>
      </div>
    </div>
  )
}
