# Pet Turtle — Design Spec

**Date:** 2026-04-20
**Status:** Draft

---

## Summary

Add a "pet" interaction so a friend can show affection to the turtle. Petting is available only when the turtle is calm. It triggers a brief eyes-closed moment, lights up one shell scute with an iridescent shimmer, then the turtle resumes swimming. The shimmer persists across page reloads for 30 minutes.

---

## Gesture

**Type:** 2–3 taps within a 1.5s window  
**Zone:** Anywhere on the turtle body or head, excluding `#shell-spot`  
**Tap definition:** pointerdown → pointerup within ~300ms with minimal pointer movement (so camera panning doesn't count)  
**State gate:** Only fires when `turtleState === 'calm'`

A new hook `usePetGesture` manages the tap counter and window timer. It accepts an `onPet` callback and calls it when the tap threshold is met. The hook is stateless with regard to turtle state — gating is handled by the caller.

---

## State Machine

`TurtleState` gains a new value:

```ts
export type TurtleState = 'calm' | 'anxious' | 'breathing' | 'reward' | 'petted'
```

New action: `PET`

Transitions:
- `calm + PET → petted`
- All other states ignore `PET`
- After 2s, `petted → calm` (driven by a `setTimeout` in the hook or component that dispatches `PET`)

---

## Navigation Freeze

`useTurtleNavigation` already skips its animation tick when `turtleState === 'breathing'`. The same guard is extended:

```ts
if (turtleStateRef.current === 'breathing' || turtleStateRef.current === 'petted') return
```

The turtle resumes swimming naturally when state returns to `calm`.

---

## Petted Animation

Driven entirely by CSS on named SVG elements — no React-rendered particles or bounce physics.

**Sequence (~2s):**

| Time | Event |
|------|-------|
| 0s | State enters `petted`; turtle stops; `turtle-petted` class added to SVG root |
| 0s | Eye close animation begins (`svg.turtle-petted #eye`) |
| ~0.3s | Eye fully closed; chosen scute receives `shimmer-active` class |
| ~1.0s | Eye open animation begins |
| ~1.5s | Eye fully open |
| ~2s | State returns to `calm`; `turtle-petted` class removed; movement resumes |

**Eye animation:** CSS keyframe on `#eye` morphing to a closed-curve shape and back. The `#eye` group will be defined by selecting the relevant SVG paths in the browser devtools.

**Scute shimmer:** The `shimmer-active` class persists on the scute element for 30 minutes (not removed when `petted` ends). CSS keyframe cycles through pearlescent blues, greens, and pinks using `filter: brightness() hue-rotate()`.

---

## Shell Scutes

**SVG editing (manual):** Select shell scute path regions in the browser devtools and wrap them in named groups:

```svg
<g id="shell-scute-1">…paths…</g>
<g id="shell-scute-2">…paths…</g>
<!-- etc., ~6–10 scutes -->
```

Similarly, the eye is grouped:
```svg
<g id="eye">…paths…</g>
```

**Random selection:** Each petting session picks a random scute from those not currently lit. If all scutes are lit, any random scute is chosen (wrap around).

---

## Shell Shimmer Persistence

Managed by a new hook `useShellShimmer`.

**localStorage key:** `glide:shell-shimmer`

**Shape:**
```json
{ "scutes": { "shell-scute-1": 1776731402291, "shell-scute-3": 1776730000000 } }
```

Keys are scute IDs; values are `Date.now()` timestamps of when the scute was lit.

**On load:** Any scute whose timestamp is older than 30 minutes (1 800 000ms) is dropped from state.

**Hook returns:** `litScutes: Set<string>` and `lightScute(id: string): void`.

`Turtle.tsx` applies `shimmer-active` to each element in `litScutes`.

---

## Data Flow

```
usePetGesture        — detects 2–3 taps on body/head (not #shell-spot)
      ↓ onPet()
useTurtleState       — calm + PET → petted → (after 2s) calm
      ↓ state
useTurtleNavigation  — freezes tick when state === 'petted'
useShellShimmer      — on petted entry: picks random unlit scute, writes to localStorage
      ↓ litScutes
Turtle.tsx           — adds turtle-petted class to SVG root
                     — adds shimmer-active class to chosen scute element
                     — CSS drives eye close/open + scute iridescent animation
```

---

## Files Changed

**New:**
- `src/hooks/usePetGesture.ts`
- `src/hooks/useShellShimmer.ts`

**Modified:**
- `src/hooks/useTurtleState.ts` — add `petted` + `PET` action
- `src/hooks/useTurtleNavigation.ts` — freeze tick for `petted`
- `src/components/Turtle/Turtle.tsx` — wire gesture + shimmer hooks, apply CSS classes
- `src/components/Turtle/Turtle.css` — eye animation + scute shimmer keyframes
- `src/assets/turtle.svg` — add `#shell-scute-N` groups + `#eye` group

---

## Known Dependency

SVG editing (shell scutes + eye group) must be completed before the shimmer CSS and eye animation can be written. State machine, gesture hook, and navigation freeze can be built independently first.

---

## Out of Scope

- Petting in `anxious`, `breathing`, or `reward` states
- Sequential scute lighting (lighting is random)
- A "full shell" special state when all scutes are lit (may revisit)
- Bubbles regression (separate bug — investigate independently)
