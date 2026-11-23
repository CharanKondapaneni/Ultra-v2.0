export interface ApiMeta {
  as_of: string
  freshness: 'live' | 'daily' | string
  persona_id: string
  client_id: string
}

export interface VisualizationItem<T = unknown> {
  type: string
  variant: string | null
  data: T
}

export interface ApiResponse<T = unknown> {
  meta: ApiMeta
  ai_message: string | null
  suggested_chips: string[]
  confidence: number | null
  data_sources_used: string[]
  visualization: VisualizationItem<T>[] | null
  data: unknown
  report: unknown
}

export interface CategoryItem {
  component: string
  variant?: string | null
}
