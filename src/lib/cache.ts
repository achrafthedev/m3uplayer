const cache = new Map<string, Promise<unknown>>()

export function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) {
    cache.set(
      key,
      fetcher().catch((err) => {
        cache.delete(key)
        throw err
      }),
    )
  }
  return cache.get(key) as Promise<T>
}

export function clearCache(): void {
  cache.clear()
}
