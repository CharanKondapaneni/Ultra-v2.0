import { useState, type ReactNode } from 'react'
import ChatInput from './ChatInput'
import ChatDrawer from './ChatDrawer'

export interface PageWithChatProps {
  persona: string
  chips?: string[]
  placeholder?: string
  children: ReactNode
}

export default function PageWithChat({ persona, chips = [], placeholder, children }: PageWithChatProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState<string | null>(null)

  function openWithQuery(query: string) {
    setInitialQuery(query)
    setDrawerOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page content — padded at bottom so the sticky bar never covers it */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-sleek">
        {children}
      </div>

      {/* Sticky chat input bar */}
      <div className="fixed bottom-0 left-0 lg:left-[264px] right-0 bg-surface/90 backdrop-blur-sm border-t border-border-subtle px-4 sm:px-6 lg:px-8 py-3 z-30">
        <div className="max-w-3xl mx-auto">
          {!drawerOpen && chips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {chips.map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => openWithQuery(chip)}
                  className="text-[11px] text-brand bg-brand/[0.06] border border-brand/15 rounded-full px-3 py-1 hover:bg-brand/10 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
          <ChatInput
            onSend={openWithQuery}
            placeholder={placeholder}
            suggestions={chips}
          />
        </div>
      </div>

      <ChatDrawer
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setInitialQuery(null) }}
        persona={persona}
        chips={chips}
        placeholder={placeholder}
        initialQuery={initialQuery}
      />
    </div>
  )
}
