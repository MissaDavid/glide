import { useRef, useCallback } from 'react'

interface UsePointerPanOptions {
  onStart: () => void
  onDelta: (dx: number, dy: number) => void
  shouldIgnore: (target: EventTarget | null) => boolean
}

export function usePointerPan({ onStart, onDelta, shouldIgnore }: UsePointerPanOptions) {
  const dragging = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (shouldIgnore(e.target)) return
    dragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    onStart()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [onStart, shouldIgnore])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !lastPos.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    onDelta(dx, dy)
  }, [onDelta])

  const onPointerUp = useCallback(() => {
    dragging.current = false
    lastPos.current = null
  }, [])

  return { onPointerDown, onPointerMove, onPointerUp }
}
