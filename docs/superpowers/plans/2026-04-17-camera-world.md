# Camera & World Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the user a pannable 4000×3000 underwater world where the turtle swims purposefully and a smooth camera follows it by default.

**Architecture:** A `.world` CSS container (4000×3000 px) holds all scene content; the camera is a `translate(x,y)` applied to that div directly via a `requestAnimationFrame` loop, bypassing React state for smoothness. Two new hooks — `useTurtleNavigation` and `useCameraState` — own world position and camera offset respectively. A `usePointerPan` hook feeds drag deltas to the camera.

**Tech Stack:** React 18, TypeScript, Vitest + @testing-library/react (jsdom), CSS transforms, Pointer Events API.

---

## File Map

| Status | File | Responsibility |
|---|---|---|
| Create | `src/constants/world.ts` | WORLD_W/H, turtle nav constants |
| Create | `src/hooks/useTurtleNavigation.ts` | World-space position, waypoints, sleep state |
| Create | `src/hooks/useTurtleNavigation.test.ts` | Tests for pure helpers |
| Create | `src/hooks/useCameraState.ts` | Camera mode, lerp loop, clamp |
| Create | `src/hooks/useCameraState.test.ts` | Tests for pure helpers |
| Create | `src/hooks/usePointerPan.ts` | Drag delta extraction |
| Create | `src/hooks/usePointerPan.test.ts` | Tests |
| Create | `src/components/RecenterButton/RecenterButton.tsx` | Fixed button, visible in free mode |
| Create | `src/components/RecenterButton/RecenterButton.css` | Styles |
| Modify | `src/components/Scene/Scene.tsx` | World container, pointer handlers |
| Modify | `src/components/Scene/Scene.css` | World sizing, background tiling |
| Modify | `src/components/Turtle/Turtle.tsx` | Accept worldX/Y/facing/tilt props |
| Modify | `src/components/Turtle/Turtle.css` | Remove centered positioning |
| Modify | `src/components/BreathingRing/BreathingRing.css` | Position via inline style |
| Modify | `src/components/Controls/Controls.tsx` | Add data-no-pan attributes |
| Modify | `src/App.tsx` | Wire all hooks, pass props |

---

## Task 1: World Constants

**Files:**
- Create: `src/constants/world.ts`

- [ ] **Step 1: Create the constants file**

```ts
// src/constants/world.ts
export const WORLD_W = 4000
export const WORLD_H = 3000

export const TURTLE_SPEED = 40          // px/sec
export const WAYPOINT_MARGIN_X = 800    // 20% of WORLD_W
export const WAYPOINT_MARGIN_Y = 600    // 20% of WORLD_H
export const ARRIVAL_THRESHOLD = 20     // px — close enough to waypoint
export const MAX_TILT = 12              // degrees max banking tilt

export const REST_MIN = 2000            // ms
export const REST_MAX = 6000            // ms
export const SLEEP_MIN = 15000          // ms
export const SLEEP_MAX = 45000          // ms
export const SLEEP_CHANCE = 0.3         // 30% chance of long sleep on arrival

export const CAMERA_LERP = 0.06        // interpolation factor per frame
```

- [ ] **Step 2: Commit**

```bash
git add src/constants/world.ts
git commit -m "feat: add world and navigation constants"
```

---

## Task 2: `useTurtleNavigation` — Pure Helpers (TDD)

**Files:**
- Create: `src/hooks/useTurtleNavigation.ts`
- Create: `src/hooks/useTurtleNavigation.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/hooks/useTurtleNavigation.test.ts
import { describe, it, expect } from 'vitest'
import { pickWaypoint, computeOrientation, hasArrived } from './useTurtleNavigation'
import {
  WORLD_W, WORLD_H, WAYPOINT_MARGIN_X, WAYPOINT_MARGIN_Y,
  ARRIVAL_THRESHOLD, MAX_TILT,
} from '../constants/world'

describe('pickWaypoint', () => {
  it('returns a point within the inner 60% of the world', () => {
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
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/hooks/useTurtleNavigation.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the pure helpers**

```ts
// src/hooks/useTurtleNavigation.ts
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/hooks/useTurtleNavigation.test.ts
```

Expected: PASS — 7 tests passing.

---

## Task 3: `useTurtleNavigation` — Full Hook

**Files:**
- Modify: `src/hooks/useTurtleNavigation.ts`

- [ ] **Step 1: Append the hook to the file (after the pure helpers)**

```ts
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
```

- [ ] **Step 2: Run existing tests to confirm they still pass**

```bash
npx vitest run src/hooks/useTurtleNavigation.test.ts
```

Expected: PASS — 7 tests passing.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTurtleNavigation.ts src/hooks/useTurtleNavigation.test.ts
git commit -m "feat: add useTurtleNavigation hook with waypoint navigation"
```

