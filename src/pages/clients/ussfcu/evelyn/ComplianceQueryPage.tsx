import { useState, useEffect } from 'react'
import { fetchGeneric } from '@/api/ussfcuApi'
import ComplianceQueryCharacteristics, { type QueryFilters } from '@/components/ComplianceQueryCharacteristics'
import ComplianceDeepQueryResult, { type ComplianceDeepQueryResultData } from '@/components/ComplianceDeepQueryResult'
import RegulatoryTestPanel, { type RegulatoryTestPanelData } from '@/components/RegulatoryTestPanel'
import PageWithChat from '@/components/chat/PageWithChat'

const CHIPS = [
  'How many members match a set of characteristics?',
  'Apply the compliance tests to this population',
  'Did we lose these members to another lender?',
]

interface PageData {
  population: ComplianceDeepQueryResultData | null
  regulatoryTests: RegulatoryTestPanelData | null
}

let inflightRequest: Promise<PageData> | null = null

function fetchPageData(filters: QueryFilters): Promise<PageData> {
  if (inflightRequest) return inflightRequest
  inflightRequest = fetchGeneric('evelyn', [
    { component: 'ComplianceDeepQueryResult', variant: null },
    { component: 'RegulatoryTestPanel',       variant: null },
  ], { filters })
    .then(res => {
      const find = (type: string) =>
        (res.visualization as { type: string; data: unknown }[])?.find(v => v.type === type)?.data
      return {
        population:      find('ComplianceDeepQueryResult') as ComplianceDeepQueryResultData ?? null,
        regulatoryTests: find('RegulatoryTestPanel')       as RegulatoryTestPanelData ?? null,
      }
    })
    .catch(() => ({ population: null, regulatoryTests: null }))
    .finally(() => { inflightRequest = null })
  return inflightRequest
}

const DEFAULT_FILTERS: QueryFilters = {
  product:     'Mortgage',
  location:    'Virginia',
  age:         'Under 30',
  origination: 'Chose to originate',
  channel:     'Majority electronic',
  window:      'App → closing',
}

export default function ComplianceQueryPage() {
  const [data, setData] = useState<PageData>({ population: null, regulatoryTests: null })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchPageData(DEFAULT_FILTERS)
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  function handleRunQuery(filters: QueryFilters) {
    setLoading(true)
    fetchPageData(filters)
      .then(setData)
      .finally(() => setLoading(false))
  }

  return (
    <PageWithChat persona="evelyn" chips={CHIPS} placeholder="Ask a population question by characteristic…">
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">Compliance Deep Query</h2>
        <p className="text-[12px] text-text-muted mb-4 max-w-2xl">
          Build a question by characteristic across the core, origination, and the contact center. The layer returns one
          reconciled count with breakdowns, then applies the regulatory test each characteristic triggers — the question that
          used to take days of manual pulls across systems that do not talk.
        </p>

        <div className="space-y-4">
          <ComplianceQueryCharacteristics onRunQuery={handleRunQuery} loading={loading} />
          {data.population      && <ComplianceDeepQueryResult data={data.population} />}
          {data.regulatoryTests && <RegulatoryTestPanel       data={data.regulatoryTests} />}
        </div>
      </div>
    </PageWithChat>
  )
}
