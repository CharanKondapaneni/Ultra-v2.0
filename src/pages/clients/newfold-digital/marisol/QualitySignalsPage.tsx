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

const DUMMY: PageDataType = {
  compliancePosture: {
    items: [
      { item: 'Auto-renewal disclosure', status: 'At risk',   tone: 'critical', detail: '21% skip · macro reverted, remediation in flight' },
      { item: 'PCI payment verification', status: 'Monitored', tone: 'warning',  detail: '88% adherence · surfaced at the right step in Agent-Assist' },
      { item: 'Refund eligibility disclosure', status: 'At risk', tone: 'critical', detail: 'Bundled with the auto-renewal macro revert' },
      { item: 'WHOIS / registrant privacy', status: 'Compliant', tone: 'success', detail: 'Registrant PII held in-environment (governance layer)' },
    ],
  },
  disclosureTimeline: {
    title: 'Disclosure Completion Rate by Day',
    subtitle: 'Completion fell from 96% to 79% after the Nov 20 macro change.',
    referenceDay: 'Nov 20',
    referenceLabel: 'Macro change',
    callout: 'Auto-renewal macro revert on Nov 20 dropped disclosure rate by 17 pts.',
    disclosureByDay: [
      { day: 'Nov 18', rate: 96 },
      { day: 'Nov 19', rate: 95 },
      { day: 'Nov 20', rate: 87, macro: true },
      { day: 'Nov 21', rate: 82 },
      { day: 'Nov 22', rate: 80 },
      { day: 'Nov 23', rate: 79 },
      { day: 'Nov 24', rate: 79 },
    ],
    shiftHeatmap: [
      { shift: 'Morning (6am–2pm)',   skipRate: 14 },
      { shift: 'Afternoon (2pm–10pm)', skipRate: 28 },
      { shift: 'Night (10pm–6am)',    skipRate: 35 },
    ],
  },
  repeatContact: {
    title: 'Repeat Contact Driver Analysis',
    subtitle: 'One IT incident, an agent workaround, and a callback pattern — traced end to end.',
    chartLabel: 'REFUND FCR + ONE-STAR REVIEW OVERLAY — NOV 22 INFLECTION',
    referenceDay: 'Nov 22',
    referenceLabel: 'FCR drop',
    callout: '74% of 1-star refund reviews mention "refund not showing" — reviews up +34%.',
    correlationChain: [
      { node: 'IT billing-sync delay', detail: 'Logged Nov 22 · fix ETA Nov 30', tone: 'cause' },
      { node: 'Agent manual workaround', detail: 'Refund instructions instead of a real fix', tone: 'mid' },
      { node: 'Repeat contact + 1-star review', detail: "74% mention 'refund not showing' · reviews +34%", tone: 'effect' },
    ],
    repeatFcr: [
      { day: 'Nov 18', fcr: 81, reviewNeg: 8 },
      { day: 'Nov 19', fcr: 80, reviewNeg: 9 },
      { day: 'Nov 20', fcr: 79, reviewNeg: 11 },
      { day: 'Nov 21', fcr: 76, reviewNeg: 15 },
      { day: 'Nov 22', fcr: 70, reviewNeg: 24 },
      { day: 'Nov 23', fcr: 63, reviewNeg: 31 },
      { day: 'Nov 24', fcr: 59, reviewNeg: 36 },
    ],
  },
  sentimentHeatmap: {
    title: 'Sentiment Heatmap by Brand',
    rows: [
      { brand: 'Bluehost',      positive: 58, neutral: 27, negative: 15 },
      { brand: 'HostGator',     positive: 52, neutral: 28, negative: 20 },
      { brand: 'Network Sol.',  positive: 41, neutral: 31, negative: 28 },
      { brand: 'Web.com',       positive: 55, neutral: 30, negative: 15 },
      { brand: 'Domain.com',    positive: 63, neutral: 24, negative: 13 },
    ],
  },
  qualityScoreDistribution: {
    title: 'Quality-Score Distribution (agents)',
    bands: [
      { band: '<60',    pct: 8  },
      { band: '60–69',  pct: 14 },
      { band: '70–79',  pct: 23 },
      { band: '80–89',  pct: 31 },
      { band: '90–100', pct: 24 },
    ],
    footnote: 'Based on 4,210 evaluated interactions · trailing 30 days',
  },
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
  const [data, setData] = useState<PageDataType | null>(DUMMY)
  useEffect(() => { fetchPageData().then(d => { if (d) setData(d) }) }, [])

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
