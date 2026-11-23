import { createContext, useContext, useState, type ReactNode } from 'react'
import { login as apiLogin, logout as apiLogout, decodeToken, isTokenExpired, type TokenClaims, type PersonaData, type LoginResponse } from '@/api/authApi'

const TOKEN_KEY = 'ultra_token'
const CLIENT_KEY = 'ultra_client'
const PERSONA_KEY = 'session_persona'

export interface SessionValue {
  token: string | null
  claims: TokenClaims | null
  isUnlocked: boolean
  scopedClientId: string | null
  sessionPersonaId: string | null
  sessionPersona: PersonaData | null
  exitPath: string | null
  signIn: (username: string, password: string) => Promise<LoginResponse>
  signOut: (destination?: string) => void
}

const SessionContext = createContext<SessionValue | null>(null)

function readStoredToken(): { token: string; claims: TokenClaims } | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null
    const claims = decodeToken(token)
    if (isTokenExpired(claims)) {
      localStorage.removeItem(TOKEN_KEY)
      return null
    }
    return { token, claims }
  } catch {
    return null
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const stored = readStoredToken()
  const [token, setToken] = useState<string | null>(stored?.token ?? null)
  const [claims, setClaims] = useState<TokenClaims | null>(stored?.claims ?? null)
  const [exitPath, setExitPath] = useState<string | null>(null)
  const [sessionPersona, setSessionPersona] = useState<PersonaData | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(PERSONA_KEY) ?? 'null') } catch { return null }
  })

  async function signIn(username: string, password: string): Promise<LoginResponse> {
    const response = await apiLogin(username, password)
    const decoded = decodeToken(response.access_token)
    localStorage.setItem(TOKEN_KEY, response.access_token)
    if (decoded.clientId) localStorage.setItem(CLIENT_KEY, decoded.clientId)
    else localStorage.removeItem(CLIENT_KEY)
    setToken(response.access_token)
    setClaims(decoded)
    setExitPath(null)
    if (response.persona) {
      setSessionPersona(response.persona)
      sessionStorage.setItem(PERSONA_KEY, JSON.stringify(response.persona))
    }
    return response
  }

  function signOut(destination?: string): void {
    const currentToken = localStorage.getItem(TOKEN_KEY)
    if (currentToken) apiLogout(currentToken)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(CLIENT_KEY)
    setToken(null)
    setClaims(null)
    setSessionPersona(null)
    sessionStorage.removeItem(PERSONA_KEY)
    sessionStorage.removeItem('session_client')
    setExitPath(destination ?? null)
  }

  const scopedClientId = claims?.clientId ?? null

  return (
    <SessionContext.Provider value={{
      token,
      claims,
      isUnlocked: token !== null,
      scopedClientId,
      sessionPersonaId: claims?.personaId ?? null,
      sessionPersona,
      exitPath,
      signIn,
      signOut,
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
