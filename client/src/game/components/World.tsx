import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { WORLD_SIZE } from '@otter-village/shared';

// ── Shared toon gradient map ─────────────────────────────────────
function createGradientMap(): THREE.DataTexture {
  const colors = new Uint8Array([60, 130, 220]);
  const tex = new THREE.DataTexture(colors, 3, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

const gradientMap = createGradientMap();

// ── Seeded random ────────────────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Ground with vertex displacement and vertex colors ────────────
function Ground() {
  const geometry = useMemo(() => {
    const ws = WORLD_SIZE + 20;
    const seg = 64;
    const geo = new THREE.PlaneGeometry(ws, ws, seg, seg);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const rng = seededRandom(123);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromCenter = Math.sqrt(x * x + z * z);
      const edgeFactor = Math.max(0, (distFromCenter - 40) / 30);
      const y = Math.sin(x * 0.08) * 0.4 + Math.cos(z * 0.06) * 0.3 + rng() * 0.15 - edgeFactor * 0.5;
      pos.setY(i, y);

      // Vertex colors: blend 3 greens (#7bc67e, #5a9a3e, #a8d88c)
      const n = Math.sin(x * 0.12 + z * 0.09) * 0.5 + 0.5;
      const n2 = Math.cos(x * 0.07 - z * 0.11) * 0.5 + 0.5;
      const t = (n + n2) * 0.5;

      // dark #5a9a3e = (0.353, 0.604, 0.243)
      // mid  #7bc67e = (0.482, 0.776, 0.494)
      // light #a8d88c = (0.659, 0.847, 0.549)
      let r: number, g: number, b: number;
      if (t < 0.5) {
        const f = t / 0.5;
        r = 0.353 * (1 - f) + 0.482 * f;
        g = 0.604 * (1 - f) + 0.776 * f;
        b = 0.243 * (1 - f) + 0.494 * f;
      } else {
        const f = (t - 0.5) / 0.5;
        r = 0.482 * (1 - f) + 0.659 * f;
        g = 0.776 * (1 - f) + 0.847 * f;
        b = 0.494 * (1 - f) + 0.549 * f;
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

  const material = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [],
  );

  return (
    <mesh geometry={geometry} material={material} receiveShadow={false} />
  );
}

// ── Tree Type A: Round Deciduous ─────────────────────────────────
function RoundTree({ scale = 1 }: { scale?: number }) {
  const trunkMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#8B5E3C', gradientMap }), []);
  const canopyMats = useMemo(() => [
    new THREE.MeshToonMaterial({ color: '#3d7a32', gradientMap }),
    new THREE.MeshToonMaterial({ color: '#4a8a3e', gradientMap }),
    new THREE.MeshToonMaterial({ color: '#5a9a4e', gradientMap }),
  ], []);

  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.18, 0.22, 2.0, 5), []);
  const canopyGeo1 = useMemo(() => new THREE.IcosahedronGeometry(1.0, 1), []);
  const canopyGeo2 = useMemo(() => new THREE.IcosahedronGeometry(0.75, 1), []);
  const canopyGeo3 = useMemo(() => new THREE.IcosahedronGeometry(0.6, 1), []);

  return (
    <group scale={scale}>
      <mesh position={[0, 1.0, 0]} geometry={trunkGeo} material={trunkMat} />
      <mesh position={[0, 2.6, 0]} geometry={canopyGeo1} material={canopyMats[0]} />
      <mesh position={[0.3, 2.9, 0.2]} geometry={canopyGeo2} material={canopyMats[1]} />
      <mesh position={[-0.2, 3.0, -0.15]} geometry={canopyGeo3} material={canopyMats[2]} />
    </group>
  );
}

// ── Tree Type B: Pine/Evergreen ──────────────────────────────────
function PineTree({ scale = 1 }: { scale?: number }) {
  const trunkMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#8B5E3C', gradientMap }), []);
  const foliageMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#2d5a27', gradientMap }), []);

  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.08, 0.12, 2.0, 5), []);
  const coneGeo1 = useMemo(() => new THREE.ConeGeometry(0.9, 1.2, 6), []);
  const coneGeo2 = useMemo(() => new THREE.ConeGeometry(0.7, 1.0, 6), []);
  const coneGeo3 = useMemo(() => new THREE.ConeGeometry(0.5, 0.8, 6), []);

  return (
    <group scale={scale}>
      <mesh position={[0, 1.0, 0]} geometry={trunkGeo} material={trunkMat} />
      <mesh position={[0, 2.4, 0]} geometry={coneGeo1} material={foliageMat} />
      <mesh position={[0, 3.0, 0]} geometry={coneGeo2} material={foliageMat} />
      <mesh position={[0, 3.5, 0]} geometry={coneGeo3} material={foliageMat} />
    </group>
  );
}

