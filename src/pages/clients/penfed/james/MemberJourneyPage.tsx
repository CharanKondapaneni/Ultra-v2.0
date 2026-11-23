import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { fetchGeneric } from '@/api/penfedApi'
import JourneyPhase from '@/components/JourneyPhase'
import FrictionHotspot from '@/components/FrictionHotspot'
import PageWithChat from '@/components/chat/PageWithChat'
import type { JourneyMapPhase } from '@/components/JourneyPhase'
import type { JourneyHotspot } from '@/components/FrictionHotspot'

interface PageDataType {
  phases: JourneyMapPhase[]
}

const CHIPS = [
  'Where is friction highest in the member journey?',
  'Which phase has the most drop-off?',
  'Show me onboarding friction points',
  'What are the top member complaints by phase?',
]

let inflightRequest: Promise<PageDataType | null> | null = null

function fetchPageData(): Promise<PageDataType | null> {
  if (inflightRequest) return inflightRequest
  inflightRequest = fetchGeneric<PageDataType>('james', [{ component: 'JourneyMapPage', variant: null }])
    .then(res => {
      const raw = (res.visualization as { type: string; data: unknown }[])
        ?.find(v => v.type === 'JourneyMapPage')?.data as PageDataType | undefined
      return raw ?? null
    })
    .catch(() => null)
    .finally(() => { inflightRequest = null })
  return inflightRequest
}

export default function MemberJourneyPage() {
  const [data, setData] = useState<PageDataType | null>(null)
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null)

  useEffect(() => {
    fetchPageData().then(setData)
  }, [])

  if (!data) return <div />

  const activePhase = data.phases.find(p => p.id === activePhaseId)
  const hotspots: (JourneyHotspot & { phaseName?: string })[] = activePhase
    ? activePhase.frictionHotspots
    : data.phases.flatMap(p => p.frictionHotspots.map(h => ({ ...h, phaseName: p.name })))

  return (
    <PageWithChat persona="james" chips={CHIPS} placeholder="Ask about the member journey…">
      <div className="flex flex-col h-full">
        {/* Phase rail */}
        <div className="px-6 pt-6 pb-4 border-b border-border-subtle">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Member Journey Map</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-sleek">
            {data.phases.map(phase => (
              <JourneyPhase
                key={phase.id}
                data={{ phase, isActive: phase.id === activePhaseId }}
                onClick={p => setActivePhaseId(activePhaseId === p.id ? null : p.id)}
              />
            ))}
          </div>
        </div>

        {/* Hotspot list */}
        <div className="flex-1 overflow-y-auto scrollbar-sleek px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-muted">
              {activePhase ? `Friction Points — ${activePhase.name}` : 'All Friction Hotspots'}
            </h3>
            {activePhase && (
              <button
                onClick={() => setActivePhaseId(null)}
                className="text-xs text-brand font-medium hover:underline cursor-pointer"
              >
                Show all
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activePhaseId ?? 'all'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 max-w-3xl"
            >
              {hotspots.length > 0 ? (
                hotspots.map((hotspot, idx) => (
                  <FrictionHotspot key={idx} data={{ hotspot, index: idx }} />
                ))
              ) : (
                <div className="text-center py-12 text-sm text-text-subtle">
                  No friction hotspots in this phase
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PageWithChat>
  )
}
