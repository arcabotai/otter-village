import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { PlayerSnapshot, Species } from '@otter-village/shared';
import { EMOTE_DEFS, lerp, SNAPSHOT_INTERPOLATION_MS } from '@otter-village/shared';

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

const SPECIES_EMOJIS: Record<Species, string> = {
  otter: '🦦',
  cat: '🐱',
  dog: '🐶',
  bunny: '🐰',
  bear: '🐻',
  fox: '🦊',
  penguin: '🐧',
  deer: '🦌',
};

// ── Species-specific ears ────────────────────────────────────────
function SpeciesEars({ species, mat }: { species: Species; mat: THREE.MeshToonMaterial }) {
  switch (species) {
    case 'otter':
      return (
        <>
          <mesh position={[-0.18, 0.42, 0]} material={mat}>
            <sphereGeometry args={[0.07, 6, 6]} />
          </mesh>
          <mesh position={[0.18, 0.42, 0]} material={mat}>
            <sphereGeometry args={[0.07, 6, 6]} />
          </mesh>
        </>
      );
    case 'cat':
      return (
        <>
          <mesh position={[-0.16, 0.45, 0]} material={mat}>
            <coneGeometry args={[0.06, 0.14, 4]} />
          </mesh>
          <mesh position={[0.16, 0.45, 0]} material={mat}>
            <coneGeometry args={[0.06, 0.14, 4]} />
          </mesh>
        </>
      );
    case 'bunny':
      return (
        <>
          <mesh position={[-0.1, 0.55, 0]} material={mat}>
            <capsuleGeometry args={[0.04, 0.22, 4, 6]} />
          </mesh>
          <mesh position={[0.1, 0.55, 0]} material={mat}>
            <capsuleGeometry args={[0.04, 0.22, 4, 6]} />
          </mesh>
        </>
      );
    case 'bear':
      return (
        <>
          <mesh position={[-0.18, 0.42, 0]} material={mat}>
            <sphereGeometry args={[0.08, 6, 6]} />
          </mesh>
          <mesh position={[0.18, 0.42, 0]} material={mat}>
            <sphereGeometry args={[0.08, 6, 6]} />
          </mesh>
        </>
      );
    case 'fox':
      return (
        <>
          <mesh position={[-0.15, 0.46, 0]} material={mat}>
            <coneGeometry args={[0.06, 0.16, 4]} />
          </mesh>
          <mesh position={[0.15, 0.46, 0]} material={mat}>
            <coneGeometry args={[0.06, 0.16, 4]} />
          </mesh>
        </>
      );
    case 'dog':
      return (
        <>
          <mesh position={[-0.2, 0.38, 0.03]} rotation={[0, 0, -0.3]} material={mat}>
            <capsuleGeometry args={[0.05, 0.12, 4, 6]} />
          </mesh>
          <mesh position={[0.2, 0.38, 0.03]} rotation={[0, 0, 0.3]} material={mat}>
            <capsuleGeometry args={[0.05, 0.12, 4, 6]} />
          </mesh>
        </>
      );
    case 'penguin':
      return null;
    case 'deer':
      return (
        <>
          <mesh position={[-0.15, 0.46, 0]} rotation={[0, 0, -0.2]} material={mat}>
            <coneGeometry args={[0.04, 0.18, 4]} />
          </mesh>
          <mesh position={[0.15, 0.46, 0]} rotation={[0, 0, 0.2]} material={mat}>
            <coneGeometry args={[0.04, 0.18, 4]} />
          </mesh>
        </>
      );
  }
}

// ── Species-specific tail ────────────────────────────────────────
function SpeciesTail({ species, mat }: { species: Species; mat: THREE.MeshToonMaterial }) {
  switch (species) {
    case 'otter':
      return (
        <mesh position={[0, -0.18, -0.3]} rotation={[0.8, 0, 0]} material={mat}>
          <capsuleGeometry args={[0.04, 0.35, 4, 6]} />
        </mesh>
      );
    case 'cat':
      return (
        <mesh position={[0, -0.15, -0.35]} rotation={[1.0, 0, 0]} material={mat}>
          <capsuleGeometry args={[0.03, 0.45, 4, 6]} />
        </mesh>
      );
    case 'bunny':
      return (
        <mesh position={[0, -0.15, -0.28]} material={mat}>
          <sphereGeometry args={[0.1, 6, 6]} />
        </mesh>
      );
    case 'bear':
      return (
        <mesh position={[0, -0.15, -0.28]} material={mat}>
          <sphereGeometry args={[0.07, 6, 6]} />
        </mesh>
      );
    case 'fox':
      return (
        <mesh position={[0, -0.15, -0.35]} rotation={[0.8, 0, 0]} material={mat}>
          <capsuleGeometry args={[0.06, 0.35, 4, 6]} />
        </mesh>
      );
    case 'dog':
      return (
        <mesh position={[0, -0.12, -0.3]} rotation={[0.5, 0, 0]} material={mat}>
          <capsuleGeometry args={[0.04, 0.22, 4, 6]} />
        </mesh>
      );
    case 'penguin':
      return null;
    case 'deer':
      return (
        <mesh position={[0, -0.15, -0.28]} material={mat}>
          <sphereGeometry args={[0.06, 6, 6]} />
        </mesh>
      );
  }
}

