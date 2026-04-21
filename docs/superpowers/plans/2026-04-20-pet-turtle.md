# Pet Turtle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Serena tools:** This codebase uses Serena MCP tools for all code exploration. Use `mcp__serena__find_symbol`, `mcp__serena__get_symbols_overview`, and `mcp__serena__find_referencing_symbols` instead of Grep/Read for symbol lookups. Call `mcp__serena__check_onboarding_performed` at session start.

> **Worktree:** Work in a git worktree branched from `main`. Use `superpowers:using-git-worktrees` skill to set one up.

> **TDD:** Write the failing test first, verify it fails, implement, verify it passes. Use `npx vitest run` to run tests. Full build check: `npm run build`.

**Goal:** Let a friend pet the turtle with 2+ taps on its body/head (not shell spot) while calm — the turtle stops, closes its eye, one shell scute shimmers iridescently, then resumes swimming. Shimmer persists 30 minutes in localStorage.

**Architecture:** New `petted` state in the state machine. `usePetGesture` detects multi-tap. `useShellShimmer` tracks which SVG scute groups are lit in localStorage. CSS drives all animation (eye close via `transform: scaleY`, scute shimmer via entrance-only keyframe). SVG editing (manual) adds `#shell-scute-N` and `#eye` groups.

**Tech Stack:** React 18, TypeScript, Vite, Vitest + @testing-library/react, CSS keyframes, localStorage, SVG

---

## File Map

| File | Status | Responsibility |
|------|--------|---------------|
| `src/hooks/useTurtleState.ts` | Modify | Add `petted` state + `PET` / `PET_COMPLETE` actions |
| `src/hooks/useTurtleNavigation.ts` | Modify | Freeze tick when state is `petted` |
| `src/hooks/usePetGesture.ts` | Create | Detect 2+ taps within 1.5s on body/head |
| `src/hooks/useShellShimmer.ts` | Create | Manage lit scute state in localStorage |
| `src/constants/turtle.ts` | Create | `SHELL_SCUTE_IDS` — filled in after SVG editing |
| `src/App.tsx` | Modify | Auto-dispatch `PET_COMPLETE` after 2s; wire `onPet`; pass `litScutes` |
| `src/components/Turtle/Turtle.tsx` | Modify | Accept `onPet`, `litScutes`, `scuteIds`; apply classes via ref |
| `src/components/Turtle/Turtle.css` | Modify | Eye close/open keyframe; scute shimmer entrance keyframe |
| `src/assets/turtle.svg` | Modify (manual) | Add `#shell-scute-N` groups + `#eye` group |
| `src/hooks/useTurtleState.test.ts` | Create | State machine tests incl. `petted` |
| `src/hooks/usePetGesture.test.ts` | Create | Tap detection unit tests |
| `src/hooks/useShellShimmer.test.ts` | Create | LocalStorage persistence + random selection |

---

## Task 1: Extend the state machine

**Files:**
- Modify: `src/hooks/useTurtleState.ts`
- Create: `src/hooks/useTurtleState.test.ts`

- [ ] **Write the failing tests**

```ts
// src/hooks/useTurtleState.test.ts
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
```

- [ ] **Run tests to verify they fail**

```bash
npx vitest run src/hooks/useTurtleState.test.ts
```

Expected: FAIL — `reducer` doesn't handle `PET` or `PET_COMPLETE` yet.

- [ ] **Implement the changes**

Replace the full contents of `src/hooks/useTurtleState.ts`:

```ts
import { useReducer } from 'react'

export type TurtleState = 'calm' | 'anxious' | 'breathing' | 'reward' | 'petted'

export type TurtleAction =
  | { type: 'HOLD_COMPLETE' }
  | { type: 'HR_EXCEEDED' }
  | { type: 'HR_NORMAL' }
  | { type: 'BREATHING_COMPLETE' }
  | { type: 'REWARD_COMPLETE' }
  | { type: 'PET' }
  | { type: 'PET_COMPLETE' }

export function reducer(state: TurtleState, action: TurtleAction): TurtleState {
  switch (state) {
    case 'calm':
      if (action.type === 'HOLD_COMPLETE' || action.type === 'HR_EXCEEDED') return 'anxious'
      if (action.type === 'PET') return 'petted'
      return state
    case 'anxious':
      if (action.type === 'HOLD_COMPLETE') return 'breathing'
      if (action.type === 'HR_NORMAL') return 'calm'
      return state
    case 'breathing':
      if (action.type === 'BREATHING_COMPLETE') return 'reward'
      return state
    case 'reward':
      if (action.type === 'REWARD_COMPLETE') return 'calm'
      return state
    case 'petted':
      if (action.type === 'PET_COMPLETE') return 'calm'
      return state
  }
}

export function useTurtleState() {
  const [state, dispatch] = useReducer(reducer, 'calm')
  return { state, dispatch }
}
```

