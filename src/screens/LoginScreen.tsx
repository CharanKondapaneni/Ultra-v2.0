import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMarkets } from '@/api/configApi'
import UltraMark from '@/components/brand/UltraMark'

export default function LoginScreen() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { usernameRef.current?.focus() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (username !== 'ultra' || password !== 'ultra@9705') {
      setError('Invalid username or password.')
      return
    }
    setLoading(true)
    try {
      const markets = await fetchMarkets()
      navigate('/clients', { state: { markets } })
    } catch {
      setError('Could not load markets. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a1633] flex items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
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

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <UltraMark />
          <h1 className="mt-6 text-4xl sm:text-[2.6rem] font-bold tracking-[-0.03em] leading-none bg-gradient-to-b from-white to-blue-200/70 bg-clip-text text-transparent">
            Ultra App
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-white/25" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Enterprise AI Platform
            </p>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-white/25" />
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] backdrop-blur-sm p-7 shadow-[0_20px_50px_-22px_rgba(37,99,235,0.6)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="login-username" className="block text-[10.5px] font-semibold text-white/45 uppercase tracking-[0.14em]">
                Username
              </label>
              <input
                id="login-username"
                ref={usernameRef}
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/[0.06] text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-400/60 focus:bg-white/[0.09] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-[10.5px] font-semibold text-white/45 uppercase tracking-[0.14em]">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/[0.06] text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-400/60 focus:bg-white/[0.09] transition-all"
              />
            </div>

            {error && (
              <p role="alert" className="px-4 py-3 rounded-xl bg-red-500/15 border border-red-400/30 text-xs text-red-200 font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1 hover:brightness-110"
              style={{ background: 'linear-gradient(135deg,#3b82f6 0%,#6366f1 100%)' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2.5">
          <span className="text-[10.5px] uppercase tracking-[0.18em] text-white/30">Powered by</span>
          <span className="text-[11px] font-bold tracking-widest text-white/50">Radiant Digital</span>
        </div>
      </div>
    </div>
  )
}
