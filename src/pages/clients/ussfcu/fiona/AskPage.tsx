import { useState, useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ChatInterface from '@/components/chat/ChatInterface'
import { fetchAsk, fetchSignals, fetchKpis } from '@/api/ussfcuApi'
import PortfolioLimitChart from '@/components/PortfolioLimitChart'
import DelinquencyTrend from '@/components/DelinquencyTrend'
import ScenarioImpactTable from '@/components/ScenarioImpactTable'
import CapitalLiquidityGauges from '@/components/CapitalLiquidityGauges'
import PlaybookActionTable from '@/components/PlaybookActionTable'
import InsightMiniCard, { type InsightSignal } from '@/components/InsightMiniCard'
import CapmKpiCarousel, { type CapmKpiCarouselData } from '@/components/CapmKpiCarousel'
import SectionLabel from '@/components/SectionLabel'

const SSE_URL = `${import.meta.env.VITE_ULTRA_API_BASE?.replace(/\/$/, '') ?? 'http://127.0.0.1:8001'}/api/sse?client_id=ussfcu&persona_id=fiona`


export function resolveComponent(type: string, data: unknown): ReactNode | null {
  const d = data as Record<string, unknown>
  switch (type) {
    case 'PortfolioLimitChart':
      if (!Array.isArray(d?.limits) || typeof d.limits[0]?.pctOfNetWorth !== 'number') return null
      return <PortfolioLimitChart data={data as never} />
    case 'DelinquencyTrend':
      if (!Array.isArray(d?.segments) || !Array.isArray(d.segments[0]?.series)) return null
      return <DelinquencyTrend data={data as never} />
    case 'ScenarioImpactTable':
      if (typeof d?.lossOverTwoQuarters !== 'number' || !Array.isArray(d?.delinquencyBySegment)) return null
      return <ScenarioImpactTable data={data as never} />
    case 'CapitalLiquidityGauges':
      if (typeof (d?.capitalLiquidity as Record<string, unknown>)?.netWorthBefore !== 'number') return null
      return <CapitalLiquidityGauges data={data as never} />
    case 'PlaybookActionTable':
      if (!Array.isArray(d?.bands)) return null
      return <PlaybookActionTable data={data as never} />
    default: return null
  }
}

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
      persona="fiona"
      fetchAsk={fetchAsk}
      greeting="Fiona"
      initials="FF"
      placeholder="Ask anything about your portfolio, signals, or scenarios…"
      briefingSlot={briefingSlot}
    />
  )
}
