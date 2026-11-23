import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Users, CalendarClock, MessageSquare, Sparkles, ChevronDown, Play } from 'lucide-react'

export interface QueryFilters {
  product:     string
  location:    string
  age:         string
  origination: string
  channel:     string
  window:      string
}

const DEFAULT_FILTERS: QueryFilters = {
  product:     'Mortgage',
  location:    'Virginia',
  age:         'Under 30',
  origination: 'Chose to originate',
  channel:     'Majority electronic',
  window:      'App → closing',
}

const OPTIONS: Record<keyof QueryFilters, string[]> = {
  product:     ['Mortgage', 'Auto Loan', 'Personal Loan', 'HELOC', 'Credit Card', 'All Products'],
  location:    ['Virginia', 'Maryland', 'Washington DC', 'All States'],
  age:         ['Under 30', '30 – 45', '45 – 60', 'Over 60', 'All Ages'],
  origination: ['Chose to originate', 'Withdrew', 'Denied', 'All Outcomes'],
  channel:     ['Majority electronic', 'Majority phone', 'Majority in-branch', 'All Channels'],
  window:      ['App → closing', 'App → 30 days', 'App → 60 days', 'App → 90 days'],
}

const TESTS: Record<keyof QueryFilters, string> = {
  product:     'Product-level risk & resource application',
  location:    'State privacy & lending requirements',
  age:         'Fair lending · ECOA & Reg B (protected basis)',
  origination: 'Member attrition — did we lose them',
  channel:     'ESIGN consent for electronic delivery',
  window:      'Lender efficiency; stepping outside procedure',
}

const ICONS = {
  product:     Search,
  location:    MapPin,
  age:         Users,
  origination: Sparkles,
  channel:     MessageSquare,
  window:      CalendarClock,
}

const LABELS: Record<keyof QueryFilters, string> = {
  product:     'Product',
  location:    'Location',
  age:         'Age',
  origination: 'Origination',
  channel:     'Channel',
  window:      'Days & interactions',
}

interface Props {
  onRunQuery: (filters: QueryFilters) => void
  loading?: boolean
}

export default function ComplianceQueryCharacteristics({ onRunQuery, loading = false }: Props) {
  const [filters, setFilters] = useState<QueryFilters>(DEFAULT_FILTERS)
  const [committed, setCommitted] = useState<QueryFilters>(DEFAULT_FILTERS)
  const [openKey, setOpenKey] = useState<keyof QueryFilters | null>(null)

  const isDirty = (Object.keys(filters) as (keyof QueryFilters)[]).some(k => filters[k] !== committed[k])

  function select(key: keyof QueryFilters, value: string) {
    setFilters(f => ({ ...f, [key]: value }))
    setOpenKey(null)
  }

  function runQuery() {
    setCommitted(filters)
    onRunQuery(filters)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-surface-2 rounded-xl p-4 border border-border-subtle"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-brand" />
          <p className="text-xs font-semibold text-text-muted">Query characteristics</p>
        </div>
        <button
          onClick={runQuery}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all
            ${isDirty
              ? 'bg-brand text-white shadow-sm hover:opacity-90'
              : 'bg-surface border border-border-subtle text-text-muted hover:bg-surface-2'
            }
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Play className="w-3 h-3" />
          {loading ? 'Running…' : 'Run Query'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {(Object.keys(filters) as (keyof QueryFilters)[]).map((key) => {
          const Icon = ICONS[key]
          const isOpen = openKey === key
          const changed = filters[key] !== DEFAULT_FILTERS[key]

          return (
            <div key={key} className="relative">
              <button
                onClick={() => setOpenKey(isOpen ? null : key)}
                className={`w-full text-left bg-surface rounded-lg border px-3 py-2.5 transition-all
                  ${isOpen ? 'border-brand ring-1 ring-brand/20' : changed ? 'border-brand/40' : 'border-border-subtle'}
                  hover:border-brand/50`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-brand" />
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-text-subtle">{LABELS[key]}</span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-text-subtle transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
                <p className={`text-[12px] font-semibold leading-tight ${changed ? 'text-brand' : 'text-text'}`}>
                  {filters[key]}
                </p>
                <p className="text-[9.5px] text-text-subtle leading-snug mt-1">{TESTS[key]}</p>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border-subtle rounded-lg shadow-lg z-20 overflow-hidden"
                  >
                    {OPTIONS[key].map(opt => (
                      <button
                        key={opt}
                        onClick={() => select(key, opt)}
                        className={`w-full text-left px-3 py-2 text-[11px] transition-colors
                          ${filters[key] === opt
                            ? 'bg-brand/10 text-brand font-semibold'
                            : 'text-text hover:bg-surface-2'
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
