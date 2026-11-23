import { useLayoutEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Frown, Meh, Lightbulb, AlertCircle, Info } from 'lucide-react'
import useAsyncData from '@/hooks/useAsyncData'
import MaximizablePanel, { MaximizeButton } from '@/components/MaximizablePanel'
import type { ComponentType } from 'react'
import type { Point, JourneyPhase, Journey } from './JourneyMap.lib'
export type { JourneyPhase, Journey } from './JourneyMap.lib'

const EMOTION_TONE: Record<number, { dot: string; text: string; wrap: string; Icon: ComponentType<{ className?: string }> }> = {
  1: { dot: 'var(--color-critical-800)', text: 'text-critical-800', wrap: 'border-critical-300 bg-critical-50', Icon: Frown },
  2: { dot: 'var(--color-critical)', text: 'text-critical-800', wrap: 'border-critical-200 bg-critical-50/60', Icon: Frown },
  3: { dot: 'var(--color-warning)', text: 'text-warning-800', wrap: 'border-warning-200 bg-warning-50/60', Icon: Meh },
  4: { dot: 'var(--color-success)', text: 'text-success-800', wrap: 'border-success-200 bg-success-50/60', Icon: Meh },
  5: { dot: 'var(--color-success)', text: 'text-success-800', wrap: 'border-success-200 bg-success-50/60', Icon: Meh },
}

function Chip() {
  return (
    <span title="Illustrative figure." className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-text-subtle whitespace-nowrap">
      <Info className="w-3 h-3" />
      Illustrative data
    </span>
  )
}

