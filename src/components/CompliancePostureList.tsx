const postureStyle: Record<string, { dot: string; text: string }> = {
  ok:    { dot: 'bg-success-500',  text: 'text-success-600'  },
  watch: { dot: 'bg-warning-500',  text: 'text-warning-600'  },
  risk:  { dot: 'bg-critical-500', text: 'text-critical-600' },
}

export interface CompliancePostureItem {
  item: string
  status: string
  detail?: string
  tone: string
}

export interface CompliancePostureListData {
  items: CompliancePostureItem[]
}

export default function CompliancePostureList({ data }: { data: CompliancePostureListData }) {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="divide-y divide-border-subtle">
        {data.items.map(c => {
          const s = postureStyle[c.tone] ?? postureStyle.watch
          return (
            <div key={c.item} className="px-4 py-3 flex items-center gap-3">
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text">{c.item}</p>
                {c.detail && <p className="text-[10px] text-text-muted mt-0.5">{c.detail}</p>}
              </div>
              <span className={`text-[11px] font-semibold ${s.text}`}>{c.status}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
