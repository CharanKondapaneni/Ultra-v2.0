import { motion } from 'framer-motion'
import { Zap, TrendingDown, Droplets, type LucideIcon } from 'lucide-react'

export interface ScenarioItem {
  id:          string
  name:        string
  description: string
  severity:    'low' | 'medium' | 'high'
}


const SEVERITY_STYLES: Record<string, { chip: string; activeBorder: string; activeChip: string }> = {
  high:   { chip: 'bg-critical-50 text-critical-700 border-critical-200', activeBorder: 'border-critical-400 ring-critical-200', activeChip: 'bg-critical-100 text-critical-700' },
  medium: { chip: 'bg-warning-50  text-warning-700  border-warning-200',  activeBorder: 'border-warning-400  ring-warning-200',  activeChip: 'bg-warning-100  text-warning-700'  },
  low:    { chip: 'bg-surface     text-text-muted   border-border-subtle', activeBorder: 'border-brand/40     ring-brand/20',     activeChip: 'bg-brand/8      text-brand'          },
}

const ICONS: Record<string, LucideIcon> = {
  high:   TrendingDown,
  medium: Droplets,
  low:    Zap,
}

interface Props {
  scenarios:   ScenarioItem[]
  activeId:    string | null
  loading:     boolean
  onSelect:    (s: ScenarioItem) => void
}

export default function ScenarioPickerStrip({ scenarios, activeId, loading, onSelect }: Props) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-subtle mb-2">Select a scenario to model</p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {scenarios.map((s, idx) => {
          const style  = SEVERITY_STYLES[s.severity] ?? SEVERITY_STYLES.medium
          const Icon   = ICONS[s.severity] ?? Zap
          const active = activeId === s.id
          const busy   = active && loading
          return (
            <motion.button
              key={s.id}
              type="button"
              onClick={() => !busy && onSelect(s)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className={`flex-shrink-0 w-[200px] text-left rounded-xl border p-3 transition-all duration-150
                ${active
                  ? `${style.activeBorder} ring-1 bg-surface shadow-sm`
                  : 'border-border-subtle bg-surface hover:border-brand/20 hover:shadow-sm'
                }
                ${busy ? 'opacity-60 cursor-wait' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${active ? style.activeChip : style.chip}`}>
                  <Icon className="w-3 h-3" />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${style.chip}`}>
                  {s.severity}
                </span>
              </div>
              <p className={`text-[11px] font-semibold leading-tight ${active ? 'text-text' : 'text-text-muted'}`}>{s.name}</p>
              <p className="text-[9.5px] text-text-subtle leading-snug mt-0.5 line-clamp-2">{s.description}</p>
              {busy && (
                <div className="mt-1.5 h-0.5 rounded-full bg-surface-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-brand/50 rounded-full"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
