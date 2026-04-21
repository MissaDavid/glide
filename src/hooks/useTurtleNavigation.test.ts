import { describe, it, expect } from 'vitest'
import { pickWaypoint, computeOrientation, hasArrived } from './useTurtleNavigation'
import {
  WORLD_W, WORLD_H, WAYPOINT_MARGIN_X, WAYPOINT_MARGIN_Y,
  ARRIVAL_THRESHOLD, MAX_TILT,
} from '../constants/world'

describe('pickWaypoint', () => {
  it('returns a point within the waypoint margins of the world', () => {
    for (let i = 0; i < 50; i++) {
      const wp = pickWaypoint()
      expect(wp.x).toBeGreaterThanOrEqual(WAYPOINT_MARGIN_X)
      expect(wp.x).toBeLessThanOrEqual(WORLD_W - WAYPOINT_MARGIN_X)
      expect(wp.y).toBeGreaterThanOrEqual(WAYPOINT_MARGIN_Y)
      expect(wp.y).toBeLessThanOrEqual(WORLD_H - WAYPOINT_MARGIN_Y)
    }
  })
})

describe('computeOrientation', () => {
  it('faces left when dx is negative', () => {
    expect(computeOrientation(-10, 0).facing).toBe('left')
  })
  it('faces right when dx is positive', () => {
    expect(computeOrientation(10, 0).facing).toBe('right')
  })
  it('tilt magnitude does not exceed MAX_TILT', () => {
    const { tilt } = computeOrientation(10, 1000)
    expect(Math.abs(tilt)).toBeLessThanOrEqual(MAX_TILT)
  })
  it('returns zero tilt for perfectly horizontal travel', () => {
    expect(computeOrientation(100, 0).tilt).toBeCloseTo(0)
  })
  it('returns zero orientation for zero vector', () => {
    const { facing, tilt } = computeOrientation(0, 0)
    expect(facing).toBe('right')
    expect(tilt).toBe(0)
  })
})

describe('hasArrived', () => {
  it('returns true when within arrival threshold', () => {
    expect(hasArrived({ x: 100, y: 100 }, { x: 100 + ARRIVAL_THRESHOLD - 1, y: 100 })).toBe(true)
  })
  it('returns false when outside arrival threshold', () => {
    expect(hasArrived({ x: 100, y: 100 }, { x: 100 + ARRIVAL_THRESHOLD + 1, y: 100 })).toBe(false)
  })
  it('uses Euclidean distance', () => {
    const diag = (ARRIVAL_THRESHOLD - 1) / Math.SQRT2
    expect(hasArrived({ x: 0, y: 0 }, { x: diag, y: diag })).toBe(true)
  })
  it('returns false when exactly at arrival threshold', () => {
    expect(hasArrived({ x: 0, y: 0 }, { x: ARRIVAL_THRESHOLD, y: 0 })).toBe(false)
  })
})
