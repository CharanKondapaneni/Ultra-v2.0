import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'
import ChatMessage, { type Message } from './ChatMessage'
import TypingIndicator from './TypingIndicator'
import ChatInput from './ChatInput'
import FollowUpChips from './FollowUpChips'
import type { ApiResponse } from '@/api/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FetchAskFn = (persona: any, query: string, history?: unknown[]) => Promise<ApiResponse<unknown>>

export interface ChatInterfaceProps {
  persona: string
  fetchAsk: FetchAskFn
  greeting: string
  initials: string
  placeholder?: string
  briefingSlot?: ReactNode
  onSend?: (query: string, messageId: string, components: ReactNode[]) => void
  inlineMap?: Record<string, ReactNode[]>
  mockGreeting?: string
  mockSources?: string[]
  mockChips?: string[]
}

let msgCounter = 0
const nextId = () => `msg-${++msgCounter}`

export default function ChatInterface({
  persona,
  fetchAsk,
  greeting,
  initials,
  placeholder,
  briefingSlot,
  inlineMap = {},
  mockGreeting,
  mockSources,
  mockChips,
}: ChatInterfaceProps) {

  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [chips, setChips] = useState<string[]>(mockChips ?? [])
  const [greetingMsg, setGreetingMsg] = useState<Message | null>(
    mockGreeting ? { id: 'mock-greeting', role: 'assistant', text: mockGreeting, sources: mockSources } : null
  )
  const bottomRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([])
  const inflightGreeting = useRef(false)

  const isInitialView = messages.length === 0 && !isTyping

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, isTyping])

  useEffect(() => {
    if (inflightGreeting.current) return
    inflightGreeting.current = true
    fetchAsk(persona, 'greeting')
      .then(res => {
        if (res.ai_message) {
          const msg: Message = {
            id: nextId(),
            role: 'assistant',
            text: res.ai_message,
            sources: res.data_sources_used?.length ? res.data_sources_used : undefined,
          }
          setGreetingMsg(msg)
          historyRef.current = [{ role: 'assistant', content: res.ai_message }]
          if (res.suggested_chips?.length) setChips(res.suggested_chips)
        }
      })
      .catch(() => { /* no fallback */ })
      .finally(() => { inflightGreeting.current = false })
  }, [persona])

  const handleBackToBriefing = useCallback(() => {
    setMessages([])
    setIsTyping(false)
    setChips([])
    historyRef.current = []
  }, [])

  const handleSend = useCallback(async (query: string) => {
    const userMsg: Message = { id: nextId(), role: 'user', text: query }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)
    setChips([])

    historyRef.current.push({ role: 'user', content: query })

    try {
      const res = await fetchAsk(persona, query, historyRef.current.slice(0, -1))
      const aiText = res.ai_message ?? 'Here is what I found.'
      const aiId = nextId()

      const aiMsg: Message = {
        id: aiId,
        role: 'assistant',
        text: aiText,
        sources: res.data_sources_used?.length ? res.data_sources_used : undefined,
      }

      historyRef.current.push({ role: 'assistant', content: aiText })
      setMessages(prev => [...prev, aiMsg])
      setChips(res.suggested_chips?.length ? res.suggested_chips : [])
    } catch {
      setMessages(prev => [...prev, {
        id: nextId(),
        role: 'assistant',
        text: 'I could not reach the data layer right now. Please try again.',
      }])
      setChips([])
    } finally {
      setIsTyping(false)
    }
  }, [persona])

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: isInitialView
          ? 'linear-gradient(180deg, color-mix(in srgb, var(--color-brand) 3%, var(--color-surface)) 0%, color-mix(in srgb, var(--color-brand) 1%, var(--color-surface)) 40%, var(--color-surface) 100%)'
          : 'var(--color-surface)',
        transition: 'background 0.4s ease',
      }}
    >
      {/* Back-to-briefing bar */}
      {!isInitialView && (
        <div className="sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-2 bg-surface/85 backdrop-blur-sm border-b border-border-subtle">
          <div className="max-w-5xl mx-auto">
            <button
              type="button"
              onClick={handleBackToBriefing}
              className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 text-[11px] font-semibold text-text-muted hover:text-brand hover:bg-brand/[0.06] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back to briefing
            </button>
          </div>
        </div>
      )}

      {/* Scrollable thread */}
      <div className="flex-1 overflow-y-auto scrollbar-sleek">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* Initial briefing view */}
          <AnimatePresence>
            {isInitialView && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                transition={{ duration: 0.4 }}
              >
                <div className="pt-2 pb-3">
                  <h2 className="text-xl font-bold text-text tracking-tight">
                    Good {getTimeOfDay()}, <span className="text-brand">{greeting}</span>
                  </h2>
                  <p className="text-[13px] text-text-muted mt-1 leading-relaxed">
                    Your AI intelligence brief is ready. Here's what needs your attention today.
                  </p>
                </div>
                {briefingSlot}
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Conversation divider — initial view only */}
          <AnimatePresence>
            {isInitialView && (
              <motion.div
                key="divider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 mb-2"
              >
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface-2 border border-border-subtle">
                  <Sparkles className="w-3 h-3 text-brand/50" />
                  <span className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider">AI Conversation</span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Greeting message — always visible once loaded */}
          {greetingMsg && (
            <motion.div
              key="greeting"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="mb-4"
            >
              <ChatMessage message={greetingMsg} personaInitials={initials} />
            </motion.div>
          )}

          {/* Chat thread */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map(msg => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  inlineComponents={inlineMap[msg.id]}
                  personaInitials={initials}
                />
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {isTyping && <TypingIndicator />}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>

        </div>
      </div>

      {/* Sticky input bar */}
      <div className="relative bg-surface border-t border-border-subtle px-4 sm:px-6 lg:px-8 pt-3 pb-4">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto">
          {!isTyping && chips.length > 0 && (
            <FollowUpChips chips={chips} onChipClick={handleSend} />
          )}
          <ChatInput
            onSend={handleSend}
            disabled={isTyping}
            suggestions={chips}
            placeholder={placeholder ?? 'Ask anything…'}
          />
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
