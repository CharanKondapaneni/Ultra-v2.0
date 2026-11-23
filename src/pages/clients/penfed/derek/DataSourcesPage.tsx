import { useEffect, useState } from 'react'
import { fetchGeneric } from '@/api/penfedApi'
import DataSourcesGrid from '@/components/DataSourcesGrid'
import type { DataSourcesGridData } from '@/components/DataSourcesGrid'

type PageDataType = DataSourcesGridData

let inflightRequest: Promise<PageDataType | null> | null = null

function fetchPageData(): Promise<PageDataType | null> {
  if (inflightRequest) return inflightRequest
  inflightRequest = fetchGeneric<PageDataType>('derek', [{ component: 'DataSourcesGrid', variant: null }])
    .then(res => {
      const raw = (res.visualization as { type: string; data: unknown }[])
        ?.find(v => v.type === 'DataSourcesGrid')?.data as PageDataType | undefined
      return raw ?? null
    })
    .catch(() => null)
    .finally(() => { inflightRequest = null })
  return inflightRequest
}

export default function DataSourcesPage() {
  const [data, setData] = useState<PageDataType | null>(null)

  useEffect(() => {
    fetchPageData().then(setData)
  }, [])

  if (!data) return <div />

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
      <DataSourcesGrid data={data} />
    </div>
  )
}
