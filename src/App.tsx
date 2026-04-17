import { useEffect, useState } from 'react'
import { Scene } from './components/Scene/Scene'
import { Turtle } from './components/Turtle/Turtle'
import { BreathingRing } from './components/BreathingRing/BreathingRing'
import { Controls } from './components/Controls/Controls'
import { useTurtleState } from './hooks/useTurtleState'
import { useBreathing } from './hooks/useBreathing'
import { useHeartRate } from './hooks/useHeartRate'
import { useRewards } from './hooks/useRewards'
import { useAudio } from './hooks/useAudio'
import type { PatternName } from './constants/breathingPatterns'
import { BREATHING_PATTERNS } from './constants/breathingPatterns'

export default function App() {
  const { state, dispatch } = useTurtleState()
  const [pattern, setPattern] = useState<PatternName>('box')
  const { hr, setHr, isExceeded } = useHeartRate(100)
  const { glowLevel, completeSession } = useRewards()
  const { muted, setMuted, playChime } = useAudio()

  const breathingActive = state === 'breathing'
  const { phase, isComplete } = useBreathing(pattern, breathingActive)

  const currentPattern = BREATHING_PATTERNS[pattern]
  const currentPhaseConfig = currentPattern.phases.find(p => p.phase === phase)
  const phaseDuration = currentPhaseConfig?.duration ?? 4

  // HR threshold → trigger anxious
  useEffect(() => {
    if (isExceeded && state === 'calm') {
      dispatch({ type: 'HR_EXCEEDED' })
      playChime()
    }
  }, [isExceeded, state, dispatch, playChime])

  // Breathing complete → reward
  useEffect(() => {
    if (isComplete && state === 'breathing') {
      dispatch({ type: 'BREATHING_COMPLETE' })
      completeSession()
      playChime()
    }
  }, [isComplete, state, dispatch, completeSession, playChime])

  // Reward auto-returns to calm after 3.5s
  useEffect(() => {
    if (state !== 'reward') return
    const id = setTimeout(() => dispatch({ type: 'REWARD_COMPLETE' }), 3500)
    return () => clearTimeout(id)
  }, [state, dispatch])

  // Phase transition chime
  useEffect(() => {
    if (state === 'breathing') playChime()
  }, [phase, state, playChime])

  return (
    <Scene>
      <BreathingRing
        phase={phase}
        phaseDuration={phaseDuration}
        visible={breathingActive}
      />
      <Turtle
        state={state}
        phase={phase}
        glowLevel={glowLevel}
        phaseDuration={phaseDuration}
        onHoldComplete={() => dispatch({ type: 'HOLD_COMPLETE' })}
      />
      <Controls
        muted={muted}
        onToggleMute={() => setMuted(m => !m)}
        hr={hr}
        onHrChange={setHr}
        pattern={pattern}
        onPatternChange={setPattern}
      />
    </Scene>
  )
}
