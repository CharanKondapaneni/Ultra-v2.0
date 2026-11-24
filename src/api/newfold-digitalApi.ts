/**
 * NewfoldDigital API calls.
 * Persona context is read exclusively from the JWT — never sent in headers or body.
 * All endpoints require a Bearer token from POST /api/auth/login.
 */

import type { ApiResponse, CategoryItem } from './types'

const BASE = import.meta.env.VITE_ULTRA_API_BASE?.replace(/\/$/, '') ?? 'http://127.0.0.1:8001'

export type NewfoldDigitalPersona = 'marisol' | 'sofia'

/** Maps config-db persona IDs → display short names (for UI use only, not sent to API). */
const PERSONA_API_ID: Record<string, NewfoldDigitalPersona> = {
  newfold_director: 'marisol',
  newfold_ops:      'sofia',
}

/** Accepts either a config-db ID (e.g. newfold_director) or a short name (e.g. marisol). */
export function resolvePersona(id: string): NewfoldDigitalPersona {
  return PERSONA_API_ID[id] ?? (id as NewfoldDigitalPersona)
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('ultra_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`)
  return res.json() as Promise<ApiResponse<T>>
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  persona: Record<string, unknown>
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(`Login failed → ${res.status}`)
  const data = await res.json() as LoginResponse
  localStorage.setItem('ultra_token', data.access_token)
  return data
}

export async function refreshToken(): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
  if (!res.ok) throw new Error(`Token refresh failed → ${res.status}`)
  const data = await res.json() as { access_token: string }
  localStorage.setItem('ultra_token', data.access_token)
}

// Persona param is kept for API compatibility with ChatInterface and callers — not sent to the server.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fetchSignals = (_persona?: NewfoldDigitalPersona) =>
  post('/api/signals', { category: [{ component: 'SignalCard' }] })

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fetchKpis = (_persona?: NewfoldDigitalPersona) =>
  post('/api/kpis', { category: [{ component: 'KpiCarousel' }] })

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fetchAsk = (_persona: NewfoldDigitalPersona | string, query: string, conversationHistory: unknown[] = []) =>
  post('/api/ask', { query, conversation_history: conversationHistory, genui_component_ids: [] })

export const fetchGeneric = <T = unknown>(_persona: NewfoldDigitalPersona | string, category: CategoryItem[], options: { filters?: Record<string, unknown> } = {}) =>
  post<T>('/api/generic', { category: category.map(c => ({ ...c, variant: c.variant ?? null })), filters: options.filters ?? {} })
