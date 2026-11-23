import { ShieldCheck, Gauge, Landmark, CalendarDays } from 'lucide-react'
import PostureRow from './PostureRow'

import type { TrustWidgets } from './prioritySignalsTypes'

export interface ExecutivePostureData {
  data_trust_score: number
  validated_at?: string
  widgets: Pick<TrustWidgets, 'ncua_exam_readiness'>
}

export default function ExecutivePosture({ data }: { data: ExecutivePostureData }) {
  const validatedTime = data.validated_at?.slice(11, 16)

  return (
    <div className="bg-surface rounded-2xl border border-border-subtle p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h3 className="text-[13px] font-semibold text-text mb-1">Executive Posture</h3>
      <p className="text-[11.5px] text-text-muted leading-relaxed mb-3">
        A strong, well-run institution with one thing to manage — liquidity — and a national membership
        opportunity beyond the DMV.
      </p>
      <PostureRow icon={ShieldCheck}   label={`Data trust · validated ${validatedTime ?? '—'} ET`}                        value={`${data.data_trust_score}%`}                              tone="good" />
      <PostureRow icon={Gauge}         label={`NCUA exam readiness · next ${data.widgets.ncua_exam_readiness.next_window ?? '—'}`} value={`${data.widgets.ncua_exam_readiness.score}/100`} tone="good" />
      <PostureRow icon={Landmark}      label="Net worth ratio · well capitalized"                                             value="7.50%"                                                tone="good" />
      <PostureRow icon={CalendarDays}  label="Next board meeting"                                                             value="Mar 2027" />
    </div>
  )
}
