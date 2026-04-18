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

  test('forwards data-state to the svg root', () => {
    const { container } = render(<Turtle {...baseProps} state="anxious" />)
    const svg = container.querySelector('svg')!
    expect(svg.dataset.state).toBe('anxious')
  })

  test('forwards data-phase to the svg root', () => {
    const { container } = render(<Turtle {...baseProps} phase="exhale" />)
    const svg = container.querySelector('svg')!
    expect(svg.dataset.phase).toBe('exhale')
  })

  test('forwards --glow-level and --phase-duration CSS vars to the svg root', () => {
    const { container } = render(<Turtle {...baseProps} glowLevel={0.7} phaseDuration={6} />)
    const svg = container.querySelector('svg')!
    expect(svg.style.getPropertyValue('--glow-level')).toBe('0.7')
    expect(svg.style.getPropertyValue('--phase-duration')).toBe('6s')
  })
})

describe('body-part groups accessible in rendered SVG', () => {
  test('renders #flipper-fl group inside svg when calm', () => {
    const { container } = render(<Turtle {...baseProps} state="calm" />)
    expect(container.querySelector('#flipper-fl')).toBeInTheDocument()
  })

  test('renders #flipper-fr group inside svg', () => {
    const { container } = render(<Turtle {...baseProps} />)
    expect(container.querySelector('#flipper-fr')).toBeInTheDocument()
  })

  test('renders #head group inside svg', () => {
    const { container } = render(<Turtle {...baseProps} />)
    expect(container.querySelector('#head')).toBeInTheDocument()
  })

  test('renders #shell group inside svg', () => {
    const { container } = render(<Turtle {...baseProps} />)
    expect(container.querySelector('#shell')).toBeInTheDocument()
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