- [ ] **Run tests to verify they pass**

```bash
npx vitest run src/hooks/useTurtleState.test.ts
```

Expected: all PASS.

- [ ] **Commit**

```bash
git add src/hooks/useTurtleState.ts src/hooks/useTurtleState.test.ts
git commit -m "feat: add petted state and PET/PET_COMPLETE actions to state machine"
```

---

## Task 2: Freeze navigation during `petted`

**Files:**
- Modify: `src/hooks/useTurtleNavigation.ts` (line 84)

No new test needed — the existing `useTurtleNavigation.test.ts` covers the exported pure helpers. The freeze behaviour is covered by integration (the turtle visibly stops).

- [ ] **Make the change**

In `src/hooks/useTurtleNavigation.ts`, find line 84:

```ts
      if (turtleStateRef.current === 'breathing') return
```

Replace with:

```ts
      if (turtleStateRef.current === 'breathing' || turtleStateRef.current === 'petted') return
```

- [ ] **Run existing tests to confirm nothing broke**

```bash
npx vitest run src/hooks/useTurtleNavigation.test.ts
```

Expected: all PASS.

- [ ] **Commit**

```bash
git add src/hooks/useTurtleNavigation.ts
git commit -m "feat: freeze turtle navigation during petted state"
```

---

## Task 3: `usePetGesture` hook

**Files:**
- Create: `src/hooks/usePetGesture.ts`
- Create: `src/hooks/usePetGesture.test.ts`

- [ ] **Write the failing tests**

