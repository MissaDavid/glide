import { useEffect, useRef, useCallback } from 'react'
import type { CSSProperties } from 'react'
import type { TurtleState } from '../../hooks/useTurtleState'
import type { Phase } from '../../constants/breathingPatterns'
import type { Facing } from '../../hooks/useTurtleNavigation'
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
  worldX: number
  worldY: number
  facing: Facing
  tilt: number
}

export function Turtle({ state, phase, glowLevel, phaseDuration, onHoldComplete, worldX, worldY, facing, tilt }: TurtleProps) {
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

  const flipScale = facing === 'left' ? -1 : 1

  return (
    <div
      className="turtle-wrapper"
      data-state={state}
      style={{ left: worldX, top: worldY }}
    >
      <div className="turtle-flip" style={{ transform: `scaleX(${flipScale})` }}>
        <div className="turtle-tilt" style={{ transform: `rotate(${tilt}deg)` }}>
        <img
          ref={svgRef}
          src="/turtle.svg"
          className="turtle-svg"
          data-state={state}
          data-phase={phase}
          style={{ '--phase-duration': `${phaseDuration}s`, '--glow-level': glowLevel } as CSSProperties}
          alt="Sea turtle"
          draggable={false}
        />
        </div>
      </div>
      <div
        className="shell-spot-overlay"
        data-no-pan="true"
        onPointerDown={handlePointerDown}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
      />
    </div>
  )
}
