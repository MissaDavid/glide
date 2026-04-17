import { useEffect, useRef, useState } from 'react'
import type { MutableRefObject, RefObject } from 'react'
import type { Vec2 } from './useTurtleNavigation'
import { WORLD_W, WORLD_H, CAMERA_LERP } from '../constants/world'

export function clampCamera(cam: Vec2, worldW: number, worldH: number, vpW: number, vpH: number): Vec2 {
  return {
    x: Math.min(0, Math.max(-(worldW - vpW), cam.x)),
    y: Math.min(0, Math.max(-(worldH - vpH), cam.y)),
  }
}

export function lerpValue(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

type CameraMode = 'follow' | 'free'

interface UseCameraStateOptions {
  turtlePosRef: MutableRefObject<Vec2>
  worldRef: RefObject<HTMLDivElement | null>
}

export function useCameraState({ turtlePosRef, worldRef }: UseCameraStateOptions) {
  const initialCam: Vec2 = {
    x: -(WORLD_W / 2 - window.innerWidth / 2),
    y: -(WORLD_H / 2 - window.innerHeight / 2),
  }

  const modeRef = useRef<CameraMode>('follow')
  const [mode, setModeState] = useState<CameraMode>('follow')
  const targetCamRef = useRef<Vec2>(initialCam)
  const displayCamRef = useRef<Vec2>({ ...initialCam })
  const rafRef = useRef<number | null>(null)

  const setMode = (m: CameraMode) => {
    modeRef.current = m
    setModeState(m)
  }

  const applyDragDelta = (dx: number, dy: number) => {
    if (modeRef.current !== 'free') return
    targetCamRef.current = clampCamera(
      { x: targetCamRef.current.x + dx, y: targetCamRef.current.y + dy },
      WORLD_W, WORLD_H, window.innerWidth, window.innerHeight,
    )
  }

  useEffect(() => {
    function tick() {
      rafRef.current = requestAnimationFrame(tick)

      if (modeRef.current === 'follow') {
        const tp = turtlePosRef.current
        targetCamRef.current = clampCamera(
          { x: -(tp.x - window.innerWidth / 2), y: -(tp.y - window.innerHeight / 2) },
          WORLD_W, WORLD_H, window.innerWidth, window.innerHeight,
        )
      }

      displayCamRef.current = {
        x: lerpValue(displayCamRef.current.x, targetCamRef.current.x, CAMERA_LERP),
        y: lerpValue(displayCamRef.current.y, targetCamRef.current.y, CAMERA_LERP),
      }

      if (worldRef.current) {
        worldRef.current.style.transform =
          `translate(${displayCamRef.current.x}px, ${displayCamRef.current.y}px)`
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [turtlePosRef, worldRef])

  return { mode, setMode, applyDragDelta }
}