---

## Task 4: `useCameraState` — Pure Helpers (TDD)

**Files:**
- Create: `src/hooks/useCameraState.ts`
- Create: `src/hooks/useCameraState.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/hooks/useCameraState.test.ts
import { describe, it, expect } from 'vitest'
import { clampCamera, lerpValue } from './useCameraState'
import { WORLD_W, WORLD_H } from '../constants/world'

describe('clampCamera', () => {
  it('clamps x to 0 when positive', () => {
    const result = clampCamera({ x: 50, y: 0 }, WORLD_W, WORLD_H, 375, 812)
    expect(result.x).toBe(0)
  })
  it('clamps x to -(WORLD_W - vpW) at minimum', () => {
    const vpW = 375
    const result = clampCamera({ x: -(WORLD_W + 100), y: 0 }, WORLD_W, WORLD_H, vpW, 812)
    expect(result.x).toBe(-(WORLD_W - vpW))
  })
  it('passes through a valid x within bounds', () => {
    const x = -500
    const result = clampCamera({ x, y: 0 }, WORLD_W, WORLD_H, 375, 812)
    expect(result.x).toBe(x)
  })
  it('clamps y to 0 when positive', () => {
    const result = clampCamera({ x: 0, y: 50 }, WORLD_W, WORLD_H, 375, 812)
    expect(result.y).toBe(0)
  })
  it('clamps y to -(WORLD_H - vpH) at minimum', () => {
    const vpH = 812
    const result = clampCamera({ x: 0, y: -(WORLD_H + 100) }, WORLD_W, WORLD_H, 375, vpH)
    expect(result.y).toBe(-(WORLD_H - vpH))
  })
})

describe('lerpValue', () => {
  it('returns midpoint at t=0.5', () => {
    expect(lerpValue(0, 100, 0.5)).toBe(50)
  })
  it('returns from at t=0', () => {
    expect(lerpValue(0, 100, 0)).toBe(0)
  })
  it('returns to at t=1', () => {
    expect(lerpValue(0, 100, 1)).toBe(100)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/hooks/useCameraState.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the pure helpers**

```ts
// src/hooks/useCameraState.ts
import { useEffect, useRef, useState } from 'react'
import type { MutableRefObject, RefObject } from 'react'
import type { Vec2 } from './useTurtleNavigation'
import { WORLD_W, WORLD_H, CAMERA_LERP } from '../constants/world'

export type CameraMode = 'follow' | 'free'

export function clampCamera(cam: Vec2, worldW: number, worldH: number, vpW: number, vpH: number): Vec2 {
  return {
    x: Math.max(-(worldW - vpW), Math.min(0, cam.x)),
    y: Math.max(-(worldH - vpH), Math.min(0, cam.y)),
  }
}

