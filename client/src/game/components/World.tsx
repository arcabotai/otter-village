import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { WORLD_SIZE } from '@otter-village/shared';

// ── Module-level shared materials (flat-shaded low-poly) ──────────
const grassMatDark = new THREE.MeshStandardMaterial({ color: '#3a6a2a', roughness: 0.95, flatShading: true });
const grassMatMed = new THREE.MeshStandardMaterial({ color: '#4a8a3a', roughness: 0.95, flatShading: true });
const grassMatLight = new THREE.MeshStandardMaterial({ color: '#5a9a4a', roughness: 0.95, flatShading: true });

const pathMaterial = new THREE.MeshStandardMaterial({ color: '#c4a35a', roughness: 0.85, flatShading: true });
const waterMaterial = new THREE.MeshStandardMaterial({
  color: '#4a90b8',
  transparent: true,
  opacity: 0.6,
  roughness: 0.2,
  flatShading: true,
});
const lilyMat = new THREE.MeshStandardMaterial({ color: '#3a8a3a', roughness: 0.8, flatShading: true });
const woodMaterial = new THREE.MeshStandardMaterial({ color: '#8B5E3C', roughness: 0.9, flatShading: true });
const fenceMat = new THREE.MeshStandardMaterial({ color: '#d4c4a0', roughness: 0.8, flatShading: true });
const stemMat = new THREE.MeshStandardMaterial({ color: '#4a7a3a', roughness: 0.8, flatShading: true });

const foliageGreens = [
  new THREE.MeshStandardMaterial({ color: '#2d5a27', roughness: 0.85, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: '#3a7a32', roughness: 0.85, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: '#4a8a42', roughness: 0.85, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: '#358a35', roughness: 0.85, flatShading: true }),
];

const rockColors = ['#7a7a7a', '#8a8a8a', '#6a6a6a', '#757575'];
const rockMaterials = rockColors.map(
  (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.92, flatShading: true }),
);

// ── Seeded random ─────────────────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Ground with vertex displacement and vertex colors ─────────────
function Ground() {
  const geometry = useMemo(() => {
    const ws = WORLD_SIZE + 20; // slightly larger than play area
    const seg = 40;
    const geo = new THREE.PlaneGeometry(ws, ws, seg, seg);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const rng = seededRandom(123);
    for (let i = 0; i < pos.count; i++) {
      // Gentle undulation
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromCenter = Math.sqrt(x * x + z * z);
      const edgeFactor = Math.max(0, (distFromCenter - 40) / 30);
      const y = Math.sin(x * 0.08) * 0.4 + Math.cos(z * 0.06) * 0.3 + rng() * 0.15 - edgeFactor * 0.5;
      pos.setY(i, y);

      // Vertex colors: blend green tones based on noise-like pattern
      const n = Math.sin(x * 0.12 + z * 0.09) * 0.5 + 0.5;
      const n2 = Math.cos(x * 0.07 - z * 0.11) * 0.5 + 0.5;
      const t = (n + n2) * 0.5;

      let r: number, g: number, b: number;
      if (t < 0.33) {
        // dark green
        const f = t / 0.33;
        r = 0.23 * (1 - f) + 0.29 * f;
        g = 0.42 * (1 - f) + 0.54 * f;
        b = 0.17 * (1 - f) + 0.23 * f;
      } else if (t < 0.66) {
        // medium green
        const f = (t - 0.33) / 0.33;
        r = 0.29 * (1 - f) + 0.35 * f;
        g = 0.54 * (1 - f) + 0.60 * f;
        b = 0.23 * (1 - f) + 0.29 * f;
      } else {
        // light green
        const f = (t - 0.66) / 0.34;
        r = 0.35 * (1 - f) + 0.38 * f;
        g = 0.60 * (1 - f) + 0.65 * f;
        b = 0.29 * (1 - f) + 0.32 * f;
      }
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow={false}>
      <meshStandardMaterial
        vertexColors
        roughness={0.95}
        flatShading
      />
    </mesh>
  );
}

// ── Tree Type A: Tall pine ────────────────────────────────────────
function PineTree({ scale = 1 }: { scale?: number }) {
  const foliageMat = foliageGreens[0];
  return (
    <group scale={scale}>
      <mesh position={[0, 1.0, 0]} material={woodMaterial}>
        <cylinderGeometry args={[0.08, 0.12, 2.0, 5]} />
      </mesh>
      <mesh position={[0, 2.4, 0]} material={foliageMat}>
        <coneGeometry args={[0.9, 1.2, 6]} />
      </mesh>
      <mesh position={[0, 3.0, 0]} material={foliageGreens[1]}>
        <coneGeometry args={[0.7, 1.0, 6]} />
      </mesh>
      <mesh position={[0, 3.5, 0]} material={foliageGreens[2]}>
        <coneGeometry args={[0.5, 0.8, 6]} />
      </mesh>
    </group>
  );
}

// ── Tree Type B: Round deciduous ──────────────────────────────────
function RoundTree({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 1.0, 0]} material={woodMaterial}>
        <cylinderGeometry args={[0.1, 0.14, 2.0, 5]} />
      </mesh>
      <mesh position={[0, 2.6, 0]} material={foliageGreens[1]}>
        <icosahedronGeometry args={[1.0, 1]} />
      </mesh>
      <mesh position={[0.3, 2.9, 0.2]} material={foliageGreens[2]}>
        <icosahedronGeometry args={[0.7, 1]} />
      </mesh>
      <mesh position={[-0.2, 3.0, -0.15]} material={foliageGreens[3]}>
        <icosahedronGeometry args={[0.6, 1]} />
      </mesh>
    </group>
  );
}

