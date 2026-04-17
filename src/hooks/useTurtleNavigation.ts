import { useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import type { TurtleState } from './useTurtleState'
import {
  WORLD_W, WORLD_H, TURTLE_SPEED, WAYPOINT_MARGIN_X, WAYPOINT_MARGIN_Y,
  ARRIVAL_THRESHOLD, MAX_TILT, REST_MIN, REST_MAX, SLEEP_MIN, SLEEP_MAX, SLEEP_CHANCE,
} from '../constants/world'

export interface Vec2 { x: number; y: number }
export type Facing = 'left' | 'right'
export interface TurtleOrientation { facing: Facing; tilt: number }
export type NavState = 'swimming' | 'resting' | 'sleeping'

export function pickWaypoint(): Vec2 {
  return {
    x: WAYPOINT_MARGIN_X + Math.random() * (WORLD_W - 2 * WAYPOINT_MARGIN_X),
    y: WAYPOINT_MARGIN_Y + Math.random() * (WORLD_H - 2 * WAYPOINT_MARGIN_Y),
  }
}

export function computeOrientation(dx: number, dy: number): TurtleOrientation {
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 0.001) return { facing: 'right', tilt: 0 }
  const facing: Facing = dx < 0 ? 'left' : 'right'
  const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, (dy / dist) * MAX_TILT))
  return { facing, tilt }
}

export function hasArrived(pos: Vec2, waypoint: Vec2): boolean {
  const dx = waypoint.x - pos.x
  const dy = waypoint.y - pos.y
  return Math.sqrt(dx * dx + dy * dy) < ARRIVAL_THRESHOLD
}

export interface TurtleNavResult {
  posRef: MutableRefObject<Vec2>
  worldX: number
  worldY: number
  facing: Facing
  tilt: number
}

export function useTurtleNavigation(turtleState: TurtleState): TurtleNavResult {
  const posRef = useRef<Vec2>({ x: WORLD_W / 2, y: WORLD_H / 2 })
  const [renderPos, setRenderPos] = useState<Vec2>({ x: WORLD_W / 2, y: WORLD_H / 2 })
  const [orientation, setOrientation] = useState<TurtleOrientation>({ facing: 'right', tilt: 0 })

  const waypointRef = useRef<Vec2>(pickWaypoint())
  const navStateRef = useRef<NavState>('swimming')
  const lastTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const turtleStateRef = useRef(turtleState)

  useEffect(() => { turtleStateRef.current = turtleState }, [turtleState])

  useEffect(() => {
    function scheduleNext(restDuration: number) {
      navStateRef.current = 'resting'
      setOrientation(prev => ({ ...prev, tilt: 0 }))
      setTimeout(() => {
        const sleepDuration = Math.random() < SLEEP_CHANCE
          ? SLEEP_MIN + Math.random() * (SLEEP_MAX - SLEEP_MIN)
          : 0
        if (sleepDuration > 0) {
          navStateRef.current = 'sleeping'
          setTimeout(() => {
            waypointRef.current = pickWaypoint()
            navStateRef.current = 'swimming'
          }, sleepDuration)
        } else {
          waypointRef.current = pickWaypoint()
          navStateRef.current = 'swimming'
        }
      }, restDuration)
    }

    function tick(time: number) {
      rafRef.current = requestAnimationFrame(tick)
      const dt = lastTimeRef.current === null ? 0 : (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time

      if (turtleStateRef.current === 'breathing') return
      if (navStateRef.current !== 'swimming') return

      const pos = posRef.current
      const wp = waypointRef.current
      const dx = wp.x - pos.x
      const dy = wp.y - pos.y

      if (hasArrived(pos, wp)) {
        scheduleNext(REST_MIN + Math.random() * (REST_MAX - REST_MIN))
        return
      }

      const dist = Math.sqrt(dx * dx + dy * dy)
      const step = Math.min(TURTLE_SPEED * dt, dist)
      const newPos = { x: pos.x + (dx / dist) * step, y: pos.y + (dy / dist) * step }
      posRef.current = newPos
      setRenderPos(newPos)
      setOrientation(computeOrientation(dx, dy))
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return { posRef, worldX: renderPos.x, worldY: renderPos.y, facing: orientation.facing, tilt: orientation.tilt }
}
