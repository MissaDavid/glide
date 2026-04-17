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
  const svgRef = useRef<SVGSVGElement>(null)
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
    <div className="turtle-wrapper">
      <svg
        ref={svgRef}
        className="turtle-svg"
        data-state={state}
        data-phase={phase}
        style={{ '--phase-duration': `${phaseDuration}s`, '--glow-level': glowLevel } as React.CSSProperties}
        viewBox="0 0 200 160"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g id="turtle">
          {/* Glow layer (behind shell) */}
          <ellipse id="glow-layer" cx="100" cy="82" rx="68" ry="54" filter="url(#glow-filter)" />

          {/* Rear flippers (behind shell) */}
          <g id="flipper-rl" style={{ transformOrigin: '82px 94px' }}>
            <ellipse cx="60" cy="108" rx="22" ry="8" fill="#2d7a6a" transform="rotate(25 82 94)" />
          </g>
          <g id="flipper-rr" style={{ transformOrigin: '118px 94px' }}>
            <ellipse cx="140" cy="108" rx="22" ry="8" fill="#2d7a6a" transform="rotate(-25 118 94)" />
          </g>

          {/* Front flippers */}
          <g id="flipper-fl" style={{ transformOrigin: '78px 66px' }}>
            <ellipse cx="50" cy="50" rx="29" ry="9" fill="#2d7a6a" transform="rotate(-35 78 66)" />
          </g>
          <g id="flipper-fr" style={{ transformOrigin: '122px 66px' }}>
            <ellipse cx="150" cy="50" rx="29" ry="9" fill="#2d7a6a" transform="rotate(35 122 66)" />
          </g>

          {/* Shell */}
          <g id="shell">
            <ellipse id="shell-base" cx="100" cy="82" rx="43" ry="35" fill="#2d7a6a" />
            <path
              id="shell-pattern"
              d="M100 50 Q122 64 122 82 Q122 100 100 114 Q78 100 78 82 Q78 64 100 50Z"
              fill="none"
              stroke="#3da890"
              strokeWidth="1.5"
            />
            <line x1="100" y1="50" x2="100" y2="114" stroke="#3da890" strokeWidth="1" opacity="0.5" />
            <line x1="78" y1="82" x2="122" y2="82" stroke="#3da890" strokeWidth="1" opacity="0.5" />
          </g>

          {/* Head */}
          <g id="head" style={{ transformOrigin: '126px 74px' }}>
            <ellipse cx="140" cy="74" rx="15" ry="12" fill="#35896e" />
            <circle cx="146" cy="70" r="2.5" fill="#1a2a22" />
            <circle cx="147" cy="69.5" r="0.8" fill="rgba(255,255,255,0.6)" />
          </g>

          {/* Shell spot — the secret hold trigger */}
          <circle
            id="shell-spot"
            cx="100"
            cy="74"
            r="8"
            fill="rgba(126,207,207,0.2)"
            stroke="rgba(126,207,207,0.45)"
            strokeWidth="1.5"
            onPointerDown={handlePointerDown}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
          />
        </g>
      </svg>
    </div>
  )
}