// ── Full animal character (toon-shaded) ──────────────────────────
function AnimalCharacter({
  species,
  bodyColor,
  eyeWhiteMat,
  eyePupilMat,
  noseMat,
}: {
  species: Species;
  bodyColor: THREE.MeshToonMaterial;
  eyeWhiteMat: THREE.MeshToonMaterial;
  eyePupilMat: THREE.MeshToonMaterial;
  noseMat: THREE.MeshToonMaterial;
}) {
  const orangeMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#ff8c00', gradientMap }), []);

  return (
    <group>
      {/* Body capsule */}
      <mesh position={[0, -0.15, 0]} material={bodyColor}>
        <capsuleGeometry args={[0.22, 0.35, 8, 10]} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.3, 0]} material={bodyColor}>
        <sphereGeometry args={[0.22, 10, 8]} />
      </mesh>

      {/* Eyes — white */}
      <mesh position={[-0.08, 0.33, 0.18]} material={eyeWhiteMat}>
        <sphereGeometry args={[0.05, 6, 6]} />
      </mesh>
      <mesh position={[0.08, 0.33, 0.18]} material={eyeWhiteMat}>
        <sphereGeometry args={[0.05, 6, 6]} />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.08, 0.33, 0.22]} material={eyePupilMat}>
        <sphereGeometry args={[0.025, 6, 6]} />
      </mesh>
      <mesh position={[0.08, 0.33, 0.22]} material={eyePupilMat}>
        <sphereGeometry args={[0.025, 6, 6]} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 0.27, 0.21]} material={noseMat}>
        <sphereGeometry args={[0.025, 6, 6]} />
      </mesh>

      {/* Penguin beak */}
      {species === 'penguin' && (
        <mesh position={[0, 0.27, 0.22]} material={orangeMat}>
          <coneGeometry args={[0.03, 0.08, 4]} />
        </mesh>
      )}

      {/* Species ears */}
      <SpeciesEars species={species} mat={bodyColor} />

      {/* Species tail */}
      <SpeciesTail species={species} mat={bodyColor} />

      {/* Feet */}
      <mesh position={[-0.1, -0.48, 0.06]} material={bodyColor}>
        <sphereGeometry args={[0.07, 6, 6]} />
      </mesh>
      <mesh position={[0.1, -0.48, 0.06]} material={bodyColor}>
        <sphereGeometry args={[0.07, 6, 6]} />
      </mesh>
    </group>
  );
}

interface RemotePlayerProps {
  snapshot: PlayerSnapshot;
}

export function RemotePlayer({ snapshot }: RemotePlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const posRef = useRef(new THREE.Vector3(
    snapshot.position.x,
    snapshot.position.y,
    snapshot.position.z,
  ));
  const rotRef = useRef(snapshot.rotation);
  const targetPos = useRef(new THREE.Vector3(
    snapshot.position.x,
    snapshot.position.y,
    snapshot.position.z,
  ));
  const targetRot = useRef(snapshot.rotation);

  // Update target when snapshot changes
  targetPos.current.set(snapshot.position.x, snapshot.position.y, snapshot.position.z);
  targetRot.current = snapshot.rotation;

  const bodyMat = useMemo(
    () => new THREE.MeshToonMaterial({ color: snapshot.appearance.bodyColor, gradientMap }),
    [snapshot.appearance.bodyColor],
  );
  const eyeWhiteMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap }), []);
  const eyePupilMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#111111', gradientMap }), []);
  const noseMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#333333', gradientMap }), []);

  const species = snapshot.appearance.species;
  const emoji = SPECIES_EMOJIS[species] ?? '🦦';

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const factor = 1 - Math.pow(0.001, dt);

    // Smooth interpolation
    posRef.current.lerp(targetPos.current, factor);
    g.position.copy(posRef.current);

    // Rotation interpolation
    let rotDiff = targetRot.current - rotRef.current;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    rotRef.current += rotDiff * factor;
    g.rotation.y = rotRef.current;
  });

  // Find emote
  const emoteDef = snapshot.emoteId
    ? EMOTE_DEFS[snapshot.emoteId as keyof typeof EMOTE_DEFS]
    : null;

  return (
    <group ref={groupRef}>
      <AnimalCharacter
        species={species}
        bodyColor={bodyMat}
        eyeWhiteMat={eyeWhiteMat}
        eyePupilMat={eyePupilMat}
        noseMat={noseMat}
      />

      {/* Name tag */}
      <Html position={[0, 0.75, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          padding: '2px 8px',
          borderRadius: 6,
          fontSize: 12,
          whiteSpace: 'nowrap',
          fontFamily: 'system-ui',
          textAlign: 'center',
        }}>
          {snapshot.displayName} {emoji}
        </div>
      </Html>

      {/* Emote */}
      {emoteDef && (
        <Html position={[0, 1.2, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            fontSize: 32,
            animation: 'floatUp 3s ease-out forwards',
          }}>
            {emoteDef.emoji}
          </div>
        </Html>
      )}
    </group>
  );
}
