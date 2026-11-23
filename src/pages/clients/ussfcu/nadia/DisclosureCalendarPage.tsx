import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, FileWarning, FileCheck } from 'lucide-react'
import { fetchGeneric } from '@/api/ussfcuApi'
import DisclosureChecklist, { type DisclosureChecklistData } from '@/components/DisclosureChecklist'
import DisclosureCalendar, { type DisclosureCalendarData } from '@/components/DisclosureCalendar'
import PageWithChat from '@/components/chat/PageWithChat'

const CHIPS = [
  'Build the disclosure checklist and calendar',
  'Document the cure',
  'Generate the daily exception report',
]

export interface DisclosureFileItem {
  file_number: string
  member_name: string
  status: 'past_due' | 'late' | 'pending' | 'on_file'
  issue: string
}

interface FileListData {
  files: DisclosureFileItem[]
}

interface FileDetailData {
  checklist: DisclosureChecklistData | null
  calendar:  DisclosureCalendarData  | null
}

const statusStyles: Record<string, { border: string; bg: string; activeBg: string; icon: typeof AlertTriangle; iconColor: string; chip: string; label: string }> = {
  past_due: { border: 'border-critical-200', bg: 'bg-critical-50',  activeBg: 'bg-critical-100', icon: AlertTriangle, iconColor: 'text-critical-500', chip: 'bg-critical-100 text-critical-800', label: 'Past Due' },
  late:     { border: 'border-warning-200',  bg: 'bg-warning-50',   activeBg: 'bg-warning-100',  icon: FileWarning,   iconColor: 'text-warning-500',  chip: 'bg-warning-100 text-warning-800',  label: 'Late' },
  pending:  { border: 'border-border',       bg: 'bg-surface-2',    activeBg: 'bg-surface',      icon: FileWarning,   iconColor: 'text-text-muted',   chip: 'bg-bg text-text-muted',            label: 'Pending' },
  on_file:  { border: 'border-success-200',  bg: 'bg-success-50',   activeBg: 'bg-success-100',  icon: FileCheck,     iconColor: 'text-success-500',  chip: 'bg-success-100 text-success-800',  label: 'On File' },
}

let inflightList: Promise<FileListData> | null = null
let inflightDetail: Promise<FileDetailData> | null = null

function fetchFileList(): Promise<FileListData> {
  if (inflightList) return inflightList
  inflightList = fetchGeneric('nadia', [{ component: 'DisclosureFileList', variant: null }])
    .then(res => {
      const find = (type: string) =>
        (res.visualization as { type: string; data: unknown }[])?.find(v => v.type === type)?.data
      return (find('DisclosureFileList') as FileListData) ?? { files: [] }
    })
    .catch(() => ({ files: [] }))
    .finally(() => { inflightList = null })
  return inflightList
}

function fetchFileDetail(fileNumber: string): Promise<FileDetailData> {
  if (inflightDetail) return inflightDetail
  inflightDetail = fetchGeneric('nadia', [
    { component: 'DisclosureChecklist', variant: null },
    { component: 'DisclosureCalendar',  variant: null },
  ], { filters: { file_number: fileNumber } })
    .then(res => {
      const find = (type: string) =>
        (res.visualization as { type: string; data: unknown }[])?.find(v => v.type === type)?.data
      return {
        checklist: find('DisclosureChecklist') as DisclosureChecklistData ?? null,
        calendar:  find('DisclosureCalendar')  as DisclosureCalendarData  ?? null,
      }
    })
    .catch(() => ({ checklist: null, calendar: null }))
    .finally(() => { inflightDetail = null })
  return inflightDetail
}

export default function DisclosureCalendarPage() {
  const [files, setFiles]           = useState<DisclosureFileItem[]>([])
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [detail, setDetail]         = useState<FileDetailData>({ checklist: null, calendar: null })
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    fetchFileList().then(d => setFiles(d.files))
  }, [])

  function handleSelectFile(fileNumber: string) {
    setActiveFile(fileNumber)
    setDetail({ checklist: null, calendar: null })
    setLoading(true)
    fetchFileDetail(fileNumber)
      .then(setDetail)
      .finally(() => setLoading(false))
  }

  return (
    <PageWithChat persona="nadia" chips={CHIPS} placeholder="Ask about this file's disclosures or the cure…">
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">Disclosure Calendar</h2>
        <p className="text-[12px] text-text-muted mb-4 max-w-2xl">
          Files with open disclosure obligations. Click a file to see its checklist and calendar — late items are flagged for a documented cure.
        </p>

        <div className="grid md:grid-cols-[280px_1fr] gap-4 items-start">
          {/* File list */}
          <div className="space-y-2">
            {files.map((f, idx) => {
              const style = statusStyles[f.status] ?? statusStyles.pending
              const Icon = style.icon
              const isActive = activeFile === f.file_number
              return (
                <motion.button
                  key={f.file_number}
                  onClick={() => handleSelectFile(f.file_number)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.06 }}
                  className={`w-full text-left rounded-xl border ${style.border} p-3 transition-all
                    ${isActive ? `${style.activeBg} ring-1 ring-brand/30` : `${style.bg} hover:opacity-90`}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 ${style.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[12px] font-semibold text-text">File {f.file_number}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${style.chip}`}>
                          {style.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted leading-tight">{f.member_name}</p>
                      <p className="text-[10px] text-text-subtle leading-tight mt-0.5">{f.issue}</p>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Checklist + Calendar */}
          <div className={`space-y-4 transition-opacity ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {detail.checklist || detail.calendar
              ? <>
                  {detail.checklist && <DisclosureChecklist data={detail.checklist} />}
                  {detail.calendar  && <DisclosureCalendar  data={detail.calendar}  />}
                </>
              : <div className="bg-surface-2 rounded-xl border border-border-subtle p-6 flex items-center justify-center min-h-[200px]">
                  <p className="text-[11px] text-text-subtle">
                    {loading ? 'Loading…' : 'Select a file to view its disclosure checklist and calendar'}
                  </p>
                </div>
            }
          </div>
        </div>
      </div>
    </PageWithChat>
  )
}
