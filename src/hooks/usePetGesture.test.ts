import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePetGesture } from './usePetGesture'
import type React from 'react'

function makeDownEvent(overrides: Partial<{
  target: Element
  isPrimary: boolean
  clientX: number
  clientY: number
}> = {}): React.PointerEvent<SVGSVGElement> {
  return {
    isPrimary: overrides.isPrimary ?? true,
    clientX: overrides.clientX ?? 0,
    clientY: overrides.clientY ?? 0,
    target: overrides.target ?? document.createElement('path'),
  } as unknown as React.PointerEvent<SVGSVGElement>
}

function fireDocUp(overrides: PointerEventInit = {}) {
  document.dispatchEvent(new PointerEvent('pointerup', {
    isPrimary: true,
    bubbles: false,
    clientX: 0,
    clientY: 0,
    ...overrides,
  }))
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
      result.current.handlePetPointerDown(makeDownEvent())
      fireDocUp()
      result.current.handlePetPointerDown(makeDownEvent())
      fireDocUp()
    })

    expect(onPet).toHaveBeenCalledTimes(1)
  })

  it('does not fire if taps are outside the 1.5s window', () => {
    const onPet = vi.fn()
    const { result } = renderHook(() => usePetGesture({ enabled: true, onPet }))

    act(() => {
      result.current.handlePetPointerDown(makeDownEvent())
      fireDocUp()
    })
    act(() => { vi.advanceTimersByTime(1600) })
    act(() => {
      result.current.handlePetPointerDown(makeDownEvent())
      fireDocUp()
    })

    expect(onPet).not.toHaveBeenCalled()
  })

  it('ignores taps on #shell-spot', () => {
    const onPet = vi.fn()
    const { result } = renderHook(() => usePetGesture({ enabled: true, onPet }))
    const spot = makeShellSpotTarget()
    document.body.appendChild(spot)

    act(() => {
      result.current.handlePetPointerDown(makeDownEvent({ target: spot }))
      fireDocUp()
      result.current.handlePetPointerDown(makeDownEvent({ target: spot }))
      fireDocUp()
    })

    expect(onPet).not.toHaveBeenCalled()
    document.body.removeChild(spot)
  })

  it('does not fire when enabled is false', () => {
    const onPet = vi.fn()
    const { result } = renderHook(() => usePetGesture({ enabled: false, onPet }))

    act(() => {
      result.current.handlePetPointerDown(makeDownEvent())
      fireDocUp()
      result.current.handlePetPointerDown(makeDownEvent())
      fireDocUp()
    })

    expect(onPet).not.toHaveBeenCalled()
  })

  it('ignores a tap longer than 300ms (drag/pan motion)', () => {
    const onPet = vi.fn()
    const { result } = renderHook(() => usePetGesture({ enabled: true, onPet }))

    act(() => { result.current.handlePetPointerDown(makeDownEvent()) })
    // advance time so duration = 400ms > 300ms threshold
    vi.advanceTimersByTime(400)
    act(() => {
      fireDocUp()  // duration = 400ms > 300ms → ignored
      result.current.handlePetPointerDown(makeDownEvent())
      fireDocUp()  // duration = 0ms → valid, but only 1 tap total
    })

    expect(onPet).not.toHaveBeenCalled()
  })

  it('ignores a tap with too much pointer movement', () => {
    const onPet = vi.fn()
    const { result } = renderHook(() => usePetGesture({ enabled: true, onPet }))

    act(() => {
      result.current.handlePetPointerDown(makeDownEvent({ clientX: 0, clientY: 0 }))
      fireDocUp({ clientX: 50, clientY: 50 })  // moved ~70px > 10px limit → ignored
      result.current.handlePetPointerDown(makeDownEvent({ clientX: 0, clientY: 0 }))
      fireDocUp({ clientX: 0, clientY: 0 })     // no movement → valid, but only 1 tap
    })

    expect(onPet).not.toHaveBeenCalled()
  })

  it('does not fire when enabled flips false mid-gesture', () => {
    const onPet = vi.fn()
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => usePetGesture({ enabled, onPet }),
      { initialProps: { enabled: true } }
    )

    act(() => { result.current.handlePetPointerDown(makeDownEvent()) })
    rerender({ enabled: false })
    act(() => { fireDocUp() })

    expect(onPet).not.toHaveBeenCalled()
  })

  it('filters non-primary pointer events (trackpad double-fire)', () => {
    const onPet = vi.fn()
    const { result } = renderHook(() => usePetGesture({ enabled: true, onPet }))

    act(() => {
      result.current.handlePetPointerDown(makeDownEvent({ isPrimary: false }))
      fireDocUp()
      result.current.handlePetPointerDown(makeDownEvent({ isPrimary: false }))
      fireDocUp()
    })

    expect(onPet).not.toHaveBeenCalled()
  })
})
