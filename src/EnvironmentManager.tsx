import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Outlines } from '@react-three/drei'
import { useGameStore } from './store'
import { playerBox } from './Player'

const NUM_SEGMENTS = 10
const SEGMENT_LENGTH = 10
const MAX_OBSTACLES = 3
const LANE_WIDTH = 3
const SCENERY_DENSITY = 4

interface Obstacle {
  id: number
  lane: number // -1, 0, 1
  zOffset: number
  type: 'box' | 'tall' | 'air'
}

interface Scenery {
  id: number
  x: number
  zOffset: number
  type: 'tree' | 'building'
  color: string
}

interface Segment {
  id: number
  zPos: number
  obstacles: Obstacle[]
  scenery: Scenery[]
}

const generateObstacles = (): Obstacle[] => {
  const obs: Obstacle[] = []
  const count = Math.floor(Math.random() * MAX_OBSTACLES) + 1
  for (let i = 0; i < count; i++) {
    const types: ('box' | 'tall' | 'air')[] = ['box', 'tall', 'air']
    obs.push({
      id: Math.random(),
      lane: Math.floor(Math.random() * 3) - 1, // -1, 0, or 1
      zOffset: Math.random() * SEGMENT_LENGTH,
      type: types[Math.floor(Math.random() * types.length)]
    })
  }
  return obs
}

const generateScenery = (): Scenery[] => {
  const scenery: Scenery[] = []
  for (let i = 0; i < SCENERY_DENSITY; i++) {
    const isLeft = Math.random() > 0.5
    const distance = 6 + Math.random() * 10
    const x = isLeft ? -distance : distance
    const type = Math.random() > 0.5 ? 'tree' : 'building'
    
    // Vibrant Shinchan cartoon colors
    const treeColors = ['#22C55E', '#16A34A']
    const buildingColors = ['#FBBF24', '#F87171', '#60A5FA', '#C084FC']
    
    scenery.push({
      id: Math.random(),
      x,
      zOffset: Math.random() * SEGMENT_LENGTH,
      type,
      color: type === 'tree' ? treeColors[Math.floor(Math.random() * treeColors.length)] : buildingColors[Math.floor(Math.random() * buildingColors.length)]
    })
  }
  return scenery
}

