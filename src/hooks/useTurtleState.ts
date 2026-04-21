import { useReducer } from 'react'

export type TurtleState = 'calm' | 'anxious' | 'breathing' | 'reward' | 'petted'

export type TurtleAction =
  | { type: 'HOLD_COMPLETE' }
  | { type: 'HR_EXCEEDED' }
  | { type: 'HR_NORMAL' }
  | { type: 'BREATHING_COMPLETE' }
  | { type: 'REWARD_COMPLETE' }
  | { type: 'PET' }
  | { type: 'PET_COMPLETE' }

export function reducer(state: TurtleState, action: TurtleAction): TurtleState {
  switch (state) {
    case 'calm':
      if (action.type === 'HOLD_COMPLETE' || action.type === 'HR_EXCEEDED') return 'anxious'
      if (action.type === 'PET') return 'petted'
      return state
    case 'anxious':
      if (action.type === 'HOLD_COMPLETE') return 'breathing'
      if (action.type === 'HR_NORMAL') return 'calm'
      return state
    case 'breathing':
      if (action.type === 'BREATHING_COMPLETE') return 'reward'
      return state
    case 'reward':
      if (action.type === 'REWARD_COMPLETE') return 'calm'
      return state
    case 'petted':
      if (action.type === 'PET_COMPLETE') return 'calm'
      return state
  }
}

export function useTurtleState() {
  const [state, dispatch] = useReducer(reducer, 'calm')
  return { state, dispatch }
}
