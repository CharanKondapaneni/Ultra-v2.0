export interface LimitItem {
  id: string
  portfolio: string
  balance: number
  pctOfNetWorth: number
  cap: number
  headroom: number
}

export interface LimitProjection {
  growthPerQuarter: number
  quartersToCap: number
  nearLimitPoints: number
}

export interface PortfolioLimitChartData {
  eyebrow?: string
  limits: LimitItem[]
  projection: LimitProjection
}

const SCALE = 110 // % of cap shown across the bar
const at = (pctOfCap: number) => `${(Math.min(Math.max(pctOfCap, 0), SCALE) / SCALE) * 100}%`

function fmtM(n: number) {
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  return `$${(n / 1_000_000).toFixed(1)}M`
}

export default function PortfolioLimitChart({ data }: { data: PortfolioLimitChartData }) {
  const { eyebrow = 'Converged Conversation', limits, projection } = data
  const { growthPerQuarter, quartersToCap, nearLimitPoints } = projection
  const use = (p: LimitItem) => (p.pctOfNetWorth / p.cap) * 100
  const sorted = [...limits].sort((a, b) => use(b) - use(a))
  const fm = limits.find(p => p.id === 'first_mortgage') ?? limits[0]
  const projectedBalance = fm.balance + growthPerQuarter * quartersToCap
  const netWorthM = fm.balance / (fm.pctOfNetWorth / 100)
  const projectedUse = (projectedBalance / netWorthM / (fm.cap / 100)) * 100
  const nextClosest = sorted.find(p => p.id !== fm.id)

  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-subtle mb-0.5">{eyebrow}</p>
          <h3 className="text-sm font-semibold text-text">Portfolios against board risk-tolerance limits</h3>
        </div>
        {(() => {
          const overCap = limits.filter(p => p.pctOfNetWorth > p.cap)
          return overCap.length > 0
            ? <span className="shrink-0 text-[10px] font-semibold bg-critical-50 text-critical-700 border border-critical-200 rounded-full px-2 py-0.5">
                {overCap.length} portfolio{overCap.length > 1 ? 's' : ''} over cap
              </span>
            : <span className="shrink-0 text-[10px] font-semibold bg-warning-50 text-warning-700 border border-warning-200 rounded-full px-2 py-0.5">
                1 portfolio near its limit
              </span>
        })()}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg border border-border-subtle bg-bg p-3">
          <p className="text-[10px] text-text-subtle mb-1">First mortgage vs net worth</p>
          <p className="text-lg font-bold text-warning-700 tabular-nums">{Math.round(fm.pctOfNetWorth)}%</p>
          <p className="text-[9.5px] text-text-subtle mt-0.5">Board cap {fm.cap}% · {fmtM(fm.balance)} balance</p>
          {fm.headroom < 0
            ? <p className="text-[9.5px] text-critical-600 font-semibold">Exceeds cap by {fmtM(Math.abs(fm.headroom))}</p>
            : <p className="text-[9.5px] text-warning-600 font-semibold">About {fmtM(Math.floor(fm.headroom))} headroom</p>
          }
        </div>
        <div className="rounded-lg border border-border-subtle bg-bg p-3">
          <p className="text-[10px] text-text-subtle mb-1">Cap reached at current pace</p>
          <p className="text-lg font-bold text-warning-700 tabular-nums">~{quartersToCap} quarters</p>
          <p className="text-[9.5px] text-text-subtle mt-0.5">First mortgage growing {fmtM(growthPerQuarter)} a quarter</p>
          <p className="text-[9.5px] text-text-subtle font-semibold">Projection</p>
        </div>
        {nextClosest && (
          <div className="rounded-lg border border-border-subtle bg-bg p-3">
            <p className="text-[10px] text-text-subtle mb-1">Next closest portfolio</p>
            <p className="text-lg font-bold text-success-600 tabular-nums">{Math.round(use(nextClosest))}% of cap</p>
            <p className="text-[9.5px] text-text-subtle mt-0.5">{nextClosest.portfolio}</p>
            <p className="text-[9.5px] text-success-600 font-semibold">Inside limits</p>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div className="rounded-lg border border-border-subtle bg-bg p-3">
        {/* Axis ticks */}
        <div className="relative mb-1 h-3 text-[9px] tabular-nums text-text-subtle" aria-hidden="true">
          {[0, 25, 50, 75, 100].map(t => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: at(t) }}>
              {t === 100 ? 'Cap' : `${t}%`}
            </span>
          ))}
        </div>

        <div className="space-y-5">
          {sorted.map(p => {
            const u = use(p)
            const near = u >= 100 - nearLimitPoints
            return (
              <div key={p.id}>
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[11px]">
                  <span className={`font-semibold ${near ? 'text-warning-700' : 'text-text'}`}>{p.portfolio}</span>
                  <span className="tabular-nums text-text-muted">
                    {fmtM(p.balance)} · {Math.round(p.pctOfNetWorth)}% of net worth vs {p.cap}% cap ·{' '}
                    {p.headroom < 0
                      ? <span className="font-semibold text-critical-700">Exceeds cap by {fmtM(Math.abs(p.headroom))}</span>
                      : <span className={near ? 'font-semibold text-warning-700' : ''}>{fmtM(Math.floor(p.headroom))} headroom</span>
                    }
                  </span>
                </div>
                <div className="relative h-5 rounded bg-surface">
                  {/* Within nearLimitPoints of cap — amber zone */}
                  <div
                    className="absolute inset-y-0 bg-warning-500/10"
                    style={{ left: at(100 - nearLimitPoints), width: `${(nearLimitPoints / SCALE) * 100}%` }}
                    aria-hidden="true"
                  />
                  {/* Headroom — green shading from bar end to cap (only when under cap) */}
                  {u <= 100 && (
                    <div
                      className="absolute inset-y-1 rounded-r bg-success-500/20"
                      style={{ left: at(u), width: `${((100 - u) / SCALE) * 100}%` }}
                      aria-hidden="true"
                    />
                  )}
                  {/* Value bar */}
                  <div
                    className={`absolute inset-y-0 left-0 flex items-center justify-end rounded-l pr-1.5 text-[9.5px] font-bold text-white ${
                      u > 100 ? 'bg-critical-500' : near ? 'bg-warning-500' : 'bg-brand/70'
                    }`}
                    style={{ width: u > 100 ? '100%' : at(u) }}
                  >
                    {u > 100
                      ? <span className="text-[8.5px] font-bold uppercase tracking-wide">{Math.round(p.pctOfNetWorth)}% — OVER CAP</span>
                      : `${Math.round(u)}%`
                    }
                  </div>
                  {/* Board cap line */}
                  <div className="absolute -inset-y-1 w-0.5 bg-critical-600" style={{ left: at(100) }} aria-hidden="true" />
                  {/* Projection marker for first mortgage */}
                  {p.id === fm.id && (
                    <div
                      className="absolute -inset-y-1.5 w-0 border-l-2 border-dashed border-text"
                      style={{ left: at(projectedUse) }}
                      title={`Projected in ${quartersToCap} quarters: ${fmtM(projectedBalance)}`}
                      aria-hidden="true"
                    >
                      <span className="absolute top-full mt-0.5 -translate-x-1/2 whitespace-nowrap rounded bg-surface px-1 text-[9px] font-semibold text-text">
                        +{quartersToCap} qtrs
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[9.5px] text-text-subtle">
          <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-critical-600" /> Board cap ({fm.cap}% of net worth)</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-3 rounded-sm bg-success-500/20" /> Headroom</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-3 rounded-sm bg-warning-500/15" /> Within {nearLimitPoints} points</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-0 border-l-2 border-dashed border-text" /> First mortgage in {quartersToCap} quarters at current pace</span>
        </div>
      </div>

      <p className="mt-3 text-[9.5px] text-text-subtle">
        Limits are percent of net worth. Sources: Core banking system, models (portfolio balance, capital position, risk limits).
      </p>
    </div>
  )
}
