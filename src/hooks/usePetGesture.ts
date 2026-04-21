import { useRef, useCallback, useEffect } from 'react'
import type React from 'react'

const TAP_THRESHOLD = 2
const TAP_WINDOW_MS = 1500
const MAX_MOVEMENT_PX = 10
const MAX_TAP_DURATION_MS = 300

interface UsePetGestureOptions {
  enabled: boolean
  onPet: () => void
}

export function usePetGesture({ enabled, onPet }: UsePetGestureOptions) {
  const tapCountRef = useRef(0)
  const windowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointerDownTimeRef = useRef(0)
  const pointerDownPosRef = useRef({ x: 0, y: 0 })

  const resetWindow = useCallback(() => {
    tapCountRef.current = 0
    if (windowTimerRef.current) {
      clearTimeout(windowTimerRef.current)
      windowTimerRef.current = null
    }
  }, [])

  useEffect(() => () => resetWindow(), [resetWindow])

  const handlePetPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!enabled) return
    if ((e.target as Element).closest('#shell-spot')) return
    pointerDownTimeRef.current = e.timeStamp
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY }
  }, [enabled])

  const handlePetPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!enabled) return
    if ((e.target as Element).closest('#shell-spot')) return

    const duration = e.timeStamp - pointerDownTimeRef.current
    const dx = e.clientX - pointerDownPosRef.current.x
    const dy = e.clientY - pointerDownPosRef.current.y
    const moved = Math.sqrt(dx * dx + dy * dy)

    if (duration > MAX_TAP_DURATION_MS || moved > MAX_MOVEMENT_PX) return

    tapCountRef.current += 1

    if (tapCountRef.current >= TAP_THRESHOLD) {
      resetWindow()
      onPet()
      return
    }

    if (windowTimerRef.current) clearTimeout(windowTimerRef.current)
    windowTimerRef.current = setTimeout(resetWindow, TAP_WINDOW_MS)
  }, [enabled, onPet, resetWindow])

  return { handlePetPointerDown, handlePetPointerUp }
}
