import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface ContextPanelAsideProps {
  children: ReactNode | null
}

export default function ContextPanelAside({ children }: ContextPanelAsideProps) {
  return (
    <AnimatePresence>
      {children !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="hidden lg:block w-[40%] flex-shrink-0 overflow-y-auto p-5 bg-gradient-to-b from-surface-2 to-bg"
        >
          <AnimatePresence mode="wait">{children}</AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
