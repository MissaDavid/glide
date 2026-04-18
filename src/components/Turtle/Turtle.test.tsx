import { render } from '@testing-library/react'
import { Turtle } from './Turtle'

const baseProps = {
  state: 'calm' as const,
  phase: 'inhale' as const,
  glowLevel: 0,
  phaseDuration: 4,
  onHoldComplete: () => {},
  worldX: 0,
  worldY: 0,
  facing: 'right' as const,
  tilt: 0,
}

describe('Turtle component', () => {
  test('renders an svg element, not an img', () => {
    const { container } = render(<Turtle {...baseProps} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })
})
