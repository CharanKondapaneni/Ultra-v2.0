import { useEffect, useState } from 'react'
import { fetchGeneric } from '@/api/penfedApi'
import RiskSignalsTable from '@/components/RiskSignalsTable'
import AMLClustersCard from '@/components/AMLClustersCard'
import CreditRiskCard from '@/components/CreditRiskCard'
import RegulatoryReadinessCard from '@/components/RegulatoryReadinessCard'
import ComplaintTrajectory from '@/components/ComplaintTrajectory'
import PageWithChat from '@/components/chat/PageWithChat'
import type { RiskSignalsTableData } from '@/components/RiskSignalsTable'
import type { AMLClustersCardData } from '@/components/AMLClustersCard'
import type { CreditRiskCardData } from '@/components/CreditRiskCard'
import type { RegulatoryReadinessCardData } from '@/components/RegulatoryReadinessCard'
import type { ComplaintTrajectoryData } from '@/components/ComplaintTrajectory'

interface PageDataType
  extends RiskSignalsTableData,
    AMLClustersCardData,
    ComplaintTrajectoryData {
  creditRiskPosture: CreditRiskCardData
  regulatoryReadiness: RegulatoryReadinessCardData
}

const CHIPS = [
  'What are the highest-risk transaction anomalies?',
  'Show me open regulatory findings',
  'How is the credit delinquency trending?',
  'Which AML clusters have SAR filings?',
]

let inflightRequest: Promise<PageDataType | null> | null = null

function fetchPageData(): Promise<PageDataType | null> {
  if (inflightRequest) return inflightRequest
  inflightRequest = fetchGeneric<PageDataType>('priya', [{ component: 'RiskSignalsTable', variant: null }])
    .then(res => {
      const raw = (res.visualization as { type: string; data: unknown }[])
        ?.find(v => v.type === 'RiskSignalsTable')?.data as PageDataType | undefined
      return raw ?? null
    })
    .catch(() => null)
    .finally(() => { inflightRequest = null })
  return inflightRequest
}

export default function RiskSignalsPage() {
  const [data, setData] = useState<PageDataType | null>(null)

  useEffect(() => {
    fetchPageData().then(setData)
  }, [])

  return (
    <PageWithChat persona="priya" chips={CHIPS} placeholder="Ask about risk signals…">
      {!data ? <div /> : (
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskSignalsTable data={data} />
            <AMLClustersCard data={data} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CreditRiskCard data={data.creditRiskPosture} />
            <RegulatoryReadinessCard data={data.regulatoryReadiness} />
            <ComplaintTrajectory data={data} />
          </div>
        </div>
      )}
    </PageWithChat>
  )
}
