import { useCallback, useEffect, useRef, type CSSProperties } from 'react'
import type { TurtleState } from '../../hooks/useTurtleState'
import type { Phase } from '../../constants/breathingPatterns'
import type { Facing } from '../../hooks/useTurtleNavigation'
import TurtleSVG from '../../assets/turtle.svg?react'
import './Turtle.css'

const SURFACE_ARC_MIN = 15_000
const SURFACE_ARC_MAX = 45_000

interface TurtleProps {
  state: TurtleState
  phase: Phase
  glowLevel: number
  phaseDuration: number
  heartRate: number
  onSpotTap: () => void
  worldX: number
  worldY: number
  facing: Facing
  tilt: number
}

export function Turtle({ state, phase, glowLevel, phaseDuration, heartRate, onSpotTap, worldX, worldY, facing, tilt }: TurtleProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const arcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const spotTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const safeBpm = heartRate > 0 ? heartRate : 60
  const pulseDuration = `${parseFloat((Math.min(1.5, Math.max(0.375, 60 / safeBpm))).toFixed(3))}s`

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
    } else {
      // State left calm — cancel any in-flight tap animation immediately so the
      // idle pulse for the new state starts without delay
      const el = svgRef.current
      if (el) el.classList.remove('spot-tapped')
      if (spotTapTimerRef.current) {
        clearTimeout(spotTapTimerRef.current)
        spotTapTimerRef.current = null
      }
    }
    return () => {
      if (arcTimerRef.current) clearTimeout(arcTimerRef.current)
      if (spotTapTimerRef.current) clearTimeout(spotTapTimerRef.current)
    }
  }, [state, scheduleArc])

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!(e.target as Element).closest('#shell-spot')) return
    onSpotTap()
    const el = svgRef.current
    if (!el) return
    el.classList.remove('spot-tapped')
    void el.getBoundingClientRect() // force reflow so animation restarts on rapid taps
    el.classList.add('spot-tapped')
    if (spotTapTimerRef.current) clearTimeout(spotTapTimerRef.current)
    spotTapTimerRef.current = setTimeout(() => {
      el.classList.remove('spot-tapped')
      spotTapTimerRef.current = null
    }, 1300)
  }, [onSpotTap])

  const flipScale = facing === 'left' ? -1 : 1

  return (
    <div
      className="turtle-wrapper"
      data-state={state}
      style={{ left: worldX, top: worldY }}
    >
      <div className="turtle-flip" style={{ transform: `scaleX(${flipScale})` }}>
        <div className="turtle-tilt" style={{ transform: `rotate(${tilt}deg)` }}>
          <TurtleSVG
            ref={svgRef}
            className="turtle-svg"
            data-state={state}
            data-phase={phase}
            style={{
              '--phase-duration': `${phaseDuration}s`,
              '--glow-level': glowLevel,
              '--pulse-duration': pulseDuration,
            } as CSSProperties}
            aria-label="Sea turtle"
            onPointerDown={handlePointerDown}
          />
        </div>
      </div>
    </div>
  )
}
