import { useEffect, useState } from 'react'
import { fetchGeneric } from '@/api/ussfcuApi'
import DataFlowLineageMap, { type DataFlowLineageData, type LineageGapFigure } from '@/components/DataFlowLineageMap'
import LineageGapDetail, { type LineageGapDetailData } from '@/components/LineageGapDetail'
import PageWithChat from '@/components/chat/PageWithChat'

const CHIPS = [
  'Show me the data flow from the core to Tableau',
  'Which board figures have no lineage?',
  'What would full lineage do for the audit?',
]

let inflightMap:    Promise<DataFlowLineageData | null>    | null = null
let inflightDetail: Promise<LineageGapDetailData | null>   | null = null

function fetchMap(): Promise<DataFlowLineageData | null> {
  if (inflightMap) return inflightMap
  inflightMap = fetchGeneric('sylvia', [{ component: 'DataFlowLineageMap', variant: null }])
    .then(res => {
      const found = (res.visualization as { type: string; data: unknown }[])
        ?.find(v => v.type === 'DataFlowLineageMap')?.data
      return (found as DataFlowLineageData) ?? null
    })
    .catch(() => null)
    .finally(() => { inflightMap = null })
  return inflightMap
}

function fetchGapDetail(gapId: string): Promise<LineageGapDetailData | null> {
  if (inflightDetail) return inflightDetail
  inflightDetail = fetchGeneric('sylvia', [{ component: 'LineageGapDetail', variant: null }], { filters: { gap_id: gapId } })
    .then(res => {
      const found = (res.visualization as { type: string; data: unknown }[])
        ?.find(v => v.type === 'LineageGapDetail')?.data
      return (found as LineageGapDetailData) ?? null
    })
    .catch(() => null)
    .finally(() => { inflightDetail = null })
  return inflightDetail
}

export default function DataFlowLineagePage() {
  const [mapData,    setMapData]    = useState<DataFlowLineageData | null>(null)
  const [detail,     setDetail]     = useState<LineageGapDetailData | null>(null)
  const [activeGap,  setActiveGap]  = useState<string | null>(null)
  const [loadingGap, setLoadingGap] = useState(false)

  useEffect(() => {
    fetchMap().then(d => { if (d) setMapData(d) })
  }, [])

  function handleSelectGap(gap: LineageGapFigure) {
    setActiveGap(gap.gap_id)
    setDetail(null)
    setLoadingGap(true)
    fetchGapDetail(gap.gap_id)
      .then(setDetail)
      .finally(() => setLoadingGap(false))
  }

  return (
    <PageWithChat persona="sylvia" chips={CHIPS} placeholder="Ask about lineage, transformations, or untraced figures…">
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">Data Flow &amp; Lineage</h2>
        <p className="text-[12px] text-text-muted mb-4 max-w-2xl">
          How every reported figure moves from the Jack Henry core and the Thought Machine ledger into the GL, Snowflake, and Tableau — with the undocumented transformation points and untraced figures the audit flagged.
        </p>

        <div className="space-y-4">
          {mapData && (
            <DataFlowLineageMap
              data={mapData}
              activeGapId={activeGap}
              onSelectGap={handleSelectGap}
            />
          )}

          <div className={`transition-opacity ${loadingGap ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {detail
              ? <LineageGapDetail data={detail} />
              : activeGap && !loadingGap
                ? null
                : null
            }
          </div>
        </div>
      </div>
    </PageWithChat>
  )
}
