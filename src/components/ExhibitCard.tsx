import type { ReactNode } from 'react'

const tierFor = (score: number | null | undefined) => !score ? 'mid' : score >= 85 ? 'high' : score >= 70 ? 'mid' : 'low'
const colorFor = (tier: string) => ({ high: 'var(--color-conf-high)', mid: 'var(--color-conf-med)', low: 'var(--color-conf-low)' }[tier] ?? 'inherit')

export interface ExhibitCardProps {
  title: string
  note?: string
  source?: string
  asOf?: string
  confidence?: number | null
  className?: string
  children?: ReactNode
}

export default function ExhibitCard({ title, note, source, asOf, confidence, className = '', children }: ExhibitCardProps) {
  const confColor = colorFor(tierFor(confidence))
  return (
    <div className={`bg-surface rounded-2xl border border-border-subtle p-4 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${className}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-[13px] font-semibold text-text">{title}</h3>
          {note && <p className="text-[10.5px] text-text-subtle mt-0.5 leading-snug">{note}</p>}
        </div>
        {confidence != null && (
          <span
            className="flex-shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold tabular-nums"
            style={{ color: confColor, background: `color-mix(in srgb, ${confColor} 8%, transparent)` }}
          >
            {confidence}% conf.
          </span>
        )}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
      {(source || asOf) && (
        <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2">
          <span className="text-[9.5px] text-text-subtle">{source}</span>
          {asOf && <span className="text-[9.5px] text-text-subtle">as of {asOf}</span>}
        </div>
      )}
    </div>
  )
}
