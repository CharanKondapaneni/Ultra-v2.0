import { motion } from 'framer-motion'
import { AlertTriangle, FileWarning, MessageSquareWarning } from 'lucide-react'
import FileTimeline, { type FileTimelineData } from './FileTimeline'

const severityStyles: Record<string, { border: string; bg: string; activeBg: string; iconClass: string; chip: string; Icon: typeof AlertTriangle }> = {
  critical: { border: 'border-critical-200', bg: 'bg-critical-50', activeBg: 'bg-critical-100', iconClass: 'text-critical-500', chip: 'bg-critical-100 text-critical-800', Icon: AlertTriangle },
  warning:  { border: 'border-warning-200',  bg: 'bg-warning-50',  activeBg: 'bg-warning-100',  iconClass: 'text-warning-500',  chip: 'bg-warning-100 text-warning-800',  Icon: FileWarning },
}

const kindIcon: Record<string, typeof AlertTriangle> = {
  'call-4471': MessageSquareWarning,
}

export interface FileException {
  id: string
  file: string
  severity: string
  rule: string
  detail: string
}

export interface FileExceptionQueueData {
  title?: string
  subtitle: string
  exceptions: FileException[]
}

export interface FileExceptionQueueProps {
  exceptions: FileExceptionQueueData
  timeline: FileTimelineData | null
  activeFileId: string | null
  loadingTimeline: boolean
  onSelectFile: (ex: FileException) => void
}

export default function FileExceptionQueue({ exceptions, timeline, activeFileId, loadingTimeline, onSelectFile }: FileExceptionQueueProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4 items-start">
      <div className="space-y-3">
        {exceptions.exceptions.map((ex, idx) => {
          const style = severityStyles[ex.severity] ?? severityStyles.warning
          const Icon = kindIcon[ex.id] ?? style.Icon
          const isActive = activeFileId === ex.id
          return (
            <motion.button
              key={ex.id}
              onClick={() => onSelectFile(ex)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className={`w-full text-left rounded-xl border ${style.border} p-4 transition-all
                ${isActive ? `${style.activeBg} ring-1 ring-brand/30` : `${style.bg} hover:opacity-90`}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${style.iconClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-text">{ex.file}</h4>
                    <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${style.chip}`}>
                      {ex.severity}
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle mb-1">{ex.rule}</p>
                  <p className="text-xs leading-relaxed text-text-muted">{ex.detail}</p>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      <div className={`transition-opacity ${loadingTimeline ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        {timeline
          ? <FileTimeline data={timeline} />
          : <div className="bg-surface-2 rounded-xl border border-border-subtle p-6 flex items-center justify-center min-h-[200px]">
              <p className="text-[11px] text-text-subtle">
                {loadingTimeline ? 'Loading timeline…' : 'Select a file to view its timeline'}
              </p>
            </div>
        }
      </div>
    </div>
  )
}
