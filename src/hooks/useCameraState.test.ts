import { describe, it, expect } from 'vitest'
import { clampCamera, lerpValue } from './useCameraState'
import { WORLD_W, WORLD_H } from '../constants/world'

describe('clampCamera', () => {
  const vpW = 400
  const vpH = 800

  it('returns origin when world smaller than viewport (no clamp needed)', () => {
    const result = clampCamera({ x: 0, y: 0 }, 300, 200, 400, 800)
    expect(result).toEqual({ x: 0, y: 0 })
  })

  it('clamps x so world right edge stays in view', () => {
    const minX = -(WORLD_W - vpW)
    const result = clampCamera({ x: minX - 100, y: 0 }, WORLD_W, WORLD_H, vpW, vpH)
    expect(result.x).toBe(minX)
  })

  it('clamps y so world bottom edge stays in view', () => {
    const minY = -(WORLD_H - vpH)
    const result = clampCamera({ x: 0, y: minY - 100 }, WORLD_W, WORLD_H, vpW, vpH)
    expect(result.y).toBe(minY)
  })

  it('clamps x at 0 (camera cannot show before world left edge)', () => {
    const result = clampCamera({ x: 100, y: 0 }, WORLD_W, WORLD_H, vpW, vpH)
    expect(result.x).toBe(0)
  })

  it('clamps y at 0 (camera cannot show before world top edge)', () => {
    const result = clampCamera({ x: 0, y: 200 }, WORLD_W, WORLD_H, vpW, vpH)
    expect(result.y).toBe(0)
  })
})

describe('lerpValue', () => {
  it('returns from when t is 0', () => {
    expect(lerpValue(0, 100, 0)).toBe(0)
  })

  it('returns to when t is 1', () => {
    expect(lerpValue(0, 100, 1)).toBe(100)
  })

  it('interpolates correctly at t=0.5', () => {
    expect(lerpValue(0, 100, 0.5)).toBe(50)
  })
})
