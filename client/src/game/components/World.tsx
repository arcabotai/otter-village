import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { WORLD_SIZE } from '@otter-village/shared';

// ── Module-level constants for geometry/materials ──────────────────
const grassColor = '#5a8f3c';
const pathColor = '#c4a56e';
const waterColor = '#4a90b8';

const grassMaterial = new THREE.MeshStandardMaterial({ color: grassColor, roughness: 0.9 });
const pathMaterial = new THREE.MeshStandardMaterial({ color: pathColor, roughness: 0.8 });
const waterMaterial = new THREE.MeshStandardMaterial({
  color: waterColor,
  transparent: true,
  opacity: 0.6,
  roughness: 0.3,
});
const woodMaterial = new THREE.MeshStandardMaterial({ color: '#8B5E3C', roughness: 0.8 });
const foliageMaterial = new THREE.MeshStandardMaterial({ color: '#3a7d3a', roughness: 0.85 });
const rockMaterial = new THREE.MeshStandardMaterial({ color: '#808080', roughness: 0.9 });
const fenceMaterial = new THREE.MeshStandardMaterial({ color: '#d4c4a0', roughness: 0.8 });

// House colors
const HOUSE_COLORS = ['#e8a0b0', '#f0d88a', '#90b8e0', '#a8d8b0'];

// Seeded random for consistent placement
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Tree component ─────────────────────────────────────────────────
function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1.2, 0]} material={woodMaterial} castShadow={false}>
        <cylinderGeometry args={[0.15, 0.2, 2.4, 6]} />
      </mesh>
      {/* Canopy - 3 overlapping spheres */}
      <mesh position={[0, 3, 0]} material={foliageMaterial} castShadow={false}>
        <sphereGeometry args={[1.1, 8, 6]} />
      </mesh>
      <mesh position={[0.4, 3.3, 0.3]} material={foliageMaterial} castShadow={false}>
        <sphereGeometry args={[0.8, 8, 6]} />
      </mesh>
      <mesh position={[-0.3, 3.5, -0.2]} material={foliageMaterial} castShadow={false}>
        <sphereGeometry args={[0.7, 8, 6]} />
      </mesh>
    </group>
  );
}

// ── Rock component ─────────────────────────────────────────────────
function Rock({ position, scale = 1, rotationY = 0 }: {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
}) {
  return (
    <mesh position={position} scale={scale} rotation={[0, rotationY, 0]} material={rockMaterial} castShadow={false}>
      <dodecahedronGeometry args={[0.6, 0]} />
    </mesh>
  );
}

// ── House component ────────────────────────────────────────────────
function House({ position, color, rotationY = 0 }: {
  position: [number, number, number];
  color: string;
  rotationY?: number;
}) {
  const houseMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
    [color],
  );
  const roofMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#8B4513', roughness: 0.8 }),
    [],
  );
  const doorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#5a3a1a', roughness: 0.9 }),
    [],
  );
  const windowMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#87ceeb', roughness: 0.5 }),
    [],
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Base box */}
      <mesh position={[0, 1.25, 0]} material={houseMat} castShadow={false}>
        <boxGeometry args={[3, 2.5, 3]} />
      </mesh>
      {/* Roof - triangular prism approximation using a cone */}
      <mesh position={[0, 3.2, 0]} material={roofMat} castShadow={false}>
        <coneGeometry args={[2.4, 1.5, 4]} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.7, 1.51]} material={doorMat} castShadow={false}>
        <boxGeometry args={[0.7, 1.4, 0.05]} />
      </mesh>
      {/* Windows */}
      <mesh position={[-0.8, 1.5, 1.51]} material={windowMat} castShadow={false}>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
      </mesh>
      <mesh position={[0.8, 1.5, 1.51]} material={windowMat} castShadow={false}>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
      </mesh>
    </group>
  );
}

// ── Flower component ───────────────────────────────────────────────
function Flower({ position, color }: { position: [number, number, number]; color: string }) {
  const flowerMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
    [color],
  );
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} material={woodMaterial} castShadow={false}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 4]} />
      </mesh>
      <mesh position={[0, 0.55, 0]} material={flowerMat} castShadow={false}>
        <sphereGeometry args={[0.12, 6, 4]} />
      </mesh>
    </group>
  );
}

