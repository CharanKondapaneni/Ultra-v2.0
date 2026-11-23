import { useEffect, useState } from 'react'
import { fetchGeneric } from '@/api/ussfcuApi'
import FileExceptionQueue, { type FileExceptionQueueData, type FileException } from '@/components/FileExceptionQueue'
import FileTimeline, { type FileTimelineData } from '@/components/FileTimeline'
import PageWithChat from '@/components/chat/PageWithChat'

const CHIPS = [
  "Show me today's file exceptions",
  'Open a member file and build its timeline',
  'Run the compliance tests on this file',
]

interface QueueData {
  exceptions: FileExceptionQueueData | null
}

interface TimelineData {
  timeline: FileTimelineData | null
}

let inflightQueue: Promise<QueueData> | null = null
let inflightTimeline: Promise<TimelineData> | null = null

function fetchQueue(): Promise<QueueData> {
  if (inflightQueue) return inflightQueue
  inflightQueue = fetchGeneric('nadia', [{ component: 'FileExceptionQueue', variant: null }])
    .then(res => {
      const find = (type: string) =>
        (res.visualization as { type: string; data: unknown }[])?.find(v => v.type === type)?.data
      return { exceptions: find('FileExceptionQueue') as FileExceptionQueueData ?? null }
    })
    .catch(() => ({ exceptions: null }))
    .finally(() => { inflightQueue = null })
  return inflightQueue
}

function fetchTimeline(fileId: string): Promise<TimelineData> {
  if (inflightTimeline) return inflightTimeline
  inflightTimeline = fetchGeneric('nadia', [{ component: 'FileTimeline', variant: null }], { filters: { file_number: fileId } })
    .then(res => {
      const find = (type: string) =>
        (res.visualization as { type: string; data: unknown }[])?.find(v => v.type === type)?.data
      return { timeline: find('FileTimeline') as FileTimelineData ?? null }
    })
    .catch(() => ({ timeline: null }))
    .finally(() => { inflightTimeline = null })
  return inflightTimeline
}

export default function ComplianceQueryPage() {
  const [exceptions, setExceptions] = useState<FileExceptionQueueData | null>(null)
  const [timeline, setTimeline]     = useState<FileTimelineData | null>(null)
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [loadingTimeline, setLoadingTimeline] = useState(false)

  useEffect(() => {
    fetchQueue().then(d => setExceptions(d.exceptions))
  }, [])

  function handleSelectFile(ex: FileException) {
    setActiveFile(ex.id)
    setTimeline(null)
    setLoadingTimeline(true)
    fetchTimeline(ex.id)
      .then(d => setTimeline(d.timeline))
      .finally(() => setLoadingTimeline(false))
  }

  return (
    <PageWithChat persona="nadia" chips={CHIPS} placeholder="Open a file, run the tests, or build a timeline…">
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">Compliance Query — File Exceptions</h2>
        <p className="text-[12px] text-text-muted mb-4 max-w-2xl">
          {exceptions?.subtitle ?? "Today's file-level exception queue."} Click a file to load its assembled timeline from MeridianLink and the contact center.
        </p>

        {exceptions && (
          <FileExceptionQueue
            exceptions={exceptions}
            timeline={timeline}
            activeFileId={activeFile}
            loadingTimeline={loadingTimeline}
            onSelectFile={handleSelectFile}
          />
        )}
      </div>
    </PageWithChat>
  )
}