// ── Tree Type C: Bush ─────────────────────────────────────────────
function Bush({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.4, 0]} material={foliageGreens[2]}>
        <icosahedronGeometry args={[0.55, 1]} />
      </mesh>
      <mesh position={[0.25, 0.5, 0.15]} material={foliageGreens[3]}>
        <icosahedronGeometry args={[0.4, 1]} />
      </mesh>
    </group>
  );
}

// ── Tree wrapper ──────────────────────────────────────────────────
function Tree({ position, scale = 1, type, rotationY = 0 }: {
  position: [number, number, number];
  scale?: number;
  type: 'pine' | 'round' | 'bush';
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {type === 'pine' && <PineTree scale={scale} />}
      {type === 'round' && <RoundTree scale={scale} />}
      {type === 'bush' && <Bush scale={scale} />}
    </group>
  );
}

// ── Rock ──────────────────────────────────────────────────────────
function Rock({ position, scale = 1, rotationY = 0 }: {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
}) {
  const mat = useMemo(() => rockMaterials[Math.floor(Math.random() * rockMaterials.length)], []);
  return (
    <mesh position={position} scale={scale} rotation={[0, rotationY, 0]} material={mat}>
      <dodecahedronGeometry args={[0.5, 0]} />
    </mesh>
  );
}

