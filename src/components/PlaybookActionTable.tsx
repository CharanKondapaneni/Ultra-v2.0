import { BookCheck } from 'lucide-react'

export interface PlaybookBand {
  band: string
  range: string
  recommended: boolean
  actions: string[]
}

export interface PlaybookActionData {
  eyebrow?: string
  playbookTitle: string
  scenario: {
    days: number
    scenario: string
  }
  bands: PlaybookBand[]
}

export default function PlaybookActionTable({ data }: { data: PlaybookActionData }) {
  const { eyebrow = 'Automated Action', playbookTitle, scenario, bands } = data

  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-subtle mb-0.5">{eyebrow}</p>
          <h3 className="text-sm font-semibold text-text">{playbookTitle}</h3>
        </div>
        <span className="shrink-0 text-[10px] font-semibold bg-brand/8 text-brand border border-brand/20 rounded-full px-2 py-0.5">
          Pulled as written
        </span>
      </div>

      {/* Severity scale */}
      <div className="mb-4 rounded-lg border border-border-subtle bg-bg p-3">
        <div className="relative flex h-6 overflow-hidden rounded-md text-[10px] font-semibold">
          {bands.map(b => (
            <div
              key={b.band}
              className={`flex min-w-0 flex-1 items-center justify-center truncate px-2 ${b.recommended ? 'bg-brand text-white' : 'bg-surface text-text-muted'}`}
            >
              <span className="truncate">{b.range}</span>
            </div>
          ))}
        </div>
        <div className="relative mt-1 h-4 text-[9.5px] text-text-subtle">
          <span className="absolute left-0">Day 0</span>
          <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-brand">▲ Modeled: {scenario.days} days</span>
        </div>
      </div>

      {/* Action table */}
      <div className="overflow-x-auto rounded-lg border border-border-subtle bg-bg">
        <table className="w-full min-w-[460px] text-[11px]">
          <thead>
            <tr className="border-b border-border-subtle text-[9.5px] uppercase tracking-wide text-text-subtle">
              <th className="w-[32%] px-3 py-2 text-left font-semibold">Shutdown severity</th>
              <th className="px-3 py-2 text-left font-semibold">Board playbook action</th>
            </tr>
          </thead>
          <tbody>
            {bands.map(b => (
              <tr key={b.band} className={`border-b border-border-subtle align-top last:border-0 ${b.recommended ? 'bg-brand/[0.04]' : ''}`}>
                <td className="px-3 py-2.5">
                  <p className={`font-semibold ${b.recommended ? 'text-brand' : 'text-text'}`}>{b.band}</p>
                  <p className="mt-0.5 text-[10px] text-text-subtle">{b.range}</p>
                  {b.recommended && (
                    <span className="mt-1.5 inline-flex text-[9px] font-bold uppercase tracking-wide text-brand bg-brand/8 border border-brand/20 rounded-full px-1.5 py-0.5">
                      Recommended · {scenario.scenario}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <ul className="space-y-1.5">
                    {b.actions.map(action => (
                      <li key={action} className="flex items-start gap-2 text-text">
                        <BookCheck className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${b.recommended ? 'text-brand' : 'text-text-subtle'}`} />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-text-muted">A decision, not a rebuild.</p>
      <p className="mt-1 text-[9.5px] text-text-subtle">Sources: Models, board playbook (policy).</p>
    </div>
  )
}
