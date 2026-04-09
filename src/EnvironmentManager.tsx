import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Outlines } from '@react-three/drei'
import { useGameStore } from './store'
import { playerBox } from './Player'

const NUM_SEGMENTS = 12
const SEGMENT_LENGTH = 10
const MAX_OBSTACLES = 1
const LANE_WIDTH = 3
const SCENERY_DENSITY = 4

const HOUSE_PALETTES = [
  { wall: '#f5f5f0', roof: '#c0392b' },
  { wall: '#fef9c3', roof: '#0369a1' },
  { wall: '#fce7f3', roof: '#15803d' },
  { wall: '#e0f2fe', roof: '#b45309' },
  { wall: '#f0fdf4', roof: '#7c3aed' },
  { wall: '#fff7ed', roof: '#be123c' },
]

interface Obstacle {
  id: number
  lane: number
  zOffset: number
  type: 'barrier' | 'crates' | 'wall' | 'log' | 'hydrant'
}

interface Coin {
  id: number
  lane: number
  zOffset: number
  height: number   // y position
  collected: boolean
}

interface Scenery {
  id: number
  x: number
  zOffset: number
  type: 'tree' | 'house' | 'lamppost' | 'bench' | 'sunflower' | 'flowers'
  paletteIdx: number
}

interface Segment {
  id: number
  zPos: number
  obstacles: Obstacle[]
  coins: Coin[]
  scenery: Scenery[]
}

const generateObstacles = (): Obstacle[] => {
  const obs: Obstacle[] = []
  if (Math.random() < 0.45) return obs
  const count = Math.floor(Math.random() * MAX_OBSTACLES) + 1
  const types: Obstacle['type'][] = ['barrier', 'crates', 'wall', 'log', 'hydrant']
  for (let i = 0; i < count; i++) {
    obs.push({
      id: Math.random(),
      lane: Math.floor(Math.random() * 3) - 1,
      zOffset: 2 + Math.random() * (SEGMENT_LENGTH - 4),
      type: types[Math.floor(Math.random() * types.length)],
    })
  }
  return obs
}

const generateCoins = (): Coin[] => {
  const coins: Coin[] = []
  const pattern = Math.floor(Math.random() * 4)
  const baseZ = 1.5 + Math.random() * (SEGMENT_LENGTH - 5)

  if (pattern === 0) {
    // Straight line — 4 coins in one lane
    const lane = Math.floor(Math.random() * 3) - 1
    for (let i = 0; i < 4; i++) {
      coins.push({ id: Math.random(), lane, zOffset: baseZ + i * 1.1, height: 0.8, collected: false })
    }
  } else if (pattern === 1) {
    // Arc — 5 coins, middle ones higher
    const lane = Math.floor(Math.random() * 3) - 1
    const heights = [0.7, 1.2, 1.8, 1.2, 0.7]
    for (let i = 0; i < 5; i++) {
      coins.push({ id: Math.random(), lane, zOffset: baseZ + i * 0.9, height: heights[i], collected: false })
    }
  } else if (pattern === 2) {
    // Zigzag across lanes
    const lanes = [-1, 0, 1, 0, -1]
    for (let i = 0; i < 5; i++) {
      coins.push({ id: Math.random(), lane: lanes[i], zOffset: baseZ + i * 1.0, height: 0.8, collected: false })
    }
  } else {
    // Diagonal sweep — left to right
    for (let i = 0; i < 3; i++) {
      coins.push({ id: Math.random(), lane: i - 1, zOffset: baseZ + i * 1.2, height: 0.8, collected: false })
    }
  }
  return coins
}

const generateScenery = (): Scenery[] => {
  const scenery: Scenery[] = []
  const nearTypes: Scenery['type'][] = ['lamppost', 'bench', 'sunflower', 'flowers']
  for (let i = 0; i < 2; i++) {
    const side = i % 2 === 0 ? -1 : 1
    scenery.push({
      id: Math.random(),
      x: side * (5.5 + Math.random() * 1.5),
      zOffset: Math.random() * SEGMENT_LENGTH,
      type: nearTypes[Math.floor(Math.random() * nearTypes.length)],
      paletteIdx: 0,
    })
  }
  for (let i = 0; i < SCENERY_DENSITY; i++) {
    const side = Math.random() > 0.5 ? 1 : -1
    const type = Math.random() > 0.4 ? 'house' : 'tree'
    scenery.push({
      id: Math.random(),
      x: side * (9 + Math.random() * 4),
      zOffset: Math.random() * SEGMENT_LENGTH,
      type,
      paletteIdx: Math.floor(Math.random() * HOUSE_PALETTES.length),
    })
  }
  return scenery
}

