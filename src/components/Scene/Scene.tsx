import './Scene.css'
import type { ReactNode, RefObject, PointerEvent, CSSProperties } from 'react'

const BUBBLES = [
  { left: 150,  size: 5, duration: '9s',  delay: '0s'  },
  { left: 380,  size: 3, duration: '12s', delay: '-3s' },
  { left: 620,  size: 4, duration: '7s',  delay: '-6s' },
  { left: 830,  size: 6, duration: '11s', delay: '-1s' },
  { left: 1030, size: 3, duration: '8s',  delay: '-8s' },
  { left: 1240, size: 4, duration: '13s', delay: '-4s' },
  { left: 1450, size: 5, duration: '9s',  delay: '-2s' },
  { left: 1650, size: 3, duration: '10s', delay: '-5s' },
  { left: 1860, size: 4, duration: '11s', delay: '-7s' },
  { left: 2060, size: 6, duration: '8s',  delay: '-1s' },
  { left: 2270, size: 3, duration: '14s', delay: '-3s' },
  { left: 2480, size: 5, duration: '9s',  delay: '-6s' },
  { left: 2610, size: 4, duration: '7s',  delay: '-4s' },
]

interface SceneProps {
  children: ReactNode
  worldRef: RefObject<HTMLDivElement | null>
  onPointerDown: (e: PointerEvent) => void
  onPointerMove: (e: PointerEvent) => void
  onPointerUp: () => void
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
