# Camera & World Navigation — Design Spec

**Date:** 2026-04-17
**Status:** Approved for implementation

---

## Problem

The scene fills the viewport but gives the user no room to explore. On a phone the turtle feels cramped. The user cannot pan, and the turtle has no sense of swimming through space.

---

## Goals

1. The user can pan freely around an underwater world larger than the viewport.
2. A camera follows the turtle by default, keeping it centered on screen.
3. The turtle swims purposefully through the world rather than bobbing in place.

---

## Approach: CSS Transform World Container

All scene content lives inside a `.world` div (~4000×3000 px). The camera is a CSS `transform: translate(camX, camY)` applied to that container. The viewport clips everything outside it. Controls and the re-center button sit in a fixed HUD layer above the world.

This approach preserves all existing CSS animations, React components, and the BreathingRing — they work unchanged relative to the turtle's world position.

---

## World Layout

- **World size:** 4000×3000 px, fixed (no infinite tiling).
- **Background:** `background.svg` tiled to fill the world via CSS `background-repeat`.
- **Bubbles:** Distributed at random world-space positions across the full extent.
- **Turtle spawn:** World center (2000, 1500).
- **Pan clamp:** Camera offset is clamped so the viewport never shows outside the world boundary.

---

## Camera System (`useCameraState`)

The hook owns all camera state:

```
mode: 'follow' | 'free'
targetCam: { x, y }   — where the camera wants to be
displayCam: { x, y }  — what gets rendered (lerps toward targetCam)
```

Each animation frame, `displayCam` interpolates toward `targetCam` at a factor of ~0.06, producing smooth movement whether following the turtle or returning to it after free pan.

**Follow mode:** `targetCam` is recalculated each frame to center the turtle in the viewport:

```
targetCam.x = -(turtle.x - viewport.width  / 2)
targetCam.y = -(turtle.y - viewport.height / 2)
```

**Free mode:** `targetCam` shifts by pointer drag deltas. The user enters free mode the moment they begin dragging the scene. Camera movement stops when the pointer lifts.

**Re-center button:** Hidden while in follow mode. Appears when the user enters free mode. Tapping it returns to follow mode; `targetCam` resumes tracking the turtle.

---

## Pan Gesture (`usePointerPan`)

Pan uses the Pointer Events API (`onPointerDown`, `onPointerMove`, `onPointerUp`), which handles both touch and mouse with the same code path. Scroll wheel does nothing.

The handler ignores events whose target is the turtle's shell overlay or any Controls element, so a tap on the turtle does not start a pan.

---

## Turtle Navigation (`useTurtleNavigation`)

The turtle has a world-space position `(x, y)` tracked in JS. Each frame the hook advances the turtle toward its current waypoint at ~40 px/sec.

The turtle SVG is a 3/4 perspective low-poly illustration (not top-down), so full 360° rotation is not viable — at 180° the tail leads, at 90° the artwork looks flat and wrong. Instead, orientation uses two layers:

- **Horizontal flip** (`scaleX(-1)`) when the horizontal travel component is leftward
- **Banking tilt** (±10–15°, driven by the turn direction) layered on top — consistent with the existing `nudge` and `surface-arc` animations

**Waypoint selection:** Random point within the inner 60% of the world (960–3040 px wide, 720–2280 px tall), keeping the turtle away from the world edge.

**Navigation state machine:**

```
swimming → arrived → rest (2–6 s) → [30% chance: sleep (15–45 s)] → pick waypoint → swimming
```

During sleep the turtle stays in place and the existing `drift` animation keeps it looking alive.

**Breathing pause:** When `state === 'breathing'`, the turtle stops advancing and the navigation state freezes. It resumes from its current position when breathing ends.

The existing CSS animations (`drift`, `nudge`, `surface-arc`, breathing states) apply as local transforms on top of the world position — they remain unchanged.

---

## Component Changes

| File | Change |
|---|---|
| `Scene.tsx` | Adds `.world` container with pointer pan handlers; renders Controls in fixed HUD layer |
| `Scene.css` | World sizing, background tiling, camera transform |
| `useCameraState.ts` | New — camera mode, target/display offsets, rAF loop, clamp logic |
| `useTurtleNavigation.ts` | New — world-space position, waypoints, sleep state, breathing pause |
| `Turtle.tsx` | Receives `worldX` / `worldY` props; positioned absolutely in world space |
| `BreathingRing.tsx` | Co-located with turtle in world space (no logic change) |
| `Controls.tsx` | No logic change; rendered outside `.world` in HUD layer |
| `usePointerPan.ts` | New — extracts raw drag deltas from pointer events; consumed by `useCameraState` |
| `RecenterButton.tsx` | New — small fixed-position button; hidden in follow mode, visible in free mode |
| `App.tsx` | Wires `useTurtleNavigation` and passes position to Turtle and camera |

---

## Out of Scope

- Pinch-to-zoom
- Infinite tiling / endless ocean
- Shell spot interaction redesign (separate task)
