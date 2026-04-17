import { describe, it, expect, beforeEach } from 'vitest'
import { computeNextRewards } from '../../src/hooks/useRewards'

describe('computeNextRewards', () => {
  it('first session increments sessionCount to 1', () => {
    const result = computeNextRewards({ sessionCount: 0, glowLevel: 0 })
    expect(result.sessionCount).toBe(1)
  })

  it('glowLevel stays 0 for first 4 sessions', () => {
    let state = { sessionCount: 0, glowLevel: 0 }
    for (let i = 0; i < 4; i++) state = computeNextRewards(state)
    expect(state.glowLevel).toBe(0)
  })

  it('glowLevel becomes 1 after 5th session', () => {
    let state = { sessionCount: 0, glowLevel: 0 }
    for (let i = 0; i < 5; i++) state = computeNextRewards(state)
    expect(state.glowLevel).toBe(1)
  })

  it('glowLevel caps at 5', () => {
    const result = computeNextRewards({ sessionCount: 24, glowLevel: 4 })
    expect(result.glowLevel).toBe(5)
    const result2 = computeNextRewards({ sessionCount: 29, glowLevel: 5 })
    expect(result2.glowLevel).toBe(5)
  })
})
