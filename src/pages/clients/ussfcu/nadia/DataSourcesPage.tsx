import { useEffect, useState, useCallback, useRef } from 'react'
import DataSourcesGrid from '@/components/DataSourcesGrid'
import PageError from '@/components/PageError'
import { fetchGeneric } from '@/api/ussfcuApi'
import type { DataSourcesGridData } from '@/components/DataSourcesGrid'

type State =
  | { status: 'loading' }
  | { status: 'ok'; data: DataSourcesGridData }
  | { status: 'error'; message: string }

export default function DataSourcesPage() {
  const [state, setState] = useState<State>({ status: 'loading' })
  const inflight = useRef(false)

  const load = useCallback(() => {
    if (inflight.current) return
    inflight.current = true
    setState({ status: 'loading' })

    fetchGeneric<DataSourcesGridData>('nadia', [{ component: 'DataSourcesGrid', variant: null }])
      .then(res => {
        const raw = res.visualization?.[0]?.data
        const sources = Array.isArray(raw) ? raw : (raw as DataSourcesGridData)?.sources
        if (!Array.isArray(sources) || sources.length === 0) {
          setState({ status: 'error', message: 'The API response did not contain valid data sources.' })
          return
        }
        setState({ status: 'ok', data: { sources } })
      })
      .catch(err => {
        setState({ status: 'error', message: err?.message ?? 'API request failed.' })
      })
      .finally(() => { inflight.current = false })
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      {state.status === 'loading' && (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {state.status === 'error' && (
        <PageError message={state.message} onRetry={load} />
      )}
      {state.status === 'ok' && (
        <DataSourcesGrid data={state.data} />
      )}
    </div>
  )
}