```ts
// src/hooks/usePetGesture.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePetGesture } from './usePetGesture'

function makePointerEvent(overrides: Partial<{
  target: Element
  timeStamp: number
  clientX: number
  clientY: number
}> = {}) {
  return {
    target: overrides.target ?? document.createElement('div'),
    timeStamp: overrides.timeStamp ?? 0,
    clientX: overrides.clientX ?? 0,
    clientY: overrides.clientY ?? 0,
  } as unknown as React.PointerEvent<SVGSVGElement>
}

function makeShellSpotTarget() {
  const spot = document.createElement('div')
  spot.id = 'shell-spot'
  return spot
}

describe('usePetGesture', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('calls onPet after 2 taps within window', () => {
    const onPet = vi.fn()
    const { result } = renderHook(() => usePetGesture({ enabled: true, onPet }))

    act(() => {
      result.current.handlePetPointerDown(makePointerEvent({ timeStamp: 0 }))
      result.current.handlePetPointerUp(makePointerEvent({ timeStamp: 100 }))
      result.current.handlePetPointerDown(makePointerEvent({ timeStamp: 500 }))
      result.current.handlePetPointerUp(makePointerEvent({ timeStamp: 600 }))
    })

    expect(onPet).toHaveBeenCalledTimes(1)
  })

  it('does not fire if taps are outside the 1.5s window', () => {
    const onPet = vi.fn()
    const { result } = renderHook(() => usePetGesture({ enabled: true, onPet }))

    act(() => {
      result.current.handlePetPointerDown(makePointerEvent({ timeStamp: 0 }))
      result.current.handlePetPointerUp(makePointerEvent({ timeStamp: 100 }))
    })
    act(() => { vi.advanceTimersByTime(1600) })
    act(() => {
      result.current.handlePetPointerDown(makePointerEvent({ timeStamp: 1700 }))
      result.current.handlePetPointerUp(makePointerEvent({ timeStamp: 1800 }))
    })

    expect(onPet).not.toHaveBeenCalled()
  })

  it('ignores taps on #shell-spot', () => {
    const onPet = vi.fn()
    const { result } = renderHook(() => usePetGesture({ enabled: true, onPet }))
    const spot = makeShellSpotTarget()
    document.body.appendChild(spot)

    act(() => {
      result.current.handlePetPointerDown(makePointerEvent({ target: spot, timeStamp: 0 }))
      result.current.handlePetPointerUp(makePointerEvent({ target: spot, timeStamp: 100 }))
      result.current.handlePetPointerDown(makePointerEvent({ target: spot, timeStamp: 500 }))
      result.current.handlePetPointerUp(makePointerEvent({ target: spot, timeStamp: 600 }))
    })

    expect(onPet).not.toHaveBeenCalled()
    document.body.removeChild(spot)
  })

  it('does not fire when enabled is false', () => {
    const onPet = vi.fn()
    const { result } = renderHook(() => usePetGesture({ enabled: false, onPet }))

    act(() => {
      result.current.handlePetPointerDown(makePointerEvent({ timeStamp: 0 }))
      result.current.handlePetPointerUp(makePointerEvent({ timeStamp: 100 }))
      result.current.handlePetPointerDown(makePointerEvent({ timeStamp: 500 }))
      result.current.handlePetPointerUp(makePointerEvent({ timeStamp: 600 }))
    })

    expect(onPet).not.toHaveBeenCalled()
  })

  it('ignores a tap longer than 300ms (drag/pan motion)', () => {
    const onPet = vi.fn()
    const { result } = renderHook(() => usePetGesture({ enabled: true, onPet }))

    act(() => {
      result.current.handlePetPointerDown(makePointerEvent({ timeStamp: 0 }))
      result.current.handlePetPointerUp(makePointerEvent({ timeStamp: 400 })) // too long
      result.current.handlePetPointerDown(makePointerEvent({ timeStamp: 500 }))
      result.current.handlePetPointerUp(makePointerEvent({ timeStamp: 550 }))
    })

    expect(onPet).not.toHaveBeenCalled()
  })

  it('ignores a tap with too much pointer movement', () => {
    const onPet = vi.fn()
    const { result } = renderHook(() => usePetGesture({ enabled: true, onPet }))

    act(() => {
      result.current.handlePetPointerDown(makePointerEvent({ timeStamp: 0, clientX: 0, clientY: 0 }))
      result.current.handlePetPointerUp(makePointerEvent({ timeStamp: 100, clientX: 50, clientY: 50 })) // moved too far
      result.current.handlePetPointerDown(makePointerEvent({ timeStamp: 500, clientX: 0, clientY: 0 }))
      result.current.handlePetPointerUp(makePointerEvent({ timeStamp: 600, clientX: 0, clientY: 0 }))
    })

    expect(onPet).not.toHaveBeenCalled()
  })
})
```

- [ ] **Run tests to verify they fail**

```bash
npx vitest run src/hooks/usePetGesture.test.ts
```

Expected: FAIL — module not found.

- [ ] **Implement `usePetGesture`**

```ts
// src/hooks/usePetGesture.ts
import { useRef, useCallback, useEffect } from 'react'
import type React from 'react'

const TAP_THRESHOLD = 2
const TAP_WINDOW_MS = 1500
const MAX_MOVEMENT_PX = 10
const MAX_TAP_DURATION_MS = 300

interface UsePetGestureOptions {
  enabled: boolean
  onPet: () => void
}

export function usePetGesture({ enabled, onPet }: UsePetGestureOptions) {
  const tapCountRef = useRef(0)
  const windowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointerDownTimeRef = useRef(0)
  const pointerDownPosRef = useRef({ x: 0, y: 0 })

  const resetWindow = useCallback(() => {
    tapCountRef.current = 0
    if (windowTimerRef.current) {
      clearTimeout(windowTimerRef.current)
      windowTimerRef.current = null
    }
  }, [])

  useEffect(() => () => resetWindow(), [resetWindow])

  const handlePetPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!enabled) return
    if ((e.target as Element).closest('#shell-spot')) return
    pointerDownTimeRef.current = e.timeStamp
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY }
  }, [enabled])

  const handlePetPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!enabled) return
    if ((e.target as Element).closest('#shell-spot')) return

    const duration = e.timeStamp - pointerDownTimeRef.current
    const dx = e.clientX - pointerDownPosRef.current.x
    const dy = e.clientY - pointerDownPosRef.current.y
    const moved = Math.sqrt(dx * dx + dy * dy)

    if (duration > MAX_TAP_DURATION_MS || moved > MAX_MOVEMENT_PX) return

    tapCountRef.current += 1

    if (tapCountRef.current >= TAP_THRESHOLD) {
      resetWindow()
      onPet()
      return
    }

    if (windowTimerRef.current) clearTimeout(windowTimerRef.current)
    windowTimerRef.current = setTimeout(resetWindow, TAP_WINDOW_MS)
  }, [enabled, onPet, resetWindow])

  return { handlePetPointerDown, handlePetPointerUp }
}
```

