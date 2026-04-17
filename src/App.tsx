import { Scene } from './components/Scene/Scene'
import { Turtle } from './components/Turtle/Turtle'

export default function App() {
  return (
    <Scene>
      <Turtle
        state="calm"
        phase="inhale"
        glowLevel={0}
        phaseDuration={4}
        onHoldComplete={() => console.log('held')}
      />
    </Scene>
  )
}
