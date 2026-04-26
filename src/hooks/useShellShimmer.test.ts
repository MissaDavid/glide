import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { pickRandomScute, useShellShimmer } from './useShellShimmer'

const SCUTE_IDS = ['shell-scute-1', 'shell-scute-2', 'shell-scute-3']

describe('pickRandomScute', () => {
  it('picks from unlit scutes when some are unlit', () => {
    const lit = new Set(['shell-scute-1'])
    for (let i = 0; i < 30; i++) {
      const result = pickRandomScute(SCUTE_IDS, lit)
      expect(['shell-scute-2', 'shell-scute-3']).toContain(result)
    }
  })

  it('picks from all scutes when all are lit', () => {
    const lit = new Set(SCUTE_IDS)
    const results = new Set(Array.from({ length: 50 }, () => pickRandomScute(SCUTE_IDS, lit)))
    expect(results.size).toBeGreaterThan(1)
  })

  it('always returns a valid scute ID', () => {
    const lit = new Set<string>()
    for (let i = 0; i < 20; i++) {
      expect(SCUTE_IDS).toContain(pickRandomScute(SCUTE_IDS, lit))
    }
  })
})

describe('useShellShimmer', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts with empty lit scutes when localStorage is empty', () => {
    const { result } = renderHook(() => useShellShimmer(SCUTE_IDS))
    expect(result.current.litScutes.size).toBe(0)
  })

  it('lighting a scute adds it to litScutes', () => {
    const { result } = renderHook(() => useShellShimmer(SCUTE_IDS))
    act(() => { result.current.lightRandomScute() })
    expect(result.current.litScutes.size).toBe(1)
  })

  it('lit scutes persist in localStorage', () => {
    const { result } = renderHook(() => useShellShimmer(SCUTE_IDS))
    act(() => { result.current.lightRandomScute() })
    const stored = JSON.parse(localStorage.getItem('glide:shell-shimmer') ?? '{}')
    expect(Object.keys(stored.scutes)).toHaveLength(1)
  })

  it('drops scutes older than 30 minutes on load', () => {
    const thirtyOneMinutesAgo = Date.now() - 31 * 60 * 1000
    localStorage.setItem('glide:shell-shimmer', JSON.stringify({
      scutes: { 'shell-scute-1': thirtyOneMinutesAgo }
    }))
    const { result } = renderHook(() => useShellShimmer(SCUTE_IDS))
    expect(result.current.litScutes.size).toBe(0)
  })

  it('keeps scutes younger than 30 minutes on load', () => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000
    localStorage.setItem('glide:shell-shimmer', JSON.stringify({
      scutes: { 'shell-scute-2': tenMinutesAgo }
    }))
    const { result } = renderHook(() => useShellShimmer(SCUTE_IDS))
    expect(result.current.litScutes.has('shell-scute-2')).toBe(true)
  })

  it('accumulates scutes across multiple pettings', () => {
    const { result } = renderHook(() => useShellShimmer(SCUTE_IDS))
    act(() => { result.current.lightRandomScute() })
    act(() => { result.current.lightRandomScute() })
    expect(result.current.litScutes.size).toBe(2)
  })
})