// ── Obstacle components ───────────────────────────────────────────────────────

// Traffic barrier (red/white striped road barrier)
function TrafficBarrier() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.6, 0.28, 0.28]} />
        <meshStandardMaterial color="#ef4444" roughness={0.5} />
        <Outlines thickness={0.04} color="black" />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.62, 0.1, 0.3]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {([-0.6, 0.6] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.5, 7]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          <Outlines thickness={0.03} color="black" />
        </mesh>
      ))}
      {/* warning light on top */}
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.1, 7, 6]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

// Stacked wooden crates
function CrateStack() {
  return (
    <group>
      {/* bottom crate */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.9, 0.8, 0.9]} />
        <meshStandardMaterial color="#a16207" roughness={0.9} />
        <Outlines thickness={0.04} color="#78350f" />
      </mesh>
      {/* planks detail */}
      <mesh position={[0, 0.4, 0.46]}>
        <boxGeometry args={[0.9, 0.08, 0.02]} />
        <meshStandardMaterial color="#78350f" roughness={1} />
      </mesh>
      <mesh position={[0, 0.55, 0.46]}>
        <boxGeometry args={[0.9, 0.08, 0.02]} />
        <meshStandardMaterial color="#78350f" roughness={1} />
      </mesh>
      {/* top crate (smaller, offset) */}
      <mesh position={[0.1, 1.15, 0.05]} castShadow>
        <boxGeometry args={[0.75, 0.65, 0.75]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.9} />
        <Outlines thickness={0.04} color="#78350f" />
      </mesh>
    </group>
  )
}

// Stone wall chunk
function StoneWall() {
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.4, 1.1, 0.5]} />
        <meshStandardMaterial color="#78716c" roughness={1} />
        <Outlines thickness={0.04} color="#44403c" />
      </mesh>
      {/* stone texture lines */}
      {([-0.3, 0.3] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.55, 0.26]}>
          <boxGeometry args={[0.04, 1.1, 0.02]} />
          <meshStandardMaterial color="#44403c" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 0.3, 0.26]}>
        <boxGeometry args={[1.4, 0.04, 0.02]} />
        <meshStandardMaterial color="#44403c" roughness={1} />
      </mesh>
      <mesh position={[0, 0.75, 0.26]}>
        <boxGeometry args={[1.4, 0.04, 0.02]} />
        <meshStandardMaterial color="#44403c" roughness={1} />
      </mesh>
    </group>
  )
}

// Rolling log (jump over it)
function RollingLog() {
  return (
    <group>
      <mesh position={[0, 0.28, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 1.6, 10]} />
        <meshStandardMaterial color="#92400e" roughness={0.9} />
        <Outlines thickness={0.04} color="#78350f" />
      </mesh>
      {/* end caps */}
      <mesh position={[0.82, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.06, 10]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <mesh position={[-0.82, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.06, 10]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
    </group>
  )
}

// Fire hydrant (Shinchan-style, duck under or jump over)
function FireHydrant() {
  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.44, 9]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
        <Outlines thickness={0.04} color="black" />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.18, 0.2, 9]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
        <Outlines thickness={0.04} color="black" />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.4} />
      </mesh>
      {/* side nozzles */}
      {([[-0.22, 0.38], [0.22, 0.38]] as [number, number][]).map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.18, 7]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// ── Advanced Coin ─────────────────────────────────────────────────────────────
