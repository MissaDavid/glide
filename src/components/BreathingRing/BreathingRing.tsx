import { useState, useEffect } from 'react'
import './BreathingRing.css'
import type { Phase } from '../../constants/breathingPatterns'

interface BreathingRingProps {
  phase: Phase
  phaseDuration: number
  visible: boolean
}

export function BreathingRing({ phase, phaseDuration, visible }: BreathingRingProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!visible) { setReady(false); return }
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [visible])

  if (!visible) return null

  const isHold = phase === 'hold-in' || phase === 'hold-out'
  const expandedPhase = phase === 'inhale' || phase === 'hold-in'
  const scale = ready && expandedPhase ? 1.35 : 0.85
  const transitionDuration = isHold ? 0.3 : phaseDuration

  return (
    <div className="breathing-ring-wrapper" data-phase={phase}>
      <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg">
        <circle
          className="breathing-ring-circle"
          cx="140"
          cy="140"
          r="110"
          fill="none"
          stroke="rgba(126, 207, 207, 0.25)"
          strokeWidth="2"
          style={{
            transform: `scale(${scale})`,
            transition: `transform ${transitionDuration}s ease-in-out`,
          }}
        />
        <circle
          className="breathing-ring-circle"
          cx="140"
          cy="140"
          r="125"
          fill="none"
          stroke="rgba(126, 207, 207, 0.1)"
          strokeWidth="1"
          style={{
            transform: `scale(${scale})`,
            transition: `transform ${isHold ? transitionDuration : transitionDuration * 1.1}s ease-in-out`,
          }}
        />
      </svg>
    </div>
  )
}
