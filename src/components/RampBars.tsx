import { motion } from 'framer-motion'

function ramp(i: number, n: number) {
  const t = n <= 1 ? 0 : i / (n - 1)
  const a = [0x00, 0x30, 0x87]
  const b = [0xc2, 0xa2, 0x4c]
  const m = a.map((c, k) => Math.round(c + (b[k] - c) * t))
  return `rgb(${m[0]},${m[1]},${m[2]})`
}

export interface RampItem {
  name: string
  value: number
}

export interface RampBarsProps {
  items: RampItem[]
  valueFmt: (it: RampItem) => string
}

export default function RampBars({ items, valueFmt }: RampBarsProps) {
  const max = Math.max(...items.map(it => it.value))
  return (
    <div className="space-y-2.5">
      {items.map((it, idx) => (
        <div key={it.name}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-text-muted truncate pr-2">{it.name}</span>
            <span className="text-[11px] font-semibold text-text tabular-nums flex-shrink-0">{valueFmt(it)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(it.value / max) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.05 }}
              className="h-full rounded-full"
              style={{ background: ramp(idx, items.length) }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
