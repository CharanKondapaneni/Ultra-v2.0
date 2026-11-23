const logoModules = import.meta.glob('./logos/*', { eager: true, query: '?url', import: 'default' })
const iconModules = import.meta.glob('./icons/**/*', { eager: true, query: '?url', import: 'default' })

function buildMap(modules: Record<string, unknown>): Record<string, string> {
  const map: Record<string, string> = {}
  for (const [path, url] of Object.entries(modules)) {
    // Strip leading './' → key is e.g. "logos/penfed-logo.svg" or "icons/nav/ask.svg"
    const key = path.replace(/^\.\//, '')
    map[key] = url as string
  }
  return map
}

const all: Record<string, string> = {
  ...buildMap(logoModules),
  ...buildMap(iconModules),
}

/** Resolve an asset key (e.g. "logos/penfed-logo.svg" or "icons/nav/ask.svg") to its bundled URL. */
export function resolveAsset(key: string): string {
  return all[key] ?? ''
}