function CoinMesh({ collected }: { collected: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const ringRef  = useRef<THREE.Mesh>(null)
  const glowRef  = useRef<THREE.Mesh>(null)
  const timeRef  = useRef(Math.random() * Math.PI * 2) // random phase offset

  useFrame((_, delta) => {
    if (!groupRef.current || collected) return
    timeRef.current += delta
    const t = timeRef.current
    // Spin fast
    groupRef.current.rotation.y += delta * 4
    // Bob up and down
    groupRef.current.position.y = Math.sin(t * 2.5) * 0.12
    // Pulse the outer ring
    if (ringRef.current) {
      const s = 1 + Math.sin(t * 4) * 0.08
      ringRef.current.scale.set(s, s, s)
    }
    // Pulse glow opacity
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(t * 5) * 0.3
    }
  })

  if (collected) return null

  return (
    <group ref={groupRef}>
      {/* Outer glow halo */}
      <mesh ref={glowRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.06, 8, 24]} />
        <meshStandardMaterial color="#fde68a" emissive="#fde68a" emissiveIntensity={0.8} transparent opacity={0.7} />
      </mesh>
      {/* Spinning ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.04, 8, 20]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} metalness={1} roughness={0.1} />
      </mesh>
      {/* Main coin face */}
      <mesh castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.1, 18]} />
        <meshStandardMaterial color="#facc15" emissive="#fbbf24" emissiveIntensity={0.35} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Inner emboss circle */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.02, 16]} />
        <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.6} metalness={1} roughness={0.05} />
      </mesh>
      {/* Star shape on top (5 small spheres) */}
      {([0, 1, 2, 3, 4] as number[]).map(i => {
        const angle = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.1, 0.07, Math.sin(angle) * 0.1]}>
            <sphereGeometry args={[0.03, 6, 5]} />
            <meshStandardMaterial color="#fef9c3" emissive="#fef9c3" emissiveIntensity={1} />
          </mesh>
        )
      })}
      {/* Sparkle particles around coin */}
      {([0, 1, 2, 3] as number[]).map(i => {
        const angle = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5]}>
            <sphereGeometry args={[0.025, 5, 4]} />
            <meshStandardMaterial color="#fde68a" emissive="#fde68a" emissiveIntensity={1.5} />
          </mesh>
        )
      })}
    </group>
  )
}

// ── Scenery components ────────────────────────────────────────────────────────
function LampPost() {
  return (
    <group>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 3, 7]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0.3, 3.1, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0.6, 3.2, 0]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshStandardMaterial color="#fef08a" roughness={0.3} emissive="#fef08a" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

function Bench() {
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.2, 0.08, 0.45]} />
        <meshStandardMaterial color="#92400e" roughness={0.9} />
        <Outlines thickness={0.03} color="black" />
      </mesh>
      <mesh position={[0, 0.75, -0.18]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[1.2, 0.35, 0.07]} />
        <meshStandardMaterial color="#92400e" roughness={0.9} />
        <Outlines thickness={0.03} color="black" />
      </mesh>
      {([-0.5, 0.5] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.22, 0]}>
          <boxGeometry args={[0.08, 0.44, 0.4]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Sunflower() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 1.0, 6]} />
        <meshStandardMaterial color="#16a34a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshStandardMaterial color="#facc15" roughness={0.7} />
        <Outlines thickness={0.03} color="black" />
      </mesh>
      <mesh position={[0, 1.07, 0.18]}>
        <sphereGeometry args={[0.1, 7, 6]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <mesh position={[0.12, 0.6, 0]} rotation={[0, 0, -0.6]}>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshStandardMaterial color="#22c55e" roughness={0.8} />
      </mesh>
    </group>
  )
}

