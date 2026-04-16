const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

const store = new Map()

export function cacheGet(key) {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.value
}

export function cacheSet(key, value, ttlMs = DEFAULT_TTL_MS) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function cacheInvalidate(...keys) {
  for (const key of keys) store.delete(key)
}

export function cacheInvalidatePrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}

export function cacheClear() {
  store.clear()
}

export async function withCache(key, fetcher, ttlMs = DEFAULT_TTL_MS) {
  const cached = cacheGet(key)
  if (cached !== undefined) return cached
  const value = await fetcher()
  cacheSet(key, value, ttlMs)
  return value
}
