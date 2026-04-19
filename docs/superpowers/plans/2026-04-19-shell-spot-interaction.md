# Shell Spot Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hold+white-circle-overlay interaction with a direct CSS glow on `#shell-spot` driven by live heart rate, triggered by a simple tap.

**Architecture:** The `.shell-spot-overlay` div is removed entirely. CSS targets `#shell-spot` directly inside the SVG for idle pulse, tap surge, and state visibility. A `heartRate` prop feeds `--pulse-duration` to the SVG style. The tap handler lives on the SVG element and filters by `event.target.closest('#shell-spot')`.

**Tech Stack:** React 18, TypeScript, Vite, SVGR (SVG-as-component), Vitest + Testing Library, CSS custom properties + keyframe animations.

**Spec:** `docs/superpowers/specs/2026-04-19-shell-spot-interaction-design.md`

---

### Task 1: Update test fixtures and write failing tests for `heartRate` prop

**Files:**
- Modify: `src/components/Turtle/Turtle.test.tsx`

- [ ] **Step 1: Update `baseProps` and existing CSS-var test**

Open `src/components/Turtle/Turtle.test.tsx`. Make these changes:

```ts
// Replace the baseProps block (lines 7-17) with:
const baseProps = {
  state: 'calm' as const,
  phase: 'inhale' as const,
  glowLevel: 0,
  phaseDuration: 4,
  heartRate: 60,
  onSpotTap: () => {},
  worldX: 0,
  worldY: 0,
  facing: 'right' as const,
  tilt: 0,
}
```

Then update the existing CSS-var test to also assert `--pulse-duration`:

```ts
test('forwards --glow-level, --phase-duration, and --pulse-duration CSS vars to the svg root', () => {
  const { container } = render(<Turtle {...baseProps} glowLevel={0.7} phaseDuration={6} heartRate={80} />)
  const svg = container.querySelector('svg')!
  expect(svg.style.getPropertyValue('--glow-level')).toBe('0.7')
  expect(svg.style.getPropertyValue('--phase-duration')).toBe('6s')
  expect(svg.style.getPropertyValue('--pulse-duration')).toBe('0.75s') // 60/80 = 0.75
})
```

- [ ] **Step 2: Add failing tests for `--pulse-duration` derivation and clamping**

Add a new `describe` block after the existing `'Turtle component'` block:

```ts
describe('--pulse-duration from heartRate', () => {
  test('derives duration from heartRate (60bpm → 1s)', () => {
    const { container } = render(<Turtle {...baseProps} heartRate={60} />)
    const svg = container.querySelector('svg')!
    expect(svg.style.getPropertyValue('--pulse-duration')).toBe('1s')
  })

  test('clamps to 1.5s for very low heartRate (30bpm → would be 2s without clamp)', () => {
    const { container } = render(<Turtle {...baseProps} heartRate={30} />)
    const svg = container.querySelector('svg')!
    expect(svg.style.getPropertyValue('--pulse-duration')).toBe('1.5s')
  })

  test('clamps to 0.375s for very high heartRate (200bpm → would be 0.3s without clamp)', () => {
    const { container } = render(<Turtle {...baseProps} heartRate={200} />)
    const svg = container.querySelector('svg')!
    expect(svg.style.getPropertyValue('--pulse-duration')).toBe('0.375s')
  })
})
```

- [ ] **Step 3: Run tests — confirm failures**

```bash
npx vitest run src/components/Turtle/Turtle.test.tsx
```

Expected: failures mentioning `heartRate` not in props / `--pulse-duration` not found / `onSpotTap` not in props.

---

### Task 2: Add `heartRate` prop and `--pulse-duration` to `Turtle.tsx`

**Files:**
- Modify: `src/components/Turtle/Turtle.tsx`

- [ ] **Step 1: Add `heartRate` to `TurtleProps` and rename callback**

In `src/components/Turtle/Turtle.tsx`, replace the interface and constants:

