import { useState, useCallback } from 'react'

const STORAGE_KEY = 'glide:shell-shimmer'
const SHIMMER_DURATION_MS = 30 * 60 * 1000

interface ShimmerStorage {
  scutes: Record<string, number>
}

function loadStorage(): ShimmerStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { scutes: {} }
    return JSON.parse(raw) as ShimmerStorage
  } catch {
    return { scutes: {} }
  }
}

function pruneExpired(data: ShimmerStorage): ShimmerStorage {
  const now = Date.now()
  const scutes: Record<string, number> = {}
  for (const [id, litAt] of Object.entries(data.scutes)) {
    if (now - litAt < SHIMMER_DURATION_MS) scutes[id] = litAt
  }
  return { scutes }
}

export function pickRandomScute(allIds: string[], litIds: Set<string>): string {
  const unlit = allIds.filter(id => !litIds.has(id))
  const pool = unlit.length > 0 ? unlit : allIds
  return pool[Math.floor(Math.random() * pool.length)]
}

export function useShellShimmer(scuteIds: string[]) {
  const [litScutes, setLitScutes] = useState<Set<string>>(() => {
    const data = pruneExpired(loadStorage())
    return new Set(Object.keys(data.scutes))
  })

  const lightRandomScute = useCallback(() => {
    const data = pruneExpired(loadStorage())
    const currentLit = new Set(Object.keys(data.scutes))
    const chosen = pickRandomScute(scuteIds, currentLit)
    const next: ShimmerStorage = {
      scutes: { ...data.scutes, [chosen]: Date.now() }
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
    setLitScutes(new Set(Object.keys(next.scutes)))
  }, [scuteIds])

  return { litScutes, lightRandomScute }
}
