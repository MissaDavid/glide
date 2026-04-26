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
  const enabledRef = useRef(enabled)
  useEffect(() => { enabledRef.current = enabled }, [enabled])

  const tapCountRef = useRef(0)
  const windowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointerDownTimeRef = useRef<number | null>(null)
  const pointerDownPosRef = useRef({ x: 0, y: 0 })
  const docUpListenerRef = useRef<((e: PointerEvent) => void) | null>(null)

  const resetWindow = useCallback(() => {
    tapCountRef.current = 0
    if (windowTimerRef.current) {
      clearTimeout(windowTimerRef.current)
      windowTimerRef.current = null
    }
  }, [])

  useEffect(() => () => {
    resetWindow()
    if (docUpListenerRef.current) {
      document.removeEventListener('pointerup', docUpListenerRef.current)
      docUpListenerRef.current = null
    }
  }, [resetWindow])

  const handlePetPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!enabled) return
    if (!e.isPrimary) return
    if ((e.target as Element).closest('#shell-spot')) return

    pointerDownTimeRef.current = performance.now()
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY }

    // Listen on document so pointerup is caught even if it fires on a parent element
    if (docUpListenerRef.current) {
      document.removeEventListener('pointerup', docUpListenerRef.current)
    }

    const handleDocUp = (upEvent: PointerEvent) => {
      document.removeEventListener('pointerup', handleDocUp)
      docUpListenerRef.current = null

      if (!enabledRef.current) return
      if (pointerDownTimeRef.current === null) return
      if ((upEvent.target as Element | null)?.closest?.('#shell-spot')) return

      const duration = performance.now() - pointerDownTimeRef.current
      pointerDownTimeRef.current = null
      const dx = upEvent.clientX - pointerDownPosRef.current.x
      const dy = upEvent.clientY - pointerDownPosRef.current.y
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
    }

    docUpListenerRef.current = handleDocUp
    document.addEventListener('pointerup', handleDocUp)
  }, [enabled, onPet, resetWindow])

  return { handlePetPointerDown }
}
