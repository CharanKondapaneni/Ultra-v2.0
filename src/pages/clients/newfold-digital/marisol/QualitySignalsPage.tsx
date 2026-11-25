import { useEffect, useState } from 'react'
import { fetchGeneric } from '@/api/newfold-digitalApi'
import CompliancePostureList from '@/components/CompliancePostureList'
import DisclosureTimelineHeatmap from '@/components/DisclosureTimelineHeatmap'
import RepeatContactCorrelation from '@/components/RepeatContactCorrelation'
import SentimentHeatmap from '@/components/SentimentHeatmap'
import QualityScoreDistribution from '@/components/QualityScoreDistribution'
import type { CompliancePostureListData } from '@/components/CompliancePostureList'
import type { DisclosureTimelineHeatmapData } from '@/components/DisclosureTimelineHeatmap'
import type { RepeatContactCorrelationData } from '@/components/RepeatContactCorrelation'
import type { SentimentHeatmapData } from '@/components/SentimentHeatmap'
import type { QualityScoreDistributionData } from '@/components/QualityScoreDistribution'

interface PageDataType {
  compliancePosture?: CompliancePostureListData
  disclosureTimeline?: DisclosureTimelineHeatmapData
  repeatContact?: RepeatContactCorrelationData
  sentimentHeatmap?: SentimentHeatmapData
  qualityScoreDistribution?: QualityScoreDistributionData
}


let inflightRequest: Promise<PageDataType | null> | null = null

function fetchPageData(): Promise<PageDataType | null> {
  if (inflightRequest) return inflightRequest
  inflightRequest = fetchGeneric<PageDataType>('marisol', [
      { component: 'CompliancePostureList',      variant: null },
      { component: 'DisclosureTimelineHeatmap',  variant: null },
      { component: 'RepeatContactCorrelation',   variant: null },
      { component: 'SentimentHeatmap',           variant: null },
      { component: 'QualityScoreDistribution',   variant: null },
    ])
    .then(res => {
      const raw = (res.visualization as { type: string; data: unknown }[])
        ?.reduce((acc, v) => {
          if (v.type === 'CompliancePostureList')     acc.compliancePosture        = v.data as CompliancePostureListData
          if (v.type === 'DisclosureTimelineHeatmap') acc.disclosureTimeline       = v.data as DisclosureTimelineHeatmapData
          if (v.type === 'RepeatContactCorrelation')  acc.repeatContact            = v.data as RepeatContactCorrelationData
          if (v.type === 'SentimentHeatmap')          acc.sentimentHeatmap         = v.data as SentimentHeatmapData
          if (v.type === 'QualityScoreDistribution')  acc.qualityScoreDistribution = v.data as QualityScoreDistributionData
          return acc
        }, {} as PageDataType) as PageDataType | undefined
      return raw ?? null
    })
    .catch(() => null)
    .finally(() => { inflightRequest = null })
  return inflightRequest
}

export default function QualitySignalsPage() {
  const [data, setData] = useState<PageDataType | null>(null)
  useEffect(() => { fetchPageData().then(setData) }, [])

  if (!data) return <div />
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl space-y-6">
      {data.compliancePosture && <CompliancePostureList data={data.compliancePosture} />}
      {data.disclosureTimeline && <DisclosureTimelineHeatmap data={data.disclosureTimeline} />}
      {data.repeatContact && <RepeatContactCorrelation data={data.repeatContact} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.sentimentHeatmap && <SentimentHeatmap data={data.sentimentHeatmap} />}
        {data.qualityScoreDistribution && <QualityScoreDistribution data={data.qualityScoreDistribution} />}
      </div>
    </div>
  )
}
