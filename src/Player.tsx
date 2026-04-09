import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Outlines } from '@react-three/drei'
import { useGameStore } from './store'

const LANE_WIDTH = 3
const JUMP_VELOCITY = 15
const GRAVITY = -40

export const playerBox = new THREE.Box3()

export function Player() {
  const playerRef = useRef<THREE.Group>(null)
  const targetX = useRef(0)
  const velocityY = useRef(0)
  const isJumping = useRef(false)
  const isDucking = useRef(false)
  const duckTimer = useRef(0)
  
  const { gameState } = useGameStore()

  const moveLeft = () => {
    if (useGameStore.getState().gameState === 'playing' && targetX.current > -LANE_WIDTH) targetX.current -= LANE_WIDTH
  }
  const moveRight = () => {
    if (useGameStore.getState().gameState === 'playing' && targetX.current < LANE_WIDTH) targetX.current += LANE_WIDTH
  }
  const jump = () => {
    if (useGameStore.getState().gameState === 'playing' && !isJumping.current && !isDucking.current) {
      velocityY.current = JUMP_VELOCITY; isJumping.current = true
    }
  }
  const duck = () => {
    if (useGameStore.getState().gameState === 'playing' && !isJumping.current) {
      isDucking.current = true; duckTimer.current = 0.8
    }
  }

  // Direct window keydown — reliable regardless of canvas focus
  // Also supports WASD keys
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':  case 'a': case 'A': moveLeft();  break
        case 'ArrowRight': case 'd': case 'D': moveRight(); break
        case 'ArrowUp':    case 'w': case 'W': case ' ':    jump(); break
        case 'ArrowDown':  case 's': case 'S':              duck(); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const characterGroupRef = useRef<THREE.Group>(null)
  const leftArmRef = useRef<THREE.Mesh>(null)
  const rightArmRef = useRef<THREE.Mesh>(null)
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!playerRef.current || gameState !== 'playing') return

    playerRef.current.position.x = THREE.MathUtils.lerp(playerRef.current.position.x, targetX.current, delta * 15)

    if (isJumping.current) {
      velocityY.current += GRAVITY * delta
      playerRef.current.position.y += velocityY.current * delta
      if (playerRef.current.position.y <= 0) {
        playerRef.current.position.y = 0
        isJumping.current = false
        velocityY.current = 0
      }
    }

    if (isDucking.current) {
      duckTimer.current -= delta
      if (duckTimer.current <= 0) {
        isDucking.current = false
      }
    }

    if (characterGroupRef.current) {
      if (isDucking.current) {
        characterGroupRef.current.scale.lerp(new THREE.Vector3(1.2, 0.5, 1.2), delta * 15)
        characterGroupRef.current.position.y = THREE.MathUtils.lerp(characterGroupRef.current.position.y, -0.3, delta * 15)
      } else {
        characterGroupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 15)
        characterGroupRef.current.position.y = THREE.MathUtils.lerp(characterGroupRef.current.position.y, 0, delta * 15)
        
        if (!isJumping.current && gameState === 'playing') {
          const time = state.clock.elapsedTime
          const runSpeed = 20
          
          characterGroupRef.current.rotation.z = Math.sin(time * 10) * 0.05
          characterGroupRef.current.rotation.y = Math.sin(time * 5) * 0.05
          characterGroupRef.current.position.y = Math.abs(Math.sin(time * runSpeed)) * 0.12

          if (leftArmRef.current && rightArmRef.current && leftLegRef.current && rightLegRef.current) {
            const swingX = Math.sin(time * runSpeed) * 0.8
            leftArmRef.current.rotation.x = swingX - 0.2 // Swing
            rightArmRef.current.rotation.x = -swingX - 0.2 
            leftLegRef.current.rotation.x = -swingX
            rightLegRef.current.rotation.x = swingX
          }
        } else {
          characterGroupRef.current.rotation.z = 0
          characterGroupRef.current.rotation.y = 0
          if (leftArmRef.current && rightArmRef.current && leftLegRef.current && rightLegRef.current) {
             leftArmRef.current.rotation.x = -Math.PI / 4
             rightArmRef.current.rotation.x = -Math.PI / 4
             leftLegRef.current.rotation.x = isJumping.current ? -Math.PI / 6 : 0
             rightLegRef.current.rotation.x = isJumping.current ? Math.PI / 6 : 0
          }
        }
      }
    }

    const currentY = playerRef.current.position.y
    const currentX = playerRef.current.position.x
    const height = isDucking.current ? 0.8 : 1.6
    
    playerBox.set(
      new THREE.Vector3(currentX - 0.5, currentY, -0.5), 
      new THREE.Vector3(currentX + 0.5, currentY + height, 0.5) 
    )
  })

  // Set outline thickness
  const T = 0.03

  return (
    <group ref={playerRef} position={[0, 0, 0]}>
      <group ref={characterGroupRef}>
        {/* Head */}
        <mesh position={[0, 1.25, 0]} castShadow>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshStandardMaterial color="#FFD1B3" />
          <Outlines thickness={T} color="black" />
        </mesh>

        {/* Hair (Black, Buzzcut style on top/back) */}
        <mesh position={[0, 1.45, -0.1]} castShadow>
          <sphereGeometry args={[0.34, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshStandardMaterial color="#111111" />
          <Outlines thickness={T} color="black" />
        </mesh>
        
        {/* Ears */}
        <mesh position={[-0.35, 1.25, 0]} castShadow>
           <sphereGeometry args={[0.1, 16, 16]} />
           <meshStandardMaterial color="#FFD1B3" />
           <Outlines thickness={T} color="black" />
        </mesh>
        <mesh position={[0.35, 1.25, 0]} castShadow>
           <sphereGeometry args={[0.1, 16, 16]} />
           <meshStandardMaterial color="#FFD1B3" />
           <Outlines thickness={T} color="black" />
        </mesh>

        {/* Body (Red Shirt) */}
        <mesh position={[0, 0.75, 0]} castShadow>
          <boxGeometry args={[0.5, 0.6, 0.4]} />
          <meshStandardMaterial color="#EF4444" />
          <Outlines thickness={T} color="black" />
        </mesh>

        {/* Arms */}
        <mesh ref={leftArmRef} position={[-0.35, 0.95, 0]} castShadow>
          <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI / 8]}>
            <cylinderGeometry args={[0.08, 0.08, 0.4]} />
            <meshStandardMaterial color="#FFD1B3" />
            <Outlines thickness={T} color="black" />
          </mesh>
        </mesh>
        <mesh ref={rightArmRef} position={[0.35, 0.95, 0]} castShadow>
          <mesh position={[0, -0.2, 0]} rotation={[0, 0, -Math.PI / 8]}>
            <cylinderGeometry args={[0.08, 0.08, 0.4]} />
            <meshStandardMaterial color="#FFD1B3" />
            <Outlines thickness={T} color="black" />
          </mesh>
        </mesh>
        
        {/* Pants (Yellow) */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.55, 0.25, 0.45]} />
          <meshStandardMaterial color="#FACC15" />
          <Outlines thickness={T} color="black" />
        </mesh>

        {/* Legs with pivot at hips */}
        <group ref={leftLegRef} position={[-0.15, 0.35, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.3]} />
            <meshStandardMaterial color="#FFD1B3" />
            <Outlines thickness={T} color="black" />
          </mesh>
          <mesh position={[0, -0.33, -0.05]} castShadow>
            <boxGeometry args={[0.18, 0.1, 0.25]} />
            <meshStandardMaterial color="#FACC15" />
            <Outlines thickness={T} color="black" />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.15, 0.35, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.3]} />
            <meshStandardMaterial color="#FFD1B3" />
            <Outlines thickness={T} color="black" />
          </mesh>
          <mesh position={[0, -0.33, -0.05]} castShadow>
            <boxGeometry args={[0.18, 0.1, 0.25]} />
            <meshStandardMaterial color="#FACC15" />
            <Outlines thickness={T} color="black" />
          </mesh>
        </group>
      </group>
    </group>
  )
}