function FlowerPatch() {
  const flowers = [
    { x: 0, z: 0, color: '#f472b6' }, { x: 0.4, z: 0.2, color: '#fb923c' },
    { x: -0.3, z: 0.3, color: '#a78bfa' }, { x: 0.2, z: -0.3, color: '#f472b6' },
    { x: -0.4, z: -0.1, color: '#fbbf24' },
  ]
  return (
    <group>
      {flowers.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 5]} />
            <meshStandardMaterial color="#16a34a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.1, 6, 5]} />
            <meshStandardMaterial color={f.color} roughness={0.7} />
            <Outlines thickness={0.03} color="black" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function RoundTree() {
  return (
    <group>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.25, 1.2, 8]} />
        <meshStandardMaterial color="#7a4a1e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.9, 0]} castShadow>
        <sphereGeometry args={[1.1, 8, 7]} />
        <meshStandardMaterial color="#16a34a" roughness={0.8} />
        <Outlines thickness={0.04} color="black" />
      </mesh>
      <mesh position={[0, 2.7, 0]} castShadow>
        <sphereGeometry args={[0.85, 8, 7]} />
        <meshStandardMaterial color="#22c55e" roughness={0.8} />
        <Outlines thickness={0.04} color="black" />
      </mesh>
      <mesh position={[0, 3.3, 0]} castShadow>
        <sphereGeometry args={[0.55, 7, 6]} />
        <meshStandardMaterial color="#4ade80" roughness={0.8} />
        <Outlines thickness={0.04} color="black" />
      </mesh>
    </group>
  )
}

