import { describe, it, expect, vi } from 'vitest'
import type { PointerEvent } from 'react'
import { renderHook } from '@testing-library/react'
import { usePointerPan } from './usePointerPan'

function makePointerEvent(x: number, y: number, target?: Element): PointerEvent {
  const el = target ?? document.createElement('div')
  ;(el as HTMLElement).setPointerCapture = vi.fn()
  return { clientX: x, clientY: y, target: el, currentTarget: el, pointerId: 1 } as unknown as PointerEvent
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
