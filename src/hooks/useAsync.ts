import { useEffect, useState } from 'react'
import { cachedFetch } from '../lib/cache'

interface AsyncState<T> {
  data?: T
  error?: string
  loading: boolean
}

export function useAsync<T>(key: string | null, fetcher: (() => Promise<T>) | null): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ loading: !!key })

  useEffect(() => {
    if (!key || !fetcher) {
      setState({ loading: false })
      return
    }
    let cancelled = false
    setState({ loading: true })
    cachedFetch(key, fetcher)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false })
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ error: err.message, loading: false })
      })
    return () => {
      cancelled = true
    }
  }, [key])

  return state
}
