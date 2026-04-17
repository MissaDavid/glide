import { useEffect, useRef, useCallback } from 'react'
import type { TurtleState } from '../../hooks/useTurtleState'
import type { Phase } from '../../constants/breathingPatterns'
import './Turtle.css'


const HOLD_DURATION = 1500
const SURFACE_ARC_MIN = 3 * 60 * 1000
const SURFACE_ARC_MAX = 5 * 60 * 1000

interface TurtleProps {
  state: TurtleState
  phase: Phase
  glowLevel: number
  phaseDuration: number
  onHoldComplete: () => void
}

export function Turtle({ state, phase, glowLevel, phaseDuration, onHoldComplete }: TurtleProps) {
  const svgRef = useRef<HTMLImageElement>(null)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const arcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleArc = useCallback(() => {
    const delay = SURFACE_ARC_MIN + Math.random() * (SURFACE_ARC_MAX - SURFACE_ARC_MIN)
    arcTimerRef.current = setTimeout(() => {
      const el = svgRef.current
      if (!el) return
      el.classList.add('surfacing')
      setTimeout(() => {
        el.classList.remove('surfacing')
        scheduleArc()
      }, 7000)
    }, delay)
  }, [])

  useEffect(() => {
    if (state === 'calm') {
      scheduleArc()
    }
    return () => {
      if (arcTimerRef.current) clearTimeout(arcTimerRef.current)
    }
  }, [state, scheduleArc])

  const handlePointerDown = useCallback(() => {
    holdTimerRef.current = setTimeout(onHoldComplete, HOLD_DURATION)
  }, [onHoldComplete])

  const cancelHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }, [])

  return (
    <div className="turtle-wrapper" data-state={state}>
      <img
        ref={svgRef}
        src="/turtle.svg"
        className="turtle-svg"
        data-state={state}
        data-phase={phase}
        style={{ '--phase-duration': `${phaseDuration}s`, '--glow-level': glowLevel } as React.CSSProperties}
        alt="Sea turtle"
        draggable={false}
      />
      <div
        className="shell-spot-overlay"
        onPointerDown={handlePointerDown}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
      />
    </div>
  )
}
