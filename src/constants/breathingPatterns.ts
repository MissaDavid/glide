export type PatternName = 'box' | '478'
export type Phase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out'

export interface PhaseConfig {
  phase: Phase
  duration: number
}

export interface BreathingPattern {
  label: string
  phases: PhaseConfig[]
  cycles: number
}

export const BREATHING_PATTERNS: Record<PatternName, BreathingPattern> = {
  box: {
    label: 'BOX 4·4·4·4',
    phases: [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold-in', duration: 4 },
      { phase: 'exhale', duration: 4 },
      { phase: 'hold-out', duration: 4 },
    ],
    cycles: 3,
  },
  '478': {
    label: '4-7-8',
    phases: [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold-in', duration: 7 },
      { phase: 'exhale', duration: 8 },
    ],
    cycles: 2,
  },
}
