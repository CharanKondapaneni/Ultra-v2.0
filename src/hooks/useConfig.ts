import { useSession } from '@/auth/SessionContext'
import { resolveAsset, type Client } from '@/config-db'
import { CLIENT_ID } from '@/auth/access'
import type { PersonaConfig, ClientConfig } from '@/types/config'

export interface AppConfig {
  clientId: string
  client: ClientConfig
  personas: PersonaConfig[]
  defaultPersonaId: string
}

function readSessionStorage<T>(key: string): T | null {
  try { return JSON.parse(sessionStorage.getItem(key) ?? 'null') as T } catch { return null }
}

export function useConfig(): AppConfig {
  const { scopedClientId, sessionPersona } = useSession()
  const clientId = scopedClientId ?? CLIENT_ID

  const rawClient = readSessionStorage<Client>('session_client')

  const client: ClientConfig = {
    id: clientId,
    name: rawClient?.name ?? clientId,
    nameLines: rawClient?.name_lines ?? rawClient?.name.split(' ') ?? [clientId],
    tagline: rawClient?.tagline ?? '',
    logoUrl: rawClient?.logo_url ? resolveAsset(rawClient.logo_url) : undefined,
  }

  const personas: PersonaConfig[] = sessionPersona
    ? [{
        id: sessionPersona.id,
        name: sessionPersona.name,
        initials: sessionPersona.initials,
        role: sessionPersona.role,
        clientId,
        nav: (sessionPersona.nav ?? []).map(n => ({ ...n, icon_url: resolveAsset(n.icon_url) })),
      }]
    : []

  return {
    clientId,
    client,
    personas,
    defaultPersonaId: sessionPersona?.id ?? '',
  }
}