// ── Tree Type C: Bush ────────────────────────────────────────────
function Bush({ scale = 1 }: { scale?: number }) {
  const bushMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#4a7a3e', gradientMap }), []);
  const bushGeo1 = useMemo(() => new THREE.IcosahedronGeometry(0.55, 1), []);
  const bushGeo2 = useMemo(() => new THREE.IcosahedronGeometry(0.4, 1), []);

  return (
    <group scale={scale}>
      <mesh position={[0, 0.4, 0]} geometry={bushGeo1} material={bushMat} />
      <mesh position={[0.25, 0.5, 0.15]} geometry={bushGeo2} material={bushMat} />
    </group>
  );
}

// ── Tree wrapper ─────────────────────────────────────────────────
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

// ── Rock ─────────────────────────────────────────────────────────
const ROCK_COLORS = ['#7a7a7a', '#8a8a8a', '#6a6a6a', '#9a9a9a'];

function Rock({ position, scale = 1, rotationY = 0, colorIndex = 0 }: {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  colorIndex?: number;
}) {
  const mat = useMemo(() => new THREE.MeshToonMaterial({ color: ROCK_COLORS[colorIndex % ROCK_COLORS.length], gradientMap }), [colorIndex]);
  const geo = useMemo(() => new THREE.DodecahedronGeometry(0.5, 1), []);
  return (
    <mesh position={position} scale={scale} rotation={[0, rotationY, 0]} geometry={geo} material={mat} />
  );
}

// ── House ────────────────────────────────────────────────────────
function House({
  position,
  wallColor,
  roofColor,
  width = 3,
  height = 2.5,
  depth = 3,
  rotationY = 0,
}: {
  position: [number, number, number];
  wallColor: string;
  roofColor: string;
  width?: number;
  height?: number;
  depth?: number;
  rotationY?: number;
}) {
  const wallMat = useMemo(() => new THREE.MeshToonMaterial({ color: wallColor, gradientMap }), [wallColor]);
  const roofMat = useMemo(() => new THREE.MeshToonMaterial({ color: roofColor, gradientMap }), [roofColor]);
  const doorMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#5a3a1a', gradientMap }), []);
  const windowMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#a0d8f0', gradientMap }), []);
  const stepMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#b0a090', gradientMap }), []);

  const wallGeo = useMemo(() => new THREE.BoxGeometry(width, height, depth), [width, height, depth]);
  const roofGeo = useMemo(() => new THREE.ConeGeometry(width * 0.85, height * 0.6, 4), [width, height]);
  const doorGeo = useMemo(() => new THREE.BoxGeometry(0.65, 1.1, 0.05), []);
  const windowGeo = useMemo(() => new THREE.BoxGeometry(0.5, 0.5, 0.04), []);
  const stepGeo = useMemo(() => new THREE.BoxGeometry(1.2, 0.16, 0.6), []);

  const roofHeight = height * 0.6;
  const halfH = height / 2;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Base */}
      <mesh position={[0, halfH, 0]} geometry={wallGeo} material={wallMat} />
      {/* Roof */}
      <mesh position={[0, height + roofHeight * 0.5, 0]} geometry={roofGeo} material={roofMat} />
      {/* Door */}
      <mesh position={[0, 0.55, depth / 2 + 0.02]} geometry={doorGeo} material={doorMat} />
      {/* Windows — front */}
      <mesh position={[-width * 0.3, height * 0.6, depth / 2 + 0.02]} geometry={windowGeo} material={windowMat} />
      <mesh position={[width * 0.3, height * 0.6, depth / 2 + 0.02]} geometry={windowGeo} material={windowMat} />
      {/* Windows — sides */}
      <mesh position={[width / 2 + 0.02, height * 0.6, 0]} rotation={[0, Math.PI / 2, 0]} geometry={windowGeo} material={windowMat} />
      <mesh position={[-width / 2 - 0.02, height * 0.6, 0]} rotation={[0, Math.PI / 2, 0]} geometry={windowGeo} material={windowMat} />
      {/* Porch step */}
      <mesh position={[0, 0.08, depth / 2 + 0.4]} geometry={stepGeo} material={stepMat} />
    </group>
  );
}