export function EnvironmentManager() {
  const { gameState, speed, incrementScore, endGame } = useGameStore()
  const groupRef = useRef<THREE.Group>(null)

  const [segments, setSegments] = useState<Segment[]>(() => {
    return Array.from({ length: NUM_SEGMENTS }).map((_, i) => ({
      id: i,
      zPos: -i * SEGMENT_LENGTH,
      obstacles: i === 0 ? [] : generateObstacles(), // First segment has no obstacles
      scenery: generateScenery()
    }))
  })

  // Pre-create materials for performance
  const materials = useMemo(() => {
    return {
      grass: new THREE.MeshStandardMaterial({ color: '#4ade80', roughness: 1 }), // Soft vibrant green
      road: new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.8 }), // Slate grey
      marker: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.5 }), // White
      treeTrunk: new THREE.MeshStandardMaterial({ color: '#92400E', roughness: 0.9 }),
      treeLeaves1: new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.8 }),
      treeLeaves2: new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.8 }),
      build1: new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.6 }), // Amber
      build2: new THREE.MeshStandardMaterial({ color: '#f87171', roughness: 0.6 }), // Red
      build3: new THREE.MeshStandardMaterial({ color: '#60a5fa', roughness: 0.6 }), // Blue
      build4: new THREE.MeshStandardMaterial({ color: '#c084fc', roughness: 0.6 }), // Purple
      obsBox: new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.4 }),
      obsTall: new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.4 }),
      obsAir: new THREE.MeshStandardMaterial({ color: '#a855f7', roughness: 0.4 }),
    }
  }, [])

  // Pre-allocate box for obstacle collision to avoid garbage collection
  const obstacleBox = useMemo(() => new THREE.Box3(), [])

  useFrame((_, delta) => {
    if (gameState !== 'playing' || !groupRef.current) return

    // Move the entire environment container forward (+Z)
    groupRef.current.position.z += speed * delta
    incrementScore(speed * delta * 0.1)

    // Check for recycled segments
    const currentWorldZ = groupRef.current.position.z

    let needsUpdate = false
    const newSegments = [...segments]
    
    for (let i = 0; i < newSegments.length; i++) {
      // If a segment has moved past the camera (Z > 30 relative to world)
      const absoluteZ = currentWorldZ + newSegments[i].zPos
      
      if (absoluteZ > 30) {
        // Recycle to the end
        // Find the furthest segment
        const minZ = Math.min(...newSegments.map(s => s.zPos))
        newSegments[i] = {
          id: Math.random(),
          zPos: minZ - SEGMENT_LENGTH,
          obstacles: generateObstacles(),
          scenery: generateScenery()
        }
        needsUpdate = true
      }
    }

    if (needsUpdate) {
      setSegments(newSegments)
    }

    // Collision detection
    let hasCollision = false
    
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      for (const obs of seg.obstacles) {
        const obsAbsoluteZ = currentWorldZ + seg.zPos - obs.zOffset
        
        // Quick distance check before AABB (Player is at Z=0)
        if (Math.abs(obsAbsoluteZ) < 5) {
          // Construct obstacle AABB
          const x = obs.lane * LANE_WIDTH
          let y = 0.5
          let height = 1
          
          if (obs.type === 'tall') { height = 2; y = 1; }
          else if (obs.type === 'air') { height = 0.5; y = 1.5; }
          
          // Actually THREE bounds require min < max for all axes.
          obstacleBox.set(
            new THREE.Vector3(x - 0.5, y - height/2, obsAbsoluteZ - 0.5),
            new THREE.Vector3(x + 0.5, y + height/2, obsAbsoluteZ + 0.5)
          )

          if (playerBox.intersectsBox(obstacleBox)) {
            hasCollision = true
            break
          }
        }
      }
      if (hasCollision) break
    }

    if (hasCollision) {
      endGame()
    }
  })

  // Pre-generate lane markers (dashed lines)
  const markers = useMemo(() => {
    const arr = []
    for(let z=0; z<SEGMENT_LENGTH; z+=4) {
      arr.push(z)
    }
    return arr
  }, [])

  const outlineThick = 0.05

  return (
    <group ref={groupRef}>
      {segments.map((seg) => (
        <group key={seg.id} position={[0, 0, seg.zPos]}>
          {/* Ground */}
          <mesh receiveShadow position={[0, -0.5, -SEGMENT_LENGTH / 2]}>
            <boxGeometry args={[100, 1, SEGMENT_LENGTH]} />
            <primitive object={materials.grass} attach="material" />
          </mesh>
          
          {/* Track/Road */}
          <mesh receiveShadow position={[0, 0.01, -SEGMENT_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[LANE_WIDTH * 3 + 1, SEGMENT_LENGTH]} />
            <primitive object={materials.road} attach="material" />
          </mesh>

          {/* Lane Markers */}
          {markers.map(zPos => (
            <group key={zPos} position={[0, 0.02, -zPos]}>
              <mesh position={[-LANE_WIDTH/2, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[0.2, 2]} />
                <primitive object={materials.marker} attach="material" />
              </mesh>
              <mesh position={[LANE_WIDTH/2, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[0.2, 2]} />
                <primitive object={materials.marker} attach="material" />
              </mesh>
            </group>
          ))}

          {/* Side Scenery */}
          {seg.scenery.map(item => {
            let bMat = materials.build1;
            if (item.color === '#f87171') bMat = materials.build2;
            if (item.color === '#60a5fa') bMat = materials.build3;
            if (item.color === '#c084fc') bMat = materials.build4;
            
            return item.type === 'tree' ? (
              <group key={item.id} position={[item.x, 0, -item.zOffset]}>
                <mesh position={[0, 0.5, 0]} castShadow>
                  <cylinderGeometry args={[0.2, 0.3, 1]} />
                  <primitive object={materials.treeTrunk} attach="material" />
                  <Outlines thickness={outlineThick} color="black" />
                </mesh>
                <mesh position={[0, 2, 0]} castShadow>
                  <coneGeometry args={[1.5, 3, 6]} />
                  <primitive object={item.color === '#22C55E' ? materials.treeLeaves1 : materials.treeLeaves2} attach="material" />
                  <Outlines thickness={outlineThick} color="black" />
                </mesh>
              </group>
            ) : (
              <group key={item.id} position={[item.x, 0, -item.zOffset]}>
                <mesh position={[0, 3, 0]} castShadow receiveShadow>
                  <boxGeometry args={[3, 6 + Math.random() * 6, 3]} />
                  <primitive object={bMat} attach="material" />
                  <Outlines thickness={outlineThick} color="black" />
                </mesh>
              </group>
            )
          })}

          {/* Obstacles */}
          {seg.obstacles.map((obs) => {
            let mat = materials.obsBox
            let args: [number, number, number] = [1, 1, 1]
            let y = 0.5
            
            if (obs.type === 'tall') { mat = materials.obsTall; args = [1, 2, 1]; y = 1; }
            if (obs.type === 'air') { mat = materials.obsAir; args = [1, 0.5, 1]; y = 1.5; }
            
            return (
              <group key={obs.id} position={[obs.lane * LANE_WIDTH, y, -obs.zOffset]}>
                <mesh castShadow receiveShadow>
                  <boxGeometry args={args} />
                  <primitive object={mat} attach="material" />
                  <Outlines thickness={outlineThick} color="black" />
                </mesh>
              </group>
            )
          })}
        </group>
      ))}
    </group>
  )
}
