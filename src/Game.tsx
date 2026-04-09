import { Canvas } from '@react-three/fiber'
import { UI } from './UI'
import { useGameStore } from './store'
import { Suspense } from 'react'
import { World } from './World'

export function Game() {
  const gameState = useGameStore(state => state.gameState)

  // Use a vibrant, premium sky color
  const skyColor = '#38bdf8' // Tailwind sky-400

  return (
    <>
      <div className="absolute inset-0 z-0" style={{ pointerEvents: 'none' }}>
        <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }} style={{ pointerEvents: gameState === 'playing' ? 'auto' : 'none' }}>
          {/* Seamless infinite horizon trick: match fog and background color */}
          <color attach="background" args={[skyColor]} />
          <fog attach="fog" args={[skyColor, 40, 90]} />
          
          <ambientLight intensity={0.8} color="#ffffff" />
          <directionalLight
            castShadow
            position={[10, 30, 10]}
            intensity={1.0}
            color="#fffbeb"
            shadow-mapSize={[512, 512]}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
            shadow-bias={-0.0001}
          />
          
          <Suspense fallback={null}>
            {gameState === 'playing' && <World />}
          </Suspense>
        </Canvas>
      </div>
      <UI />
    </>
  )
}
