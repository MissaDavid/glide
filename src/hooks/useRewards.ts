import { useState, useCallback } from 'react'

const STORAGE_KEY = 'glide-rewards'

interface RewardsState {
  sessionCount: number
  glowLevel: number
}

export function computeNextRewards(prev: RewardsState): RewardsState {
  const sessionCount = prev.sessionCount + 1
  const glowLevel = Math.min(5, Math.floor(sessionCount / 5))
  return { sessionCount, glowLevel }
}

function loadRewards(): RewardsState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as RewardsState
  } catch {}
  return { sessionCount: 0, glowLevel: 0 }
}

export function useRewards() {
  const [rewards, setRewards] = useState<RewardsState>(loadRewards)

  const completeSession = useCallback(() => {
    setRewards(prev => {
      const next = computeNextRewards(prev)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  return { ...rewards, completeSession }
}
