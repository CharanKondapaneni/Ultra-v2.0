import { useEffect, useState } from 'react'

export default function useAsyncData<T>(getter: () => Promise<T> | T | null): T | null {
  const [data, setData] = useState<T | null>(null)

  useEffect(() => {
    let alive = true
    Promise.resolve(getter())
      .then((d) => { if (alive) setData(d) })
      .catch(() => { if (alive) setData(null) })
    return () => { alive = false }
  }, [getter])

  return data
}
