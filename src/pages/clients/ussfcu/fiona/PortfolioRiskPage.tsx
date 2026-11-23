import { useEffect, useState } from 'react'
import { fetchGeneric } from '@/api/ussfcuApi'
import FinanceKpiRow, { type FinanceKpiRowData } from '@/components/FinanceKpiRow'
import PortfolioLimitChart, { type PortfolioLimitChartData } from '@/components/PortfolioLimitChart'
import DelinquencyTrend, { type DelinquencyTrendData } from '@/components/DelinquencyTrend'
import PageWithChat from '@/components/chat/PageWithChat'

const CHIPS = [
  'Show me portfolios against board limits',
  'Which portfolio is nearest its cap?',
  'Show me delinquency by loan segment',
  'When does first mortgage hit its limit?',
]

interface PageData {
  financeKpiRow:       FinanceKpiRowData       | null
  portfolioLimitChart: PortfolioLimitChartData | null
  delinquencyTrend:    DelinquencyTrendData    | null
}

let inflightRequest: Promise<PageData> | null = null

function fetchPageData(): Promise<PageData> {
  if (inflightRequest) return inflightRequest
  inflightRequest = fetchGeneric('fiona', [
    { component: 'FinanceKpiRow',       variant: null },
    { component: 'PortfolioLimitChart', variant: null },
    { component: 'DelinquencyTrend',    variant: null },
  ])
    .then(res => {
      const find = (type: string) =>
        (res.visualization as { type: string; data: unknown }[])?.find(v => v.type === type)?.data
      return {
        financeKpiRow:       find('FinanceKpiRow')       as FinanceKpiRowData       ?? null,
        portfolioLimitChart: find('PortfolioLimitChart') as PortfolioLimitChartData ?? null,
        delinquencyTrend:    find('DelinquencyTrend')    as DelinquencyTrendData    ?? null,
      }
    })
    .catch(() => ({ financeKpiRow: null, portfolioLimitChart: null, delinquencyTrend: null }))
    .finally(() => { inflightRequest = null })
  return inflightRequest
}

export default function PortfolioRiskPage() {
  const [data, setData] = useState<PageData>({ financeKpiRow: null, portfolioLimitChart: null, delinquencyTrend: null })

  useEffect(() => {
    fetchPageData().then(setData)
  }, [])

  return (
    <PageWithChat persona="fiona" chips={CHIPS} placeholder="Ask about portfolio limits, delinquency, or headroom…">
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">Portfolio &amp; Limits</h2>
        <p className="text-[12px] text-text-muted mb-4 max-w-2xl">
          Every portfolio measured against its board risk-tolerance limit, with headroom shaded and a projection marker showing when first mortgage hits its cap at the current pace.
        </p>
        {data.financeKpiRow       && <FinanceKpiRow       data={data.financeKpiRow} />}
        {data.portfolioLimitChart && <PortfolioLimitChart data={data.portfolioLimitChart} />}
        {data.delinquencyTrend    && <DelinquencyTrend    data={data.delinquencyTrend} />}
      </div>
    </PageWithChat>
  )
}
