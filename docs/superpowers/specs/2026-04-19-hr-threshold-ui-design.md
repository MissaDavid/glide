# HR Threshold UI — Design Spec

**Date:** 2026-04-19  
**Status:** Approved

## Overview

Replace the hardcoded 100 bpm threshold and manual HR entry with automatic Garmin Connect polling, smart sustained-elevation detection, and a cooldown window to avoid over-nudging an anxious user.

## Goals

- Poll the friend's Garmin Connect heart rate every 60 seconds automatically
- Only trigger the `HR_EXCEEDED` nudge after sustained elevation (5 consecutive readings above threshold)
- Enforce a 30-minute cooldown after a breathing session completes
- Let the threshold be adjusted via the Controls popover (default 110 bpm)
- Remove the "Do you have a smart watch?" hint text from the UI

## Out of Scope

- Push notifications when the app is closed (deferred)
- In-app Garmin OAuth flow for the friend (deferred — credentials set up once by developer via Netlify env vars)
- Spike detection (delta-based nudge) — future exploration

---

## Architecture

```
Garmin Connect API
      ↓
/.netlify/functions/garmin-hr   (Netlify Function)
      ↓  polled every 60s
useHeartRateMonitor()           (React hook — replaces useHeartRate)
      ↓
App.tsx                         (dispatches HR_EXCEEDED / calls startCooldown)
Controls popover                (read-only HR display + threshold stepper)
```

---

## Netlify Function: `/.netlify/functions/garmin-hr`

**Package:** `garmin-connect` (npm, unofficial Garmin Connect client)

**Env vars required (set in Netlify dashboard):**
- `GARMIN_EMAIL`
- `GARMIN_PASSWORD`

**Behaviour:**
- Creates a `GarminConnect` client, authenticates (session may be reused across warm Lambda invocations)
- Fetches today's heart rate data, returns latest measured reading
- Response: `{ hr: number }` — returns `{ hr: 0 }` if no reading available yet today
- On auth or network failure: returns HTTP 500 (hook treats this as a no-op, buffer unchanged)

No persistent state. No Netlify Blobs.

---

## Hook: `useHeartRateMonitor()`

Replaces `useHeartRate`. Manages polling, sustained-elevation detection, cooldown, and threshold configuration.

### State

| Field | Type | Persisted | Default |
|---|---|---|---|
| `readings` | `number[]` | No (session only) | `[]` |
| `threshold` | `number` | `localStorage` | `110` |
| `cooldownUntil` | `number \| null` | `localStorage` | `null` |

### Derived values

| Value | Condition |
|---|---|
| `hr` | `readings.at(-1) ?? 0` |
| `inCooldown` | `cooldownUntil !== null && Date.now() < cooldownUntil` |
| `isExceeded` | `readings.length === 5 && readings.every(r => r > threshold) && !inCooldown` |

### Polling

- `setInterval` every 60 seconds → `fetch('/.netlify/functions/garmin-hr')`
- On success: push result to buffer, cap at 5 entries (drop oldest)
- On error or `hr === 0`: buffer unchanged — no false triggers from network blips

### `startCooldown()`

- Sets `cooldownUntil = Date.now() + 30 * 60 * 1000`
- Persists to `localStorage`
- Clears `readings` buffer (resets sustained-elevation window)

### Exports

```ts
{
  hr: number
  isExceeded: boolean
  inCooldown: boolean
  threshold: number
  setThreshold: (n: number) => void
  startCooldown: () => void
}
```

---

## App.tsx Changes

- Replace `useHeartRate(100)` with `useHeartRateMonitor()`
- Remove `threshold` argument (now managed inside hook)
- `BREATHING_COMPLETE` effect: call `startCooldown()` alongside existing `completeSession()`
- Pass `threshold` and `onThresholdChange` (i.e. `setThreshold`) to `<Controls>`
- Remove `onHrChange` from Controls props (HR is now read-only)

---

## Controls UI: HR Popover Redesign

The `HeartRateInput` component is repurposed from manual entry to a status + settings panel.

**Removed:**
- Manual HR number input
- "Do you have a smart watch or a health app?" hint text

**New layout (Option A — Compact):**

```
┌─────────────────────┐
│        87           │  ← large, amber, read-only
│  BPM · updated 23s ago │
│ ─────────────────── │
│ Nudge above  − 110 +│  ← stepper, step 5, range 50–180
│          bpm · 5 min│
└─────────────────────┘
```

**Threshold stepper:**
- Range: 50–180 bpm
- Step: 5 bpm
- `−` button disabled at 50, `+` button disabled at 180

**Cooldown indicator:** small muted line below threshold row when cooldown is active (e.g. "cooling down · 24 min left"). Remaining minutes derived in the component as `Math.ceil((cooldownUntil - Date.now()) / 60000)`.

---

## Files to Create / Modify

| File | Change |
|---|---|
| `netlify/functions/garmin-hr.ts` | New — Garmin proxy function |
| `src/hooks/useHeartRateMonitor.ts` | New — replaces `useHeartRate` |
| `src/hooks/useHeartRate.ts` | Delete — nothing else references it |
| `src/components/HeartRateInput/HeartRateInput.tsx` | Rewrite — new compact UI |
| `src/components/Controls/Controls.tsx` | Update props (remove `onHrChange`, add `threshold`/`onThresholdChange`) |
| `src/App.tsx` | Swap hook, wire `startCooldown`, update Controls props |
| `package.json` | Add `garmin-connect` dependency |
