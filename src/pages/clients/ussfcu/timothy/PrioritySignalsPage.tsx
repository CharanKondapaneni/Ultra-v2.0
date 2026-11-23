import { useEffect, useState } from 'react'
import { fetchGeneric } from '@/api/ussfcuApi'
import HeroSignal from '@/components/HeroSignal'
import SignalCard from '@/components/SignalCard'
import ExecutivePosture, { type ExecutivePostureData } from '@/components/ExecutivePosture'
import BoardRecommendation from '@/components/BoardRecommendation'
import PageWithChat from '@/components/chat/PageWithChat'
import type { CeoSignal } from '@/components/prioritySignalsTypes'

const CHIPS = [
  'Walk me through the liquidity signal',
  'Can I trust these numbers?',
  'What happens if this continues?',
  'Open the full briefing',
]

interface PageData {
  signals:         CeoSignal[]          | null
  executivePosture: ExecutivePostureData | null
}

let inflightRequest: Promise<PageData> | null = null

function fetchPageData(): Promise<PageData> {
  if (inflightRequest) return inflightRequest
  inflightRequest = fetchGeneric('timothy', [
    { component: 'PrioritySignals',   variant: null },
    { component: 'ExecutivePosture',  variant: null },
  ])
    .then(res => {
      const find = (type: string) =>
        (res.visualization as { type: string; data: unknown }[])?.find(v => v.type === type)?.data
      return {
        signals:          (() => { const r = find('PrioritySignals'); return Array.isArray(r) ? r : (r as { signals?: CeoSignal[] })?.signals ?? null })(),
        executivePosture: find('ExecutivePosture') as ExecutivePostureData  ?? null,
      }
    })
    .catch(() => ({ signals: null, executivePosture: null }))
    .finally(() => { inflightRequest = null })
  return inflightRequest
}

export default function PrioritySignalsPage() {
  const [data, setData] = useState<PageData>({ signals: null, executivePosture: null })

  useEffect(() => {
    fetchPageData().then(setData)
  }, [])

  const signals  = data.signals ?? []
  const primary  = signals.find(s => s.primary) ?? signals[0] ?? null
  const secondary = signals.filter(s => s !== primary)

  return (
    <PageWithChat persona="timothy" chips={CHIPS} placeholder="Ask about signals, liquidity, or trust…">
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">Priority Signals</h2>
        <p className="text-[12px] text-text-muted mb-5 max-w-2xl">
          The small set of state-of-the-business signals at the top of the house — validated overnight and
          traceable to source.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {primary  && <HeroSignal signal={primary} />}
            {secondary.map(s => <SignalCard key={s.id} signal={s} />)}
          </div>

          <div>
            {data.executivePosture && (
              <ExecutivePosture data={data.executivePosture} />
            )}
            <BoardRecommendation />
          </div>
        </div>
      </div>
    </PageWithChat>
  )
}
