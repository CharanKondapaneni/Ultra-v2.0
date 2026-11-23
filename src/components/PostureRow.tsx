import type { ComponentType } from 'react'

export interface PostureRowProps {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  tone?: 'good'
}

export default function PostureRow({ icon: Icon, label, value, tone }: PostureRowProps) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-border-subtle last:border-0">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand/[0.07] text-brand">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-[11.5px] text-text-muted flex-1">{label}</span>
      <span className={`text-[12px] font-semibold tabular-nums ${tone === 'good' ? 'text-success-600' : 'text-text'}`}>{value}</span>
    </div>
  )
}
