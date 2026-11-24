# build-api

Generate the API file for a client by reading its persona manifests from the Ultra codebase.

## Invocation

```
/build-api --client <client>
```

**Examples:**
```
/build-api --client nfcu
/build-api --client ussfcu
```

## What this skill does

Reads all persona manifests for the given client from the Ultra codebase, extracts their IDs and short names, then generates `src/api/<client>Api.ts` from a fixed template.

All generated API files use JWT Bearer token authentication — persona context is read exclusively from the JWT and is never sent in request headers or body.

## Steps

### 1. Find all persona folders for the client

```bash
ls /Users/charansaikondapaneni/Desktop/UltraMaster/app/src/markets/financial-services/clients/<client>/personas/
```

This gives the list of persona folder names (e.g. `ceo`, `evelyn`, `nadia`).

### 2. Read each persona manifest

For each folder, read:
```
/Users/charansaikondapaneni/Desktop/UltraMaster/app/src/markets/financial-services/clients/<client>/personas/<persona>/manifest.tsx
```

Extract:
- `id` — the manifest's `id` field (e.g. `'ussfcu_ceo'`) — this is the config-db persona ID
- **Short name** — first word of `identity.name`, lowercased (e.g. `identity.name: 'Timothy L. Anderson'` → `'timothy'`). If `identity.name` is not a string literal (references a variable), read the leading file comment which contains `Persona: <Name>` and use that name lowercased.

### 3. Check for existing file

```bash
find /Users/charansaikondapaneni/Desktop/Ultra-v2.0/src/api -name "<client>Api.ts"
```

If it exists, read it and inform the user it already exists. Ask if they want to overwrite it. Only proceed if confirmed.

### 4. Generate the file

Use this exact template, substituting `<CLIENT_PASCAL>`, `<client>`, the persona union type, and the ID map:

```ts
/**
 * <CLIENT_PASCAL> API calls.
 * Persona context is read exclusively from the JWT — never sent in headers or body.
 * All endpoints require a Bearer token from POST /api/auth/login.
 */

import type { ApiResponse, CategoryItem } from './types'

const BASE = import.meta.env.VITE_ULTRA_API_BASE?.replace(/\/$/, '') ?? 'http://127.0.0.1:8001'

export type <CLIENT_PASCAL>Persona = <PERSONA_UNION>

/** Maps config-db persona IDs → display short names (for UI use only, not sent to API). */
const PERSONA_API_ID: Record<string, <CLIENT_PASCAL>Persona> = {
  <PERSONA_ID_MAP>
}

/** Accepts either a config-db ID (e.g. <client>_finance) or a short name (e.g. fiona). */
export function resolvePersona(id: string): <CLIENT_PASCAL>Persona {
  return PERSONA_API_ID[id] ?? (id as <CLIENT_PASCAL>Persona)
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
export const fetchSignals = (_persona?: <CLIENT_PASCAL>Persona) =>
  post('/api/signals', { category: [{ component: 'SignalCard' }] })

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fetchKpis = (_persona?: <CLIENT_PASCAL>Persona) =>
  post('/api/kpis', { category: [{ component: 'KpiCarousel' }] })

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fetchAsk = (_persona: <CLIENT_PASCAL>Persona | string, query: string, conversationHistory: unknown[] = [], sessionId?: string) =>
  post('/api/ask', { query, conversation_history: conversationHistory, genui_component_ids: [], session_id: sessionId })

export const fetchGeneric = <T = unknown>(_persona: <CLIENT_PASCAL>Persona | string, category: CategoryItem[], options: { filters?: Record<string, unknown> } = {}) =>
  post<T>('/api/generic', { category: category.map(c => ({ ...c, variant: c.variant ?? null })), filters: options.filters ?? {} })
```

**Substitution rules:**
- `<CLIENT_PASCAL>` — PascalCase of the client name (e.g. `nfcu` → `Nfcu`, `ussfcu` → `Ussfcu`)
- `<PERSONA_UNION>` — all short names as a TypeScript union string literal type, e.g. `'fiona' | 'evelyn' | 'timothy' | 'sylvia' | 'nadia'`
- `<PERSONA_ID_MAP>` — one entry per persona: `<manifest_id>: '<short_name>',` e.g. `ussfcu_finance: 'fiona',` — align values with spaces for readability
- `<client>` — lowercase client name as-is

The file-level comment block at the top uses `<CLIENT_PASCAL>` (e.g. `USSFCU API calls.`).

### 5. Write the file

Write to:
```
src/api/<client>Api.ts
```

### 6. Report

Print a short summary:
- **Output:** the file written
- **Personas found:** list each manifest id → short name mapping used
- **Notes:** anything unexpected (missing manifest, missing id field, non-literal `identity.name` that required fallback to file comment, etc.)
