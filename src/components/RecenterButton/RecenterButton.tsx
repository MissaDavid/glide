import './RecenterButton.css'

interface RecenterButtonProps {
  mode: 'follow' | 'free'
  onRecenter: () => void
}

export function RecenterButton({ mode, onRecenter }: RecenterButtonProps) {
  return (
    <button
      className={`recenter-button ${mode === 'free' ? 'visible' : ''}`}
      onClick={onRecenter}
      aria-label="Re-center on turtle"
    >
      ◎
    </button>
  )
}