- [ ] **Run tests to verify they pass**

```bash
npx vitest run src/hooks/usePetGesture.test.ts
```

Expected: all PASS.

- [ ] **Commit**

```bash
git add src/hooks/usePetGesture.ts src/hooks/usePetGesture.test.ts
git commit -m "feat: add usePetGesture hook for multi-tap detection"
```

---

## Task 4: `useShellShimmer` hook

**Files:**
- Create: `src/hooks/useShellShimmer.ts`
- Create: `src/hooks/useShellShimmer.test.ts`

- [ ] **Write the failing tests**

```ts
// src/hooks/useShellShimmer.test.ts
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
})
```

- [ ] **Run tests to verify they fail**

```bash
npx vitest run src/hooks/useShellShimmer.test.ts
```

Expected: FAIL — module not found.

- [ ] **Implement `useShellShimmer`**

```ts
// src/hooks/useShellShimmer.ts
import { useState, useCallback } from 'react'

const STORAGE_KEY = 'glide:shell-shimmer'
const SHIMMER_DURATION_MS = 30 * 60 * 1000

interface ShimmerStorage {
  scutes: Record<string, number>
}

function loadStorage(): ShimmerStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { scutes: {} }
    return JSON.parse(raw) as ShimmerStorage
  } catch {
    return { scutes: {} }
  }
}

function pruneExpired(data: ShimmerStorage): ShimmerStorage {
  const now = Date.now()
  const scutes: Record<string, number> = {}
  for (const [id, litAt] of Object.entries(data.scutes)) {
    if (now - litAt < SHIMMER_DURATION_MS) scutes[id] = litAt
  }
  return { scutes }
}

export function pickRandomScute(allIds: string[], litIds: Set<string>): string {
  const unlit = allIds.filter(id => !litIds.has(id))
  const pool = unlit.length > 0 ? unlit : allIds
  return pool[Math.floor(Math.random() * pool.length)]
}

export function useShellShimmer(scuteIds: string[]) {
  const [litScutes, setLitScutes] = useState<Set<string>>(() => {
    const data = pruneExpired(loadStorage())
    return new Set(Object.keys(data.scutes))
  })

  const lightRandomScute = useCallback(() => {
    const data = pruneExpired(loadStorage())
    const currentLit = new Set(Object.keys(data.scutes))
    const chosen = pickRandomScute(scuteIds, currentLit)
    const next: ShimmerStorage = {
      scutes: { ...data.scutes, [chosen]: Date.now() }
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
    setLitScutes(new Set(Object.keys(next.scutes)))
  }, [scuteIds])

  return { litScutes, lightRandomScute }
}
```

- [ ] **Run tests to verify they pass**

```bash
npx vitest run src/hooks/useShellShimmer.test.ts
```

Expected: all PASS.

- [ ] **Commit**

```bash
git add src/hooks/useShellShimmer.ts src/hooks/useShellShimmer.test.ts
git commit -m "feat: add useShellShimmer hook with localStorage persistence"
```

---

## Task 5: Scute ID constants (placeholder — filled after SVG editing)

**Files:**
- Create: `src/constants/turtle.ts`

This file needs to exist before wiring, but the IDs are placeholders until SVG editing is done (Task 6).

- [ ] **Create the file with placeholder IDs**

```ts
// src/constants/turtle.ts
// Update these IDs after grouping shell scutes in the SVG (Task 6).
export const SHELL_SCUTE_IDS: string[] = [
  'shell-scute-1',
  'shell-scute-2',
  'shell-scute-3',
  'shell-scute-4',
  'shell-scute-5',
  'shell-scute-6',
]
```

