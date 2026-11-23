import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Maximize2, Minimize2, X } from 'lucide-react'
import type { ReactNode } from 'react'

interface PanelState {
  maximized: boolean
  toggle: () => void
  close: () => void
}

export interface MaximizeButtonProps {
  className?: string
}

export interface MaximizablePanelProps {
  className?: string
  children?: ReactNode | ((state: { maximized: boolean }) => ReactNode)
  label?: string
  shell?: string
}

const PanelContext = createContext<PanelState | null>(null)

const SHELL = 'rounded-2xl border border-border-subtle bg-surface'

export function MaximizeButton({ className = '' }: MaximizeButtonProps) {
  const ctx = useContext(PanelContext)
  if (!ctx) return null
  const { maximized, toggle, close } = ctx

  const base = 'inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-colors cursor-pointer flex-shrink-0'
  const quiet = 'border-border bg-surface-2 text-text-subtle hover:text-text'

  if (!maximized) {
    return (
      <button type="button" onClick={toggle} title="Maximize" aria-label="Maximize panel" className={`${base} ${quiet} ${className}`}>
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <button type="button" onClick={toggle} title="Restore to page" aria-label="Restore panel to the page" className={`${base} ${quiet}`}>
        <Minimize2 className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={close} title="Close (Esc)" aria-label="Close the maximized panel" className={`${base} border-border bg-surface-2 text-text-subtle hover:text-critical-700 hover:border-critical-300`}>
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  )
}

export default function MaximizablePanel({ className = '', children, label = 'Panel', shell = SHELL }: MaximizablePanelProps) {
  const [maximized, setMaximized] = useState(false)
  const inline = useRef<HTMLDivElement>(null)
  const [gap, setGap] = useState<number | null>(null)

  const toggle = useCallback(() => {
    setMaximized((v) => {
      if (!v && inline.current) setGap(inline.current.getBoundingClientRect().height)
      return !v
    })
  }, [])
  const close = useCallback(() => setMaximized(false), [])

  useEffect(() => {
    if (!maximized) return undefined
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMaximized(false) }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [maximized])

  const ctx = useMemo(() => ({ maximized, toggle, close }), [maximized, toggle, close])
  const body = typeof children === 'function' ? children({ maximized }) : children

  return (
    <PanelContext.Provider value={ctx}>
      {maximized ? (
        <div style={{ height: gap || undefined }} className="rounded-2xl border border-dashed border-border bg-surface-2/40 flex items-center justify-center min-h-[80px]">
          <p className="text-[11px] text-text-subtle px-4 text-center">{label} is maximized — press Escape or Restore to bring it back here.</p>
        </div>
      ) : (
        <div ref={inline} className={`${shell} ${className}`}>{body}</div>
      )}

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {maximized && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[120] bg-text/55 backdrop-blur-[2px] p-2 sm:p-5 flex"
              onClick={close} role="presentation"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.985 }} transition={{ duration: 0.18 }}
                className={`${shell} w-full h-full flex flex-col overflow-hidden shadow-2xl`}
                onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`${label}, maximized`}
              >
                <div className={`flex-1 min-h-0 overflow-y-auto scrollbar-sleek ${className}`}>{body}</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </PanelContext.Provider>
  )
}
