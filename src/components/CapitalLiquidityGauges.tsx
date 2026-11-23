import { CheckCircle2, ArrowRight } from 'lucide-react'

export interface ReconciliationItem {
  id: string
  layer: string
  system: string
  netWorth: number
  ratio: number
}

export interface CapitalLiquidityData {
  eyebrow?: string
  capitalLiquidity: {
    netWorthBefore: number
    netWorthAfter: number
    earlyWarning: number
    liquiditySurplusBefore: number
    liquiditySurplus: number
    loanToShareBefore: number
    loanToShareAfter: number
    trigger: number
    reconciliation: ReconciliationItem[]
  }
}

function fmtM(n: number, dp = 1) {
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(dp)}B`
  if (Math.abs(n) >= 1_000_000)     return `$${(n / 1_000_000).toFixed(dp)}M`
  if (Math.abs(n) >= 1_000)         return `$${(n / 1_000).toFixed(dp)}K`
  return `$${n.toFixed(dp)}M`
}
function fmtPct(v: number, dp = 1) { return `${v.toFixed(dp)}%` }

interface GaugeProps {
  title: string
  min: number
  max: number
  before: number
  after: number
  line: number
  lineLabel: string
  format: (v: number) => string
  status: string
  tone: 'success' | 'warning'
  source: string
  lineTone?: string
}

function Gauge({ title, min, max, before, after, line, lineLabel, format, status, tone, source, lineTone = '#dc2626' }: GaugeProps) {
  const r = 52, cx = 64, cy = 62
  const angle = (v: number) => Math.PI * (1 - (Math.min(Math.max(v, min), max) - min) / (max - min))
  const pt = (v: number, rr = r): [number, number] => [cx + rr * Math.cos(angle(v)), cy - rr * Math.sin(angle(v))]
  const arc = (from: number, to: number) => {
    if (Math.abs(to - from) < 0.001) return ''
    const [x1, y1] = pt(from); const [x2, y2] = pt(to)
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`
  }
  const [ax, ay] = pt(after, r - 10)
  const [bx1, by1] = pt(before, r - 7); const [bx2, by2] = pt(before, r + 7)
  const [lx1, ly1] = pt(line, r - 9); const [lx2, ly2] = pt(line, r + 9)
  const dangerFrom = line <= (min + max) / 2 ? min : line
  const dangerTo   = line <= (min + max) / 2 ? line : max

  const toneCls = tone === 'success'
    ? 'bg-success-50 text-success-700 border-success-200'
    : 'bg-warning-50 text-warning-700 border-warning-200'

  return (
    <div className="min-w-0 rounded-lg border border-border-subtle bg-surface p-3">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-text-subtle">{title}</p>
      <svg viewBox="0 0 128 72" className="mx-auto mt-1 w-full max-w-[190px]" role="img" aria-label={`${title}: ${format(before)} before, ${format(after)} after`}>
        <path d={arc(min, max)} fill="none" stroke="var(--color-border-subtle, #e5e7eb)" strokeWidth="10" strokeLinecap="round" />
        {dangerTo > dangerFrom && (
          <path d={arc(dangerFrom, dangerTo)} fill="none" stroke={lineTone} strokeOpacity="0.18" strokeWidth="10" />
        )}
        <path d={arc(min, after)} fill="none" stroke="var(--color-brand, #003087)" strokeWidth="10" strokeLinecap="round" opacity="0.85" />
        <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke={lineTone} strokeWidth="2" />
        <line x1={bx1} y1={by1} x2={bx2} y2={by2} stroke="var(--color-text-subtle, #9ca3af)" strokeWidth="2" strokeDasharray="2 1.5" />
        <line x1={cx} y1={cy} x2={ax} y2={ay} stroke="var(--color-text, #111827)" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="3" fill="var(--color-text, #111827)" />
      </svg>
      <div className="mt-0.5 flex items-center justify-center gap-1.5 tabular-nums">
        <span className="text-[12px] text-text-subtle">{format(before)}</span>
        <ArrowRight className="h-3 w-3 text-text-subtle" />
        <span className="text-[18px] font-bold leading-none text-text">{format(after)}</span>
      </div>
      <p className="mt-1 text-center text-[10px] text-text-muted">{lineLabel}</p>
      <div className="mt-1.5 flex justify-center">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${toneCls}`}>{status}</span>
      </div>
      <p className="mt-1.5 text-center text-[9.5px] text-text-subtle">{source} · Overnight scan</p>
    </div>
  )
}

export default function CapitalLiquidityGauges({ data }: { data: CapitalLiquidityData }) {
  const { eyebrow = 'Friction Observability', capitalLiquidity: c } = data

  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-subtle mb-0.5">{eyebrow}</p>
          <h3 className="text-sm font-semibold text-text">Capital and liquidity cushion · before and after the 30-day shutdown</h3>
        </div>
        <span className="shrink-0 text-[10px] font-semibold bg-success-50 text-success-700 border border-success-200 rounded-full px-2 py-0.5">
          Still well capitalized
        </span>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Gauge
          title="Net worth ratio"
          min={6.5} max={8}
          before={c.netWorthBefore} after={c.netWorthAfter}
          line={c.earlyWarning}
          lineLabel={`Early-warning line ${fmtPct(c.earlyWarning)}`}
          format={v => fmtPct(v, v === c.netWorthBefore ? 2 : 1)}
          status={`${(c.netWorthAfter - c.earlyWarning).toFixed(1)} pts above the line`}
          tone="success"
          source="General ledger"
        />
        <Gauge
          title="Liquidity to spare, quarter"
          min={0} max={100}
          before={c.liquiditySurplusBefore} after={c.liquiditySurplus}
          line={-1}
          lineLabel="Covers projected quarter outflows"
          format={v => fmtM(v)}
          status="Positive coverage"
          tone="success"
          source="Models"
        />
        <Gauge
          title="Loan-to-share"
          min={80} max={90}
          before={c.loanToShareBefore} after={c.loanToShareAfter}
          line={c.trigger}
          lineLabel={`Funding-review trigger ${c.trigger}%`}
          format={v => `${v}%`}
          status={`${c.trigger - c.loanToShareAfter} pt below the trigger`}
          tone="warning"
          source="Core banking system + general ledger"
          lineTone="#d97706"
        />
      </div>

      <p className="mb-4 rounded-lg border border-warning-200 bg-warning-50/50 px-3 py-2 text-[11px] leading-relaxed text-text">
        <span className="font-semibold text-warning-700">Pressure point: </span>
        deposit outflow concentrated in a few Senate-community payroll groups pushes loan-to-share toward the trigger.
      </p>

      <div className="rounded-lg border border-success-200 bg-success-50/40 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-success-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Capital position reconciled across three sources
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {c.reconciliation.map(s => (
            <div key={s.id} className="min-w-0 rounded-md border border-success-200 bg-surface px-2.5 py-2">
              <p className="text-[9.5px] font-semibold uppercase tracking-wide text-text-subtle">{s.layer}</p>
              <p className="truncate text-[11px] font-medium text-text" title={s.system}>{s.system}</p>
              <p className="mt-1 flex items-baseline justify-between gap-2 tabular-nums">
                <span className="text-[13px] font-bold text-text">{fmtM(s.netWorth, 2)}</span>
                <span className="text-[11px] text-text-muted">{fmtPct(s.ratio, 2)}</span>
              </p>
              <span className="mt-1 inline-flex text-[9px] font-bold uppercase tracking-wide text-success-700 bg-success-50 border border-success-200 rounded-full px-1.5 py-0.5">
                Matched
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[9.5px] text-text-subtle">Dashed tick: before the shutdown. Needle: after. Sources: Core banking system, models (capital position, liquidity).</p>
    </div>
  )
}
