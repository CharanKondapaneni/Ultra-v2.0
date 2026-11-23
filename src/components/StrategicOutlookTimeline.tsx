import { motion } from 'framer-motion'
import { CheckCircle2, Circle } from 'lucide-react'

const GOLD = '#C2A24C'

export interface OutlookMilestone {
  label: string
  when: string
  state: string
}

export interface StrategicOutlookData {
  title: string
  source: string
  asOf: string
  confidence: number
  milestones: OutlookMilestone[]
}

export default function StrategicOutlookTimeline({ data }: { data: StrategicOutlookData }) {
  const currentIdx = data.milestones.findIndex(m => m.state === 'current')
  const progressPct = currentIdx >= 0 ? (currentIdx / (data.milestones.length - 1)) * 100 : 0

  return (
    <div className="pt-4 pb-2 px-2">
      <div className="relative">
        <div className="absolute left-0 right-0 top-[7px] h-1 rounded-full bg-surface-2" />
        <motion.div
          className="absolute left-0 top-[7px] h-1 rounded-full"
          style={{ background: GOLD }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
        <div className="relative flex justify-between">
          {data.milestones.map(m => {
            const done = m.state === 'done'
            const current = m.state === 'current'
            return (
              <div key={m.label} className="flex flex-col items-center text-center" style={{ width: `${100 / data.milestones.length}%` }}>
                <div className={`w-[15px] h-[15px] rounded-full flex items-center justify-center ${done ? 'bg-[#C2A24C]' : current ? 'bg-brand' : 'bg-surface border-2 border-border'}`}>
                  {done ? <CheckCircle2 className="w-3 h-3 text-white" /> : current ? <Circle className="w-2 h-2 text-white fill-white" /> : null}
                </div>
                <span className={`text-[10px] mt-2 leading-tight ${current ? 'font-semibold text-brand' : 'text-text-muted'}`}>{m.label}</span>
                <span className="text-[9px] text-text-subtle mt-0.5">{m.when}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
