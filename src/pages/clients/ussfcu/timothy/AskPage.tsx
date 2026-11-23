import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ShieldCheck, Gauge, Route } from 'lucide-react'
import ChatInterface from '@/components/chat/ChatInterface'
import SectionLabel from '@/components/SectionLabel'
import InsightMiniCard, { type InsightSignal } from '@/components/InsightMiniCard'
import CapmKpiCarousel, { type CapmKpiCarouselData } from '@/components/CapmKpiCarousel'
import TrustTile from '@/components/TrustTile'
import { fetchAsk, fetchGeneric, fetchKpis } from '@/api/ussfcuApi'

interface TrustWidgets {
  pipeline_health:     { state: string; summary: string; detail?: string }
  open_audit_issues:   { state: string; summary: string; open_count?: number }
  ncua_exam_readiness: { state: string; score: number; status_label?: string; next_window?: string }
  lineage_on_demand:   { state: string; summary: string; detail?: string }
}

interface PrioritySignalsViewData {
  trust: {
    data_trust_score: number
    validated_at?: string
    widgets: TrustWidgets
  }
  signals: InsightSignal[]
}

let inflightBriefing: Promise<void> | null = null

export default function AskPage() {
  const [signals, setSignals] = useState<InsightSignal[]>([])
  const [kpiData, setKpiData] = useState<CapmKpiCarouselData | null>(null)
  const [trust, setTrust] = useState<PrioritySignalsViewData['trust'] | null>(null)

  useEffect(() => {
    if (inflightBriefing) return
    inflightBriefing = Promise.allSettled([
      fetchGeneric('timothy', [{ component: 'PrioritySignalsView', variant: null }]),
      fetchKpis(),
    ])
      .then(([sigResult, kpiResult]) => {
        if (sigResult.status === 'fulfilled') {
          const raw = (sigResult.value.visualization as { type: string; data: unknown }[])
            ?.find(v => v.type === 'PrioritySignalsView')?.data as PrioritySignalsViewData | undefined
          if (raw?.signals?.length) setSignals(raw.signals)
          if (raw?.trust?.widgets) setTrust(raw.trust)
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

      {trust && (
        <>
          <SectionLabel label="Data Trust Strip" icon={ShieldCheck} />
          <AnimatePresence>
            <motion.div
              key="trust"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3"
            >
              <TrustTile data={{
                icon: Activity,
                name: 'Pipeline Health',
                value: trust.widgets.pipeline_health.summary,
                sub: trust.widgets.pipeline_health.detail,
                state: trust.widgets.pipeline_health.state,
              }} />
              <TrustTile data={{
                icon: ShieldCheck,
                name: 'Open Audit Issues',
                value: trust.widgets.open_audit_issues.summary,
                sub: trust.widgets.open_audit_issues.open_count != null ? `${trust.widgets.open_audit_issues.open_count} open` : undefined,
                state: trust.widgets.open_audit_issues.state,
              }} />
              <TrustTile data={{
                icon: Gauge,
                name: 'NCUA Exam Readiness',
                value: `${trust.widgets.ncua_exam_readiness.score} / 100`,
                sub: [trust.widgets.ncua_exam_readiness.status_label, trust.widgets.ncua_exam_readiness.next_window ? `Next ${trust.widgets.ncua_exam_readiness.next_window}` : undefined].filter(Boolean).join(' · '),
                state: trust.widgets.ncua_exam_readiness.state,
                progressPct: trust.widgets.ncua_exam_readiness.score,
              }} />
              <TrustTile data={{
                icon: Route,
                name: 'Lineage on Demand',
                value: trust.widgets.lineage_on_demand.summary,
                sub: trust.widgets.lineage_on_demand.detail,
                state: trust.widgets.lineage_on_demand.state,
              }} />
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </>
  )

  return (
    <ChatInterface
      persona="timothy"
      fetchAsk={fetchAsk}
      greeting="Timothy"
      initials="TA"
      placeholder="Ask anything about strategy, risk, or operations…"
      briefingSlot={briefingSlot}
    />
  )
}
