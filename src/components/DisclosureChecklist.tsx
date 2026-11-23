import { motion } from 'framer-motion'
import { Check, AlertTriangle, CircleDashed } from 'lucide-react'

const statusMeta = {
  delivered: { icon: Check,          dot: 'bg-success-600 border-success-600',     badge: 'bg-success-100 text-success-800 border border-success-300',     label: 'Delivered' },
  on_file:   { icon: Check,          dot: 'bg-success-600 border-success-600',     badge: 'bg-success-100 text-success-800 border border-success-300',     label: 'On file' },
  pending:   { icon: CircleDashed,   dot: 'bg-text-muted/40 border-text-muted/40', badge: 'bg-surface-2 text-text-muted border border-border-subtle',      label: 'Pending' },
  late:      { icon: AlertTriangle,  dot: 'bg-warning-500 border-warning-500',     badge: 'bg-warning-100 text-warning-800 border border-warning-300',     label: 'Late — cure' },
  past_due:  { icon: AlertTriangle,  dot: 'bg-critical-500 border-critical-500',   badge: 'bg-critical-100 text-critical-800 border border-critical-300',  label: 'Past due' },
}

export interface DisclosureChecklistItem {
  id: string
  disclosure: string
  regulation?: string
  required_by?: string
  status: keyof typeof statusMeta
}

export interface DisclosureChecklistData {
  title: string
  member_label?: string
  items: DisclosureChecklistItem[]
  footnote?: string
}

export default function DisclosureChecklist({ data }: { data: DisclosureChecklistData }) {
  const { title, member_label, items = [], footnote } = data
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-surface-2 rounded-xl p-4 border border-border-subtle"
    >
      <div className="mb-3">
        <p className="text-xs font-semibold text-text-muted">{title}</p>
        {member_label && <p className="text-[10px] text-text-subtle mt-0.5">{member_label}</p>}
      </div>

      <div className="space-y-1.5">
        {items.map((it, idx) => {
          const meta = statusMeta[it.status] ?? statusMeta.pending
          const Icon = meta.icon
          return (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              className="flex items-center gap-2.5 bg-surface rounded-lg px-3 py-2 border border-border-subtle"
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border ${meta.dot}`}>
                <Icon className="w-2.5 h-2.5 text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-text leading-tight">{it.disclosure}</p>
                {(it.regulation || it.required_by) && (
                  <p className="text-[9.5px] text-text-subtle leading-snug mt-0.5">
                    {[it.regulation, it.required_by].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${meta.badge}`}>
                {meta.label}
              </span>
            </motion.div>
          )
        })}
      </div>

      {footnote && <p className="text-[9.5px] text-text-subtle mt-2.5 leading-snug">{footnote}</p>}
    </motion.div>
  )
}
