import { motion } from 'framer-motion'
import IllustrativeDataChip from '@/components/IllustrativeDataChip'
import type { ReactNode } from 'react'

export interface HsePageHeaderData {
  title: string
  subtitle?: string
  asOf?: string
  illustrative?: boolean
}

export default function HsePageHeader({ data, children }: { data: HsePageHeaderData; children?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border-subtle bg-surface p-5 mb-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-text tracking-tight">{data.title}</h2>
          {data.subtitle && <p className="text-[13px] text-text-muted mt-1 leading-relaxed max-w-3xl">{data.subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {data.asOf && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10px] font-medium text-text-muted whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
              Updated {data.asOf}
            </span>
          )}
          {(data.illustrative ?? true) && <IllustrativeDataChip />}
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </motion.div>
  )
}
