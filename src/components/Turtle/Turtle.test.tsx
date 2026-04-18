import { render } from '@testing-library/react'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { JSDOM } from 'jsdom'
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

describe('turtle.svg structure', () => {
  let doc: Document

  beforeAll(() => {
    const svgPath = resolve(__dirname, '../../assets/turtle.svg')
    const svg = readFileSync(svgPath, 'utf-8')
    doc = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document
  })

  const REQUIRED_GROUPS = ['body', 'shell', 'shell-spot', 'head', 'flipper-fl', 'flipper-fr', 'flipper-bl', 'flipper-br']

  test.each(REQUIRED_GROUPS)('has non-empty #%s group', (id) => {
    const group = doc.getElementById(id)
    expect(group).not.toBeNull()
    expect(group!.tagName).toBe('g')
    expect(group!.querySelectorAll('path').length).toBeGreaterThan(0)
  })
})
