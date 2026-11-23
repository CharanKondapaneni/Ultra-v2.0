import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import UltraMark from '@/components/brand/UltraMark'
import { fetchClientsByMarket } from '@/api/configApi'
import { resolveAsset } from '@/config-db'
import type { Client } from '@/config-db'
import type { MarketSummary } from '@/api/authApi'

export default function ChooseClientScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const markets: MarketSummary[] = (location.state as { markets?: MarketSummary[] } | null)?.markets ?? []
  const [activeMarket, setActiveMarket] = useState<MarketSummary | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)

  async function handleSelectMarket(market: MarketSummary) {
    setActiveMarket(market)
    setLoadingClients(true)
    try {
      const data = await fetchClientsByMarket(market.id)
      setClients(data)
    } finally {
      setLoadingClients(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0a1633] flex justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1e4d] via-[#0a1633] to-[#070f24]" />
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full blur-[120px] opacity-40"
          style={{ background: 'radial-gradient(circle,#2563eb 0%,transparent 62%)' }}
        />
        <div
          className="absolute bottom-[-10rem] right-[-6rem] w-[420px] h-[420px] rounded-full blur-[130px] opacity-25"
          style={{ background: 'radial-gradient(circle,#7c3aed 0%,transparent 60%)' }}
        />
      </div>

      <div className="relative my-auto w-full max-w-4xl">
        <div className="flex flex-col items-center text-center mb-8">
          <UltraMark />
          <h1 className="mt-4 text-4xl sm:text-[2.75rem] font-bold tracking-[-0.03em] leading-none bg-gradient-to-b from-white to-blue-200/70 bg-clip-text text-transparent">
            Ultra App
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-white/25" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
              {activeMarket ? activeMarket.name : 'Enterprise AI Platform'}
            </p>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-white/25" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!activeMarket ? (
            /* Level 1: markets */
            <motion.div
              key="markets"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-center text-white/40 text-[13px] mb-4">Choose a market to get started</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {markets.map(market => (
                  <button
                    key={market.id}
                    type="button"
                    onClick={() => handleSelectMarket(market)}
                    className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-[0_16px_38px_-20px_rgba(37,99,235,0.6)] cursor-pointer"
                  >
                    <span
                      className="absolute inset-y-0 left-0 w-[2.5px] opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: `linear-gradient(180deg,${market.gradient_from},${market.gradient_to})` }}
                    />
                    <span
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-white/15 transition-transform duration-300 group-hover:scale-105"
                      style={{ background: `linear-gradient(135deg,${market.gradient_from},${market.gradient_to})`, boxShadow: `0 8px 20px -10px ${market.gradient_from}` }}
                    >
                      <img src={resolveAsset(market.icon_url)} alt="" className="h-5 w-5" style={{ filter: 'brightness(0) invert(1)' }} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold tracking-tight text-white">{market.name}</span>
                      <span className="block text-[11.5px] text-white/40">{market.client_count} {market.client_count === 1 ? 'client' : 'clients'}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-white/25 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white/80" />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Level 2: clients */
            <motion.div
              key={activeMarket.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <button
                type="button"
                onClick={() => { setActiveMarket(null); setClients([]) }}
                className="group mb-4 inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-white/50 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                All markets
              </button>

              {loadingClients ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {clients.map(client => (
                  <div
                    key={client.id}
                    className="group relative flex items-stretch overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] hover:shadow-[0_16px_38px_-20px_rgba(37,99,235,0.6)]"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/login/${client.id}`, { state: { client } })}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-3.5 text-left"
                    >
                      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/[0.04]">
                        <img src={resolveAsset(client.logo_url)} alt="" className="h-7 w-7 object-contain" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 block text-[13.5px] font-semibold leading-snug text-white">
                          {client.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
                          {client.tagline}
                        </span>
                      </span>
                      <span className="inline-flex flex-shrink-0 items-center gap-1 text-[11.5px] font-semibold text-white/45 transition-colors group-hover:text-white">
                        Launch
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </button>
                  </div>
                ))}
              </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-center gap-2.5">
          <span className="text-[10.5px] uppercase tracking-[0.18em] text-white/30">Powered by</span>
          <span className="text-[11px] font-bold tracking-widest text-white/50">Radiant Digital</span>
        </div>
      </div>
    </div>
  )
}
