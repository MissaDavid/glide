# Shell Spot Interaction — Design Spec

**Date:** 2026-04-19
**Status:** Approved

---

## Summary

Replace the white circle overlay on the turtle's shell with a direct CSS highlight of the `#shell-spot` SVG group. Change the interaction from a 1500ms hold to a simple tap. The spot's glow pulse rhythm is driven by the user's live heart rate.

---

## What Changes

### Removed
- The `.shell-spot-overlay` `<div>` in `Turtle.tsx` and all its CSS rules.
- The hold timer logic (`HOLD_DURATION`, `holdTimerRef`).

### Added
- CSS targeting `#shell-spot` directly for idle glow, tap feedback, and state visibility.
- A `heartRate` prop on `Turtle` (number, bpm), used to set `--pulse-duration` on the SVG root.
- A tap handler wired to the SVG element, filtered to clicks originating within `#shell-spot`.
- The callback prop renamed from `onHoldComplete` to `onTap` (or `onSpotTap`) to reflect the new interaction.

---

## Visual Behaviour

### Idle glow (calm + anxious states)
- `#shell-spot` animates a warm golden brightness pulse using `filter: brightness() drop-shadow()`.
- Animation duration is `--pulse-duration`, set to `${60 / heartRate}s` (clamped to 0.375s–1.5s, i.e. 40–160 bpm).
- In anxious state the rhythm is naturally faster because HR is higher — no separate animation needed.
- In calm state the rhythm is slower and more relaxed.

### Tap feedback
- On tap, a CSS class `spot-tapped` is added to the SVG root and removed after ~1.3s.
- `#shell-spot` plays a teal-white bioluminescent surge: fast rise to a cool bright glow, then a slow fade back to idle (~1.2s total).
- Implemented via a short CSS keyframe on `svg.spot-tapped #shell-spot`.

### Hidden states
- During `breathing` and `reward`, `#shell-spot` has `pointer-events: none` and `opacity: 0` (with a 0.4s fade transition).
- During `calm` and `anxious`, `#shell-spot` has `pointer-events: all` and full visibility.

---

## Interaction

- **Trigger:** `pointerdown` on the SVG element, checked with `event.target.closest('#shell-spot')`.
- **Effect:** fires `onSpotTap()` immediately (no hold timer).
- **Tap class:** added via ref on the SVG element (no React state re-render).

---

## Data Flow

```
useTurtleState → state (calm | anxious | breathing | reward)
useHeartRate   → heartRate (bpm)
               ↓
Turtle.tsx     → --pulse-duration = clamp(60/heartRate, 0.375, 1.5) + "s"
               → --glow-level (existing)
               → data-state (existing)
               → onSpotTap callback (was onHoldComplete)
```

---

## Props Change

```ts
// Before
onHoldComplete: () => void

// After
onSpotTap: () => void
heartRate: number   // bpm, used to derive --pulse-duration
```

All call sites (typically `App.tsx` or the hook wiring) update accordingly.

---

## Files Affected

| File | Change |
|------|--------|
| `src/components/Turtle/Turtle.tsx` | Remove overlay div + hold logic; add `heartRate` prop; add SVG tap handler |
| `src/components/Turtle/Turtle.css` | Remove overlay rules; add `#shell-spot` idle, tap, and visibility rules |
| `src/assets/turtle.svg` | No change — `#shell-spot` group already exists |
| `src/App.tsx` | Pass `hr` (already from `useHeartRate`) as `heartRate={hr}` to `<Turtle>`; rename `onHoldComplete` → `onSpotTap` |
| `src/components/Turtle/Turtle.test.tsx` | Update prop names, add test for spot tap handler |

---

## Out of Scope

- Changing the heart rate source or threshold logic.
- Changing any other turtle states or animations.
- Reward glow wiring (`--glow-level` → `#shell-spot` brightness) — tracked separately.
