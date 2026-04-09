import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Player } from './Player'
import { EnvironmentManager } from './EnvironmentManager'
import { useThree } from '@react-three/fiber'

export function World() {
  const worldRef = useRef<THREE.Group>(null)
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 4.5, 9)
    camera.lookAt(0, 1, -10)
  }, [camera])

  return (
    <group ref={worldRef}>
      {/* The environment moves towards the player */}
      <EnvironmentManager />
      {/* The player stays at a fixed z-axis position */}
      <Player />
    </group>
  )
}
