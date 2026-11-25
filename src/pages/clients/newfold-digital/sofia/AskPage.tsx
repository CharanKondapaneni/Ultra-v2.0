import { useState, useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import ChatInterface from '@/components/chat/ChatInterface'
import { fetchAsk, fetchSignals, fetchKpis } from '@/api/newfold-digitalApi'
import InsightMiniCard from '@/components/InsightMiniCard'
import CapmKpiCarousel from '@/components/CapmKpiCarousel'
import SectionLabel from '@/components/SectionLabel'
import type { InsightSignal } from '@/components/InsightMiniCard'
import type { CapmKpiCarouselData } from '@/components/CapmKpiCarousel'

let inflightBriefing: Promise<void> | null = null

export default function AskPage() {
  const [signals, setSignals] = useState<InsightSignal[]>([])
  const [kpiData, setKpiData] = useState<CapmKpiCarouselData | null>(null)

  useEffect(() => {
    if (inflightBriefing) return
    inflightBriefing = Promise.all([fetchSignals('sofia'), fetchKpis('sofia')])
      .then(([sigRes, kpiRes]) => {
        const sigs = sigRes.visualization
          ?.map(v => v.data)
          .filter((d): d is InsightSignal => !!d && typeof (d as Record<string, unknown>).id === 'string')
        if (sigs && sigs.length > 0) setSignals(sigs)

        const kpiRaw = kpiRes.visualization?.[0]?.data as CapmKpiCarouselData | undefined
        if (Array.isArray(kpiRaw?.kpis) && kpiRaw.kpis.length > 0) setKpiData(kpiRaw)
      })
      .catch(() => { /* noop */ })
      .finally(() => { inflightBriefing = null })
  }, [])

  const briefingSlot: ReactNode = (
    <>
      {signals.length > 0 && (
        <>
          <SectionLabel label="Priority Signals" icon={TrendingUp} />
          <AnimatePresence>
            <motion.div
              key="signals"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              transition={{ duration: 0.35 }}
              className="flex gap-3 mb-4"
            >
              {signals.map((signal, idx) => (
                <InsightMiniCard key={signal.id} signal={signal} index={idx} />
              ))}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {kpiData && (
        <AnimatePresence>
          <motion.div
            key="kpis"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="mb-3"
          >
            <CapmKpiCarousel data={kpiData} />
          </motion.div>
        </AnimatePresence>
      )}
    </>
  )

  return (
    <ChatInterface
      persona="sofia"
      fetchAsk={fetchAsk}
      greeting="Sofia"
      initials="SR"
      placeholder="Ask about workforce operations, shift coverage, or agent performance…"
      briefingSlot={briefingSlot}
    />
  )
}
