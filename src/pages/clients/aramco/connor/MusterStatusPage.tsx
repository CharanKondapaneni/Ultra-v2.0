import { useEffect, useState } from 'react'
import { fetchGeneric } from '@/api/aramcoApi'
import HsePageHeader from '@/components/HsePageHeader'
import MusterBoard from '@/components/MusterBoard'
import type { MusterBoardData } from '@/components/MusterBoard'

type PageDataType = MusterBoardData

const DUMMY: PageDataType = {
  stateLabel: 'Muster Drill in Progress',
  accounted: 2384,
  total: 2412,
  unaccounted: 28,
  elapsedSeconds: 90,
  unaccountedNote: 'All from the earlier reconciliation gap — no new gaps opened at the alarm.',
  control: {
    total: 2412,
    control: {
      notStarted: 9,
      mustering: 19,
      mustered: 2384,
      status: 'running',
      gateMovementsIn: 0,
      gateMovementsOut: 0,
      lockdownNote: 'zero movements is the assertion that the denominator is trustworthy.',
      durationLabel: '4 min 22 sec',
    },
  },
  zones: [
    { id: 'a', name: 'Muster Point A — North',        coversZones: ['Unit 1 — Crude Distillation', 'Tank Farm North'],            accounted: 612, expected: 618, capacity: 800 },
    { id: 'b', name: 'Muster Point B — Central',      coversZones: ['Unit 2 — Hydrocracker', 'Utilities and Flare'],              accounted: 681, expected: 685, capacity: 800 },
    { id: 'c', name: 'Muster Point C — East',         coversZones: ['Unit 3 — Coker', 'Unit 4 — Sulphur Recovery'],              accounted: 624, expected: 630, capacity: 800 },
    { id: 'd', name: 'Muster Point D — South',        coversZones: ['Tank Farm South', 'Marine Loading'],                        accounted: 256, expected: 260, capacity: 400 },
    { id: 'e', name: 'Muster Point E — Admin and Gate', coversZones: ['Central Admin and Control', 'West Gate', 'Parking Muster Point'], accounted: 211, expected: 219, capacity: 400 },
  ],
  unaccountedGroups: [
    {
      id: 'g1',
      count: 19,
      label: 'Near the west gate',
      detail: 'Location signal stale over 10 minutes. Most likely tags left in vehicles.',
      lastKnown: 'West Gate perimeter',
      priority: 'low',
    },
    {
      id: 'g2',
      count: 7,
      label: 'At the parking muster point, not yet checked in',
      detail: 'Present at the muster point but not yet registered by a warden.',
      lastKnown: 'Parking Muster Point',
      priority: 'medium',
    },
    {
      id: 'g3',
      count: 2,
      label: 'No signal in the last 10 minutes',
      detail: 'Need eyes on them first. Nearest camera shows no presence in that area since 06:44.',
      lastKnown: 'Unit 4 sulphur recovery boundary, last fix 06:41',
      priority: 'high',
    },
  ],
  projection: {
    fullAccountingMinutes: 3,
    basis: 'Current check-in rate across all muster points',
    confidence: 90,
  },
  measuredCompletion: {
    label: '2:47',
    target: 'Under 5:00, All Accounted',
    basis: 'Time from alarm to all personnel accounted, measured by TrackLynk across all five muster points.',
    priorDrill: 'Not measured —',
    note: 'the site had no instrumented figure before this drill. This closes an open follow-up from the intake: the last drill\'s completion time was recorded only as "felt too long". A measured, defensible number is the point — a muster that cannot be timed cannot be improved.',
  },
}

let inflightRequest: Promise<PageDataType | null> | null = null

function fetchPageData(): Promise<PageDataType | null> {
  if (inflightRequest) return inflightRequest
  inflightRequest = fetchGeneric<PageDataType>('connor', [{ component: 'MusterBoard', variant: null }])
    .then(res => {
      const raw = (res.visualization as { type: string; data: unknown }[])
        ?.find(v => v.type === 'MusterBoard')?.data as PageDataType | undefined
      return raw ?? null
    })
    .catch(() => null)
    .finally(() => { inflightRequest = null })
  return inflightRequest
}

export default function MusterStatusPage() {
  const [data, setData] = useState<PageDataType | null>(DUMMY)
  useEffect(() => { fetchPageData().then(d => { if (d) setData(d) }) }, [])

  if (!data) return <div />
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
      <HsePageHeader
        data={{
          title: 'Muster Status',
          subtitle: `${data.accounted.toLocaleString()} of ${data.total.toLocaleString()} accounted for in the first ${data.elapsedSeconds} seconds. The ${data.unaccounted} outstanding all trace to the earlier headcount reconciliation, so the muster inherits a defended number rather than starting an argument about which system to believe.`,
          asOf: 'live',
        }}
      />
      <MusterBoard data={data} />
    </div>
  )
}
