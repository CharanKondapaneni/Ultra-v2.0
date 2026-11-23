import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
  placeholder?: string
  suggestions?: string[]
}

export default function ChatInput({ onSend, disabled = false, placeholder, suggestions = [] }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = value.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    onSend(suggestion)
    setValue('')
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasSuggestions = filtered.length > 0 && !disabled

  return (
    <div ref={wrapperRef} className="relative">
      <AnimatePresence>
        {showSuggestions && hasSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-surface rounded-xl border border-border-subtle overflow-hidden z-50"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
          >
            <div className="px-4 py-2.5 border-b border-border-subtle flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand/60" />
              <span className="text-[10px] font-bold text-text-subtle uppercase tracking-wider">Suggested questions</span>
            </div>
            <ul className="max-h-[200px] overflow-y-auto py-1">
              {filtered.map((s, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(s)}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-text-muted hover:bg-brand/[0.03] hover:text-brand transition-colors flex items-start gap-2.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-brand/25 mt-2 flex-shrink-0" />
                    <span className="leading-snug">{s}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`rounded-2xl p-[1px] transition-all duration-300 ${
        isFocused
          ? 'bg-gradient-to-r from-brand/30 via-brand/15 to-brand/30 shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-brand)_8%,transparent)]'
          : 'bg-border-subtle shadow-sm'
      }`}>
        <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-surface rounded-[15px] px-5 py-3">
          <Sparkles className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${isFocused ? 'text-brand/50' : 'text-brand/25'}`} />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onFocus={() => { setIsFocused(true); setShowSuggestions(true) }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder ?? 'Ask anything about your portfolio, signals, or scenarios…'}
            disabled={disabled}
            className="flex-1 text-sm text-text placeholder-text-muted outline-none bg-transparent disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!value.trim() || disabled}
            className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