export function lerpValue(from: number, to: number, t: number): number {
  return from + (to - from) * t
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/hooks/useCameraState.test.ts
```

Expected: PASS — 8 tests passing.

---

## Task 5: `useCameraState` — Full Hook

**Files:**
- Modify: `src/hooks/useCameraState.ts`

- [ ] **Step 1: Append the hook to the file (after the pure helpers)**

The hook drives the world div transform directly via a DOM ref to avoid 60fps React re-renders.

```ts
interface UseCameraStateOptions {
  turtlePosRef: MutableRefObject<Vec2>
  worldRef: RefObject<HTMLDivElement>
}

export function useCameraState({ turtlePosRef, worldRef }: UseCameraStateOptions) {
  const initialCam: Vec2 = {
    x: -(WORLD_W / 2 - window.innerWidth / 2),
    y: -(WORLD_H / 2 - window.innerHeight / 2),
  }

  const modeRef = useRef<CameraMode>('follow')
  const [mode, setModeState] = useState<CameraMode>('follow')
  const targetCamRef = useRef<Vec2>(initialCam)
  const displayCamRef = useRef<Vec2>({ ...initialCam })
  const rafRef = useRef<number | null>(null)

  const setMode = (m: CameraMode) => {
    modeRef.current = m
    setModeState(m)
  }

  const applyDragDelta = (dx: number, dy: number) => {
    if (modeRef.current !== 'free') return
    targetCamRef.current = clampCamera(
      { x: targetCamRef.current.x + dx, y: targetCamRef.current.y + dy },
      WORLD_W, WORLD_H, window.innerWidth, window.innerHeight,
    )
  }

  useEffect(() => {
    function tick() {
      rafRef.current = requestAnimationFrame(tick)

      if (modeRef.current === 'follow') {
        const tp = turtlePosRef.current
        targetCamRef.current = clampCamera(
          { x: -(tp.x - window.innerWidth / 2), y: -(tp.y - window.innerHeight / 2) },
          WORLD_W, WORLD_H, window.innerWidth, window.innerHeight,
        )
      }

      displayCamRef.current = {
        x: lerpValue(displayCamRef.current.x, targetCamRef.current.x, CAMERA_LERP),
        y: lerpValue(displayCamRef.current.y, targetCamRef.current.y, CAMERA_LERP),
      }

      if (worldRef.current) {
        worldRef.current.style.transform =
          `translate(${displayCamRef.current.x}px, ${displayCamRef.current.y}px)`
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [turtlePosRef, worldRef])

  return { mode, setMode, applyDragDelta }
}
```

- [ ] **Step 2: Run existing tests to confirm they still pass**

```bash
npx vitest run src/hooks/useCameraState.test.ts
```

Expected: PASS — 8 tests passing.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCameraState.ts src/hooks/useCameraState.test.ts
git commit -m "feat: add useCameraState hook with lerp follow and free pan"
```

---

## Task 6: `usePointerPan` — Hook + Tests

**Files:**
- Create: `src/hooks/usePointerPan.ts`
- Create: `src/hooks/usePointerPan.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/hooks/usePointerPan.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePointerPan } from './usePointerPan'

function makePointerEvent(x: number, y: number, target?: Element): React.PointerEvent {
  const el = target ?? document.createElement('div')
  ;(el as HTMLElement).setPointerCapture = vi.fn()
  return { clientX: x, clientY: y, target: el, currentTarget: el, pointerId: 1 } as unknown as React.PointerEvent
}

describe('usePointerPan', () => {
  it('calls onStart and begins tracking on pointer down', () => {
    const onStart = vi.fn()
    const { result } = renderHook(() =>
      usePointerPan({ onStart, onDelta: vi.fn(), shouldIgnore: () => false })
    )
    result.current.onPointerDown(makePointerEvent(100, 150))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('calls onDelta with correct deltas on pointer move after down', () => {
    const onDelta = vi.fn()
    const { result } = renderHook(() =>
      usePointerPan({ onStart: vi.fn(), onDelta, shouldIgnore: () => false })
    )
    result.current.onPointerDown(makePointerEvent(100, 150))
    result.current.onPointerMove(makePointerEvent(110, 160))
    expect(onDelta).toHaveBeenCalledWith(10, 10)
  })

  it('accumulates deltas across multiple move events', () => {
    const onDelta = vi.fn()
    const { result } = renderHook(() =>
      usePointerPan({ onStart: vi.fn(), onDelta, shouldIgnore: () => false })
    )
    result.current.onPointerDown(makePointerEvent(0, 0))
    result.current.onPointerMove(makePointerEvent(10, 20))
    result.current.onPointerMove(makePointerEvent(15, 25))
    expect(onDelta).toHaveBeenNthCalledWith(1, 10, 20)
    expect(onDelta).toHaveBeenNthCalledWith(2, 5, 5)
  })

  it('does not call onDelta before pointer down', () => {
    const onDelta = vi.fn()
    const { result } = renderHook(() =>
      usePointerPan({ onStart: vi.fn(), onDelta, shouldIgnore: () => false })
    )
    result.current.onPointerMove(makePointerEvent(110, 160))
    expect(onDelta).not.toHaveBeenCalled()
  })

  it('stops calling onDelta after pointer up', () => {
    const onDelta = vi.fn()
    const { result } = renderHook(() =>
      usePointerPan({ onStart: vi.fn(), onDelta, shouldIgnore: () => false })
    )
    result.current.onPointerDown(makePointerEvent(0, 0))
    result.current.onPointerMove(makePointerEvent(10, 10))
    result.current.onPointerUp()
    result.current.onPointerMove(makePointerEvent(20, 20))
    expect(onDelta).toHaveBeenCalledTimes(1)
  })

  it('ignores pointer down when shouldIgnore returns true', () => {
    const onStart = vi.fn()
    const { result } = renderHook(() =>
      usePointerPan({ onStart, onDelta: vi.fn(), shouldIgnore: () => true })
    )
    result.current.onPointerDown(makePointerEvent(100, 150))
    expect(onStart).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/hooks/usePointerPan.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

```ts
// src/hooks/usePointerPan.ts
import { useRef, useCallback } from 'react'

interface UsePointerPanOptions {
  onStart: () => void
  onDelta: (dx: number, dy: number) => void
  shouldIgnore: (target: EventTarget | null) => boolean
}

export function usePointerPan({ onStart, onDelta, shouldIgnore }: UsePointerPanOptions) {
  const dragging = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (shouldIgnore(e.target)) return
    dragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    onStart()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [onStart, shouldIgnore])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !lastPos.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    onDelta(dx, dy)
  }, [onDelta])

  const onPointerUp = useCallback(() => {
    dragging.current = false
    lastPos.current = null
  }, [])

  return { onPointerDown, onPointerMove, onPointerUp }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/hooks/usePointerPan.test.ts
```

Expected: PASS — 6 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePointerPan.ts src/hooks/usePointerPan.test.ts
git commit -m "feat: add usePointerPan hook with shouldIgnore and delta tracking"
```

---

## Task 7: `RecenterButton` Component

**Files:**
- Create: `src/components/RecenterButton/RecenterButton.tsx`
- Create: `src/components/RecenterButton/RecenterButton.css`

- [ ] **Step 1: Create the component**

```tsx
// src/components/RecenterButton/RecenterButton.tsx
import type { CameraMode } from '../../hooks/useCameraState'
import './RecenterButton.css'

interface RecenterButtonProps {
  mode: CameraMode
  onRecenter: () => void
}

export function RecenterButton({ mode, onRecenter }: RecenterButtonProps) {
  return (
    <button
      className={`recenter-button ${mode === 'free' ? 'visible' : ''}`}
      onClick={onRecenter}
      aria-label="Re-center on turtle"
    >
      ◎
    </button>
  )
}
```

- [ ] **Step 2: Create the styles**

```css
/* src/components/RecenterButton/RecenterButton.css */
.recenter-button {
  position: fixed;
  bottom: 72px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(126, 207, 207, 0.25);
  background: rgba(6, 26, 46, 0.5);
  color: rgba(126, 207, 207, 0.5);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 50;
}

.recenter-button.visible {
  opacity: 1;
  pointer-events: auto;
}

.recenter-button:hover {
  border-color: rgba(126, 207, 207, 0.5);
  color: rgba(126, 207, 207, 0.8);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/RecenterButton/
git commit -m "feat: add RecenterButton component"
```

---

## Task 8: Scene World Container

**Files:**
- Modify: `src/components/Scene/Scene.tsx`
- Modify: `src/components/Scene/Scene.css`

- [ ] **Step 1: Update `Scene.tsx`**

Bubbles are now distributed across world-space x positions. Scene receives a `worldRef` and pointer event handlers from App.

```tsx
// src/components/Scene/Scene.tsx
import './Scene.css'

const BUBBLES = [
  { left: 200,  size: 5, duration: '9s',  delay: '0s'  },
  { left: 550,  size: 3, duration: '12s', delay: '-3s' },
  { left: 900,  size: 4, duration: '7s',  delay: '-6s' },
  { left: 1200, size: 6, duration: '11s', delay: '-1s' },
  { left: 1500, size: 3, duration: '8s',  delay: '-8s' },
  { left: 1800, size: 4, duration: '13s', delay: '-4s' },
  { left: 2100, size: 5, duration: '9s',  delay: '-2s' },
  { left: 2400, size: 3, duration: '10s', delay: '-5s' },
  { left: 2700, size: 4, duration: '11s', delay: '-7s' },
  { left: 3000, size: 6, duration: '8s',  delay: '-1s' },
  { left: 3300, size: 3, duration: '14s', delay: '-3s' },
  { left: 3600, size: 5, duration: '9s',  delay: '-6s' },
  { left: 3800, size: 4, duration: '7s',  delay: '-4s' },
]

interface SceneProps {
  children: React.ReactNode
  worldRef: React.RefObject<HTMLDivElement>
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
}

export function Scene({ children, worldRef, onPointerDown, onPointerMove, onPointerUp }: SceneProps) {
  return (
    <div
      className="scene"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div ref={worldRef} className="world">
        <div className="world-bubbles">
          {BUBBLES.map((b, i) => (
            <div
              key={i}
              className="bubble"
              style={{
                left: b.left,
                width: b.size,
                height: b.size,
                '--duration': b.duration,
                '--delay': b.delay,
              } as React.CSSProperties}
            />
          ))}
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `Scene.css`**

```css
/* src/components/Scene/Scene.css */
.scene {
  position: fixed;
  inset: 0;
  background: #061a2e;
  overflow: hidden;
  cursor: grab;
}

.scene:active {
  cursor: grabbing;
}

.world {
  position: absolute;
  width: 4000px;
  height: 3000px;
  background: url('/background.svg') repeat;
  background-size: 100vw auto;
  will-change: transform;
}

.world-bubbles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bubble {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(126, 207, 207, 0.2);
  animation: bubble-rise var(--duration, 8s) ease-in infinite var(--delay, 0s);
  bottom: 0;
}

@keyframes bubble-rise {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% { opacity: 0.4; }
  90% { opacity: 0.2; }
  100% {
    transform: translateY(-105vh) translateX(15px);
    opacity: 0;
  }
}
```

- [ ] **Step 3: Add `data-no-pan` to Controls to block spurious pan starts**

In `src/components/Controls/Controls.tsx`, add `data-no-pan="true"` to both fixed divs:

```tsx
// Change:
<div className="controls-top-right">
// To:
<div className="controls-top-right" data-no-pan="true">
```

```tsx
// Change:
<div className="pattern-pill">
// To:
<div className="pattern-pill" data-no-pan="true">
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Scene/ src/components/Controls/Controls.tsx
git commit -m "feat: add world container to Scene with pointer pan support"
```

---

## Task 9: Turtle World Positioning

**Files:**
- Modify: `src/components/Turtle/Turtle.tsx`
- Modify: `src/components/Turtle/Turtle.css`

The turtle-wrapper is positioned via `left`/`top` inline style (set to world coords). An inner `.turtle-flip` div handles the directional flip and banking tilt — keeping these transforms separate from the CSS animations on `.turtle-svg`.

- [ ] **Step 1: Update `Turtle.tsx`**

```tsx
// src/components/Turtle/Turtle.tsx
import { useEffect, useRef, useCallback } from 'react'
import type { TurtleState } from '../../hooks/useTurtleState'
import type { Phase } from '../../constants/breathingPatterns'
import type { Facing } from '../../hooks/useTurtleNavigation'
import './Turtle.css'

const HOLD_DURATION = 1500
const SURFACE_ARC_MIN = 3 * 60 * 1000
const SURFACE_ARC_MAX = 5 * 60 * 1000

interface TurtleProps {
  state: TurtleState
  phase: Phase
  glowLevel: number
  phaseDuration: number
  onHoldComplete: () => void
  worldX: number
  worldY: number
  facing: Facing
  tilt: number
}

export function Turtle({ state, phase, glowLevel, phaseDuration, onHoldComplete, worldX, worldY, facing, tilt }: TurtleProps) {
  const svgRef = useRef<HTMLImageElement>(null)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const arcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleArc = useCallback(() => {
    const delay = SURFACE_ARC_MIN + Math.random() * (SURFACE_ARC_MAX - SURFACE_ARC_MIN)
    arcTimerRef.current = setTimeout(() => {
      const el = svgRef.current
      if (!el) return
      el.classList.add('surfacing')
      setTimeout(() => {
        el.classList.remove('surfacing')
        scheduleArc()
      }, 7000)
    }, delay)
  }, [])

  useEffect(() => {
    if (state === 'calm') {
      scheduleArc()
    }
    return () => {
      if (arcTimerRef.current) clearTimeout(arcTimerRef.current)
    }
  }, [state, scheduleArc])

  const handlePointerDown = useCallback(() => {
    holdTimerRef.current = setTimeout(onHoldComplete, HOLD_DURATION)
  }, [onHoldComplete])

  const cancelHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }, [])

  const flipScale = facing === 'left' ? -1 : 1

  return (
    <div
      className="turtle-wrapper"
      data-state={state}
      style={{ left: worldX, top: worldY }}
    >
      <div
        className="turtle-flip"
        style={{ transform: `scaleX(${flipScale}) rotate(${tilt}deg)` }}
      >
        <img
          ref={svgRef}
          src="/turtle.svg"
          className="turtle-svg"
          data-state={state}
          data-phase={phase}
          style={{ '--phase-duration': `${phaseDuration}s`, '--glow-level': glowLevel } as React.CSSProperties}
          alt="Sea turtle"
          draggable={false}
        />
      </div>
      <div
        className="shell-spot-overlay"
        data-no-pan="true"
        onPointerDown={handlePointerDown}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
      />
    </div>
  )
}
```

- [ ] **Step 2: Update `Turtle.css`**

Remove the hardcoded `top`/`left` centering from `.turtle-wrapper` (now set via inline style). Add `.turtle-flip` with a smooth transition.

```css
/* src/components/Turtle/Turtle.css */

