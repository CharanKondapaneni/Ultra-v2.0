import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import SourceBadge from './SourceBadge'
import MessageFeedback from './MessageFeedback'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  sources?: string[]
}

// ── VizErrorBoundary ──────────────────────────────────────────────────────────
class VizErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('[VizErrorBoundary]', error, info)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center gap-2.5">
        <span className="text-xs font-semibold text-text-muted">This visualization couldn't be rendered.</span>
      </div>
    )
  }
}

// ── Inline text renderer ──────────────────────────────────────────────────────
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/)
    return m ? <strong key={i} className="font-semibold text-text">{m[1]}</strong> : part
  })
}

// ── ChatMessage ───────────────────────────────────────────────────────────────
interface ChatMessageProps {
  message: Message
  inlineComponents?: ReactNode[]
  personaInitials?: string
}

export default function ChatMessage({ message, inlineComponents, personaInitials = 'FI' }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-brand/[0.12] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-brand/70" />
        </div>
      )}

      <div className={`min-w-0 max-w-[85%] ${isUser ? 'order-first' : ''}`}>
        {/* Bubble */}
        <div
          className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-brand to-[color-mix(in_srgb,var(--color-brand)_85%,white)] text-white rounded-tr-md shadow-[0_2px_8px_color-mix(in_srgb,var(--color-brand)_20%,transparent)]'
              : 'bg-surface text-text rounded-tl-md border border-border/70'
          }`}
          style={!isUser ? { boxShadow: '0 1px 6px rgba(0,0,0,0.06)' } : {}}
        >
          {message.text.split('\n').map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-2.5" />

            // [SourceName] text
            const bracketMatch = line.match(/^\[(.+?)\]\s*(.*)$/)
            if (bracketMatch && !isUser) {
              // Numbered item [1]
              const isNum = /^\d+$/.test(bracketMatch[1])
              if (isNum) return (
                <p key={i} className="mb-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-brand/10 text-brand text-[10px] font-bold mr-1.5">{bracketMatch[1]}</span>
                  <span className="text-text-muted">{renderInline(bracketMatch[2])}</span>
                </p>
              )
              return (
                <p key={i} className="mb-1.5">
                  <span className="font-semibold text-brand">[{bracketMatch[1]}]</span>{' '}
                  <span className="text-text-muted">{renderInline(bracketMatch[2])}</span>
                </p>
              )
            }

            // — dash items
            const dashMatch = line.match(/^—\s*(.*)$/)
            if (dashMatch && !isUser) return (
              <p key={i} className="mb-1 pl-3 relative text-text-muted">
                <span className="absolute left-0 top-0 text-brand/30">—</span>
                {renderInline(dashMatch[1])}
              </p>
            )

            return <p key={i} className="mb-1.5 last:mb-0">{renderInline(line)}</p>
          })}
        </div>

        {/* Inline components */}
        {inlineComponents && inlineComponents.length > 0 && (
          <div className="mt-3 space-y-3">
            {inlineComponents.map((comp, idx) => (
              <VizErrorBoundary key={idx}>{comp}</VizErrorBoundary>
            ))}
          </div>
        )}

        {/* Source badges + feedback */}
        {!isUser && (
          <div className="mt-2.5 pl-0.5 flex flex-wrap items-center gap-1.5">
            {message.sources?.map((src, idx) => (
              <SourceBadge key={idx} source={src} />
            ))}
            <MessageFeedback messageId={message.id} />
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-bg to-border flex items-center justify-center flex-shrink-0 mt-0.5 border border-border/60">
          <span className="text-text-muted text-[10px] font-bold">{personaInitials}</span>
        </div>
      )}
    </motion.div>
  )
}
