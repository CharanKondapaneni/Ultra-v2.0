import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ChatInterface from '@/components/chat/ChatInterface'
import SectionLabel from '@/components/SectionLabel'
import InsightMiniCard, { type InsightSignal } from '@/components/InsightMiniCard'
import CapmKpiCarousel, { type CapmKpiCarouselData } from '@/components/CapmKpiCarousel'
import { fetchAsk, fetchSignals, fetchKpis } from '@/api/ussfcuApi'

let inflightBriefing: Promise<void> | null = null

export default function AskPage() {
  const [signals, setSignals] = useState<InsightSignal[]>([])
  const [kpiData, setKpiData] = useState<CapmKpiCarouselData | null>(null)

  useEffect(() => {
    if (inflightBriefing) return
    inflightBriefing = Promise.allSettled([fetchSignals(), fetchKpis()])
      .then(([sigResult, kpiResult]) => {
        if (sigResult.status === 'fulfilled') {
          const sigs = sigResult.value.visualization
            ?.map(v => v.data)
            .filter((d): d is InsightSignal => !!d && typeof (d as InsightSignal).id === 'string')
          if (sigs && sigs.length > 0) setSignals(sigs)
        }
        if (kpiResult.status === 'fulfilled') {
          const kpiRaw = kpiResult.value.visualization?.[0]?.data as CapmKpiCarouselData | undefined
          if (Array.isArray(kpiRaw?.kpis) && kpiRaw.kpis.length > 0) setKpiData(kpiRaw)
        }
      })
      .finally(() => { inflightBriefing = null })
  }, [])

  const briefingSlot = (
    <>
      {signals.length > 0 && (
        <>
          <SectionLabel label="Priority Signals" />
          <AnimatePresence>
            <motion.div
              key="signals"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              transition={{ duration: 0.35 }}
              className="flex gap-3 mb-3"
            >
              {signals.map((signal, idx) => (
                <InsightMiniCard
                  key={signal.id}
                  signal={signal}
                  index={idx}
                  onClick={() => {
                    if (signal.chipText) window.dispatchEvent(new CustomEvent('fiona:chip', { detail: signal.chipText }))
                  }}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {kpiData && (
        <AnimatePresence>
          <motion.div
            key="kpi"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <CapmKpiCarousel data={kpiData} />
          </motion.div>
        </AnimatePresence>
      )}
    </>
  )

  return (
    <ChatInterface
      persona="nadia"
      fetchAsk={fetchAsk}
      greeting="Nadia"
      initials="NH"
      placeholder="Ask anything about compliance, disclosures, or regulations…"
      briefingSlot={briefingSlot}
    />
  )
}
