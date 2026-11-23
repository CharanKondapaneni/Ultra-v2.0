import { useEffect, useState } from 'react'
import { fetchGeneric } from '@/api/ussfcuApi'
import ScenarioPickerStrip, { type ScenarioItem } from '@/components/ScenarioPickerStrip'
import ScenarioImpactTable,  { type ScenarioImpactData }   from '@/components/ScenarioImpactTable'
import CapitalLiquidityGauges, { type CapitalLiquidityData } from '@/components/CapitalLiquidityGauges'
import PlaybookActionTable,  { type PlaybookActionData }   from '@/components/PlaybookActionTable'
import PageWithChat from '@/components/chat/PageWithChat'

const CHIPS = [
  'What happens to net worth in a 30-day shutdown?',
  'Which scenario breaches the delinquency parameter?',
  'Show me the playbook for a rate shock',
  'Compare shutdown vs deposit runoff impact',
]

const SCENARIOS: ScenarioItem[] = [
  { id: 'GOVERNMENT_SHUTDOWN',    name: 'Gov. Shutdown',        description: 'Federal payroll pause — no immediate rate impact',      severity: 'high'   },
  { id: 'RATE_HIKE_CYCLE',        name: 'Rate Hike +400bps',    description: '400bps hike over 18 months, compressing NIM and ARMs',  severity: 'high'   },
  { id: 'BANKING_SECTOR_STRESS',  name: 'Banking Sector Stress', description: 'Regional bank stress, flight to safety −50bps',        severity: 'medium' },
  { id: 'PANDEMIC_LIKE',          name: 'Pandemic-like Shock',  description: 'COVID-like emergency rate cuts −150bps',                severity: 'medium' },
]

interface ScenarioPageData {
  scenarioImpactTable:    ScenarioImpactData    | null
  capitalLiquidityGauges: CapitalLiquidityData  | null
  playbookActionTable:    PlaybookActionData     | null
}

let inflightDetail: Promise<ScenarioPageData> | null = null

function fetchScenarioData(scenarioId: string): Promise<ScenarioPageData> {
  inflightDetail = fetchGeneric('fiona', [
    { component: 'ScenarioImpactTable',    variant: null },
    { component: 'CapitalLiquidityGauges', variant: null },
    { component: 'PlaybookActionTable',    variant: null },
  ], { filters: { scenario_id: scenarioId } })
    .then(res => {
      const find = (type: string) =>
        (res.visualization as { type: string; data: unknown }[])?.find(v => v.type === type)?.data
      return {
        scenarioImpactTable:    find('ScenarioImpactTable')    as ScenarioImpactData   ?? null,
        capitalLiquidityGauges: find('CapitalLiquidityGauges') as CapitalLiquidityData ?? null,
        playbookActionTable:    find('PlaybookActionTable')     as PlaybookActionData   ?? null,
      }
    })
    .catch(() => ({ scenarioImpactTable: null, capitalLiquidityGauges: null, playbookActionTable: null }))
    .finally(() => { inflightDetail = null })
  return inflightDetail
}

export default function ScenariosPage() {
  const [activeId,      setActiveId]      = useState<string>(SCENARIOS[0].id)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detail,        setDetail]        = useState<ScenarioPageData>({
    scenarioImpactTable: null, capitalLiquidityGauges: null, playbookActionTable: null,
  })

  useEffect(() => {
    setLoadingDetail(true)
    fetchScenarioData(SCENARIOS[0].id)
      .then(setDetail)
      .finally(() => setLoadingDetail(false))
  }, [])

  function handleSelectScenario(s: ScenarioItem) {
    if (s.id === activeId && !loadingDetail) return
    setActiveId(s.id)
    setDetail({ scenarioImpactTable: null, capitalLiquidityGauges: null, playbookActionTable: null })
    setLoadingDetail(true)
    fetchScenarioData(s.id)
      .then(setDetail)
      .finally(() => setLoadingDetail(false))
  }

  return (
    <PageWithChat persona="fiona" chips={CHIPS} placeholder="Ask about scenarios, capital impact, or the playbook…">
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">Scenarios &amp; Modelling</h2>
        <p className="text-[12px] text-text-muted mb-5 max-w-2xl">
          Select a stress scenario to see its projected member impact, capital and liquidity cushion, and the board playbook band it activates.
        </p>

        <ScenarioPickerStrip
          scenarios={SCENARIOS}
          activeId={activeId}
          loading={loadingDetail}
          onSelect={handleSelectScenario}
        />

        <div className={`transition-opacity duration-200 ${loadingDetail ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          {detail.scenarioImpactTable    && <ScenarioImpactTable    data={detail.scenarioImpactTable} />}
          {detail.capitalLiquidityGauges && <CapitalLiquidityGauges data={detail.capitalLiquidityGauges} />}
          {detail.playbookActionTable    && <PlaybookActionTable    data={detail.playbookActionTable} />}
        </div>
      </div>
    </PageWithChat>
  )
}
