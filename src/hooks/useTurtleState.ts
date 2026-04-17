import { useReducer } from 'react'

export type TurtleState = 'calm' | 'anxious' | 'breathing' | 'reward'

export type TurtleAction =
  | { type: 'HOLD_COMPLETE' }
  | { type: 'HR_EXCEEDED' }
  | { type: 'BREATHING_COMPLETE' }
  | { type: 'REWARD_COMPLETE' }

export function reducer(state: TurtleState, action: TurtleAction): TurtleState {
  switch (state) {
    case 'calm':
      if (action.type === 'HOLD_COMPLETE' || action.type === 'HR_EXCEEDED') return 'anxious'
      return state
    case 'anxious':
      if (action.type === 'HOLD_COMPLETE') return 'breathing'
      return state
    case 'breathing':
      if (action.type === 'BREATHING_COMPLETE') return 'reward'
      return state
    case 'reward':
      if (action.type === 'REWARD_COMPLETE') return 'calm'
      return state
  }
}

export function useTurtleState() {
  const [state, dispatch] = useReducer(reducer, 'calm')
  return { state, dispatch }
}