/* ── Wrapper ─────────────────────────────────── */
.turtle-wrapper {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 520px;
  height: 308px;
}

/* ── Flip + tilt layer ───────────────────────── */
.turtle-flip {
  width: 100%;
  height: 100%;
  transition: transform 0.8s ease;
}

.turtle-svg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* Interactive overlay positioned over the shell */
.shell-spot-overlay {
  position: absolute;
  top: 20%;
  left: 40%;
  transform: translate(-50%, -50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  cursor: pointer;
  animation: spot-pulse 3s ease-in-out infinite;
  border: 1.5px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3), 0 0 20px rgba(126, 207, 207, 0.25);
}

.turtle-wrapper[data-state='anxious'] .shell-spot-overlay {
  animation: spot-pulse-bright 1.2s ease-in-out infinite;
}

.turtle-wrapper[data-state='breathing'] .shell-spot-overlay,
.turtle-wrapper[data-state='reward'] .shell-spot-overlay {
  animation: none;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.6s ease;
}

/* ── Calm state ──────────────────────────────── */
.turtle-svg[data-state='calm'] {
  animation: drift 6s ease-in-out infinite;
}

@keyframes drift {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-14px); }
}

/* ── Ambient surface arc ─────────────────────── */
.turtle-svg.surfacing {
  animation: surface-arc 7s ease-in-out forwards !important;
}