```ts
// Remove this constant — hold duration no longer needed:
// const HOLD_DURATION = 1500

// Update interface:
interface TurtleProps {
  state: TurtleState
  phase: Phase
  glowLevel: number
  phaseDuration: number
  heartRate: number
  onSpotTap: () => void
  worldX: number
  worldY: number
  facing: Facing
  tilt: number
}
```

- [ ] **Step 2: Add `--pulse-duration` to the SVG style object**

In the component function, replace the destructure and style object:

```ts
// Destructure (update onHoldComplete → onSpotTap, add heartRate):
export function Turtle({ state, phase, glowLevel, phaseDuration, heartRate, onSpotTap, worldX, worldY, facing, tilt }: TurtleProps) {
```

Add a helper above the return statement (inside the component):

```ts
const pulseDuration = `${Math.min(1.5, Math.max(0.375, 60 / heartRate)).toFixed(3).replace(/\.?0+$/, '')}s`
```

> Note: `.toFixed(3).replace(/\.?0+$/, '')` produces clean strings: `1s`, `0.75s`, `1.5s`, `0.375s` — no trailing zeros.

Update the SVG style object:

```ts
style={{
  '--phase-duration': `${phaseDuration}s`,
  '--glow-level': glowLevel,
  '--pulse-duration': pulseDuration,
} as CSSProperties}
```

- [ ] **Step 3: Run tests — Task 1 tests should now pass**

```bash
npx vitest run src/components/Turtle/Turtle.test.tsx
```

Expected: the `--pulse-duration` and prop-rename tests pass. Tap interaction tests don't exist yet.

- [ ] **Step 4: Commit**

```bash
git add src/components/Turtle/Turtle.tsx src/components/Turtle/Turtle.test.tsx
git commit -m "feat: add heartRate prop and --pulse-duration CSS var to Turtle"
```

---

### Task 3: Write failing tests for tap interaction

**Files:**
- Modify: `src/components/Turtle/Turtle.test.tsx`

- [ ] **Step 1: Add import for `fireEvent` and `vi`**

At the top of `Turtle.test.tsx`, ensure these imports exist (add if missing):

```ts
import { render, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
```

- [ ] **Step 2: Add tap interaction tests**

Add a new describe block after the `--pulse-duration` tests:

```ts
describe('shell spot tap interaction', () => {
  test('fires onSpotTap when #shell-spot is tapped', () => {
    const onSpotTap = vi.fn()
    const { container } = render(<Turtle {...baseProps} onSpotTap={onSpotTap} />)
    const shellSpot = container.querySelector('#shell-spot')!
    expect(shellSpot).toBeInTheDocument()
    fireEvent.pointerDown(shellSpot)
    expect(onSpotTap).toHaveBeenCalledTimes(1)
  })

  test('does not fire onSpotTap when tapping outside #shell-spot', () => {
    const onSpotTap = vi.fn()
    const { container } = render(<Turtle {...baseProps} onSpotTap={onSpotTap} />)
    const svg = container.querySelector('svg')!
    fireEvent.pointerDown(svg) // target is svg itself, not inside #shell-spot
    expect(onSpotTap).not.toHaveBeenCalled()
  })

  test('adds spot-tapped class to svg on tap and removes it after 1300ms', () => {
    vi.useFakeTimers()
    const { container } = render(<Turtle {...baseProps} />)
    const shellSpot = container.querySelector('#shell-spot')!
    const svg = container.querySelector('svg')!
    fireEvent.pointerDown(shellSpot)
    expect(svg.classList.contains('spot-tapped')).toBe(true)
    vi.advanceTimersByTime(1300)
    expect(svg.classList.contains('spot-tapped')).toBe(false)
    vi.useRealTimers()
  })
})
```

- [ ] **Step 3: Run tests — confirm failures**

```bash
npx vitest run src/components/Turtle/Turtle.test.tsx
```

Expected: three new tap tests fail — `onSpotTap` is not called / class not toggled yet.

---

### Task 4: Replace hold logic with tap handler in `Turtle.tsx`

**Files:**
- Modify: `src/components/Turtle/Turtle.tsx`

- [ ] **Step 1: Remove hold timer, add spot-tap timer ref**