function ShinChanHouse({ wall, roof }: { wall: string; roof: string }) {
  const o = 0.04
  return (
    <group>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[7.2, 0.16, 7.2]} />
        <meshStandardMaterial color="#e8d9a0" roughness={1} />
      </mesh>
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <boxGeometry args={[6.8, 0.12, 6.8]} />
        <meshStandardMaterial color="#5cb85c" roughness={1} />
      </mesh>
      <mesh position={[-2.2, 0.55, 3.2]} castShadow>
        <boxGeometry args={[1.8, 0.7, 0.2]} />
        <meshStandardMaterial color="#e8e0a0" roughness={0.8} />
        <Outlines thickness={o} color="black" />
      </mesh>
      <mesh position={[2.2, 0.55, 3.2]} castShadow>
        <boxGeometry args={[1.8, 0.7, 0.2]} />
        <meshStandardMaterial color="#e8e0a0" roughness={0.8} />
        <Outlines thickness={o} color="black" />
      </mesh>
      <mesh position={[-3.2, 0.55, 0]} castShadow>
        <boxGeometry args={[0.2, 0.7, 6.4]} />
        <meshStandardMaterial color="#e8e0a0" roughness={0.8} />
        <Outlines thickness={o} color="black" />
      </mesh>
      <mesh position={[0, 0.55, -3.2]} castShadow>
        <boxGeometry args={[6.4, 0.7, 0.2]} />
        <meshStandardMaterial color="#e8e0a0" roughness={0.8} />
        <Outlines thickness={o} color="black" />
      </mesh>
      <mesh position={[3.2, 0.55, -0.8]} castShadow>
        <boxGeometry args={[0.2, 0.7, 4.8]} />
        <meshStandardMaterial color="#e8e0a0" roughness={0.8} />
        <Outlines thickness={o} color="black" />
      </mesh>
      <mesh position={[0.4, 0.7, 3.2]} castShadow>
        <boxGeometry args={[1.2, 1.0, 0.15]} />
        <meshStandardMaterial color="#a0724a" roughness={0.9} />
        <Outlines thickness={o} color="black" />
      </mesh>
      <mesh position={[0, 1.3, -0.3]} castShadow receiveShadow>
        <boxGeometry args={[4.8, 2.2, 4.2]} />
        <meshStandardMaterial color={wall} roughness={0.5} />
        <Outlines thickness={o} color="black" />
      </mesh>
      <mesh position={[-1.2, 1.4, 1.82]}>
        <boxGeometry args={[1.0, 1.2, 0.05]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh position={[1.2, 1.4, 1.82]}>
        <boxGeometry args={[1.0, 1.2, 0.05]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh position={[-1.2, 2.1, 2.0]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[1.2, 0.08, 0.5]} />
        <meshStandardMaterial color={roof} roughness={0.6} />
        <Outlines thickness={o} color="black" />
      </mesh>
      <mesh position={[0, 1.1, 1.82]}>
        <boxGeometry args={[1.4, 1.8, 0.05]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh position={[0, 2.5, 0.2]} castShadow>
        <boxGeometry args={[5.8, 0.15, 5.4]} />
        <meshStandardMaterial color={roof} roughness={0.6} />
        <Outlines thickness={o} color="black" />
      </mesh>
      <mesh position={[0, 2.72, 2.6]} rotation={[0.45, 0, 0]} castShadow>
        <boxGeometry args={[5.8, 0.12, 1.2]} />
        <meshStandardMaterial color={roof} roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.72, -2.2]} rotation={[-0.45, 0, 0]} castShadow>
        <boxGeometry args={[5.8, 0.12, 1.2]} />
        <meshStandardMaterial color={roof} roughness={0.6} />
      </mesh>
      <mesh position={[-2.7, 2.72, 0.2]} rotation={[0, 0, 0.45]} castShadow>
        <boxGeometry args={[0.12, 1.2, 5.4]} />
        <meshStandardMaterial color={roof} roughness={0.6} />
      </mesh>
      <mesh position={[2.7, 2.72, 0.2]} rotation={[0, 0, -0.45]} castShadow>
        <boxGeometry args={[0.12, 1.2, 5.4]} />
        <meshStandardMaterial color={roof} roughness={0.6} />
      </mesh>
      <mesh position={[0, 4.0, -0.3]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 1.6, 3.6]} />
        <meshStandardMaterial color={wall} roughness={0.5} />
        <Outlines thickness={o} color="black" />
      </mesh>
      <mesh position={[0, 4.1, 1.52]}>
        <boxGeometry args={[2.8, 1.0, 0.05]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh position={[0, 3.3, 2.1]} castShadow>
        <boxGeometry args={[4.4, 0.1, 0.8]} />
        <meshStandardMaterial color={wall} roughness={0.6} />
        <Outlines thickness={o} color="black" />
      </mesh>
      {([-1.8, -0.9, 0, 0.9, 1.8] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 3.65, 2.45]} castShadow>
          <boxGeometry args={[0.08, 0.6, 0.08]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 3.95, 2.45]} castShadow>
        <boxGeometry args={[4.0, 0.08, 0.08]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
        <Outlines thickness={o} color="black" />
      </mesh>
      <mesh position={[0, 5.0, -0.3]} castShadow>
        <boxGeometry args={[5.0, 0.15, 4.4]} />
        <meshStandardMaterial color={roof} roughness={0.6} />
        <Outlines thickness={o} color="black" />
      </mesh>
      <mesh position={[0, 5.35, 1.8]} rotation={[0.55, 0, 0]} castShadow>
        <boxGeometry args={[5.0, 0.12, 1.8]} />
        <meshStandardMaterial color={roof} roughness={0.6} />
      </mesh>
      <mesh position={[0, 5.35, -2.4]} rotation={[-0.55, 0, 0]} castShadow>
        <boxGeometry args={[5.0, 0.12, 1.8]} />
        <meshStandardMaterial color={roof} roughness={0.6} />
      </mesh>
      <mesh position={[-2.3, 5.35, -0.3]} rotation={[0, 0, 0.55]} castShadow>
        <boxGeometry args={[0.12, 1.8, 4.4]} />
        <meshStandardMaterial color={roof} roughness={0.6} />
      </mesh>
      <mesh position={[2.3, 5.35, -0.3]} rotation={[0, 0, -0.55]} castShadow>
        <boxGeometry args={[0.12, 1.8, 4.4]} />
        <meshStandardMaterial color={roof} roughness={0.6} />
      </mesh>
      {([[3.6, 2.4], [4.8, 2.4], [3.6, 0.8], [4.8, 0.8]] as [number,number][]).map(([px, pz], i) => (
        <mesh key={i} position={[px, 1.0, pz]} castShadow>
          <boxGeometry args={[0.15, 2.0, 0.15]} />
          <meshStandardMaterial color="#e8e0a0" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[4.2, 2.1, 1.6]} castShadow>
        <boxGeometry args={[1.6, 0.12, 2.0]} />
        <meshStandardMaterial color="#00b4c8" roughness={0.5} />
        <Outlines thickness={o} color="black" />
      </mesh>
      <mesh position={[-2.6, 0.5, 2.4]} castShadow>
        <sphereGeometry args={[0.4, 7, 6]} />
        <meshStandardMaterial color="#2d8a2d" roughness={0.9} />
        <Outlines thickness={o} color="black" />
      </mesh>
      <mesh position={[2.2, 1.8, -1.8]} castShadow>
        <sphereGeometry args={[0.7, 8, 7]} />
        <meshStandardMaterial color="#22c55e" roughness={0.8} />
        <Outlines thickness={o} color="black" />
      </mesh>
    </group>
  )
}

// ── Obstacle collision sizes ──────────────────────────────────────────────────
function getObstacleBox(type: Obstacle['type']): { w: number; h: number; d: number; y: number } {
  switch (type) {
    case 'barrier':  return { w: 1.6, h: 0.75, d: 0.4,  y: 0.375 }
    case 'crates':   return { w: 1.0, h: 1.4,  d: 1.0,  y: 0.7   }
    case 'wall':     return { w: 1.4, h: 1.1,  d: 0.6,  y: 0.55  }
    case 'log':      return { w: 1.6, h: 0.56, d: 0.56, y: 0.28  }
    case 'hydrant':  return { w: 0.5, h: 0.7,  d: 0.5,  y: 0.35  }
  }
}

export function EnvironmentManager() {
  const { gameState, incrementScore, endGame, collectCoin } = useGameStore()

  const segDataRef = useRef<Segment[]>(
    Array.from({ length: NUM_SEGMENTS }).map((_, i) => ({
      id: i,
      zPos: -i * SEGMENT_LENGTH,
      obstacles: i === 0 ? [] : generateObstacles(),
      coins: generateCoins(),
      scenery: generateScenery(),
    }))
  )

  const [renderTick, setRenderTick] = useState(0)
  const segGroupRefs = useRef<(THREE.Group | null)[]>(Array(NUM_SEGMENTS).fill(null))

  const materials = useMemo(() => ({
    grass:  new THREE.MeshStandardMaterial({ color: '#4ade80', roughness: 1 }),
    road:   new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.8 }),
    marker: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.5 }),
  }), [])

  const obstacleBox = useMemo(() => new THREE.Box3(), [])
  const coinBox     = useMemo(() => new THREE.Box3(), [])
  const traveledRef = useRef(0)

  useFrame((_, delta) => {
    if (gameState !== 'playing') return

    const spd = useGameStore.getState().speed
    traveledRef.current += spd * delta
    incrementScore(spd * delta * 0.1)

    const traveled = traveledRef.current
    const segs = segDataRef.current
    let needsRerender = false

    for (let i = 0; i < segs.length; i++) {
      const segWorldZ = segs[i].zPos + traveled
      const grp = segGroupRefs.current[i]
      if (grp) grp.position.z = segWorldZ

      if (segWorldZ > 15) {
        let minZPos = Infinity
        for (const s of segs) minZPos = Math.min(minZPos, s.zPos)
        segs[i] = {
          id: Math.random(),
          zPos: minZPos - SEGMENT_LENGTH,
          obstacles: generateObstacles(),
          coins: generateCoins(),
          scenery: generateScenery(),
        }
        needsRerender = true
      }
    }

    if (needsRerender) setRenderTick(t => t + 1)

    // Obstacle collision
    let hasCollision = false
    for (const seg of segs) {
      const segWorldZ = seg.zPos + traveled
      for (const obs of seg.obstacles) {
        const obsZ = segWorldZ - obs.zOffset
        if (Math.abs(obsZ) < 4) {
          const x = obs.lane * LANE_WIDTH
          const { w, h, d, y } = getObstacleBox(obs.type)
          obstacleBox.set(
            new THREE.Vector3(x - w/2, y - h/2, obsZ - d/2),
            new THREE.Vector3(x + w/2, y + h/2, obsZ + d/2)
          )
          if (playerBox.intersectsBox(obstacleBox)) { hasCollision = true; break }
        }
      }
      if (hasCollision) break
    }
    if (hasCollision) { endGame(); return }

    // Coin collection
    for (const seg of segs) {
      const segWorldZ = seg.zPos + traveled
      for (const coin of seg.coins) {
        if (coin.collected) continue
        const coinZ = segWorldZ - coin.zOffset
        if (Math.abs(coinZ) < 3) {
          const x = coin.lane * LANE_WIDTH
          coinBox.set(
            new THREE.Vector3(x - 0.3, coin.height - 0.3, coinZ - 0.3),
            new THREE.Vector3(x + 0.3, coin.height + 0.3, coinZ + 0.3)
          )
          if (playerBox.intersectsBox(coinBox)) {
            coin.collected = true
            collectCoin()
            needsRerender = true
          }
        }
      }
    }
  })

  const prevGameState = useRef(gameState)
  if (gameState === 'playing' && prevGameState.current !== 'playing') {
    traveledRef.current = 0
    segDataRef.current = Array.from({ length: NUM_SEGMENTS }).map((_, i) => ({
      id: i,
      zPos: -i * SEGMENT_LENGTH,
      obstacles: i === 0 ? [] : generateObstacles(),
      coins: generateCoins(),
      scenery: generateScenery(),
    }))
  }
  prevGameState.current = gameState

  const markers = useMemo(() => {
    const arr: number[] = []
    for (let z = 0; z < SEGMENT_LENGTH; z += 4) arr.push(z)
    return arr
  }, [])

  void renderTick

  return (
    <group>
      {segDataRef.current.map((seg, idx) => (
        <group key={seg.id} ref={el => { segGroupRefs.current[idx] = el }} position={[0, 0, seg.zPos]}>

          {/* Ground */}
          <mesh receiveShadow position={[0, -0.5, -SEGMENT_LENGTH / 2]}>
            <boxGeometry args={[100, 1, SEGMENT_LENGTH]} />
            <primitive object={materials.grass} attach="material" />
          </mesh>

          {/* Road */}
          <mesh receiveShadow position={[0, 0.01, -SEGMENT_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[LANE_WIDTH * 3 + 1, SEGMENT_LENGTH]} />
            <primitive object={materials.road} attach="material" />
          </mesh>

          {/* Lane markers */}
          {markers.map(zPos => (
            <group key={zPos} position={[0, 0.02, -zPos]}>
              <mesh position={[-LANE_WIDTH / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.2, 2]} />
                <primitive object={materials.marker} attach="material" />
              </mesh>
              <mesh position={[LANE_WIDTH / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.2, 2]} />
                <primitive object={materials.marker} attach="material" />
              </mesh>
            </group>
          ))}

          {/* Scenery */}
          {seg.scenery.map(item => {
            const palette = HOUSE_PALETTES[item.paletteIdx % HOUSE_PALETTES.length]
            if (item.type === 'tree')     return <group key={item.id} position={[item.x, 0, -item.zOffset]}><RoundTree /></group>
            if (item.type === 'lamppost') return <group key={item.id} position={[item.x, 0, -item.zOffset]}><LampPost /></group>
            if (item.type === 'bench')    return <group key={item.id} position={[item.x, 0, -item.zOffset]}><Bench /></group>
            if (item.type === 'sunflower')return <group key={item.id} position={[item.x, 0, -item.zOffset]}><Sunflower /></group>
            if (item.type === 'flowers')  return <group key={item.id} position={[item.x, 0, -item.zOffset]}><FlowerPatch /></group>
            return (
              <group key={item.id} position={[item.x, 0, -item.zOffset]} scale={[0.42, 0.42, 0.42]} rotation={[0, item.x > 0 ? Math.PI : 0, 0]}>
                <ShinChanHouse wall={palette.wall} roof={palette.roof} />
              </group>
            )
          })}

          {/* Obstacles */}
          {seg.obstacles.map(obs => (
            <group key={obs.id} position={[obs.lane * LANE_WIDTH, 0, -obs.zOffset]}>
              {obs.type === 'barrier'  && <TrafficBarrier />}
              {obs.type === 'crates'   && <CrateStack />}
              {obs.type === 'wall'     && <StoneWall />}
              {obs.type === 'log'      && <RollingLog />}
              {obs.type === 'hydrant'  && <FireHydrant />}
            </group>
          ))}

          {/* Coins */}
          {seg.coins.map(coin => (
            <group key={coin.id} position={[coin.lane * LANE_WIDTH, coin.height, -coin.zOffset]}>
              <CoinMesh collected={coin.collected} />
            </group>
          ))}

        </group>
      ))}
    </group>
  )
}