// ── House ─────────────────────────────────────────────────────────
function House({
  position,
  wallColor,
  roofColor,
  width = 3,
  height = 2.5,
  depth = 3,
  rotationY = 0,
  hasChimney = true,
}: {
  position: [number, number, number];
  wallColor: string;
  roofColor: string;
  width?: number;
  height?: number;
  depth?: number;
  rotationY?: number;
  hasChimney?: boolean;
}) {
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.7, flatShading: true }), [wallColor]);
  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.8, flatShading: true }), [roofColor]);
  const doorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5a3a1a', roughness: 0.9, flatShading: true }), []);
  const windowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a0d8f0', roughness: 0.4 }), []);
  const stepMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b0a090', roughness: 0.9, flatShading: true }), []);
  const chimneyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8a7060', roughness: 0.9, flatShading: true }), []);

  const roofHeight = height * 0.6;
  const halfH = height / 2;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Base */}
      <mesh position={[0, halfH, 0]} material={wallMat}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, height + roofHeight * 0.5, 0]} material={roofMat}>
        <coneGeometry args={[width * 0.85, roofHeight, 4]} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.55, depth / 2 + 0.02]} material={doorMat}>
        <boxGeometry args={[0.65, 1.1, 0.05]} />
      </mesh>

      {/* Door handle */}
      <mesh position={[0.2, 0.55, depth / 2 + 0.05]}>
        <sphereGeometry args={[0.035, 6, 6]} />
        <meshStandardMaterial color="#c0a040" />
      </mesh>

      {/* Windows — front */}
      <mesh position={[-width * 0.3, height * 0.6, depth / 2 + 0.02]} material={windowMat}>
        <boxGeometry args={[0.5, 0.5, 0.04]} />
      </mesh>
      <mesh position={[width * 0.3, height * 0.6, depth / 2 + 0.02]} material={windowMat}>
        <boxGeometry args={[0.5, 0.5, 0.04]} />
      </mesh>

      {/* Windows — sides */}
      <mesh position={[width / 2 + 0.02, height * 0.6, 0]} rotation={[0, Math.PI / 2, 0]} material={windowMat}>
        <boxGeometry args={[0.5, 0.5, 0.04]} />
      </mesh>
      <mesh position={[-width / 2 - 0.02, height * 0.6, 0]} rotation={[0, Math.PI / 2, 0]} material={windowMat}>
        <boxGeometry args={[0.5, 0.5, 0.04]} />
      </mesh>

      {/* Porch step */}
      <mesh position={[0, 0.08, depth / 2 + 0.4]} material={stepMat}>
        <boxGeometry args={[1.2, 0.16, 0.6]} />
      </mesh>

      {/* Chimney */}
      {hasChimney && (
        <mesh position={[width * 0.25, height + roofHeight * 0.4, -depth * 0.15]} material={chimneyMat}>
          <boxGeometry args={[0.4, roofHeight * 0.7, 0.4]} />
        </mesh>
      )}
    </group>
  );
}

// ── Flower ────────────────────────────────────────────────────────
function Flower({ position, color }: { position: [number, number, number]; color: string }) {
  const flowerMat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.7 }), [color]);
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} material={stemMat}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 4]} />
      </mesh>
      <mesh position={[0, 0.32, 0]} material={flowerMat}>
        <sphereGeometry args={[0.06, 6, 4]} />
      </mesh>
    </group>
  );
}

// ── Lily pad ──────────────────────────────────────────────────────
function LilyPad({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} material={lilyMat}>
      <circleGeometry args={[0.35, 6]} />
    </mesh>
  );
}

// ── Fence section (2 posts + 2 rails) ─────────────────────────────
function FenceSection({ position, rotationY = 0 }: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Posts */}
      <mesh position={[-1.2, 0.35, 0]} material={fenceMat}>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 4]} />
      </mesh>
      <mesh position={[1.2, 0.35, 0]} material={fenceMat}>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 4]} />
      </mesh>
      {/* Rails */}
      <mesh position={[0, 0.55, 0]} material={fenceMat}>
        <boxGeometry args={[2.5, 0.05, 0.05]} />
      </mesh>
      <mesh position={[0, 0.25, 0]} material={fenceMat}>
        <boxGeometry args={[2.5, 0.05, 0.05]} />
      </mesh>
    </group>
  );
}

