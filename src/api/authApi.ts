const BASE = import.meta.env.VITE_ULTRA_API_BASE?.replace(/\/$/, '') ?? 'http://127.0.0.1:8001'

export interface TokenClaims {
  sub: string
  role: 'platform' | 'client'
  clientId?: string
  personaId?: string
  marketId?: string
  exp: number
}

export interface MarketSummary {
  id: string
  name: string
  icon_url: string
  gradient_from: string
  gradient_to: string
  client_count: number
}

export interface PersonaNav {
  key: string
  label: string
  path: string
  icon_url: string
}

export interface PersonaData {
  id: string
  client_id: string
  name: string
  initials: string
  role: string
  greeting: string
  is_default: boolean
  nav: PersonaNav[]
}

export interface LoginResponse {
  access_token: string
  token_type: string
  markets?: MarketSummary[]   // platform login only
  persona?: PersonaData        // client login only
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as Record<string, string>).detail ?? `Login failed (${res.status})`)
  }
  return res.json() as Promise<LoginResponse>
}

/** Decode JWT payload without verifying signature — verification is server-side. */
export function decodeToken(token: string): TokenClaims {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as TokenClaims
  } catch {
    throw new Error('Malformed token')
  }
}

export function isTokenExpired(claims: TokenClaims): boolean {
  return Date.now() / 1000 > claims.exp
}

export async function logout(token: string): Promise<void> {
  await fetch(`${BASE}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => { /* fire and forget — local cleanup always happens */ })
}
