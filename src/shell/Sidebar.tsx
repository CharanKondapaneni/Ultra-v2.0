import { NavLink, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import type { NavItem } from '@/types/config'
interface SidebarProps {
  nav: NavItem[]
  open: boolean
  onClose: () => void
  clientName: string
  clientNameLines: string[]
  clientTagline: string
  clientLogoUrl?: string
}

export default function Sidebar({ nav, open, onClose, clientNameLines, clientTagline, clientLogoUrl }: SidebarProps) {
  const location = useLocation()

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-[60] lg:z-30 w-[264px] flex-shrink-0 bg-surface border-r border-border-subtle flex flex-col h-dvh transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border-subtle/80">
          <div className="flex items-center gap-2.5 min-w-0">
            {clientLogoUrl && <img src={clientLogoUrl} alt={clientNameLines[0]} className="w-11 h-11 flex-shrink-0 object-contain" />}
            <div className="flex flex-col min-w-0 gap-0">
              {clientNameLines.map((line, i) => (
                <span key={i} className="text-brand font-bold text-[11px] tracking-tight truncate leading-[1.2]">{line}</span>
              ))}
              <span className="text-[8.5px] font-semibold text-text-subtle uppercase tracking-widest truncate leading-[1.2] mt-[1px]">{clientTagline}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 -mr-1 rounded-lg text-text-subtle hover:bg-surface-2 hover:text-text-muted transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 px-3 overflow-y-auto scrollbar-sleek">
          <p className="text-[9px] font-bold text-text-subtle uppercase tracking-widest px-3 mb-3">Navigation</p>
          <ul className="space-y-1">
            {nav.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)
              return (
                <li key={item.key}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-brand text-white shadow-[0_2px_8px_color-mix(in_srgb,var(--color-brand)_25%,transparent)]'
                        : 'text-text-muted hover:bg-surface-2 hover:text-text'
                    }`}
                  >
                    <img
                      src={item.icon_url}
                      alt=""
                      className="w-[18px] h-[18px] flex-shrink-0"
                      style={{ filter: isActive ? 'brightness(0) invert(1)' : 'brightness(0) invert(0.45)' }}
                    />
                    {item.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-subtle/80">
          <p className="text-[10px] text-text-subtle">
            Powered by <span className="font-semibold text-text-muted">Radiant Digital</span>
          </p>
        </div>
      </aside>
    </>
  )
}
