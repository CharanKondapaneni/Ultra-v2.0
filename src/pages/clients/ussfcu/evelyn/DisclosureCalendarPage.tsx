import { useEffect, useState } from 'react'
import { fetchGeneric } from '@/api/ussfcuApi'
import DisclosureChecklist, { type DisclosureChecklistData } from '@/components/DisclosureChecklist'
import DisclosureCalendar, { type DisclosureCalendarData } from '@/components/DisclosureCalendar'
import PageWithChat from '@/components/chat/PageWithChat'

const CHIPS = [
  "What is on the disclosure clock this week?",
  "Build a member's disclosure checklist and calendar",
  'Generate the exam evidence package',
]

const REGULATIONS = [
  { id: 'TRID',      label: 'TRID',      description: 'Loan Estimate & Closing Disclosure' },
  { id: 'ESIGN',     label: 'ESIGN',     description: 'Electronic consent' },
  { id: 'GLBA',      label: 'GLBA',      description: 'Privacy notices' },
  { id: 'ECOA',      label: 'ECOA / Reg B', description: 'Adverse action notices' },
  { id: 'REG_Z',     label: 'Reg Z',     description: 'Right of rescission' },
] as const

type RegulationId = typeof REGULATIONS[number]['id']

interface PageData {
  checklist: DisclosureChecklistData | null
  calendar:  DisclosureCalendarData  | null
}

let inflightRequest: Promise<PageData> | null = null

function fetchPageData(regulation: RegulationId): Promise<PageData> {
  if (inflightRequest) return inflightRequest

  inflightRequest = fetchGeneric('evelyn', [
    { component: 'DisclosureChecklist', variant: null },
    { component: 'DisclosureCalendar',  variant: null },
  ], { filters: { regulation } })
    .then(res => {
      const find = (type: string) =>
        (res.visualization as { type: string; data: unknown }[])?.find(v => v.type === type)?.data
      return {
        checklist: find('DisclosureChecklist') as DisclosureChecklistData ?? null,
        calendar:  find('DisclosureCalendar')  as DisclosureCalendarData  ?? null,
      }
    })
    .catch(() => ({ checklist: null, calendar: null }))
    .finally(() => { inflightRequest = null })

  return inflightRequest
}

export default function DisclosureCalendarPage() {
  const [activeReg, setActiveReg] = useState<RegulationId>('TRID')
  const [data, setData] = useState<PageData>({ checklist: null, calendar: null })
  const [loading, setLoading] = useState(false)

  function load(reg: RegulationId) {
    setLoading(true)
    fetchPageData(reg)
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load('TRID') }, [])

  function handleRegChange(reg: RegulationId) {
    setActiveReg(reg)
    setData({ checklist: null, calendar: null })
    load(reg)
  }

  return (
    <PageWithChat persona="evelyn" chips={CHIPS} placeholder="Ask about the disclosure clock or a checklist…">
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">Disclosure Calendar — Portfolio</h2>
        <p className="text-[12px] text-text-muted mb-4 max-w-2xl">
          Every disclosure a member is owed, on its required date under the rules. Past-due and at-risk items are flagged; the same engine surfaces the batch — 20 mortgages waiting on a disclosure — for a single human-in-the-loop approval.
        </p>

        {/* Regulation selector */}
        <div className="flex flex-wrap gap-2 mb-5">
          {REGULATIONS.map(reg => {
            const isActive = activeReg === reg.id
            return (
              <button
                key={reg.id}
                onClick={() => handleRegChange(reg.id)}
                className={`flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-all
                  ${isActive
                    ? 'bg-brand/10 border-brand/40 text-brand'
                    : 'bg-surface border-border-subtle text-text-muted hover:bg-surface-2 hover:border-brand/20'
                  }`}
              >
                <span className="text-[11px] font-bold leading-tight">{reg.label}</span>
                <span className="text-[9px] text-text-subtle leading-tight mt-0.5">{reg.description}</span>
              </button>
            )
          })}
        </div>

        <div className={`grid md:grid-cols-2 gap-4 items-start transition-opacity ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          {data.checklist && <DisclosureChecklist data={data.checklist} />}
          {data.calendar  && <DisclosureCalendar  data={data.calendar}  />}
        </div>
      </div>
    </PageWithChat>
  )
}
