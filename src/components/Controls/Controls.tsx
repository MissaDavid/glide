import { useState } from 'react'
import type { PatternName } from '../../constants/breathingPatterns'
import { BREATHING_PATTERNS } from '../../constants/breathingPatterns'
import { HeartRateInput } from '../HeartRateInput/HeartRateInput'
import './Controls.css'

interface ControlsProps {
  muted: boolean
  onToggleMute: () => void
  hr: number
  onHrChange: (value: number) => void
  pattern: PatternName
  onPatternChange: (pattern: PatternName) => void
}

export function Controls({ muted, onToggleMute, hr, onHrChange, pattern, onPatternChange }: ControlsProps) {
  const [hrOpen, setHrOpen] = useState(false)

  return (
    <>
      <div className="controls-top-right">
        <button
          className={`control-icon ${!muted ? 'active' : ''}`}
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '♪'}
        </button>
        <button
          className={`control-icon ${hr > 0 ? 'active' : ''}`}
          onClick={() => setHrOpen(o => !o)}
          aria-label="Heart rate"
        >
          ♥
        </button>
      </div>

      {hrOpen && (
        <HeartRateInput
          hr={hr}
          onHrChange={onHrChange}
          onClose={() => setHrOpen(false)}
        />
      )}

      <div className="pattern-pill">
        {(['box', '478'] as PatternName[]).map(p => (
          <div
            key={p}
            className={`pattern-option ${pattern === p ? 'selected' : ''}`}
            onClick={() => onPatternChange(p)}
          >
            {BREATHING_PATTERNS[p].label}
          </div>
        ))}
      </div>
    </>
  )
}