// ── Main World ────────────────────────────────────────────────────
export function World() {
  const ws = WORLD_SIZE; // 100

  // ── Tree positions ──────────────────────────────────────────────
  const trees = useMemo(() => {
    const rng = seededRandom(42);
    const types: Array<'pine' | 'round' | 'bush'> = ['pine', 'round', 'bush'];
    const result: { pos: [number, number, number]; scale: number; type: 'pine' | 'round' | 'bush'; rotY: number }[] = [];
    for (let i = 0; i < 18; i++) {
      let x: number, z: number;
      let attempts = 0;
      do {
        x = (rng() - 0.5) * ws * 0.85;
        z = (rng() - 0.5) * ws * 0.85;
        attempts++;
      } while (
        attempts < 50 &&
        // Keep away from paths (cross shape)
        ((Math.abs(x) < 4 && Math.abs(z) < 40) || (Math.abs(z) < 4 && Math.abs(x) < 40)) &&
        // Keep away from house zones
        !(Math.abs(x) > 5 || Math.abs(z) > 5)
      );
      const scale = 0.7 + rng() * 0.6;
      const type = types[Math.floor(rng() * types.length)];
      const rotY = rng() * Math.PI * 2;
      result.push({ pos: [x, 0, z], scale, type, rotY });
    }
    return result;
  }, []);

  // ── Rock positions ──────────────────────────────────────────────
  const rocks = useMemo(() => {
    const rng = seededRandom(99);
    const result: { pos: [number, number, number]; scale: number; rotY: number }[] = [];
    for (let i = 0; i < 10; i++) {
      let x: number, z: number;
      let attempts = 0;
      do {
        x = (rng() - 0.5) * ws * 0.7;
        z = (rng() - 0.5) * ws * 0.7;
        attempts++;
      } while (
        attempts < 50 &&
        ((Math.abs(x) < 3 && Math.abs(z) < 35) || (Math.abs(z) < 3 && Math.abs(x) < 35))
      );
      const scale = 0.2 + rng() * 1.3;
      const rotY = rng() * Math.PI * 2;
      result.push({ pos: [x, scale * 0.2, z], scale, rotY });
    }
    return result;
  }, []);

  // ── Houses — arranged in a semicircle along paths ───────────────
  const houses = useMemo(() => [
    {
      pos: [12, 0, 8] as [number, number, number],
      wallColor: '#f0e6d0', roofColor: '#a04040',
      rotY: -0.4, w: 3.2, h: 2.6, d: 3.0, chimney: true,
    },
    {
      pos: [-14, 0, 10] as [number, number, number],
      wallColor: '#d0e0f0', roofColor: '#8a6a4a',
      rotY: 0.5, w: 2.8, h: 2.4, d: 2.8, chimney: false,
    },
    {
      pos: [10, 0, -16] as [number, number, number],
      wallColor: '#f0d0d0', roofColor: '#4a6a8a',
      rotY: 2.8, w: 3.0, h: 2.5, d: 3.2, chimney: true,
    },
    {
      pos: [-12, 0, -14] as [number, number, number],
      wallColor: '#d0f0e0', roofColor: '#a04040',
      rotY: -2.3, w: 3.4, h: 2.8, d: 3.0, chimney: true,
    },
    {
      pos: [22, 0, 0] as [number, number, number],
      wallColor: '#f0f0d0', roofColor: '#8a6a4a',
      rotY: 1.6, w: 2.8, h: 2.3, d: 2.6, chimney: false,
    },
    {
      pos: [-22, 0, -2] as [number, number, number],
      wallColor: '#e8d8e8', roofColor: '#4a6a8a',
      rotY: -1.5, w: 3.0, h: 2.6, d: 3.0, chimney: true,
    },
  ], []);

  // ── Flowers ─────────────────────────────────────────────────────
  const flowers = useMemo(() => {
    const rng = seededRandom(77);
    const colors = ['#ff6b8a', '#ffb347', '#87ceeb', '#dda0dd', '#fff68f', '#ff8a8a', '#ffffff'];
    const result: { pos: [number, number, number]; color: string }[] = [];

    // Cluster near houses
    for (const h of houses) {
      for (let j = 0; j < 3; j++) {
        const ox = (rng() - 0.5) * 4;
        const oz = (rng() - 0.5) * 4;
        result.push({
          pos: [h.pos[0] + ox, 0, h.pos[2] + oz],
          color: colors[Math.floor(rng() * colors.length)],
        });
      }
    }

    // Scatter along paths
    for (let i = 0; i < 15; i++) {
      const alongPath = (rng() - 0.5) * 50;
      const side = rng() > 0.5 ? 2.5 + rng() * 5 : -2.5 - rng() * 5;
      const isNS = rng() > 0.5;
      result.push({
        pos: isNS ? [side, 0, alongPath] : [alongPath, 0, side],
        color: colors[Math.floor(rng() * colors.length)],
      });
    }

    return result;
  }, [houses]);

  // ── Fence sections ──────────────────────────────────────────────
  const fences = useMemo(() => {
    const result: { pos: [number, number, number]; rotY: number }[] = [];
    // Along one side of the north-south path
    for (let z = -30; z <= 30; z += 2.5) {
      if (Math.abs(z) < 3) continue; // gap at crossroads
      result.push({ pos: [2.5, 0, z], rotY: 0 });
    }
    return result;
  }, []);

  return (
    <>
      {/* Ground */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.02, 0]}>
        <Ground />
      </RigidBody>

      {/* ── Paths (Y-crossroads) ──────────────────────────────── */}
      {/* North-south path */}
      <mesh position={[0, 0.02, -15]} rotation={[-Math.PI / 2, 0, 0]} material={pathMaterial}>
        <planeGeometry args={[3, 50]} />
      </mesh>
      <mesh position={[0, 0.02, 15]} rotation={[-Math.PI / 2, 0, 0]} material={pathMaterial}>
        <planeGeometry args={[3, 50]} />
      </mesh>
      {/* East-west path */}
      <mesh position={[-15, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={pathMaterial}>
        <planeGeometry args={[3, 50]} />
      </mesh>
      <mesh position={[15, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={pathMaterial}>
        <planeGeometry args={[3, 50]} />
      </mesh>
      {/* Diagonal branch paths */}
      <mesh position={[8, 0.02, 8]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]} material={pathMaterial}>
        <planeGeometry args={[2.5, 20]} />
      </mesh>
      <mesh position={[-8, 0.02, -8]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]} material={pathMaterial}>
        <planeGeometry args={[2.5, 20]} />
      </mesh>

      {/* ── Pond ──────────────────────────────────────────────── */}
      <mesh position={[20, -0.08, -18]} rotation={[-Math.PI / 2, 0, 0]} material={waterMaterial}>
        <circleGeometry args={[4, 12]} />
      </mesh>
      {/* Lily pads */}
      <LilyPad position={[19, 0.01, -17.5]} />
      <LilyPad position={[21, 0.01, -18.5]} />
      <LilyPad position={[20.5, 0.01, -17]} />

      {/* ── Trees ─────────────────────────────────────────────── */}
      {trees.map((t, i) => (
        <RigidBody key={`tree-${i}`} type="fixed" colliders="trimesh" position={t.pos}>
          <Tree position={[0, 0, 0]} scale={t.scale} type={t.type} rotationY={t.rotY} />
        </RigidBody>
      ))}

      {/* ── Rocks ─────────────────────────────────────────────── */}
      {rocks.map((r, i) => (
        <RigidBody key={`rock-${i}`} type="fixed" colliders="ball" position={r.pos}>
          <Rock position={[0, 0, 0]} scale={r.scale} rotationY={r.rotY} />
        </RigidBody>
      ))}

      {/* ── Houses ────────────────────────────────────────────── */}
      {houses.map((h, i) => (
        <RigidBody key={`house-${i}`} type="fixed" colliders="cuboid" position={h.pos}>
          <House
            position={[0, 0, 0]}
            wallColor={h.wallColor}
            roofColor={h.roofColor}
            rotationY={h.rotY}
            width={h.w}
            height={h.h}
            depth={h.d}
            hasChimney={h.chimney}
          />
        </RigidBody>
      ))}

      {/* ── Flowers (no collision) ────────────────────────────── */}
      {flowers.map((f, i) => (
        <Flower key={`flower-${i}`} position={f.pos} color={f.color} />
      ))}

      {/* ── Fences ────────────────────────────────────────────── */}
      {fences.map((f, i) => (
        <FenceSection key={`fence-${i}`} position={f.pos} rotationY={f.rotY} />
      ))}
    </>
  );
}
