import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  memoryCache,
  setProductCache,
  getProductCache,
  clearCache,
  hashName,
} from '@/lib/cache/produto-cache.service'

describe('MemoryCache TTL', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    memoryCache.clear()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('expira após o TTL', () => {
    memoryCache.set('k', 'v', 1000)
    expect(memoryCache.get('k')).toBe('v')
    vi.advanceTimersByTime(1001)
    expect(memoryCache.get('k')).toBeUndefined()
  })

  it('setProductCache/getProductCache respeitam TTL de 24h', () => {
    setProductCache('123', { nomeNormalizado: 'X' } as any)
    expect(getProductCache('123')?.nomeNormalizado).toBe('X')
    vi.advanceTimersByTime(86400001)
    expect(getProductCache('123')).toBeUndefined()
  })

  it('clearCache remove a entrada', () => {
    setProductCache('123', { nomeNormalizado: 'X' } as any)
    clearCache('123')
    expect(getProductCache('123')).toBeUndefined()
  })

  it('has reflete a expiração', () => {
    memoryCache.set('h', 1, 100)
    expect(memoryCache.has('h')).toBe(true)
    vi.advanceTimersByTime(101)
    expect(memoryCache.has('h')).toBe(false)
  })

  it('hashName é estável e distingue nomes', () => {
    expect(hashName('Arroz')).toBe(hashName('Arroz'))
    expect(hashName('Arroz')).not.toBe(hashName('Feijao'))
  })
})
