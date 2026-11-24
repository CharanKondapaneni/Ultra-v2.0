export interface BpoCapacityCardData {
  available: number
  needed: number
  certified?: string
  confirmBy?: string
  contingency?: number
  title?: string
  note?: string
}

export default function BpoCapacityCard({ data }: { data: BpoCapacityCardData }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <p className="text-xs font-semibold text-text-muted mb-3">{data.title ?? 'BPO Overflow Capacity'}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border-subtle p-3 text-center">
          <p className="text-2xl font-bold text-success-600 tabular-nums">{data.available}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wide">Available</p>
        </div>
        <div className="rounded-lg border border-border-subtle p-3 text-center">
          <p className="text-2xl font-bold text-brand tabular-nums">{data.needed}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wide">Needed</p>
        </div>
      </div>
      {data.note && <p className="text-[11px] text-text-muted mt-3">{data.note}</p>}
      {!data.note && (data.certified || data.confirmBy) && (
        <p className="text-[11px] text-text-muted mt-3">
          {data.certified && <>{data.certified}-certified agents</>}
          {data.confirmBy && <> · confirm by <span className="font-semibold text-text">{data.confirmBy}</span></>}
          {(data.contingency ?? 0) > 0 && <> · {data.contingency} held as contingency</>}
          .
        </p>
      )}
    </div>
  )
}
