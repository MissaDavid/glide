import './Scene.css'

const BUBBLES = [
  { left: '15%', size: 5, duration: '9s', delay: '0s' },
  { left: '28%', size: 3, duration: '12s', delay: '-3s' },
  { left: '42%', size: 4, duration: '7s', delay: '-6s' },
  { left: '57%', size: 6, duration: '11s', delay: '-1s' },
  { left: '70%', size: 3, duration: '8s', delay: '-8s' },
  { left: '83%', size: 4, duration: '13s', delay: '-4s' },
]

interface SceneProps {
  children: React.ReactNode
}

export function Scene({ children }: SceneProps) {
  return (
    <div className="scene">
      <div className="scene-rays" />
      <div className="scene-surface" />
      <div className="scene-bubbles">
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
            } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="scene-content">{children}</div>
    </div>
  )
}
