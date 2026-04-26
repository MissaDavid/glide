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

  it('does not fire when enabled flips false mid-gesture', () => {
    const onPet = vi.fn()
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => usePetGesture({ enabled, onPet }),
      { initialProps: { enabled: true } }
    )

    act(() => {
      result.current.handlePetPointerDown(makePointerEvent({ timeStamp: 0 }))
    })
    rerender({ enabled: false })
    act(() => {
      result.current.handlePetPointerUp(makePointerEvent({ timeStamp: 100 }))
    })

    expect(onPet).not.toHaveBeenCalled()
  })
})
