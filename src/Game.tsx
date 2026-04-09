import { Canvas } from '@react-three/fiber'
import { UI } from './UI'
import { useGameStore } from './store'
import { Suspense } from 'react'
import { World } from './World'
import { SoftShadows } from '@react-three/drei'

export function Game() {
  const gameState = useGameStore(state => state.gameState)

  // Use a vibrant, premium sky color
  const skyColor = '#38bdf8' // Tailwind sky-400

  return (
    <>
      <UI />
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
          {/* Seamless infinite horizon trick: match fog and background color */}
          <color attach="background" args={[skyColor]} />
          <fog attach="fog" args={[skyColor, 40, 90]} />
          
          <SoftShadows size={15} samples={10} focus={0.5} />
          
          <ambientLight intensity={0.8} color="#ffffff" />
          <directionalLight
            castShadow
            position={[10, 30, 10]}
            intensity={1.0}
            color="#fffbeb"
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
            shadow-bias={-0.0001}
          />
          
          <Suspense fallback={null}>
            {gameState === 'playing' && <World />}
          </Suspense>
        </Canvas>
      </div>
    </>
  )
}
