import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { PlayerSnapshot, Species } from '@otter-village/shared';
import { EMOTE_DEFS, lerp, SNAPSHOT_INTERPOLATION_MS } from '@otter-village/shared';

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
    () => new THREE.MeshStandardMaterial({ color: snapshot.appearance.bodyColor, roughness: 0.7 }),
    [snapshot.appearance.bodyColor],
  );
  const eyeWhiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff' }), []);
  const eyePupilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111111' }), []);
  const noseMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#333333' }), []);

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
      {/* Body */}
      <mesh position={[0, 0.3, 0]} material={bodyMat}>
        <capsuleGeometry args={[0.35, 0.6, 8, 12]} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.0, 0]} material={bodyMat}>
        <sphereGeometry args={[0.3, 10, 8]} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.1, 1.05, 0.24]} material={eyeWhiteMat}><sphereGeometry args={[0.06, 6, 6]} /></mesh>
      <mesh position={[0.1, 1.05, 0.24]} material={eyeWhiteMat}><sphereGeometry args={[0.06, 6, 6]} /></mesh>
      <mesh position={[-0.1, 1.05, 0.28]} material={eyePupilMat}><sphereGeometry args={[0.03, 6, 6]} /></mesh>
      <mesh position={[0.1, 1.05, 0.28]} material={eyePupilMat}><sphereGeometry args={[0.03, 6, 6]} /></mesh>
      <mesh position={[0, 0.97, 0.28]} material={noseMat}><sphereGeometry args={[0.035, 6, 6]} /></mesh>

      {/* Name tag */}
      <Html position={[0, 1.7, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
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
        <Html position={[0, 2.2, 0]} center style={{ pointerEvents: 'none' }}>
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