@keyframes surface-arc {
  0%   { transform: translateY(0) rotate(0deg); }
  20%  { transform: translateY(-22vh) rotate(-15deg); }
  50%  { transform: translateY(-22vh) rotate(-10deg); }
  80%  { transform: translateY(-8vh) rotate(-5deg); }
  100% { transform: translateY(0) rotate(0deg); }
}

@keyframes spot-pulse {
  0%, 100% { opacity: 0.5; box-shadow: 0 0 6px rgba(255,255,255,0.2), 0 0 16px rgba(126,207,207,0.15); }
  50%       { opacity: 1;   box-shadow: 0 0 12px rgba(255,255,255,0.5), 0 0 28px rgba(126,207,207,0.35); }
}

@keyframes spot-pulse-bright {
  0%, 100% { opacity: 0.7; box-shadow: 0 0 10px rgba(255,255,255,0.4), 0 0 24px rgba(126,207,207,0.3); }
  50%       { opacity: 1;   box-shadow: 0 0 18px rgba(255,255,255,0.7), 0 0 40px rgba(126,207,207,0.5); }
}

/* ── Anxious state ───────────────────────────── */
.turtle-svg[data-state='anxious'] {
  animation: nudge 2.8s ease-in-out infinite;
  transform-origin: center;
}

