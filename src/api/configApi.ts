import type { Client, Persona } from '@/config-db'

const BASE = import.meta.env.VITE_ULTRA_API_BASE?.replace(/\/$/, '') ?? 'http://127.0.0.1:8001'

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('ultra_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { ...authHeader() } })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

export const fetchClientsByMarket = (marketId: string): Promise<Client[]> =>
  get(`/api/config/clients?market_id=${encodeURIComponent(marketId)}`)

export const fetchClientById = (clientId: string): Promise<Client> =>
  get(`/api/config/clients/${encodeURIComponent(clientId)}`)

export const fetchPersonaById = (personaId: string): Promise<Persona> =>
  get<{ is_default: boolean } & Omit<Persona, 'default'>>(`/api/config/personas/${encodeURIComponent(personaId)}`)
    .then(({ is_default, ...rest }) => ({ ...rest, default: is_default }))

export const fetchMarkets = () =>
  get<import('@/api/authApi').MarketSummary[]>('/api/config/markets')

export const fetchClients = (): Promise<Client[]> => get('/api/config/clients')

// Backend returns is_default; map to default for consistency with existing code.
interface RawPersona extends Omit<Persona, 'default'> {
  is_default: boolean
}

export const fetchPersonas = (clientId: string): Promise<Persona[]> =>
  get<RawPersona[]>(`/api/config/personas?client_id=${encodeURIComponent(clientId)}`).then(rows =>
    rows.map(({ is_default, ...rest }) => ({ ...rest, default: is_default }))
  )
