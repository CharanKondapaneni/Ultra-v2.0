import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Activity, AlertTriangle, ArrowLeftRight, Award, BadgeDollarSign, BarChart3, Brain, Briefcase, Building2, CalendarClock, CalendarDays, CheckCircle2, ClipboardCheck, ClipboardList, Clock, CreditCard, Database, DollarSign, Droplets, FileCheck2, FileEdit, FileText, FileWarning, Flame, Gauge, GitCompareArrows, Headphones, Home, Layers, ListChecks, MessageSquare, Percent, PhoneCall, PiggyBank, Receipt, Scale, Search, ShieldAlert, ShieldCheck, ShieldOff, Sparkles, Star, Target, Timer, TrendingDown, TrendingUp, UserCheck, Users, Wallet } from 'lucide-react'
import type { ComponentType } from 'react'

// ── Icon registry ─────────────────────────────────────────────────────────────
type IconComponent = ComponentType<{ className?: string }>

const ICONS: Record<string, IconComponent> = {
  'activity': Activity, 'alert-triangle': AlertTriangle, 'arrow-left-right': ArrowLeftRight,
  'award': Award, 'badge-dollar-sign': BadgeDollarSign, 'bar-chart': BarChart3,
  'brain': Brain, 'briefcase': Briefcase, 'building': Building2, 'calendar': CalendarDays,
  'check-circle-2': CheckCircle2, 'clipboard-check': ClipboardCheck, 'clipboard-list': ClipboardList,
  'clock': Clock, 'credit-card': CreditCard, 'database': Database, 'dollar-sign': DollarSign,
  'file-check': FileCheck2, 'file-text': FileText, 'file-warning': FileWarning, 'flame': Flame,
  'calendar-clock': CalendarClock, 'droplets': Droplets, 'file-edit': FileEdit,
  'gauge': Gauge, 'git-compare': GitCompareArrows, 'headphones': Headphones, 'home': Home, 'layers': Layers,
  'list-checks': ListChecks, 'message-square': MessageSquare, 'percent': Percent,
  'phone-call': PhoneCall, 'piggy-bank': PiggyBank, 'receipt': Receipt, 'scale': Scale,
  'search': Search, 'shield-alert': ShieldAlert, 'shield-check': ShieldCheck, 'shield-off': ShieldOff,
  'sparkles': Sparkles, 'star': Star, 'target': Target, 'timer': Timer, 'trending-down': TrendingDown,
  'trending-up': TrendingUp, 'user-check': UserCheck, 'users': Users, 'wallet': Wallet,
}

// ── Tone map ──────────────────────────────────────────────────────────────────
const TONE_STYLE: Record<string, { color: string; bg: string }> = {
  good:      { color: 'text-success-600',  bg: 'bg-success-500/10'  },
  warning:   { color: 'text-warning-600',  bg: 'bg-warning-500/10'  },
  critical:  { color: 'text-critical-600', bg: 'bg-critical-500/10' },
  info:      { color: 'text-info-600',     bg: 'bg-info-500/10'     },
  neutral:   { color: 'text-text-muted',   bg: 'bg-text-muted/10'   },
  brand:     { color: 'text-brand',        bg: 'bg-brand/10'        },
  category1: { color: 'text-violet-600',   bg: 'bg-violet-500/10'   },
  category2: { color: 'text-cyan-600',     bg: 'bg-cyan-500/10'     },
  category3: { color: 'text-teal-700',     bg: 'bg-teal-500/10'     },
  category4: { color: 'text-indigo-500',   bg: 'bg-indigo-500/10'   },
  category5: { color: 'text-pink-500',     bg: 'bg-pink-500/10'     },
}

function tileIcon(stat: { iconTone?: string }) {
  return TONE_STYLE[stat.iconTone ?? ''] ?? TONE_STYLE.neutral
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface KpiStat {
  id: string
  icon?: string
  value: string
  label: string
  trend?: string
  positive?: boolean
  iconTone?: string
  chipText?: string | null
}

export interface CapmKpiCarouselData {
  kpis: KpiStat[]
  visible?: boolean
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ stat, onClick }: { stat: KpiStat; onClick: (chip: string) => void }) {
  const Icon = stat.icon ? (ICONS[stat.icon] ?? Activity) : Activity
  const tone = tileIcon(stat)
  const isClickable = !!stat.chipText

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onClick(stat.chipText!) : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(stat.chipText!) } : undefined}
      className={`flex-1 min-w-0 rounded-lg px-3 py-2.5 bg-surface border border-border-subtle/80 ${
        isClickable
          ? 'cursor-pointer hover:border-brand/15 hover:shadow-[0_2px_8px_rgba(0,48,135,0.06)] transition-all duration-200'
          : ''
      }`}
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${tone.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${tone.color}`} />
        </div>
        <div className="min-w-0 flex-1 flex flex-col gap-[2px]">
          <span className="text-[14px] font-bold text-text leading-none truncate">{stat.value}</span>
          <span className="text-[10px] text-text-subtle font-medium leading-none truncate">{stat.label}</span>
          {stat.trend && (
            <span className={`text-[9.5px] font-semibold leading-none truncate ${
              stat.positive ? 'text-success-600' : 'text-warning-600'
            }`}>
              {stat.trend}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── CapmKpiCarousel ───────────────────────────────────────────────────────────
const PER_PAGE = 4

export interface CapmKpiCarouselProps {
  data: CapmKpiCarouselData
  onStatClick?: (chip: string) => void
}

export default function CapmKpiCarousel({ data, onStatClick }: CapmKpiCarouselProps) {
  const [page, setPage] = useState(0)
  const { kpis, visible = true } = data

  if (!kpis || kpis.length === 0 || !visible) return null

  const totalPages = Math.ceil(kpis.length / PER_PAGE)
  const visibleStats = kpis.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)
  const canPrev = page > 0
  const canNext = page < totalPages - 1

  const handleClick = (chip: string) => {
    if (onStatClick) onStatClick(chip)
    else window.dispatchEvent(new CustomEvent('fiona:chip', { detail: chip }))
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 'auto' }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="mb-3"
        >
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-1.5 mb-1.5">
              <span className="text-[10px] text-text-subtle font-medium tabular-nums">
                {page + 1}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => canPrev && setPage(p => p - 1)}
                disabled={!canPrev}
                aria-label="Previous KPIs"
                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                  canPrev ? 'text-text-muted hover:text-brand hover:bg-brand/[0.06] cursor-pointer' : 'text-text-subtle cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => canNext && setPage(p => p + 1)}
                disabled={!canNext}
                aria-label="Next KPIs"
                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                  canNext ? 'text-text-muted hover:text-brand hover:bg-brand/[0.06] cursor-pointer' : 'text-text-subtle cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            {visibleStats.map(stat => (
              <StatCard key={stat.id} stat={stat} onClick={handleClick} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
