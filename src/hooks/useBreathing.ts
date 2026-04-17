import { useState, useEffect } from 'react'
import { BreathingPattern, PatternName, Phase, BREATHING_PATTERNS } from '../constants/breathingPatterns'

export interface BreathingState {
  phase: Phase
  secondsLeft: number
  cycleCount: number
  isComplete: boolean
}

export function computeState(pattern: BreathingPattern, tick: number): BreathingState {
  const cycleDuration = pattern.phases.reduce((sum, p) => sum + p.duration, 0)
  const totalDuration = cycleDuration * pattern.cycles

  if (tick >= totalDuration) {
    const last = pattern.phases[pattern.phases.length - 1]
    return { phase: last.phase, secondsLeft: 0, cycleCount: pattern.cycles, isComplete: true }
  }

  const positionInCycle = tick % cycleDuration
  let remaining = positionInCycle
  let phaseIndex = 0

  for (let i = 0; i < pattern.phases.length; i++) {
    if (remaining < pattern.phases[i].duration) {
      phaseIndex = i
      break
    }
    remaining -= pattern.phases[i].duration
    phaseIndex = i + 1
  }

  const currentPhase = pattern.phases[Math.min(phaseIndex, pattern.phases.length - 1)]
  const secondsLeft = currentPhase.duration - (remaining % currentPhase.duration)

  return {
    phase: currentPhase.phase,
    secondsLeft,
    cycleCount: Math.floor(tick / cycleDuration),
    isComplete: false,
  }
}

export function useBreathing(patternName: PatternName, active: boolean): BreathingState {
  const pattern = BREATHING_PATTERNS[patternName]
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!active) {
      setTick(0)
      return
    }
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [active])

  return computeState(pattern, tick)
}
