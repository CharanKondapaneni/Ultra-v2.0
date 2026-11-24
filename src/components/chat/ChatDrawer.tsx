import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import ChatMessage, { type Message } from './ChatMessage'
import TypingIndicator from './TypingIndicator'
import ChatInput from './ChatInput'
import { fetchAsk } from '@/api/ussfcuApi'

let msgCounter = 0
const nextId = () => `drawer-msg-${++msgCounter}`

export interface ChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  persona: string
  chips?: string[]
  placeholder?: string
  initialQuery?: string | null
}

export default function ChatDrawer({ isOpen, onClose, persona, chips = [], placeholder, initialQuery }: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([])
  const sentRef = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef<string>(crypto.randomUUID())

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, isTyping])

  // Fire initial query once per open
  useEffect(() => {
    if (!isOpen) { sentRef.current = null; return }
    if (initialQuery && initialQuery !== sentRef.current) {
      sentRef.current = initialQuery
      handleSend(initialQuery)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialQuery])

  // Clear thread on close and generate a fresh session for next open
  useEffect(() => {
    if (!isOpen) {
      setMessages([])
      setIsTyping(false)
      historyRef.current = []
      sessionIdRef.current = crypto.randomUUID()
    }
  }, [isOpen])

  async function handleSend(query: string) {
    const userMsg: Message = { id: nextId(), role: 'user', text: query }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)
    historyRef.current.push({ role: 'user', content: query })

    try {
      const res = await fetchAsk(persona, query, historyRef.current.slice(0, -1), sessionIdRef.current)
      const aiText = res.ai_message ?? 'Here is what I found.'
      const aiMsg: Message = {
        id: nextId(),
        role: 'assistant',
        text: aiText,
        sources: res.data_sources_used?.length ? res.data_sources_used : undefined,
      }
      historyRef.current.push({ role: 'assistant', content: aiText })
      setMessages(prev => [...prev, aiMsg])
    } catch {
      setMessages(prev => [...prev, { id: nextId(), role: 'assistant', text: 'Could not reach the data layer right now. Please try again.' }])
    } finally {
      setIsTyping(false)
    }
  }

  const currentChips = messages.length === 0 ? chips : []

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 lg:left-[264px] right-0 h-[420px] bg-surface border-t border-border-subtle shadow-2xl z-40 flex flex-col rounded-t-2xl"
        >
          <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle flex-shrink-0">
            <h3 className="text-sm font-semibold text-brand">Ask the AI</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-text-subtle" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-sleek">
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {messages.map(msg => (
                  <ChatMessage key={msg.id} message={msg} personaInitials={persona.slice(0, 2).toUpperCase()} onChipClick={handleSend} />
                ))}
              </AnimatePresence>
              <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="px-4 pb-4 pt-2 border-t border-border-subtle flex-shrink-0">
            {!isTyping && currentChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {currentChips.map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSend(chip)}
                    className="text-[11px] text-brand bg-brand/[0.06] border border-brand/15 rounded-full px-3 py-1 hover:bg-brand/10 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
            <ChatInput onSend={handleSend} disabled={isTyping} suggestions={currentChips} placeholder={placeholder} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