// ── Main World ─────────────────────────────────────────────────────
export function World() {
  const ws = WORLD_SIZE; // 100

  // Generate tree positions
  const trees = useMemo(() => {
    const rng = seededRandom(42);
    const result: { pos: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < 14; i++) {
      let x: number, z: number;
      // Avoid center area and pond
      do {
        x = (rng() - 0.5) * ws * 0.8;
        z = (rng() - 0.5) * ws * 0.8;
      } while (Math.abs(x) < 8 && Math.abs(z) < 8);
      const scale = 0.7 + rng() * 0.8;
      result.push({ pos: [x, 0, z], scale });
    }
    return result;
  }, []);

  // Generate rock positions
  const rocks = useMemo(() => {
    const rng = seededRandom(99);
    const result: { pos: [number, number, number]; scale: number; rotY: number }[] = [];
    for (let i = 0; i < 7; i++) {
      let x: number, z: number;
      do {
        x = (rng() - 0.5) * ws * 0.7;
        z = (rng() - 0.5) * ws * 0.7;
      } while (Math.abs(x) < 6 && Math.abs(z) < 6);
      const scale = 0.5 + rng() * 1.0;
      const rotY = rng() * Math.PI * 2;
      result.push({ pos: [x, scale * 0.3, z], scale, rotY });
    }
    return result;
  }, []);

  // Houses
  const houses = useMemo(() => [
    { pos: [15, 0, 15] as [number, number, number], color: HOUSE_COLORS[0], rotY: 0.3 },
    { pos: [-18, 0, 12] as [number, number, number], color: HOUSE_COLORS[1], rotY: -0.5 },
    { pos: [12, 0, -20] as [number, number, number], color: HOUSE_COLORS[2], rotY: 1.2 },
    { pos: [-15, 0, -15] as [number, number, number], color: HOUSE_COLORS[3], rotY: 0.8 },
    { pos: [25, 0, 0] as [number, number, number], color: HOUSE_COLORS[0], rotY: 1.5 },
    { pos: [-25, 0, 5] as [number, number, number], color: HOUSE_COLORS[2], rotY: -1.0 },
  ], []);

  // Flowers
  const flowers = useMemo(() => {
    const rng = seededRandom(77);
    const flowerColors = ['#ff6b8a', '#ffb347', '#87ceeb', '#dda0dd', '#fff68f'];
    const result: { pos: [number, number, number]; color: string }[] = [];
    for (let i = 0; i < 30; i++) {
      const x = (rng() - 0.5) * ws * 0.6;
      const z = (rng() - 0.5) * ws * 0.6;
      const color = flowerColors[Math.floor(rng() * flowerColors.length)];
      result.push({ pos: [x, 0, z], color });
    }
    return result;
  }, []);

  // Fence posts
  const fenceSegments = useMemo(() => {
    const posts: [number, number, number][] = [];
    const half = 22;
    for (let i = -half; i <= half; i += 3) {
      posts.push([i, 0, -half]);
      posts.push([i, 0, half]);
      posts.push([-half, 0, i]);
      posts.push([half, 0, i]);
    }
    return posts;
  }, []);

  return (
    <>
      {/* Ground plane */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.01, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={grassMaterial} receiveShadow={false}>
          <planeGeometry args={[ws, ws]} />
        </mesh>
      </RigidBody>

      {/* Paths - cross-shaped main paths */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={pathMaterial}>
        <planeGeometry args={[3, ws * 0.6]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={pathMaterial}>
        <planeGeometry args={[3, ws * 0.6]} />
      </mesh>

      {/* Pond */}
      <mesh position={[0, 0.05, -12]} rotation={[-Math.PI / 2, 0, 0]} material={waterMaterial}>
        <circleGeometry args={[5, 16]} />
      </mesh>
      {/* Pond collider */}
      <RigidBody type="fixed" position={[0, -0.5, -12]} colliders="cuboid">
        <mesh visible={false}>
          <boxGeometry args={[10, 1, 10]} />
        </mesh>
      </RigidBody>

      {/* Trees */}
      {trees.map((t, i) => (
        <RigidBody key={`tree-${i}`} type="fixed" colliders="trimesh" position={t.pos}>
          <Tree position={[0, 0, 0]} scale={t.scale} />
        </RigidBody>
      ))}

      {/* Rocks */}
      {rocks.map((r, i) => (
        <RigidBody key={`rock-${i}`} type="fixed" colliders="ball" position={r.pos}>
          <Rock position={[0, 0, 0]} scale={r.scale} rotationY={r.rotY} />
        </RigidBody>
      ))}

      {/* Houses */}
      {houses.map((h, i) => (
        <RigidBody key={`house-${i}`} type="fixed" colliders="cuboid" position={h.pos}>
          <House position={[0, 0, 0]} color={h.color} rotationY={h.rotY} />
        </RigidBody>
      ))}

      {/* Flowers (no collision) */}
      {flowers.map((f, i) => (
        <Flower key={`flower-${i}`} position={f.pos} color={f.color} />
      ))}

      {/* Fence posts (simple) */}
      {fenceSegments.slice(0, 40).map((pos, i) => (
        <mesh key={`fence-${i}`} position={[pos[0], 0.4, pos[2]]} material={fenceMaterial} castShadow={false}>
          <boxGeometry args={[0.1, 0.8, 0.1]} />
        </mesh>
      ))}
    </>
  );
}
