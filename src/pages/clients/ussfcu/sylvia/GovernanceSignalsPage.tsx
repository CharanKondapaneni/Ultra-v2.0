import { useEffect, useState } from 'react'
import { fetchGeneric } from '@/api/ussfcuApi'
import GovernanceSignalsTable, { type GovernanceSignalsTableData } from '@/components/GovernanceSignalsTable'
import GovernanceKpiCards, { type GovernanceKpiCardsData } from '@/components/GovernanceKpiCards'
import PageWithChat from '@/components/chat/PageWithChat'

const CHIPS = [
  'Show me where the numbers break',
  'Show me the CFO and Lending parity gap',
  'Which board figures have no lineage?',
  'Generate the audit evidence package',
  'Draft the data-governance remediation plan',
]

interface PageData {
  signals: GovernanceSignalsTableData | null
  kpis:    GovernanceKpiCardsData    | null
}

let inflightRequest: Promise<PageData> | null = null

function fetchPageData(): Promise<PageData> {
  if (inflightRequest) return inflightRequest
  inflightRequest = fetchGeneric('sylvia', [
    { component: 'GovernanceSignalsTable', variant: null },
    { component: 'GovernanceKpiCards',     variant: null },
  ])
    .then(res => {
      const find = (type: string) =>
        (res.visualization as { type: string; data: unknown }[])?.find(v => v.type === type)?.data
      return {
        signals: find('GovernanceSignalsTable') as GovernanceSignalsTableData ?? null,
        kpis:    find('GovernanceKpiCards')     as GovernanceKpiCardsData     ?? null,
      }
    })
    .catch(() => ({ signals: null, kpis: null }))
    .finally(() => { inflightRequest = null })
  return inflightRequest
}

export default function GovernanceSignalsPage() {
  const [data, setData] = useState<PageData>({ signals: null, kpis: null })

  useEffect(() => {
    fetchPageData().then(setData)
  }, [])

  return (
    <PageWithChat persona="sylvia" chips={CHIPS} placeholder="Ask about reconciliation breaks, parity, or lineage…">
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">Governance Signals</h2>
        <p className="text-[12px] text-text-muted mb-4 max-w-2xl">
          Active data-governance and reconciliation signals across the GL, Thought Machine ledger, and Tableau — with parity gaps, lineage failures, and audit items surfaced before they become findings.
        </p>
        <div className="grid md:grid-cols-2 gap-4 items-start">
          {data.signals && <GovernanceSignalsTable data={data.signals} />}
          {data.kpis    && <GovernanceKpiCards     data={data.kpis}    />}
        </div>
      </div>
    </PageWithChat>
  )
}
