import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Bell, ChevronDown, LogOut } from 'lucide-react'
import type { PersonaConfig } from '@/types/config'
import { useSession } from '@/auth/SessionContext'
import { useConfig } from '@/hooks/useConfig'


interface TopHeaderProps {
  onMenuClick: () => void
  persona: PersonaConfig
  personas: PersonaConfig[]
  onPersonaSwitch: (id: string) => void
}

export default function TopHeader({ onMenuClick, persona, personas, onPersonaSwitch }: TopHeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useSession()
  const { clientId } = useConfig()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  function handleSignOut() {
    setDropdownOpen(false)
    signOut(`/login/${clientId}`)
  }

  const title = persona.nav.find(item => item.path === location.pathname)?.label ?? 'Ask the AI'

  useEffect(() => {
    if (!dropdownOpen) return
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [dropdownOpen])

  const handleSwitch = (id: string) => {
    setDropdownOpen(false)
    onPersonaSwitch(id)
    navigate('/ask', { replace: true })
  }

  return (
    <header className="h-16 bg-surface border-b border-border-subtle flex items-center justify-between px-4 sm:px-6 lg:px-8 relative z-50 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-xl text-text-muted hover:bg-surface-2 transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-text tracking-tight truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Notification bell */}
        <button
          type="button"
          className="relative p-2 rounded-xl text-text-muted hover:bg-surface-2 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-surface-2" />

        {/* Persona switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-3 px-2 py-1.5 -mx-2 rounded-xl hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
              {persona.initials}
            </div>
            <div className="text-right hidden sm:block max-w-[160px]">
              <p className="text-sm font-semibold text-text leading-tight truncate">{persona.name}</p>
              <p className="text-[10px] text-text-subtle leading-tight font-medium truncate">{persona.role}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-text-subtle transition-transform flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-surface rounded-xl border border-border shadow-xl z-[60] overflow-hidden">
              <div className="px-3 py-2 border-b border-border-subtle">
                <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider">Switch Persona</p>
              </div>
              <div className="py-1">
                {personas.map((p) => {
                  const isActive = p.id === persona.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => !isActive && handleSwitch(p.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        isActive ? 'bg-brand/[0.06] cursor-default' : 'hover:bg-surface-2 cursor-pointer'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        isActive ? 'bg-brand text-white' : 'bg-surface-2 text-text-muted'
                      }`}>
                        {p.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold leading-tight truncate ${isActive ? 'text-brand' : 'text-text'}`}>{p.name}</p>
                        <p className="text-[10px] text-text-subtle leading-tight">{p.role}</p>
                      </div>
                      {isActive && (
                        <span className="text-[9px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">ACTIVE</span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="border-t border-border-subtle py-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2 transition-colors cursor-pointer text-text-muted hover:text-critical"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-medium">Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
