import type { ComponentType } from 'react'
import { Zap } from 'lucide-react'

interface SectionLabelProps {
  label: string
  icon?: ComponentType<{ className?: string }>
}

export default function SectionLabel({ label, icon: Icon = Zap }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-5 h-5 rounded-md bg-brand/[0.08] flex items-center justify-center">
        <Icon className="w-3 h-3 text-brand" />
      </div>
      <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-border-subtle ml-1" />
    </div>
  )
}
