import './HeartRateInput.css'

interface HeartRateInputProps {
  hr: number
  onHrChange: (value: number) => void
  onClose: () => void
}

export function HeartRateInput({ hr, onHrChange, onClose }: HeartRateInputProps) {
  return (
    <div className="hr-popover">
      <label>Heart Rate (BPM)</label>
      <input
        className="hr-input"
        type="number"
        min={30}
        max={220}
        value={hr || ''}
        placeholder="72"
        onChange={e => onHrChange(Number(e.target.value))}
        onBlur={onClose}
        autoFocus
      />
      <p className="hr-hint">Do you have a smart watch or a health app?</p>
    </div>
  )
}
