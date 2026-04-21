import { describe, it, expect } from 'vitest'
import { reducer } from './useTurtleState'

describe('reducer — petted state', () => {
  it('calm + PET → petted', () => {
    expect(reducer('calm', { type: 'PET' })).toBe('petted')
  })

  it('petted + PET_COMPLETE → calm', () => {
    expect(reducer('petted', { type: 'PET_COMPLETE' })).toBe('calm')
  })

  it('petted ignores all other actions', () => {
    expect(reducer('petted', { type: 'HOLD_COMPLETE' })).toBe('petted')
    expect(reducer('petted', { type: 'HR_EXCEEDED' })).toBe('petted')
    expect(reducer('petted', { type: 'BREATHING_COMPLETE' })).toBe('petted')
    expect(reducer('petted', { type: 'REWARD_COMPLETE' })).toBe('petted')
  })

  it('anxious ignores PET', () => {
    expect(reducer('anxious', { type: 'PET' })).toBe('anxious')
  })
})

describe('reducer — existing transitions unchanged', () => {
  it('calm + HOLD_COMPLETE → anxious', () => {
    expect(reducer('calm', { type: 'HOLD_COMPLETE' })).toBe('anxious')
  })
  it('calm + HR_EXCEEDED → anxious', () => {
    expect(reducer('calm', { type: 'HR_EXCEEDED' })).toBe('anxious')
  })
  it('anxious + HOLD_COMPLETE → breathing', () => {
    expect(reducer('anxious', { type: 'HOLD_COMPLETE' })).toBe('breathing')
  })
  it('anxious + HR_NORMAL → calm', () => {
    expect(reducer('anxious', { type: 'HR_NORMAL' })).toBe('calm')
  })
  it('breathing + BREATHING_COMPLETE → reward', () => {
    expect(reducer('breathing', { type: 'BREATHING_COMPLETE' })).toBe('reward')
  })
  it('reward + REWARD_COMPLETE → calm', () => {
    expect(reducer('reward', { type: 'REWARD_COMPLETE' })).toBe('calm')
  })
})