- [ ] **Commit**

```bash
git add src/constants/turtle.ts
git commit -m "feat: add SHELL_SCUTE_IDS constant (placeholder IDs, updated after SVG editing)"
```

---

## Task 6: SVG editing (manual — requires browser devtools)

**Files:**
- Modify: `src/assets/turtle.svg` (manually)

> **This task is done by the human, not by code.** Pause here and complete it before continuing.

**How to do it (same workflow as last time):**

1. Run `npm run dev` and open the app in Chrome/Firefox.
2. Open devtools → Inspector/Elements panel.
3. Locate the `<svg>` element for the turtle.
4. Inside `<g id="shell">`, identify natural scute regions by clicking paths — they'll highlight on the canvas.
5. Select the paths that form each scute region and wrap them in a named group:
   ```svg
   <g id="shell-scute-1">
     <!-- paths you selected -->
   </g>
   ```
   Repeat for each scute (~6–10 total).
6. Find the eye paths and wrap them:
   ```svg
   <g id="eye">
     <!-- eye paths -->
   </g>
   ```
7. Copy the edited SVG source and save it back to `src/assets/turtle.svg`.
8. Update `src/constants/turtle.ts` with the actual IDs you used.

- [ ] **After editing, update the scute IDs constant** in `src/constants/turtle.ts` to match the IDs you assigned.

- [ ] **Commit**

```bash
git add src/assets/turtle.svg src/constants/turtle.ts
git commit -m "feat: group shell scutes and eye in turtle SVG"
```

---

## Task 7: CSS animations

**Files:**
- Modify: `src/components/Turtle/Turtle.css`

> No automated tests for CSS — verify visually in the browser after Task 8.

- [ ] **Add the eye close/open animation**

Append to `src/components/Turtle/Turtle.css`:

```css
/* ── Pet: eye close/open ────────────────────────────── */
#eye {
  transform-origin: center;
}

@keyframes eye-close-open {
  0%   { transform: scaleY(1); }
  15%  { transform: scaleY(0); }
  65%  { transform: scaleY(0); }
  80%  { transform: scaleY(1); }
  100% { transform: scaleY(1); }
}

svg.turtle-petted #eye {
  animation: eye-close-open 2s ease-in-out forwards;
}

/* ── Pet: shell scute shimmer (entrance flash → static glow) ── */
@keyframes scute-shimmer-entrance {
  0%   { filter: brightness(1)   opacity(1); }
  15%  { filter: brightness(2)   opacity(1) hue-rotate(0deg); }
  40%  { filter: brightness(2.2) opacity(1) hue-rotate(120deg); }
  70%  { filter: brightness(1.8) opacity(1) hue-rotate(240deg); }
  100% { filter: brightness(1.4) opacity(1) hue-rotate(60deg); }
}

.shimmer-active {
  animation: scute-shimmer-entrance 2.5s ease-out forwards;
}
```

- [ ] **Commit**

```bash
git add src/components/Turtle/Turtle.css
git commit -m "feat: add eye close/open and shell scute shimmer CSS animations"
```

---

## Task 8: Wire everything in `App.tsx` and `Turtle.tsx`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Turtle/Turtle.tsx`

### App.tsx changes

- [ ] **Add the `petted` auto-return timer and `useShellShimmer` wiring in `App.tsx`**

Add these imports at the top of `src/App.tsx`:

```ts
import { useShellShimmer } from './hooks/useShellShimmer'
import { SHELL_SCUTE_IDS } from './constants/turtle'
```

Inside `App()`, after the existing hooks, add:

```ts
const { litScutes, lightRandomScute } = useShellShimmer(SHELL_SCUTE_IDS)

useEffect(() => {
  if (state !== 'petted') return
  lightRandomScute()
  const id = setTimeout(() => dispatch({ type: 'PET_COMPLETE' }), 2000)
  return () => clearTimeout(id)
}, [state, dispatch, lightRandomScute])
```

Update the `<Turtle>` JSX to pass the new props:

