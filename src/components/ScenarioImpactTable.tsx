import { Users, TrendingDown } from 'lucide-react'

export interface DelinquencySegment {
  id: string
  segment: string
  before: number
  after: number
}

export interface ScenarioImpactData {
  eyebrow?: string
  scenario: {
    scenario: string
    days: number
    membersAffectedPct: number
    depositDrawdownPct: number
    paymentDelayPct: number
    lossOverTwoQuarters: number
    delinquencyBySegment: DelinquencySegment[]
  }
}

const MAX_DQ = 3.5

function fmtPct(v: number, dp = 1) { return `${v.toFixed(dp)}%` }
function fmtInt(n: number) { return n.toLocaleString() }

const TOTAL_MEMBERS = 52488

export default function ScenarioImpactTable({ data }: { data: ScenarioImpactData }) {
  const { eyebrow = 'Predictive Intelligence', scenario: s } = data

  const funnel = [
    { label: 'Affected members',    pct: s.membersAffectedPct,  of: 'of all members',      count: Math.round(TOTAL_MEMBERS * s.membersAffectedPct / 100),  bar: 'bg-brand/70' },
    { label: 'Draw down deposits',  pct: s.depositDrawdownPct,  of: 'of affected members', count: Math.round(TOTAL_MEMBERS * s.membersAffectedPct / 100 * s.depositDrawdownPct / 100), bar: 'bg-warning-500' },
    { label: 'Delay a loan payment', pct: s.paymentDelayPct,   of: 'of affected members', count: Math.round(TOTAL_MEMBERS * s.membersAffectedPct / 100 * s.paymentDelayPct / 100),    bar: 'bg-critical-600' },
  ]

  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-subtle mb-0.5">{eyebrow}</p>
          <h3 className="text-sm font-semibold text-text">Scenario: {s.scenario}, modeled as an employment shock</h3>
        </div>
        <span className="shrink-0 text-[10px] font-semibold bg-brand/8 text-brand border border-brand/20 rounded-full px-2 py-0.5">
          Calibrated to our members
        </span>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Member behaviour */}
        <div className="min-w-0 rounded-lg border border-border-subtle bg-bg p-3 lg:col-span-2">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-subtle">
            <Users className="h-3.5 w-3.5" /> Member behaviour in a {s.days}-day shutdown
          </p>
          <div className="space-y-2.5">
            {funnel.map(f => (
              <div key={f.label}>
                <div className="flex items-baseline justify-between gap-2 text-[11px]">
                  <span className="font-medium text-text">{f.label}</span>
                  <span className="tabular-nums text-text-muted">
                    <span className="text-[13px] font-bold text-text">{f.pct}%</span> {f.of} · ~{fmtInt(f.count)}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface" aria-hidden="true">
                  <div className={`h-full rounded-full ${f.bar}`} style={{ width: `${Math.max(f.pct, 2)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modeled loss */}
        <div className="flex min-w-0 flex-col justify-between rounded-lg border border-critical-200 bg-critical-50/40 p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-critical-600">
            <TrendingDown className="h-3.5 w-3.5" /> Modeled loan losses
          </p>
          <p className="mt-2 text-[26px] font-bold leading-none tabular-nums text-critical-600">
            +${s.lossOverTwoQuarters.toFixed(1)}M
          </p>
          <p className="mt-1.5 text-[10.5px] text-text-muted">Over two quarters, led by the Home Improvement Loan book</p>
        </div>
      </div>

      {/* Delinquency table */}
      <div className="overflow-x-auto rounded-lg border border-border-subtle bg-bg">
        <table className="w-full min-w-[480px] text-[11px]">
          <thead>
            <tr className="border-b border-border-subtle text-[9.5px] uppercase tracking-wide text-text-subtle">
              <th className="px-3 py-2 text-left font-semibold">Segment</th>
              <th className="px-2 py-2 text-right font-semibold">Today</th>
              <th className="px-2 py-2 text-right font-semibold">Projected</th>
              <th className="w-[38%] px-3 py-2 text-left font-semibold">60-day delinquency, today → projected</th>
            </tr>
          </thead>
          <tbody>
            {s.delinquencyBySegment.map((d, i) => {
              const lead = i === 0
              return (
                <tr key={d.id} className={`border-b border-border-subtle last:border-0 ${lead ? 'bg-critical-50/40' : ''}`}>
                  <td className={`px-3 py-1.5 font-medium ${lead ? 'text-critical-600' : 'text-text'}`}>
                    {d.segment}
                    {lead && (
                      <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-critical-600 bg-critical-50 border border-critical-200 rounded-full px-1.5 py-0.5">
                        Leading
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-text-muted">{fmtPct(d.before, 2)}</td>
                  <td className={`px-2 py-1.5 text-right font-semibold tabular-nums ${lead ? 'text-critical-600' : 'text-text'}`}>
                    {fmtPct(d.after, 2)}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="relative h-2.5 rounded-full bg-surface" aria-hidden="true">
                      <span className="absolute inset-y-0 left-0 rounded-l-full bg-text-subtle/30" style={{ width: `${(d.before / MAX_DQ) * 100}%` }} />
                      <span
                        className={`absolute inset-y-0 rounded-r-full ${lead ? 'bg-critical-500' : 'bg-warning-500'}`}
                        style={{ left: `${(d.before / MAX_DQ) * 100}%`, width: `${((d.after - d.before) / MAX_DQ) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
        Calibrated to our own members, the impact lands sharper and faster than a generic model would show.
      </p>
      <p className="mt-1 text-[9.5px] text-text-subtle">Sources: Models (asset-liability), core banking system (member and portfolio history).</p>
    </div>
  )
}
