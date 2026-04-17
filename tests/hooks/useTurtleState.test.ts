import { describe, it, expect } from 'vitest'
import { reducer, TurtleState } from '../../src/hooks/useTurtleState'

describe('turtle state machine', () => {
  it('initial state is calm', () => {
    expect(reducer('calm', { type: 'REWARD_COMPLETE' })).toBe('calm')
  })

  it('calm + HOLD_COMPLETE → anxious', () => {
    expect(reducer('calm', { type: 'HOLD_COMPLETE' })).toBe('anxious')
  })

  it('calm + HR_EXCEEDED → anxious', () => {
    expect(reducer('calm', { type: 'HR_EXCEEDED' })).toBe('anxious')
  })

  it('anxious + HOLD_COMPLETE → breathing', () => {
    expect(reducer('anxious', { type: 'HOLD_COMPLETE' })).toBe('breathing')
  })

  it('anxious + HR_EXCEEDED stays anxious', () => {
    expect(reducer('anxious', { type: 'HR_EXCEEDED' })).toBe('anxious')
  })

  it('breathing + BREATHING_COMPLETE → reward', () => {
    expect(reducer('breathing', { type: 'BREATHING_COMPLETE' })).toBe('reward')
  })

  it('breathing + HOLD_COMPLETE stays breathing', () => {
    expect(reducer('breathing', { type: 'HOLD_COMPLETE' })).toBe('breathing')
  })

  it('reward + REWARD_COMPLETE → calm', () => {
    expect(reducer('reward', { type: 'REWARD_COMPLETE' })).toBe('calm')
  })
})
