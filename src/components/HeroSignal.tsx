import { motion } from 'framer-motion'
import { Route } from 'lucide-react'
import type { CeoSignal } from './prioritySignalsTypes'

export default function HeroSignal({ signal }: { signal: CeoSignal }) {
  const m = signal.metrics ?? {}
  const tiles = [
    { l: 'Loan-to-share',   v: m.loan_to_share_pct != null       ? `${m.loan_to_share_pct}%`       : '—', s: '5-year high' },
    { l: 'Loan growth',     v: m.net_loan_growth_ytd_pct != null  ? `+${m.net_loan_growth_ytd_pct}%` : '—', s: m.share_growth_ytd_pct != null ? `shares +${m.share_growth_ytd_pct}%` : '' },
    { l: '90-day pipeline', v: '$312M', s: 'MeridianLink' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-brand text-white p-5 shadow-[0_8px_30px_color-mix(in_srgb,var(--color-brand)_18%,transparent)]"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="rounded-md bg-[#E4CE96] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text">Primary</span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#E4CE96]">
          <span className="h-2 w-2 rounded-full bg-[#E4CE96]" /> Watch · Balance sheet
        </span>
        {signal.confidence && (
          <span className="ml-auto text-[11px] font-semibold tabular-nums text-[#7fd3a6]">Confidence {signal.confidence.score}%</span>
        )}
      </div>

      <h3 className="text-[19px] font-bold leading-tight">{signal.title}</h3>
      {signal.description && <p className="text-[12.5px] text-white/70 mt-1.5 leading-relaxed">{signal.description}</p>}

      <div className="grid grid-cols-3 gap-2.5 mt-4">
        {tiles.map(t => (
          <div key={t.l} className="rounded-xl bg-white/[0.06] border border-white/10 p-3">
            <p className="text-[9.5px] uppercase tracking-wide text-white/50">{t.l}</p>
            <p className="text-[22px] font-bold text-[#E4CE96] leading-none mt-1 tabular-nums">{t.v}</p>
            <p className="text-[10px] text-white/50 mt-1">{t.s}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3.5 py-2 text-[12px] font-semibold text-white/90 transition-colors hover:bg-white/10"
        >
          <Route className="h-3.5 w-3.5" /> Trace to source
        </button>
      </div>
    </motion.div>
  )
}
