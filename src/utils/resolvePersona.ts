/**
 * Strips the client prefix from a config-db persona ID to get the registry short name.
 * e.g. "nfcu_platform_admin" → "platform-admin", "ussfcu_ceo" → "ceo", "penfed_maya" → "maya"
 *
 * Falls back to the input as-is if no underscore is found.
 */

const OVERRIDES: Record<string, string> = {
  ussfcu_finance: 'fiona',
  ussfcu_evelyn:  'evelyn',
  ussfcu_ceo:     'timothy',
  ussfcu_cfo:     'sylvia',
  ussfcu_nadia:   'nadia',
  nfcu_platform_admin:  'platform-admin',
  newfold_director:     'marisol',
  newfold_ops:          'sofia',
}

export function resolvePersona(id: string): string {
  if (OVERRIDES[id]) return OVERRIDES[id]
  // Strip client prefix: "penfed_maya" → "maya", "nfcu_supervisor" → "supervisor"
  const idx = id.indexOf('_')
  return idx !== -1 ? id.slice(idx + 1) : id
}
