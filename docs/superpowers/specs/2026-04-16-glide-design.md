# Glide — Design Spec
_2026-04-16_

## Overview

Glide is a React web application featuring a virtual Kemp's Ridley sea turtle as an emotional support companion for a user with anxiety and autism. The experience is a full-viewport animated underwater scene — calm, slow, and predictable — where the turtle actively co-regulates with the user through breathing exercises.

---

## Tech Stack

- **React + Vite**, TypeScript
- **SVG turtle** with CSS transforms (single articulated SVG, no sprite sheets)
- **CSS keyframe animations** for all turtle states and transitions
- **Vitest** for unit testing
- **localStorage** for reward persistence
- No backend — fully client-side

---

## SVG Turtle Structure

A single SVG file with named groups for independent animation:

```
<g id="turtle">
  <g id="shell">
    <path id="shell-base" />
    <path id="shell-pattern" />   <!-- separate layer for glow filter -->
  </g>
  <g id="head" />                 <!-- rotates/extends for surfacing & nudging -->
  <g id="flipper-fl" />           <!-- front-left -->
  <g id="flipper-fr" />           <!-- front-right -->
  <g id="flipper-rl" />           <!-- rear-left -->
  <g id="flipper-rr" />           <!-- rear-right -->
  <circle id="shell-spot" />      <!-- secret hold trigger, subtle pulse -->
  <ellipse id="glow-layer" />     <!-- behind shell, opacity 0 normally -->
</g>
```

Illustration requirement: each major body part must be a separate named group so it can be animated independently via CSS transforms. The shell-spot is a subtle glowing circle whose pulse intensifies in anxious state.

---

## Architecture

### Component Tree

```
App
├── Scene              — underwater world (gradient, surface line, light rays, bubbles)
├── Turtle             — SVG turtle + CSS state classes
├── BreathingRing      — expanding ring + glow overlay, driven by useBreathing
├── HeartRateInput     — modal/popover triggered from HR icon
├── AudioManager       — loads ambient-ocean.mp3 + chime.mp3, respects mute toggle
└── Controls           — sound toggle icon + HR icon (top-right), breathing pattern pill (bottom-center)
```

### Hooks

| Hook | Responsibility |
|---|---|
| `useTurtleState` | State machine: `calm → anxious → breathing → reward` |
| `useBreathing` | Tick-based timing engine for box (4-4-4-4) and 4-7-8 patterns |
| `useHeartRate` | HR value + threshold detection (hardcoded 100 bpm for MVP) |
| `useRewards` | Session count, growth scale, glow level — read/write localStorage |

### Constants

- `breathingPatterns.ts` — phase timing configs for both patterns
- `colors.ts` — design token palette (dark blues, teals)

---

## State Machine

```
calm ──────────────────────────────────────────────┐
  │  hold shell spot (≥1.5s) OR HR > 100 bpm       │
  ▼                                                  │
anxious ────────────────────────────────────────────┤
  │  user holds shell spot to begin                 │
  ▼                                                  │
breathing                                            │
  │  all phases complete                             │
  ▼                                                  │
reward ─────────────────────────────────────────────┘
  (glow plays + chime fires + growth increments → auto-returns to calm)
```

---

## Turtle Animation States

All states are CSS classes on `<g id="turtle">`.

### Calm — `.state-calm`
- Whole turtle: slow vertical drift (translateY, ~6s loop)
- Flippers: lazy rotation on pivot points
- Shell spot: very subtle slow pulse (always visible, low opacity)
- **Ambient surface arc**: every 3–5 minutes (randomized), the turtle makes an unprompted gentle arc up through the surface line, pauses briefly, then dives back. This is Glide breathing naturally — and familiarises the user with the surfacing motion before it's used as an alert.

### Anxious — `.state-anxious`
- Turtle translates up toward the surface line, tilts nose-up ~15°
- Bumps gently against the top of the screen on a slow loop
- Shell spot pulses brighter — inviting the hold gesture
- If sound is on: soft chime to draw attention

### Breathing — `.state-breathing`
- Exercises happen **at the surface** — Glide and the user breathe together
- Turtle rises for inhale, hovers at surface for hold, dives for exhale, hovers for hold
- Phase and seconds remaining driven by `useBreathing`
- BreathingRing SVG fades in at start of breathing state, expands/contracts in sync with turtle movement, fades out on transition to reward
- Glow layer opacity pulses on the Kuon-style soft radiance

### Reward — `.state-reward`
- Turtle returns to center
- Glow layer fades in fully (SVG `<feGaussianBlur>` filter, CSS opacity animation)
- Chime plays at session completion
- After ~3s, auto-transitions back to calm

---

## Interaction

**Step 1 — Triggering support (manual):** Press and hold the glowing shell spot for 1.5 seconds → transitions `calm → anxious`. Shell spot brightens progressively during the hold. (HR threshold also triggers this step automatically.)

**Step 2 — Starting breathing:** Once in anxious state, the turtle nudges at the surface. A second hold of the shell spot (same gesture, same duration) begins the breathing exercise → transitions `anxious → breathing`. The two-step ensures the user consciously opts into the exercise rather than being launched into it.

---

## Scene Composition (MVP)

- Full-viewport dark gradient background (deep navy → teal)
- Subtle horizontal surface line near the top (~20% from top) — a thin luminous gradient
- Ambient slow-drifting bubbles (CSS animation)
- Soft caustic light rays (CSS animation, low opacity)
- Turtle crosses the surface line during ambient breathing arcs and breathing exercises

**Post-MVP additions:** swaying seagrass at bottom, distant fish, richer parallax layers.

---

## Layout

Minimal overlay — scene fills 100% of the viewport.

- **Top-right:** sound toggle icon + HR icon (small, low-opacity, always present)
- **Bottom-center:** breathing pattern selector — a subtle pill toggle between `BOX 4·4·4·4` and `4-7-8`
- No other persistent UI

---

## Audio

| Sound | Trigger |
|---|---|
| `ambient-ocean.mp3` | Loops continuously while sound is on |
| `chime.mp3` | Plays on: anxious state entry (if sound on), breathing phase transitions, session completion |

**Toggle:** Single on/off icon — controls all audio. Off by default, respecting sensory sensitivities.

---

## Heart Rate Input

- Heart icon (top-right) opens a minimal input popover
- Number field: enter BPM manually
- Helper text: *"Do you have a smart watch or a health app?"*
- Threshold: 100 bpm (hardcoded for MVP)
- When HR > threshold and state is `calm` → transitions to `anxious`
- No polling — user updates manually. Web Bluetooth API integration planned post-MVP.

---

## Rewards System

Managed by `useRewards`, persisted to `localStorage`.

| Property | Behaviour |
|---|---|
| `sessionCount` | Increments on each completed breathing session |
| `glowLevel` | Integer 0–5, increments every 5 sessions, affects baseline shell-spot brightness |

On session completion: glow animation plays (~3s), chime fires. Full reward system design (visual growth, achievements, etc.) deferred to post-MVP once the core experience is in place.

---

## Testing

**Unit tests (Vitest):**
- `useBreathing` — phase sequencing and timing for both patterns
- `useTurtleState` — all state transitions including HR threshold trigger
- `useRewards` — localStorage read/write, session count and glow level increments

**Manual:** animation correctness (breathing ring sync, turtle movement, glow) verified during development.

---

## Repository

`git@git.tamplin.family:melissa/glide.git` (Gitea)

---

## Out of Scope (MVP)

- Web Bluetooth / smartwatch HR integration
- Rich scene (seagrass, fish)
- Settings screen (HR threshold, growth reset)
- Multiple users / profiles