```tsx
<Turtle
  state={state}
  phase={phase}
  glowLevel={glowLevel}
  phaseDuration={phaseDuration}
  heartRate={hr}
  onSpotTap={() => dispatch({ type: 'HOLD_COMPLETE' })}
  onPet={() => dispatch({ type: 'PET' })}
  litScutes={litScutes}
  scuteIds={SHELL_SCUTE_IDS}
  worldX={worldX}
  worldY={worldY}
  facing={facing}
  tilt={tilt}
/>
```

### Turtle.tsx changes

- [ ] **Add new props to `TurtleProps`**

In `src/components/Turtle/Turtle.tsx`, update `TurtleProps`:

```ts
interface TurtleProps {
  state: TurtleState
  phase: Phase
  glowLevel: number
  phaseDuration: number
  heartRate: number
  onSpotTap: () => void
  onPet: () => void
  litScutes: Set<string>
  scuteIds: string[]
  worldX: number
  worldY: number
  facing: Facing
  tilt: number
}
```

- [ ] **Add imports and hook wiring in `Turtle`**

Add import at top of `src/components/Turtle/Turtle.tsx`:

```ts
import { usePetGesture } from '../../hooks/usePetGesture'
```

Inside the `Turtle` function, destructure the new props and add the hook:

```ts
export function Turtle({ state, phase, glowLevel, phaseDuration, heartRate,
  onSpotTap, onPet, litScutes, scuteIds, worldX, worldY, facing, tilt }: TurtleProps) {
```

After the existing `spotTapTimerRef` line, add:

```ts
const { handlePetPointerDown, handlePetPointerUp } = usePetGesture({
  enabled: state === 'calm',
  onPet,
})
```

- [ ] **Apply `turtle-petted` class via effect**

After the existing `useEffect` for state changes, add:

```ts
useEffect(() => {
  const el = svgRef.current
  if (!el) return
  if (state === 'petted') {
    el.classList.add('turtle-petted')
  } else {
    el.classList.remove('turtle-petted')
  }
}, [state])
```

- [ ] **Apply shimmer classes to scute elements via effect**

```ts
useEffect(() => {
  const svg = svgRef.current
  if (!svg) return
  for (const id of scuteIds) {
    const el = svg.querySelector(`#${id}`)
    if (!el) continue
    if (litScutes.has(id)) {
      if (!el.classList.contains('shimmer-active')) {
        el.classList.add('shimmer-active')
      }
    } else {
      el.classList.remove('shimmer-active')
    }
  }
}, [litScutes, scuteIds])
```

- [ ] **Route pointer events through both handlers**

Find the existing `onPointerDown` on the `<svg>` element and update it to call both handlers. Also add `onPointerUp`:

```tsx
<svg
  ref={svgRef}
  onPointerDown={(e) => { handlePointerDown(e); handlePetPointerDown(e) }}
  onPointerUp={handlePetPointerUp}
  // ... rest of existing props
/>
```

- [ ] **Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Run all tests**

```bash
npx vitest run
```

Expected: all PASS.

- [ ] **Commit**

```bash
git add src/App.tsx src/components/Turtle/Turtle.tsx
git commit -m "feat: wire pet gesture, shell shimmer, and petted animation in App and Turtle"
```

---

## Task 9: Visual verification

- [ ] **Start dev server**

```bash
npm run dev
```

- [ ] **Verify the following in the browser:**
  1. With turtle in `calm` state, tap the turtle body (not shell spot) twice quickly — turtle should stop, eye should close and reopen, one shell scute should shimmer
  2. Tapping the shell spot still triggers the breathing exercise, not petting
  3. Tapping during `anxious` / `breathing` / `reward` states does nothing
  4. After ~2s the turtle resumes swimming
  5. Refresh the page — the shimmered scute should still be glowing
  6. The shimmer is a brief entrance flash that settles to a static pearlescent glow (no continuous animation)

- [ ] **Final build + test**

```bash
npm run build && npx vitest run
```

Expected: build succeeds, all tests PASS.

---

## Known dependency

Task 6 (SVG editing) is manual and must be completed before the scute shimmer and eye animation will render correctly. The code in Tasks 1–5 and 7–8 can be built and committed first. After Task 6, update `SHELL_SCUTE_IDS` in `src/constants/turtle.ts` and verify visually.