@keyframes nudge {
  0%   { transform: translateY(-18vh) rotate(-10deg); }
  35%  { transform: translateY(-20vh) rotate(-12deg); }
  50%  { transform: translateY(-21vh) rotate(-13deg); }
  65%  { transform: translateY(-20vh) rotate(-12deg); }
  100% { transform: translateY(-18vh) rotate(-10deg); }
}

/* ── Breathing state ─────────────────────────── */
.turtle-svg[data-state='breathing'] {
  transition: transform var(--phase-duration, 4s) ease-in-out;
}

.turtle-svg[data-state='breathing'][data-phase='inhale'],
.turtle-svg[data-state='breathing'][data-phase='hold-in'] {
  transform: translateY(-20vh) rotate(-8deg);
}

.turtle-svg[data-state='breathing'][data-phase='exhale'],
.turtle-svg[data-state='breathing'][data-phase='hold-out'] {
  transform: translateY(0) rotate(0deg);
}

/* ── Reward state ────────────────────────────── */
.turtle-svg[data-state='reward'] {
  animation: reward-settle 0.8s ease-out forwards;
}

@keyframes reward-settle {
  to { transform: translateY(0) rotate(0deg); }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Turtle/
git commit -m "feat: position turtle in world space with flip and banking tilt"
```

---

## Task 10: BreathingRing Co-location + App Wiring

**Files:**
- Modify: `src/components/BreathingRing/BreathingRing.css`
- Modify: `src/App.tsx`

BreathingRing is rendered at the same world position as the turtle. Its CSS already uses `translate(-50%, -50%)` centering — we just replace the static `top: 50%; left: 50%` with inline style props.

- [ ] **Step 1: Update `BreathingRing.css` to remove static centering**

```css
/* src/components/BreathingRing/BreathingRing.css */
.breathing-ring-wrapper {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 280px;
  height: 280px;
  pointer-events: none;
  animation: ring-fade-in 1s ease forwards;
}

@keyframes ring-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.breathing-ring-wrapper.fading-out {
  animation: ring-fade-out 1s ease forwards;
}

@keyframes ring-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

.breathing-ring-circle {
  transform-origin: center;
  transform-box: fill-box;
}

.breathing-ring-wrapper[data-phase='hold-in'] .breathing-ring-circle,
.breathing-ring-wrapper[data-phase='hold-out'] .breathing-ring-circle {
  animation: ring-hold-blink 1.1s ease-in-out infinite;
}

@keyframes ring-hold-blink {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.2; }
}
```

- [ ] **Step 2: Add `worldX`/`worldY` props to BreathingRing**

```tsx
// src/components/BreathingRing/BreathingRing.tsx
import { useState, useEffect } from 'react'
import './BreathingRing.css'
import type { Phase } from '../../constants/breathingPatterns'