function useRailCentres(rail: HTMLElement | null, count: number) {
  const [geo, setGeo] = useState<{ width: number; centres: number[]; aligned: boolean }>({ width: 0, centres: [], aligned: false })
  useLayoutEffect(() => {
    if (!rail) return undefined
    const measure = () => {
      const width = rail.clientWidth
      const style = getComputedStyle(rail)
      const cols = style.gridTemplateColumns.split(' ').map(parseFloat).filter((n) => !Number.isNaN(n))
      const gap = parseFloat(style.columnGap) || 0
      let centres: number[]
      let aligned = false
      if (cols.length === count) {
        let x = 0
        centres = cols.map((c) => {
          const centre = x + c / 2
          x += c + gap
          return centre
        })
        aligned = true
      } else {
        const pad = 14
        const step = count > 1 ? (width - pad * 2) / (count - 1) : 0
        centres = Array.from({ length: count }, (_, i) => (count > 1 ? pad + i * step : width / 2))
      }
      setGeo((g) =>
        g.width === width && g.aligned === aligned && g.centres.every((c, i) => Math.abs(c - centres[i]) < 0.5) && g.centres.length === centres.length
          ? g
          : { width, centres, aligned },
      )
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(rail)
    return () => ro.disconnect()
  }, [rail, count])
  return geo
}

function curve(pts: Point[]): string {
  return pts
    .map(([x, py], i) => {
      if (i === 0) return `M ${x} ${py}`
      const [x0, y0] = pts[i - 2] || pts[i - 1]
      const [x1, y1] = pts[i - 1]
      const [x3, y3] = pts[i + 1] || [x, py]
      const c1 = [x1 + (x - x0) / 6, y1 + (py - y0) / 6]
      const c2 = [x - (x3 - x1) / 6, py - (y3 - y1) / 6]
      return `C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${x} ${py}`
    })
    .join(' ')
}

function EmotionLine({ phases, activeId, onSelect, rail, showFuture = false }: { phases: JourneyPhase[]; activeId: string | null; onSelect: (id: string) => void; rail: HTMLElement | null; showFuture?: boolean }) {
  const { width, centres, aligned } = useRailCentres(rail, phases.length)
  const top = aligned ? 12 : 20
  const bottom = 26
  const h = top + bottom + 44
  const y = (e: number) => top + ((5 - e) / 4) * (h - top - bottom)
  const lowest = Math.min(...phases.map((p) => p.emotion))
  const lowId = phases.find((p) => p.emotion === lowest)?.id

  if (!width || centres.length !== phases.length) return <div style={{ height: h }} aria-hidden="true" />

  const pts = phases.map((p, i): Point => [centres[i], y(p.emotion)])
  const d = curve(pts)
  const futurePts = showFuture ? phases.map((p, i): Point => [centres[i], y(p.futureEmotion ?? p.emotion)]) : null

  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} className="block overflow-visible" aria-hidden="true">
      {[5, 3, 1].map((e) => (
        <line key={e} x1={0} x2={width} y1={y(e)} y2={y(e)} stroke="var(--color-border)" strokeWidth={1} strokeDasharray={e === 3 ? '3 4' : undefined} />
      ))}
      <path d={d} fill="none" stroke="var(--color-border)" strokeWidth={2} strokeLinecap="round" />
      {futurePts && (
        <g>
          <path d={curve(futurePts)} fill="none" stroke="var(--color-brand)" strokeWidth={2} strokeDasharray="6 4" strokeLinecap="round" />
          {futurePts.map(([cx, cy], i) => (
            <circle key={phases[i].id} cx={cx} cy={cy} r={4.5} fill="var(--color-surface)" stroke="var(--color-brand)" strokeWidth={2} />
          ))}
        </g>
      )}
      {phases.map((p, i) => {
        const isActive = activeId === p.id
        const [cx, cy] = pts[i]
        return (
          <g key={p.id} className="cursor-pointer" onMouseEnter={() => onSelect(p.id)}>
            <circle cx={cx} cy={cy} r={14} fill="transparent" />
            <circle cx={cx} cy={cy} r={isActive ? 7.5 : 6} fill={EMOTION_TONE[p.emotion]?.dot || 'var(--color-text-subtle)'} stroke="var(--color-surface)" strokeWidth={2} className="[transition:r_150ms_ease]" />
            {p.id === lowId && (
              <text x={cx} y={cy + 20} textAnchor="middle" className="fill-critical-700 text-[9.5px] font-bold tracking-[0.04em]">LOW POINT</text>
            )}
            {!aligned && (
              <text x={cx} y={top - 8} textAnchor="middle" className="fill-text-subtle text-[9px] font-bold">{p.index}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

const NO_FETCH = (): Journey | null => null

export interface JourneyMapProps {
  data?: Journey
  getter?: () => Promise<Journey> | Journey
  title?: string
  idleHint?: string
}

export default function JourneyMap({ data, getter, title = 'Journey', idleHint = '' }: JourneyMapProps) {
  const fetched = useAsyncData(data || !getter ? NO_FETCH : getter) as Journey | null
  const journey = data ?? fetched
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showFuture, setShowFuture] = useState(false)
  const [rail, setRail] = useState<HTMLElement | null>(null)

  if (!journey) return null

  const active = journey.phases.find((p) => p.id === activeId) || null
  const hasFuture = journey.phases.every((p) => typeof p.futureEmotion === 'number')
  const future = hasFuture && showFuture
  const railCols = journey.phases.length >= 5 ? 'xl:grid-cols-5' : 'xl:grid-cols-4'

  return (
    <MaximizablePanel className="p-4 sm:p-5" label="Journey map">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          <p className="text-[11.5px] text-text-muted mt-1 leading-relaxed max-w-3xl">{journey.scenario} {journey.timeframe}</p>
        </div>
        <span className="flex items-center gap-2">{journey.illustrative !== false && <Chip />}<MaximizeButton /></span>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mb-4 text-[11px]">
        <span className="text-text-muted">
          Baseline satisfaction{' '}
          <span className="font-bold text-critical-700">{journey.baselineSatisfaction}/{journey.baselineScale ?? 10}</span>{' '}
          <span className="text-text-subtle">— {journey.baselineNote.toLowerCase()}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-text-subtle">
          <Star className="w-3 h-3 text-warning-500 fill-warning-500" /> Moment of truth
        </span>
        {hasFuture && (
          <span className="inline-flex items-center gap-2 ml-auto">
            {future && (
              <span className="inline-flex items-center gap-1.5 text-text-subtle">
                <svg width="22" height="6" aria-hidden="true"><line x1="0" y1="3" x2="22" y2="3" stroke="var(--color-brand)" strokeWidth="2" strokeDasharray="5 3" /></svg>
                {journey.futureLabel || 'Future state'}
              </span>
            )}
            <span className="inline-flex rounded-lg border border-border p-0.5" role="group" aria-label="Journey view">
              {([
                [false, 'Today'],
                [true, journey.futureLabel || 'Future state'],
              ] as Array<[boolean, string]>).map(([val, label]) => (
                <button key={label} type="button" aria-pressed={showFuture === val} onClick={() => setShowFuture(val)}
                  className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${showFuture === val ? 'bg-brand text-white' : 'text-text-muted hover:text-brand'}`}>
                  {label}
                </button>
              ))}
            </span>
          </span>
        )}
      </div>
      {future && journey.futureNote && <p className="-mt-2 mb-3 text-[10.5px] text-text-subtle">{journey.futureNote}</p>}

      <EmotionLine phases={journey.phases} activeId={activeId} onSelect={setActiveId} rail={rail} showFuture={future} />

      <div ref={setRail} className={`grid grid-cols-1 sm:grid-cols-2 ${railCols} gap-2.5 mt-1 mb-4`}>
        {journey.phases.map((phase, i) => {
          const tone = EMOTION_TONE[phase.emotion] || EMOTION_TONE[3]
          const Icon = tone.Icon
          const isActive = activeId === phase.id
          return (
            <motion.button type="button" key={phase.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}
              onMouseEnter={() => setActiveId(phase.id)} onFocus={() => setActiveId(phase.id)}
              onClick={() => setActiveId(isActive ? null : phase.id)}
              className={`text-left rounded-xl border p-3 min-w-0 transition-shadow cursor-pointer ${tone.wrap} ${isActive ? 'shadow-md ring-2 ring-brand/30' : 'hover:shadow-sm'}`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-text-subtle">Phase {phase.index}</span>
                {phase.momentOfTruth && <Star className="w-3 h-3 text-warning-500 fill-warning-500 flex-shrink-0" />}
              </div>
              <p className="text-[12px] font-semibold text-text leading-snug mb-1.5">{phase.name}</p>
              <p className={`inline-flex items-center gap-1 text-[10.5px] font-semibold ${tone.text}`}>
                <Icon className="w-3 h-3" /> {phase.emotion}/5 · {phase.emotionLabel}
              </p>
              {future && <p className="text-[10.5px] font-semibold text-brand mt-0.5">→ {phase.futureEmotion}/5 {journey.futureLabel ? journey.futureLabel.charAt(0).toLowerCase() + journey.futureLabel.slice(1) : 'in the future state'}</p>}
              {phase.demoStep && <p className="text-[9.5px] text-text-subtle mt-1.5">{phase.demoStep}</p>}
            </motion.button>
          )
        })}
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-2 p-3.5 mb-5 min-h-[120px]">
        {active ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <p className="text-[13px] font-semibold text-text">Phase {active.index} — {active.name}</p>
              {active.momentOfTruth && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning-100 border border-warning-300 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-warning-800">
                  <Star className="w-2.5 h-2.5 fill-warning-600 text-warning-600" /> Moment of truth
                </span>
              )}
            </div>
            {active.momentLabel && <p className="text-[11.5px] italic text-warning-800 mb-2">{active.momentLabel}</p>}
            <p className="text-[12px] text-text-muted leading-relaxed mb-2">{active.action}</p>
            <p className="text-[12px] text-text italic leading-relaxed mb-2.5">"{active.thought}"</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-subtle mb-1">
                  <AlertCircle className="w-3 h-3 text-critical-600" /> Pain points
                </p>
                <ul className="space-y-0.5">
                  {active.painPoints.map((p, i) => (
                    <li key={i} className="text-[11.5px] text-text-muted leading-snug">• {p}</li>
                  ))}
                </ul>
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-subtle mb-1">
                  <Lightbulb className="w-3 h-3 text-success-600" /> Opportunity
                </p>
                <p className="text-[11.5px] text-text-muted leading-snug">{active.opportunity}</p>
              </div>
            </div>
            <p className="text-[10px] text-text-subtle mt-2.5">Touchpoints today: {active.touchpoints.join(' · ')}</p>
          </motion.div>
        ) : (
          <p className="text-xs text-text-muted leading-relaxed">
            {idleHint || 'Hover a phase for its pain points, the persona\'s own words, and the opportunity that answers them.'}
          </p>
        )}
      </div>

      {(journey.traceability?.length ?? 0) > 0 && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle mb-2">Journey → signal → demo traceability</p>
          <div className="overflow-x-auto scrollbar-sleek">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="pb-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-text-subtle">Phase</th>
                  <th className="pb-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-text-subtle">Pain point</th>
                  <th className="pb-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-text-subtle">Signal card</th>
                  <th className="pb-2 text-[10px] font-bold uppercase tracking-wider text-text-subtle">Demo step</th>
                </tr>
              </thead>
              <tbody>
                {journey.traceability?.map((row, i) => (
                  <tr key={i} className="border-b border-border-subtle/60 last:border-0">
                    <td className="py-2 pr-3 text-[11.5px] font-medium text-text align-top whitespace-nowrap">{row.phase}</td>
                    <td className="py-2 pr-3 text-[11.5px] text-text-muted align-top">{row.painPoint}</td>
                    <td className="py-2 pr-3 text-[11.5px] text-text-muted align-top">{row.signal}</td>
                    <td className="py-2 text-[11.5px] font-medium text-text-muted align-top whitespace-nowrap">{row.demoStep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </MaximizablePanel>
  )
}
