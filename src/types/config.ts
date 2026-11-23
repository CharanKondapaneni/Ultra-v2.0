export interface NavItem {
  key: string
  label: string
  path: string
  icon_url: string
}

export interface PersonaConfig {
  id: string
  name: string
  initials: string
  role: string
  clientId: string
  nav: NavItem[]
}

export interface ClientConfig {
  id: string
  name: string
  nameLines: string[]
  tagline: string
  logoUrl?: string
}