Remove `holdTimerRef` and `HOLD_DURATION`. Add a timer ref for the spot-tapped class cleanup:

```ts
// Remove: const HOLD_DURATION = 1500  (already done in Task 2)
// Remove: const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

// Add alongside arcTimerRef:
const spotTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
```

- [ ] **Step 2: Remove old handlers, add tap handler**

Remove `handlePointerDown` and `cancelHold`. Replace with:

```ts
const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
  if (!(e.target as Element).closest('#shell-spot')) return
  onSpotTap()
  const el = svgRef.current
  if (!el) return
  el.classList.remove('spot-tapped')
  void el.offsetWidth // force reflow so animation restarts on rapid taps
  el.classList.add('spot-tapped')
  if (spotTapTimerRef.current) clearTimeout(spotTapTimerRef.current)
  spotTapTimerRef.current = setTimeout(() => {
    el.classList.remove('spot-tapped')
    spotTapTimerRef.current = null
  }, 1300)
}, [onSpotTap])
```

- [ ] **Step 3: Clean up spotTapTimer on unmount**

In the existing `useEffect` cleanup (the one for `arcTimerRef`), add:

```ts
return () => {
  if (arcTimerRef.current) clearTimeout(arcTimerRef.current)
  if (spotTapTimerRef.current) clearTimeout(spotTapTimerRef.current)
}
```

- [ ] **Step 4: Update SVG element — remove overlay event props, add tap handler**

The `<TurtleSVG>` element should now have `onPointerDown`:

```tsx
<TurtleSVG
  ref={svgRef}
  className="turtle-svg"
  data-state={state}
  data-phase={phase}
  style={{
    '--phase-duration': `${phaseDuration}s`,
    '--glow-level': glowLevel,
    '--pulse-duration': pulseDuration,
  } as CSSProperties}
  aria-label="Sea turtle"
  onPointerDown={handlePointerDown}
/>
```

- [ ] **Step 5: Remove the `.shell-spot-overlay` div from JSX**

Delete these lines from the return:

```tsx
// Remove entirely:
<div
  className="shell-spot-overlay"
  data-no-pan="true"
  onPointerDown={handlePointerDown}
  onPointerUp={cancelHold}
  onPointerLeave={cancelHold}
/>
```

The full return should now be:

```tsx
return (
  <div
    className="turtle-wrapper"
    data-state={state}
    style={{ left: worldX, top: worldY }}
  >
    <div className="turtle-flip" style={{ transform: `scaleX(${flipScale})` }}>
      <div className="turtle-tilt" style={{ transform: `rotate(${tilt}deg)` }}>
        <TurtleSVG
          ref={svgRef}
          className="turtle-svg"
          data-state={state}
          data-phase={phase}
          style={{
            '--phase-duration': `${phaseDuration}s`,
            '--glow-level': glowLevel,
            '--pulse-duration': pulseDuration,
          } as CSSProperties}
          aria-label="Sea turtle"
          onPointerDown={handlePointerDown}
        />
      </div>
    </div>
  </div>
)
```

- [ ] **Step 6: Run tests — Task 3 tests should now pass**

```bash
npx vitest run src/components/Turtle/Turtle.test.tsx
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/Turtle/Turtle.tsx src/components/Turtle/Turtle.test.tsx
git commit -m "feat: replace hold interaction with tap on #shell-spot"
```

---

### Task 5: Update CSS — remove overlay rules, add `#shell-spot` glow

**Files:**
- Modify: `src/components/Turtle/Turtle.css`

- [ ] **Step 1: Remove all shell-spot-overlay CSS**

Delete these blocks from `Turtle.css` entirely:

```css
/* Remove: */
/* Interactive overlay positioned over the shell */
.shell-spot-overlay { … }

.turtle-wrapper[data-state='anxious'] .shell-spot-overlay { … }

.turtle-wrapper[data-state='breathing'] .shell-spot-overlay,
.turtle-wrapper[data-state='reward'] .shell-spot-overlay { … }

@keyframes spot-pulse { … }

@keyframes spot-pulse-bright { … }
```

- [ ] **Step 2: Add `#shell-spot` idle glow and visibility rules**