// ── Flower ───────────────────────────────────────────────────────
function Flower({ position, color }: { position: [number, number, number]; color: string }) {
  const flowerMat = useMemo(() => new THREE.MeshToonMaterial({ color, gradientMap }), [color]);
  const stemMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#4a7a3a', gradientMap }), []);
  const stemGeo = useMemo(() => new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4), []);
  const headGeo = useMemo(() => new THREE.SphereGeometry(0.08, 6, 4), []);

  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} geometry={stemGeo} material={stemMat} />
      <mesh position={[0, 0.32, 0]} geometry={headGeo} material={flowerMat} />
    </group>
  );
}

// ── Lily pad with wave animation ─────────────────────────────────
function LilyPad({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const mat = useMemo(() => new THREE.MeshToonMaterial({ color: '#3a8a3a', gradientMap, side: THREE.DoubleSide }), []);
  const geo = useMemo(() => new THREE.CircleGeometry(0.35, 6), []);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 1.5 + offset) * 0.02;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      geometry={geo}
      material={mat}
    />
  );
}

// ── Fence section ────────────────────────────────────────────────
function FenceSection({ position, rotationY = 0 }: {
  position: [number, number, number];
  rotationY?: number;
}) {
  const mat = useMemo(() => new THREE.MeshToonMaterial({ color: '#d4c4a0', gradientMap }), []);
  const postGeo = useMemo(() => new THREE.CylinderGeometry(0.04, 0.04, 0.7, 4), []);
  const railGeo = useMemo(() => new THREE.BoxGeometry(2.5, 0.05, 0.05), []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[-1.2, 0.35, 0]} geometry={postGeo} material={mat} />
      <mesh position={[1.2, 0.35, 0]} geometry={postGeo} material={mat} />
      <mesh position={[0, 0.55, 0]} geometry={railGeo} material={mat} />
      <mesh position={[0, 0.25, 0]} geometry={railGeo} material={mat} />
    </group>
  );
}

// ── Mushroom ─────────────────────────────────────────────────────
function Mushroom({ position, scale = 0.2 }: { position: [number, number, number]; scale?: number }) {
  const stemMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#f0e6d0', gradientMap }), []);
  const capMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#cc3333', gradientMap }), []);
  const stemGeo = useMemo(() => new THREE.CylinderGeometry(0.03, 0.04, 0.08, 5), []);
  const capGeo = useMemo(() => new THREE.SphereGeometry(0.08, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), []);

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.04, 0]} geometry={stemGeo} material={stemMat} />
      <mesh position={[0, 0.08, 0]} geometry={capGeo} material={capMat} />
    </group>
  );
}

