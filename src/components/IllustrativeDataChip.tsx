import { Info } from 'lucide-react'

export interface IllustrativeDataChipProps {
  note?: string
  size?: 'sm' | 'md'
  className?: string
}

export default function IllustrativeDataChip({ note, size = 'md', className = '' }: IllustrativeDataChipProps) {
  const sizing = size === 'sm' ? 'text-[9px] px-1.5 py-0.5 gap-0.5' : 'text-[10px] px-2 py-0.5 gap-1'
  return (
    <span
      title={note || 'Illustrative figure — authored for this prototype, not the client’s data.'}
      className={`inline-flex items-center rounded-full border border-border bg-surface-2 text-text-subtle font-medium whitespace-nowrap ${sizing} ${className}`}
    >
      <Info className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      Illustrative data
    </span>
  )
}

export interface ProvenanceLineProps {
  source?: string
  freshness?: string
  reconciled?: boolean
  note?: string
  className?: string
}

export function ProvenanceLine({ source, freshness, reconciled = false, note, className = '' }: ProvenanceLineProps) {
  if (!source && !freshness) return null
  return (
    <p className={`text-[10px] text-text-subtle leading-snug ${className}`}>
      {source && (
        <>
          <span className="font-medium text-text-muted">Source:</span> {source}
        </>
      )}
      {source && freshness ? ' · ' : ''}
      {freshness && (
        <>
          <span className="font-medium text-text-muted">Updated:</span> {freshness}
        </>
      )}
      {reconciled && <span className="ml-1 font-semibold text-success-700">· Reconciled</span>}
      {note && <span className="block mt-0.5 italic">{note}</span>}
    </p>
  )
}
