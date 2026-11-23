import { useEffect, useState } from 'react'
import { fetchGeneric } from '@/api/ussfcuApi'
import PageWithChat from '@/components/chat/PageWithChat'
import ExhibitCard from '@/components/ExhibitCard'
import KpiCard, { type KpiCardData } from '@/components/KpiCard'
import RampBars from '@/components/RampBars'
import AssetGrowthChart, { type AssetGrowthData } from '@/components/AssetGrowthChart'
import CapitalGauge, { type CapitalGaugeData } from '@/components/CapitalGauge'
import LoanPortfolioDonut, { type LoanPortfolioData } from '@/components/LoanPortfolioDonut'
import StrategicOutlookTimeline, { type StrategicOutlookData } from '@/components/StrategicOutlookTimeline'

const CHIPS = [
  'Where does the business stand this morning?',
  'Show me membership and growth',
  'Trace net income back to source',
  'Draft the board briefing',
]

interface DepositsData {
  title:      string
  source:     string
  asOf:       string
  confidence: number
  total:      string
  segments:   { name: string; pct: number }[]
}

interface GeographyData {
  title:      string
  note:       string
  source:     string
  asOf:       string
  confidence: number
  regions:    { region: string; members: number }[]
}

interface PageData {
  kpis:          KpiCardData[]        | null
  assetGrowth:   AssetGrowthData      | null
  loanPortfolio: LoanPortfolioData    | null
  deposits:      DepositsData         | null
  geography:     GeographyData        | null
  capital:       CapitalGaugeData     | null
  outlook:       StrategicOutlookData | null
}

let inflightRequest: Promise<PageData> | null = null

function fetchPageData(): Promise<PageData> {
  if (inflightRequest) return inflightRequest
  inflightRequest = fetchGeneric('timothy', [
    { component: 'BusinessKpiRow',           variant: null },
    { component: 'AssetGrowthChart',         variant: null },
    { component: 'LoanPortfolioDonut',       variant: null },
    { component: 'DepositMix',               variant: null },
    { component: 'MemberGeography',          variant: null },
    { component: 'CapitalGauge',             variant: null },
    { component: 'StrategicOutlookTimeline', variant: null },
  ])
    .then(res => {
      const find = (type: string) =>
        (res.visualization as { type: string; data: unknown }[])?.find(v => v.type === type)?.data
      return {
        kpis:          (() => { const r = find('BusinessKpiRow'); return Array.isArray(r) ? r : (r as { kpis?: KpiCardData[] })?.kpis ?? null })(),
        assetGrowth:   find('AssetGrowthChart')         as AssetGrowthData      ?? null,
        loanPortfolio: find('LoanPortfolioDonut')       as LoanPortfolioData    ?? null,
        deposits:      find('DepositMix')               as DepositsData         ?? null,
        geography:     find('MemberGeography')          as GeographyData        ?? null,
        capital:       find('CapitalGauge')             as CapitalGaugeData     ?? null,
        outlook:       find('StrategicOutlookTimeline') as StrategicOutlookData ?? null,
      }
    })
    .catch(() => ({
      kpis: null, assetGrowth: null, loanPortfolio: null,
      deposits: null, geography: null, capital: null, outlook: null,
    }))
    .finally(() => { inflightRequest = null })
  return inflightRequest
}

export default function BusinessPerformancePage() {
  const [data, setData] = useState<PageData>({
    kpis: null, assetGrowth: null, loanPortfolio: null,
    deposits: null, geography: null, capital: null, outlook: null,
  })

  useEffect(() => {
    fetchPageData().then(setData)
  }, [])

  return (
    <PageWithChat persona="timothy" chips={CHIPS} placeholder="Ask about performance, assets, or the board briefing…">
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">Business Performance</h2>
        <p className="text-[12px] text-text-muted mb-5 max-w-2xl">
          The executive roll-up of USSFCU — assets and growth, loan portfolio, deposits, membership and geography,
          and capital — at board altitude, each exhibit shown with its source, as-of date, and confidence.
        </p>

        {/* KPI row */}
        {Array.isArray(data.kpis) && data.kpis.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {data.kpis.map(k => <KpiCard key={k.id} kpi={k} />)}
          </div>
        )}

        {/* Asset growth + capital */}
        {(data.assetGrowth || data.capital) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {data.assetGrowth && (
              <ExhibitCard className="lg:col-span-2" title={data.assetGrowth.title} source={data.assetGrowth.source} asOf={data.assetGrowth.asOf} confidence={data.assetGrowth.confidence}>
                <AssetGrowthChart data={data.assetGrowth} />
              </ExhibitCard>
            )}
            {data.capital && (
              <ExhibitCard title={data.capital.title} note={data.capital.note} source={data.capital.source} asOf={data.capital.asOf} confidence={data.capital.confidence}>
                <CapitalGauge data={data.capital} />
              </ExhibitCard>
            )}
          </div>
        )}

        {/* Loan portfolio + deposits + geography */}
        {(data.loanPortfolio || data.deposits || data.geography) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {data.loanPortfolio && (
              <ExhibitCard title={data.loanPortfolio.title} source={data.loanPortfolio.source} asOf={data.loanPortfolio.asOf} confidence={data.loanPortfolio.confidence}>
                <LoanPortfolioDonut data={data.loanPortfolio} />
              </ExhibitCard>
            )}
            {data.deposits && (
              <ExhibitCard title={data.deposits.title} note={`Total shares ${data.deposits.total}`} source={data.deposits.source} asOf={data.deposits.asOf} confidence={data.deposits.confidence}>
                <RampBars items={data.deposits.segments.map(s => ({ name: s.name, value: s.pct }))} valueFmt={it => `${it.value}%`} />
              </ExhibitCard>
            )}
            {data.geography && (
              <ExhibitCard title={data.geography.title} note={data.geography.note} source={data.geography.source} asOf={data.geography.asOf} confidence={data.geography.confidence}>
                <RampBars items={data.geography.regions.map(r => ({ name: r.region, value: r.members }))} valueFmt={it => it.value.toLocaleString()} />
              </ExhibitCard>
            )}
          </div>
        )}

        {/* Strategic outlook */}
        {data.outlook && (
          <ExhibitCard title={data.outlook.title} source={data.outlook.source} asOf={data.outlook.asOf} confidence={data.outlook.confidence}>
            <StrategicOutlookTimeline data={data.outlook} />
          </ExhibitCard>
        )}
      </div>
    </PageWithChat>
  )
}
