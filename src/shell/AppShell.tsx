import { useState, Component, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopHeader from './TopHeader'
import type { PersonaConfig, ClientConfig } from '@/types/config'

class PageErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8 text-sm text-critical-600">
          <p className="font-semibold mb-1">Page error</p>
          <pre className="text-[11px] text-text-muted whitespace-pre-wrap">{(this.state.error as Error).message}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

interface AppShellProps {
  persona: PersonaConfig
  personas: PersonaConfig[]
  client: ClientConfig
  onPersonaSwitch: (id: string) => void
}

export default function AppShell({ persona, personas, client, onPersonaSwitch }: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex h-dvh bg-bg overflow-hidden">
      <Sidebar
        nav={persona.nav}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        clientName={client.name}
        clientNameLines={client.nameLines}
        clientTagline={client.tagline}
        clientLogoUrl={client.logoUrl}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopHeader
          onMenuClick={() => setNavOpen(true)}
          persona={persona}
          personas={personas}
          onPersonaSwitch={onPersonaSwitch}
        />
        <main className="flex-1 overflow-y-auto scrollbar-sleek">
          <PageErrorBoundary>
            <Outlet />
          </PageErrorBoundary>
        </main>
      </div>
    </div>
  )
}
