import { useEffect, useState } from 'react'
import { fetchGeneric } from '@/api/newfold-digitalApi'
import ForceToLoadTable from '@/components/ForceToLoadTable'
import ShiftCoverageBar from '@/components/ShiftCoverageBar'
import MultiYearSurgeChart from '@/components/MultiYearSurgeChart'
import StaffingScenarioTable from '@/components/StaffingScenarioTable'
import BpoCapacityCard from '@/components/BpoCapacityCard'
import CohortRampCurve from '@/components/CohortRampCurve'
import type { ForceToLoadTableData } from '@/components/ForceToLoadTable'
import type { ShiftCoverageBarData } from '@/components/ShiftCoverageBar'
import type { MultiYearSurgeChartData } from '@/components/MultiYearSurgeChart'
import type { StaffingScenarioTableData } from '@/components/StaffingScenarioTable'
import type { BpoCapacityCardData } from '@/components/BpoCapacityCard'
import type { CohortRampCurveData } from '@/components/CohortRampCurve'

interface PageDataType {
  forceToLoad?: ForceToLoadTableData
  shiftCoverage?: ShiftCoverageBarData
  surgeChart?: MultiYearSurgeChartData
  staffingScenarios?: StaffingScenarioTableData
  bpoCapacity?: BpoCapacityCardData
  cohortRamp?: CohortRampCurveData
}

let inflightRequest: Promise<PageDataType | null> | null = null

function fetchPageData(): Promise<PageDataType | null> {
  if (inflightRequest) return inflightRequest
  inflightRequest = fetchGeneric<PageDataType>('marisol', [
      { component: 'ForceToLoadTable',      variant: null },
      { component: 'ShiftCoverageBar',      variant: null },
      { component: 'MultiYearSurgeChart',   variant: null },
      { component: 'StaffingScenarioTable', variant: null },
      { component: 'BpoCapacityCard',       variant: null },
      { component: 'CohortRampCurve',       variant: null },
    ])
    .then(res => {
      const raw = (res.visualization as { type: string; data: unknown }[])
        ?.reduce((acc, v) => {
          if (v.type === 'ForceToLoadTable')      acc.forceToLoad       = v.data as ForceToLoadTableData
          if (v.type === 'ShiftCoverageBar')      acc.shiftCoverage     = v.data as ShiftCoverageBarData
          if (v.type === 'MultiYearSurgeChart')   acc.surgeChart        = v.data as MultiYearSurgeChartData
          if (v.type === 'StaffingScenarioTable') acc.staffingScenarios = v.data as StaffingScenarioTableData
          if (v.type === 'BpoCapacityCard')       acc.bpoCapacity       = v.data as BpoCapacityCardData
          if (v.type === 'CohortRampCurve')       acc.cohortRamp        = v.data as CohortRampCurveData
          return acc
        }, {} as PageDataType) as PageDataType | undefined
      return raw ?? null
    })
    .catch(() => null)
    .finally(() => { inflightRequest = null })
  return inflightRequest
}

export default function WorkforceIntelligencePage() {
  const [data, setData] = useState<PageDataType | null>(null)
  useEffect(() => { fetchPageData().then(setData) }, [])

  if (!data) return <div />
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl space-y-6">
      {data.surgeChart && <MultiYearSurgeChart data={data.surgeChart} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.shiftCoverage && <ShiftCoverageBar data={data.shiftCoverage} />}
        {data.bpoCapacity && <BpoCapacityCard data={data.bpoCapacity} />}
      </div>
      {data.forceToLoad && <ForceToLoadTable data={data.forceToLoad} />}
      {data.staffingScenarios && <StaffingScenarioTable data={data.staffingScenarios} />}
      {data.cohortRamp && <CohortRampCurve data={data.cohortRamp} />}
    </div>
  )
}
