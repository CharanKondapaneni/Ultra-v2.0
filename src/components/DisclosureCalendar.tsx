import { motion } from 'framer-motion'
import { CalendarDays, Flag } from 'lucide-react'

const statusBar: Record<string, string> = {
  on_time:   'bg-brand',
  scheduled: 'bg-brand',
  late:      'bg-warning-500',
  past_due:  'bg-critical-500',
}

const statusChip: Record<string, string> = {
  on_time:   'text-success-600',
  scheduled: 'text-brand',
  late:      'text-warning-600',
  past_due:  'text-critical-600',
}

export interface DisclosureMilestone {
  id: string
  name: string
  regulation?: string
  status: string
  span: [number, number]
}

export interface DisclosureCalendarData {
  title: string
  window_label?: string
  months: string[]
  milestones: DisclosureMilestone[]
  footnote?: string
}

export default function DisclosureCalendar({ data }: { data: DisclosureCalendarData }) {
  const { title, window_label, months = [], milestones = [], footnote } = data
  const cols = months.length || 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-surface-2 rounded-xl p-4 border border-border-subtle"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-brand" />
          <p className="text-xs font-semibold text-text-muted">{title}</p>
        </div>
        {window_label && (
          <span className="text-[9px] font-semibold text-brand bg-brand/5 border border-brand/15 px-1.5 py-0.5 rounded">
            {window_label}
          </span>
        )}
      </div>

      <div className="grid gap-1 mb-2 pl-[128px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {months.map((m) => (
          <div key={m} className="text-center">
            <span className="text-[8.5px] font-semibold text-text-subtle">{m}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {milestones.map((ms) => {
          const startPct = (ms.span[0] / cols) * 100
          const widthPct = ((ms.span[1] - ms.span[0]) / cols) * 100
          const isFlagged = ms.status === 'past_due' || ms.status === 'late'
          return (
            <div key={ms.id} className="flex items-center gap-2">
              <div className="w-[124px] flex-shrink-0">
                <p className="text-[11px] font-bold text-text leading-tight truncate">{ms.name}</p>
                {ms.regulation && (
                  <p className={`text-[8.5px] font-semibold leading-tight ${statusChip[ms.status] ?? 'text-text-subtle'}`}>
                    {ms.regulation}
                  </p>
                )}
              </div>
              <div className="flex-1 relative h-6">
                <div className="absolute inset-0 rounded-md bg-surface" />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{ left: `${startPct}%` }}
                  className={`absolute top-0 h-6 rounded-md ${statusBar[ms.status] ?? statusBar.on_time} flex items-center px-2 gap-1`}
                >
                  {isFlagged && <Flag className="w-2.5 h-2.5 text-white flex-shrink-0" />}
                  <span className="text-[8.5px] font-semibold text-white truncate capitalize">
                    {ms.status.replace('_', ' ')}
                  </span>
                </motion.div>
              </div>
            </div>
          )
        })}
      </div>

      {footnote && <p className="text-[9.5px] text-text-subtle mt-3 leading-snug">{footnote}</p>}
    </motion.div>
  )
}
