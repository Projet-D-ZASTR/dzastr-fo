import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cacheClear,
  cacheGet,
  cacheInvalidate,
  cacheInvalidatePrefix,
  cacheSet,
  withCache,
} from './cache.service'

describe('cache service', () => {
  beforeEach(() => {
    cacheClear()
    vi.useRealTimers()
  })

  it('returns cached values until TTL expires', () => {
    vi.useFakeTimers()

    cacheSet('clients:7', ['alice'], 1_000)
    expect(cacheGet('clients:7')).toEqual(['alice'])

    vi.advanceTimersByTime(1_001)

    expect(cacheGet('clients:7')).toBeUndefined()
  })

  it('caches null responses with withCache', async () => {
    const fetcher = vi.fn(async () => null)

    await expect(withCache('logo:me', fetcher, 60_000)).resolves.toBeNull()
    await expect(withCache('logo:me', fetcher, 60_000)).resolves.toBeNull()

    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('invalidates keys individually or by prefix', () => {
    cacheSet('clients:1', ['a'])
    cacheSet('clients:2', ['b'])
    cacheSet('services:1', ['design'])

    cacheInvalidate('clients:1')
    expect(cacheGet('clients:1')).toBeUndefined()
    expect(cacheGet('clients:2')).toEqual(['b'])

    cacheInvalidatePrefix('clients:')
    expect(cacheGet('clients:2')).toBeUndefined()
    expect(cacheGet('services:1')).toEqual(['design'])
  })
})
