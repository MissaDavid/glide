import { Scene } from './components/Scene/Scene'
import { Turtle } from './components/Turtle/Turtle'
import { BreathingRing } from './components/BreathingRing/BreathingRing'

export default function App() {
  return (
    <Scene>
      <BreathingRing phase="inhale" phaseDuration={4} visible={true} />
      <Turtle
        state="breathing"
        phase="inhale"
        glowLevel={0}
        phaseDuration={4}
        onHoldComplete={() => {}}
      />
    </Scene>
  )
}
