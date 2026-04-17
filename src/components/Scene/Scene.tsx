import './Scene.css'
import type { ReactNode, RefObject, PointerEvent, CSSProperties } from 'react'

const BUBBLES = [
  { left: 200,  size: 5, duration: '9s',  delay: '0s'  },
  { left: 550,  size: 3, duration: '12s', delay: '-3s' },
  { left: 900,  size: 4, duration: '7s',  delay: '-6s' },
  { left: 1200, size: 6, duration: '11s', delay: '-1s' },
  { left: 1500, size: 3, duration: '8s',  delay: '-8s' },
  { left: 1800, size: 4, duration: '13s', delay: '-4s' },
  { left: 2100, size: 5, duration: '9s',  delay: '-2s' },
  { left: 2400, size: 3, duration: '10s', delay: '-5s' },
  { left: 2700, size: 4, duration: '11s', delay: '-7s' },
  { left: 3000, size: 6, duration: '8s',  delay: '-1s' },
  { left: 3300, size: 3, duration: '14s', delay: '-3s' },
  { left: 3600, size: 5, duration: '9s',  delay: '-6s' },
  { left: 3800, size: 4, duration: '7s',  delay: '-4s' },
]

interface SceneProps {
  children: ReactNode
  worldRef: RefObject<HTMLDivElement>
  onPointerDown: (e: PointerEvent) => void
  onPointerMove: (e: PointerEvent) => void
  onPointerUp: (e: PointerEvent) => void
}

export function Scene({ children, worldRef, onPointerDown, onPointerMove, onPointerUp }: SceneProps) {
  return (
    <div
      className="scene"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div ref={worldRef} className="world">
        <div className="world-bubbles">
          {BUBBLES.map((b, i) => (
            <div
              key={i}
              className="bubble"
              style={{
                left: b.left,
                width: b.size,
                height: b.size,
                '--duration': b.duration,
                '--delay': b.delay,
              } as CSSProperties}
            />
          ))}
        </div>
        {children}
      </div>
    </div>
  )
}