Append to `Turtle.css`:

```css
/* ── Shell spot — idle glow (calm + anxious) ─────── */
svg.turtle-svg[data-state='calm'] #shell-spot,
svg.turtle-svg[data-state='anxious'] #shell-spot {
  animation: shell-spot-pulse var(--pulse-duration, 1s) ease-in-out infinite;
  cursor: pointer;
}

@keyframes shell-spot-pulse {
  0%, 100% { filter: brightness(1)    drop-shadow(0 0 4px  rgba(200, 190, 80, 0.2)); }
  50%       { filter: brightness(1.35) drop-shadow(0 0 14px rgba(220, 210, 100, 0.7)); }
}

/* ── Shell spot — tap feedback ────────────────────── */
svg.turtle-svg.spot-tapped #shell-spot {
  animation: shell-spot-tap 1.2s ease-out forwards;
}

@keyframes shell-spot-tap {
  0%   { filter: brightness(2)   drop-shadow(0 0 20px rgba(160, 210, 220, 0.9)); }
  40%  { filter: brightness(1.6) drop-shadow(0 0 16px rgba(140, 200, 210, 0.6)); }
  100% { filter: brightness(1)   drop-shadow(0 0 4px  rgba(200, 190, 80,  0.2)); }
}

/* ── Shell spot — hidden during active session ───── */
svg.turtle-svg[data-state='breathing'] #shell-spot,
svg.turtle-svg[data-state='reward'] #shell-spot {
  opacity: 0;
  pointer-events: none;
  animation: none;
  transition: opacity 0.4s ease;
}
```

- [ ] **Step 3: Run tests + build to verify nothing broken**

```bash
npx vitest run src/components/Turtle/Turtle.test.tsx && npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/Turtle/Turtle.css
git commit -m "feat: replace overlay CSS with direct #shell-spot glow animation"
```

---

### Task 6: Wire `heartRate` prop in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Pass `hr` and rename callback on `<Turtle>`**

In `src/App.tsx`, update the `<Turtle>` JSX:

```tsx
<Turtle
  state={state}
  phase={phase}
  glowLevel={glowLevel}
  phaseDuration={phaseDuration}
  heartRate={hr}
  onSpotTap={() => dispatch({ type: 'HOLD_COMPLETE' })}
  worldX={worldX}
  worldY={worldY}
  facing={facing}
  tilt={tilt}
/>
```

> `hr` is already available in `App.tsx` from `useHeartRate()` — no new imports needed.

- [ ] **Step 2: Run full test suite and build**

```bash
npm run build && npx vitest run
```

Expected: all tests pass, TypeScript build clean.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire heartRate into Turtle for HR-driven shell spot pulse"
```

---

### Task 7: Manual visual verification

> CSS opacity, pointer-events, and animation cannot be tested in jsdom. Verify these manually.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open `http://localhost:5173`.

- [ ] **Step 2: Verify idle glow**

Set HR to 60bpm in the UI controls. The shell spot (upper-left area of the shell) should show a slow warm golden pulse. The white circle ring should be gone.

- [ ] **Step 3: Verify HR-driven rhythm**

Increase HR to 100bpm. The pulse should visibly speed up. Decrease to 40bpm — it should slow to 1.5s cycle.

- [ ] **Step 4: Verify tap feedback**

Click the shell spot. The spot should flash teal-white and fade back over ~1.2s. The breathing session should trigger immediately (no hold required).

- [ ] **Step 5: Verify state visibility**

Once breathing starts, the shell spot should fade out and become non-interactive. After the session ends (reward state clears), it should fade back in.

- [ ] **Step 6: Verify flip tracking**

Navigate the turtle to face left. The shell spot glow should stay on the shell, not drift to the wrong side.

---

### Task 8: Final checks and push

- [ ] **Step 1: Run full suite one more time**

```bash
npm run build && npx vitest run
```

Expected: clean build, all tests green.

- [ ] **Step 2: Update project memory**

Update `docs/superpowers/specs/2026-04-19-shell-spot-interaction-design.md` status to `Implemented`.
