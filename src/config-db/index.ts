/**
 * Config loader — fetches from the backend API, falls back to local JSON if the
 * API is unavailable. When the backend config endpoints are live, the JSON files
 * can be deleted and the fallback removed.
 */

import { fetchMarkets, fetchClients, fetchPersonas } from '@/api/configApi'
import marketsJson from './markets.json'
import clientsJson from './clients.json'
export { resolveAsset } from '@/assets'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Market {
  id: string
  name: string
  icon_url: string
  gradient: { from: string; to: string }
}

export interface Client {
  id: string
  market_id: string
  name: string
  name_lines?: string[]
  tagline: string
  logo_url: string
  primary_color: string
  slug: string
}

export interface NavItem {
  key: string
  label: string
  path: string
  icon_url: string
}

export interface Persona {
  id: string
  client_id: string
  name: string
  initials: string
  role: string
  greeting: string
  default: boolean
  illustrative?: boolean
  nav?: NavItem[]
}

// ─── Suspense cache with JSON fallback ────────────────────────────────────────

type CacheEntry<T> =
  | { status: 'pending'; promise: Promise<void> }
  | { status: 'resolved'; data: T }

function makeSuspenseCache<T>(fetcher: () => Promise<T>, fallback: T): () => T {
  let entry: CacheEntry<T> | null = null

  return function read(): T {
    if (!entry) {
      const promise = fetcher()
        .then(data => { entry = { status: 'resolved', data } })
        .catch(() => { entry = { status: 'resolved', data: fallback } })
      entry = { status: 'pending', promise }
    }
    if (entry.status === 'pending') throw entry.promise
    return entry.data
  }
}

const personaModules = import.meta.glob('./personas/*.json', { eager: true })

function localPersonas(clientId: string): Persona[] {
  const mod = personaModules[`./personas/${clientId}.json`] as { default: Persona[] } | undefined
  return mod?.default ?? []
}

const readMarkets = makeSuspenseCache(fetchMarkets, marketsJson as Market[])
const readClients = makeSuspenseCache(fetchClients, clientsJson as Client[])

const personaReaders = new Map<string, () => Persona[]>()

function getPersonaReader(clientId: string): () => Persona[] {
  if (!personaReaders.has(clientId)) {
    personaReaders.set(
      clientId,
      makeSuspenseCache(() => fetchPersonas(clientId), localPersonas(clientId)),
    )
  }
  return personaReaders.get(clientId)!
}

// ─── Accessors ────────────────────────────────────────────────────────────────

export const getMarkets = (): Market[] => readMarkets()
export const getClients = (): Client[] => readClients()
export const getClientsForMarket = (marketId: string): Client[] =>
  readClients().filter(c => c.market_id === marketId)
export const getClient = (clientId: string): Client | undefined =>
  readClients().find(c => c.id === clientId)
export const getPersonasForClient = (clientId: string): Persona[] =>
  getPersonaReader(clientId)()
export const getDefaultPersona = (clientId: string): Persona | undefined =>
  getPersonasForClient(clientId).find(p => p.default) ?? getPersonasForClient(clientId)[0]
export const getNavForPersona = (clientId: string, personaId: string): NavItem[] =>
  getPersonasForClient(clientId).find(p => p.id === personaId)?.nav ?? []
