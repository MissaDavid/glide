import { useState, useEffect, useRef, useCallback } from 'react'

export function useAudio() {
  const [muted, setMuted] = useState(true)
  const ambientRef = useRef<HTMLAudioElement | null>(null)
  const chimeRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const ambient = new Audio('/audio/ambient-ocean.mp3')
    ambient.loop = true
    ambient.volume = 0.25
    ambientRef.current = ambient

    const chime = new Audio('/audio/chime.mp3')
    chime.volume = 0.55
    chimeRef.current = chime

    return () => {
      ambient.pause()
    }
  }, [])

  useEffect(() => {
    const ambient = ambientRef.current
    if (!ambient) return
    if (muted) {
      ambient.pause()
    } else {
      ambient.play().catch(() => {})
    }
  }, [muted])

  const playChime = useCallback(() => {
    if (muted) return
    const chime = chimeRef.current
    if (!chime) return
    chime.currentTime = 0
    chime.play().catch(() => {})
  }, [muted])

  return { muted, setMuted, playChime }
}