interface BreathingRingProps {
  phase: Phase
  phaseDuration: number
  visible: boolean
  worldX: number
  worldY: number
}

export function BreathingRing({ phase, phaseDuration, visible, worldX, worldY }: BreathingRingProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!visible) { setReady(false); return }
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [visible])

  if (!visible) return null

  const isHold = phase === 'hold-in' || phase === 'hold-out'
  const expandedPhase = phase === 'inhale' || phase === 'hold-in'
  const scale = ready && expandedPhase ? 1.35 : 0.85
  const transitionDuration = isHold ? 0.3 : phaseDuration

  return (
    <div
      className="breathing-ring-wrapper"
      data-phase={phase}
      style={{ left: worldX, top: worldY }}
    >
      <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg">
        <circle
          className="breathing-ring-circle"
          cx="140" cy="140" r="110"
          fill="none"
          stroke="rgba(255, 255, 255, 0.55)"
          strokeWidth="2"
          style={{
            transform: `scale(${scale})`,
            transition: `transform ${transitionDuration}s ease-in-out`,
          }}
        />
        <circle
          className="breathing-ring-circle"
          cx="140" cy="140" r="125"
          fill="none"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="1"
          style={{
            transform: `scale(${scale})`,
            transition: `transform ${isHold ? transitionDuration : transitionDuration * 1.1}s ease-in-out`,
          }}
        />
      </svg>
    </div>
  )
}
```

- [ ] **Step 3: Update `App.tsx` to wire all hooks**

```tsx
// src/App.tsx
import { useEffect, useRef, useState } from 'react'
import { Scene } from './components/Scene/Scene'
import { Turtle } from './components/Turtle/Turtle'
import { BreathingRing } from './components/BreathingRing/BreathingRing'
import { Controls } from './components/Controls/Controls'
import { RecenterButton } from './components/RecenterButton/RecenterButton'
import { useTurtleState } from './hooks/useTurtleState'
import { useBreathing } from './hooks/useBreathing'
import { useHeartRate } from './hooks/useHeartRate'
import { useRewards } from './hooks/useRewards'
import { useAudio } from './hooks/useAudio'
import { useTurtleNavigation } from './hooks/useTurtleNavigation'
import { useCameraState } from './hooks/useCameraState'
import { usePointerPan } from './hooks/usePointerPan'
import type { PatternName } from './constants/breathingPatterns'
import { BREATHING_PATTERNS } from './constants/breathingPatterns'

