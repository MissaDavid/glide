import { describe, it, expect } from 'vitest'
import { computeState } from '../../src/hooks/useBreathing'
import { BREATHING_PATTERNS } from '../../src/constants/breathingPatterns'

describe('computeState - box pattern', () => {
  const pattern = BREATHING_PATTERNS.box

  it('tick 0 → inhale, 4s left', () => {
    const result = computeState(pattern, 0)
    expect(result.phase).toBe('inhale')
    expect(result.secondsLeft).toBe(4)
    expect(result.cycleCount).toBe(0)
    expect(result.isComplete).toBe(false)
  })

  it('tick 3 → inhale, 1s left', () => {
    const result = computeState(pattern, 3)
    expect(result.phase).toBe('inhale')
    expect(result.secondsLeft).toBe(1)
  })

  it('tick 4 → hold-in, 4s left', () => {
    const result = computeState(pattern, 4)
    expect(result.phase).toBe('hold-in')
    expect(result.secondsLeft).toBe(4)
  })

  it('tick 8 → exhale, 4s left', () => {
    const result = computeState(pattern, 8)
    expect(result.phase).toBe('exhale')
    expect(result.secondsLeft).toBe(4)
  })

  it('tick 12 → hold-out, 4s left', () => {
    const result = computeState(pattern, 12)
    expect(result.phase).toBe('hold-out')
    expect(result.secondsLeft).toBe(4)
  })

  it('tick 16 → second cycle starts, inhale', () => {
    const result = computeState(pattern, 16)
    expect(result.phase).toBe('inhale')
    expect(result.cycleCount).toBe(1)
  })

  it('tick 48 (3 full cycles) → isComplete', () => {
    const result = computeState(pattern, 48)
    expect(result.isComplete).toBe(true)
  })
})

describe('computeState - 4-7-8 pattern', () => {
  const pattern = BREATHING_PATTERNS['478']

  it('tick 4 → hold-in, 7s left', () => {
    const result = computeState(pattern, 4)
    expect(result.phase).toBe('hold-in')
    expect(result.secondsLeft).toBe(7)
  })

  it('tick 11 → exhale, 8s left', () => {
    const result = computeState(pattern, 11)
    expect(result.phase).toBe('exhale')
    expect(result.secondsLeft).toBe(8)
  })

  it('tick 38 (2 full cycles) → isComplete', () => {
    // each cycle: 4+7+8=19, 2 cycles = 38
    const result = computeState(pattern, 38)
    expect(result.isComplete).toBe(true)
  })
})