// ── Pebble ───────────────────────────────────────────────────────
function Pebble({ position, scale = 0.1 }: { position: [number, number, number]; scale?: number }) {
  const mat = useMemo(() => new THREE.MeshToonMaterial({ color: '#9a9a9a', gradientMap }), []);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);

  return (
    <mesh position={position} scale={scale} geometry={geo} material={mat} />
  );
}

// ── Pond ─────────────────────────────────────────────────────────
function Pond({ position }: { position: [number, number, number] }) {
  const waterMat = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#5ca0b0', transparent: true, opacity: 0.7, gradientMap }),
    [],
  );
  const pondGeo = useMemo(() => new THREE.CircleGeometry(5, 16), []);

  return (
    <group position={position}>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={pondGeo} material={waterMat} />
      {/* Lily pads */}
      <LilyPad position={[-1.5, 0.05, 1.0]} />
      <LilyPad position={[1.0, 0.05, -1.5]} />
      <LilyPad position={[2.0, 0.05, 0.5]} />
      <LilyPad position={[-0.5, 0.05, -2.0]} />
    </group>
  );
}

// ── Main World ───────────────────────────────────────────────────
export function World() {
  const ws = WORLD_SIZE;

  // ── Tree positions (clustered) ─────────────────────────────────
  const trees = useMemo(() => {
    const rng = seededRandom(42);
    const types: Array<'pine' | 'round' | 'bush'> = ['pine', 'round', 'bush'];
    const result: { pos: [number, number, number]; scale: number; type: 'pine' | 'round' | 'bush'; rotY: number }[] = [];

    // Define cluster centers
    const clusterCenters = [
      { x: -30, z: -25 }, { x: 35, z: 20 }, { x: -35, z: 30 },
      { x: 25, z: -30 }, { x: -20, z: -35 }, { x: 30, z: -15 },
    ];

    // 70% in clusters, 30% standalone
    // Clusters: ~16 trees
    for (const center of clusterCenters) {
      const clusterSize = 2 + Math.floor(rng() * 3); // 2-4
      for (let j = 0; j < clusterSize; j++) {
        const ox = (rng() - 0.5) * 8;
        const oz = (rng() - 0.5) * 8;
        const x = center.x + ox;
        const z = center.z + oz;
        const scale = 0.7 + rng() * 0.7; // 0.7-1.4
        const yScale = scale * (0.9 + rng() * 0.2); // non-uniform
        const type = types[Math.floor(rng() * types.length)];
        const rotY = rng() * Math.PI * 2;
        result.push({ pos: [x, 0, z], scale: yScale, type, rotY });
      }
    }

    // Standalone: ~7 trees
    for (let i = 0; i < 7; i++) {
      let x: number, z: number;
      let attempts = 0;
      do {
        x = (rng() - 0.5) * ws * 0.8;
        z = (rng() - 0.5) * ws * 0.8;
        attempts++;
      } while (
        attempts < 50 &&
        ((Math.abs(x) < 5 && Math.abs(z) < 40) || (Math.abs(z) < 5 && Math.abs(x) < 40))
      );
      const scale = 0.7 + rng() * 0.7;
      const type = types[Math.floor(rng() * types.length)];
      const rotY = rng() * Math.PI * 2;
      result.push({ pos: [x, 0, z], scale, type, rotY });
    }

    return result;
  }, []);

  // ── Rock positions (clustered) ─────────────────────────────────
  const rocks = useMemo(() => {
    const rng = seededRandom(99);
    const result: { pos: [number, number, number]; scale: number; rotY: number; colorIndex: number }[] = [];

    // Cluster centers for rocks
    const rockClusters = [
      { x: -18, z: -20 }, { x: 28, z: 25 }, { x: -25, z: 15 },
    ];

    for (const center of rockClusters) {
      const count = 2 + Math.floor(rng() * 3); // 2-4
      for (let j = 0; j < count; j++) {
        const ox = (rng() - 0.5) * 5;
        const oz = (rng() - 0.5) * 5;
        const scale = 0.5 + rng() * 1.0;
        const rotY = rng() * Math.PI * 2;
        const colorIndex = Math.floor(rng() * ROCK_COLORS.length);
        result.push({ pos: [center.x + ox, scale * 0.2, center.z + oz], scale, rotY, colorIndex });
      }
    }

    // A few standalone
    for (let i = 0; i < 4; i++) {
      const x = (rng() - 0.5) * ws * 0.6;
      const z = (rng() - 0.5) * ws * 0.6;
      const scale = 0.3 + rng() * 1.2;
      const rotY = rng() * Math.PI * 2;
      const colorIndex = Math.floor(rng() * ROCK_COLORS.length);
      result.push({ pos: [x, scale * 0.2, z], scale, rotY, colorIndex });
    }

    return result;
  }, []);

  // ── Houses ─────────────────────────────────────────────────────
  const houses = useMemo(() => [
    { pos: [12, 0, 8] as [number, number, number], wallColor: '#f0e6d0', roofColor: '#a04040', rotY: -0.4, w: 3.2, h: 2.6, d: 3.0 },
    { pos: [-14, 0, 10] as [number, number, number], wallColor: '#d0e0f0', roofColor: '#8a6a4a', rotY: 0.5, w: 2.8, h: 2.4, d: 2.8 },
    { pos: [10, 0, -16] as [number, number, number], wallColor: '#f0d0d0', roofColor: '#4a6a8a', rotY: 2.8, w: 3.0, h: 2.5, d: 3.2 },
    { pos: [-12, 0, -14] as [number, number, number], wallColor: '#d0f0e0', roofColor: '#a04040', rotY: -2.3, w: 3.4, h: 2.8, d: 3.0 },
    { pos: [22, 0, 0] as [number, number, number], wallColor: '#f0f0d0', roofColor: '#8a6a4a', rotY: 1.6, w: 2.8, h: 2.3, d: 2.6 },
    { pos: [-22, 0, -2] as [number, number, number], wallColor: '#e0d0f0', roofColor: '#4a6a8a', rotY: -1.5, w: 3.0, h: 2.6, d: 3.0 },
  ], []);

  // ── Flowers (clustered near houses and along paths) ────────────
  const flowers = useMemo(() => {
    const rng = seededRandom(77);
    const colors = ['#ff6b6b', '#ffd93d', '#ff9ff3', '#ffffff', '#a29bfe', '#fd79a8'];
    const result: { pos: [number, number, number]; color: string }[] = [];

    // Cluster near houses
    for (const h of houses) {
      const clusterSize = 4 + Math.floor(rng() * 5); // 4-8
      for (let j = 0; j < clusterSize; j++) {
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

  // ── Fences ─────────────────────────────────────────────────────
  const fences = useMemo(() => {
    const result: { pos: [number, number, number]; rotY: number }[] = [];
    for (let z = -30; z <= 30; z += 2.5) {
      if (Math.abs(z) < 3) continue;
      result.push({ pos: [2.5, 0, z], rotY: 0 });
    }
    return result;
  }, []);

  // ── Mushrooms (near trees) ─────────────────────────────────────
  const mushrooms = useMemo(() => {
    const rng = seededRandom(555);
    const result: { pos: [number, number, number]; scale: number }[] = [];
    // Place near some tree positions
    for (let i = 0; i < 10; i++) {
      const treeIdx = Math.floor(rng() * trees.length);
      const tree = trees[treeIdx];
      const ox = (rng() - 0.5) * 3;
      const oz = (rng() - 0.5) * 3;
      result.push({
        pos: [tree.pos[0] + ox, 0, tree.pos[2] + oz],
        scale: 0.15 + rng() * 0.15,
      });
    }
    return result;
  }, [trees]);

  // ── Pebbles (scattered near rocks and paths) ───────────────────
  const pebbles = useMemo(() => {
    const rng = seededRandom(333);
    const result: { pos: [number, number, number]; scale: number }[] = [];

    // Near rocks
    for (const rock of rocks) {
      const count = 1 + Math.floor(rng() * 2);
      for (let j = 0; j < count; j++) {
        const ox = (rng() - 0.5) * 3;
        const oz = (rng() - 0.5) * 3;
        result.push({
          pos: [rock.pos[0] + ox, 0.03, rock.pos[2] + oz],
          scale: 0.05 + rng() * 0.1,
        });
      }
    }

    // Near paths
    for (let i = 0; i < 6; i++) {
      const along = (rng() - 0.5) * 40;
      const side = rng() > 0.5 ? 2.0 + rng() * 3 : -2.0 - rng() * 3;
      const isNS = rng() > 0.5;
      result.push({
        pos: isNS ? [side, 0.03, along] : [along, 0.03, side],
        scale: 0.05 + rng() * 0.1,
      });
    }

    return result;
  }, [rocks]);

  // ── Shared path material ───────────────────────────────────────
  const pathMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#d4a86c', gradientMap }), []);

  return (
    <>
      {/* Ground */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.02, 0]}>
        <Ground />
      </RigidBody>

      {/* ── Paths (Y-crossroads) ─────────────────────────────── */}
      {/* North-south path */}
      <mesh position={[0, 0.02, -15]} rotation={[-Math.PI / 2, 0, 0]} material={pathMat}>
        <planeGeometry args={[3, 50]} />
      </mesh>
      <mesh position={[0, 0.02, 15]} rotation={[-Math.PI / 2, 0, 0]} material={pathMat}>
        <planeGeometry args={[3, 50]} />
      </mesh>
      {/* East-west path */}
      <mesh position={[-15, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={pathMat}>
        <planeGeometry args={[3, 50]} />
      </mesh>
      <mesh position={[15, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={pathMat}>
        <planeGeometry args={[3, 50]} />
      </mesh>
      {/* Diagonal branch paths */}
      <mesh position={[8, 0.02, 8]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]} material={pathMat}>
        <planeGeometry args={[2.5, 20]} />
      </mesh>
      <mesh position={[-8, 0.02, -8]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]} material={pathMat}>
        <planeGeometry args={[2.5, 20]} />
      </mesh>

      {/* ── Pond ─────────────────────────────────────────────── */}
      <Pond position={[20, -0.08, -18]} />

      {/* ── Trees ────────────────────────────────────────────── */}
      {trees.map((t, i) => (
        <RigidBody key={`tree-${i}`} type="fixed" colliders="trimesh" position={t.pos}>
          <Tree position={[0, 0, 0]} scale={t.scale} type={t.type} rotationY={t.rotY} />
        </RigidBody>
      ))}

      {/* ── Rocks ────────────────────────────────────────────── */}
      {rocks.map((r, i) => (
        <RigidBody key={`rock-${i}`} type="fixed" colliders="ball" position={r.pos}>
          <Rock position={[0, 0, 0]} scale={r.scale} rotationY={r.rotY} colorIndex={r.colorIndex} />
        </RigidBody>
      ))}

      {/* ── Houses ───────────────────────────────────────────── */}
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
          />
        </RigidBody>
      ))}

      {/* ── Flowers ──────────────────────────────────────────── */}
      {flowers.map((f, i) => (
        <Flower key={`flower-${i}`} position={f.pos} color={f.color} />
      ))}

      {/* ── Fences ───────────────────────────────────────────── */}
      {fences.map((f, i) => (
        <FenceSection key={`fence-${i}`} position={f.pos} rotationY={f.rotY} />
      ))}

      {/* ── Mushrooms ────────────────────────────────────────── */}
      {mushrooms.map((m, i) => (
        <Mushroom key={`mushroom-${i}`} position={m.pos} scale={m.scale} />
      ))}

      {/* ── Pebbles ──────────────────────────────────────────── */}
      {pebbles.map((p, i) => (
        <Pebble key={`pebble-${i}`} position={p.pos} scale={p.scale} />
      ))}
    </>
  );
}