export default function App() {
  const { state, dispatch } = useTurtleState()
  const [pattern, setPattern] = useState<PatternName>('box')
  const { hr, setHr, isExceeded } = useHeartRate(100)
  const { glowLevel, completeSession } = useRewards()
  const { muted, setMuted, playChime } = useAudio()

  const breathingActive = state === 'breathing'
  const { phase, isComplete } = useBreathing(pattern, breathingActive)

  const currentPattern = BREATHING_PATTERNS[pattern]
  const currentPhaseConfig = currentPattern.phases.find(p => p.phase === phase)
  const phaseDuration = currentPhaseConfig?.duration ?? 4

  const { posRef, worldX, worldY, facing, tilt } = useTurtleNavigation(state)

  const worldRef = useRef<HTMLDivElement>(null)
  const { mode, setMode, applyDragDelta } = useCameraState({ turtlePosRef: posRef, worldRef })

  const { onPointerDown, onPointerMove, onPointerUp } = usePointerPan({
    onStart: () => setMode('free'),
    onDelta: applyDragDelta,
    shouldIgnore: (target) =>
      target !== null && (target as HTMLElement).closest('[data-no-pan]') !== null,
  })

  useEffect(() => {
    if (isExceeded && state === 'calm') {
      dispatch({ type: 'HR_EXCEEDED' })
      playChime()
    }
  }, [isExceeded, state, dispatch, playChime])

  useEffect(() => {
    if (isComplete && state === 'breathing') {
      dispatch({ type: 'BREATHING_COMPLETE' })
      completeSession()
      playChime()
    }
  }, [isComplete, state, dispatch, completeSession, playChime])

  useEffect(() => {
    if (state !== 'reward') return
    const id = setTimeout(() => dispatch({ type: 'REWARD_COMPLETE' }), 3500)
    return () => clearTimeout(id)
  }, [state, dispatch])

  useEffect(() => {
    if (state === 'breathing') playChime()
  }, [phase, state, playChime])

  return (
    <>
      <Scene
        worldRef={worldRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <BreathingRing
          phase={phase}
          phaseDuration={phaseDuration}
          visible={breathingActive}
          worldX={worldX}
          worldY={worldY}
        />
        <Turtle
          state={state}
          phase={phase}
          glowLevel={glowLevel}
          phaseDuration={phaseDuration}
          onHoldComplete={() => dispatch({ type: 'HOLD_COMPLETE' })}
          worldX={worldX}
          worldY={worldY}
          facing={facing}
          tilt={tilt}
        />
      </Scene>
      <Controls
        muted={muted}
        onToggleMute={() => setMuted(m => !m)}
        hr={hr}
        onHrChange={setHr}
        pattern={pattern}
        onPatternChange={setPattern}
      />
      <RecenterButton mode={mode} onRecenter={() => setMode('follow')} />
    </>
  )
}
```

Note: `Controls` and `RecenterButton` are rendered outside `<Scene>` so they are siblings of the world container in the DOM — not children inside `.world`. Their `position: fixed` CSS already places them above everything.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: PASS — all tests passing, no regressions.

- [ ] **Step 5: Start the dev server and verify manually**

```bash
npm run dev
```

Check:
- Turtle appears at world center, camera follows it
- Turtle slowly swims to waypoints, pauses, occasionally sleeps
- Turtle flips horizontally when swimming left
- Drag on scene pans the world; re-center button appears
- Tapping re-center snaps camera back to turtle
- Controls and pattern pill remain fixed regardless of pan
- Breathing session freezes turtle movement
- On mobile (or browser DevTools mobile emulation), touch pan works

- [ ] **Step 6: Commit**

```bash
git add src/components/BreathingRing/ src/App.tsx
git commit -m "feat: wire camera, world navigation, and pan gesture into app"
```
