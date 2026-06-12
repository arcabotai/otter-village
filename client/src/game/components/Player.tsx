import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Species, EMOTE_DEFS } from '@otter-village/shared';
import { usePlayerStore } from '../../state/playerStore';
import { useChatStore } from '../../state/chatStore';
import { useConnectionStore } from '../../state/connectionStore';
import { PlayerController } from '../controllers/PlayerController';

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

interface SpeciesFeaturesProps {
  species: Species;
  bodyColor: THREE.MeshStandardMaterial;
}

function SpeciesFeatures({ species, bodyColor }: SpeciesFeaturesProps) {
  switch (species) {
    case 'otter':
      return (
        <>
          {/* Round ears */}
          <mesh position={[-0.2, 1.85, 0]} material={bodyColor}><sphereGeometry args={[0.1, 6, 6]} /></mesh>
          <mesh position={[0.2, 1.85, 0]} material={bodyColor}><sphereGeometry args={[0.1, 6, 6]} /></mesh>
          {/* Tail */}
          <mesh position={[0, 0.3, -0.4]} rotation={[0.8, 0, 0]} material={bodyColor}><capsuleGeometry args={[0.06, 0.5, 4, 6]} /></mesh>
        </>
      );
    case 'cat':
      return (
        <>
          {/* Pointed ears (cones) */}
          <mesh position={[-0.2, 1.9, 0]} material={bodyColor}><coneGeometry args={[0.08, 0.18, 4]} /></mesh>
          <mesh position={[0.2, 1.9, 0]} material={bodyColor}><coneGeometry args={[0.08, 0.18, 4]} /></mesh>
          {/* Long tail */}
          <mesh position={[0, 0.2, -0.45]} rotation={[1.0, 0, 0]} material={bodyColor}><capsuleGeometry args={[0.04, 0.7, 4, 6]} /></mesh>
        </>
      );
    case 'bunny':
      return (
        <>
          {/* Long ears */}
          <mesh position={[-0.12, 2.05, 0]} material={bodyColor}><capsuleGeometry args={[0.06, 0.35, 4, 6]} /></mesh>
          <mesh position={[0.12, 2.05, 0]} material={bodyColor}><capsuleGeometry args={[0.06, 0.35, 4, 6]} /></mesh>
          {/* Fluffy tail */}
          <mesh position={[0, 0.35, -0.35]} material={bodyColor}><sphereGeometry args={[0.15, 6, 6]} /></mesh>
        </>
      );
    case 'bear':
      return (
        <>
          {/* Round ears */}
          <mesh position={[-0.22, 1.87, 0]} material={bodyColor}><sphereGeometry args={[0.1, 6, 6]} /></mesh>
          <mesh position={[0.22, 1.87, 0]} material={bodyColor}><sphereGeometry args={[0.1, 6, 6]} /></mesh>
          {/* Stub tail */}
          <mesh position={[0, 0.35, -0.35]} material={bodyColor}><sphereGeometry args={[0.1, 6, 6]} /></mesh>
        </>
      );
    case 'fox':
      return (
        <>
          {/* Pointed ears */}
          <mesh position={[-0.18, 1.92, 0]} material={bodyColor}><coneGeometry args={[0.08, 0.2, 4]} /></mesh>
          <mesh position={[0.18, 1.92, 0]} material={bodyColor}><coneGeometry args={[0.08, 0.2, 4]} /></mesh>
          {/* Bushy tail */}
          <mesh position={[0, 0.3, -0.45]} rotation={[0.8, 0, 0]} material={bodyColor}><capsuleGeometry args={[0.08, 0.5, 4, 6]} /></mesh>
        </>
      );
    case 'dog':
      return (
        <>
          {/* Floppy ears */}
          <mesh position={[-0.25, 1.75, 0.05]} rotation={[0, 0, -0.3]} material={bodyColor}><capsuleGeometry args={[0.06, 0.15, 4, 6]} /></mesh>
          <mesh position={[0.25, 1.75, 0.05]} rotation={[0, 0, 0.3]} material={bodyColor}><capsuleGeometry args={[0.06, 0.15, 4, 6]} /></mesh>
          {/* Wagging tail */}
          <mesh position={[0, 0.35, -0.35]} rotation={[0.5, 0, 0]} material={bodyColor}><capsuleGeometry args={[0.05, 0.3, 4, 6]} /></mesh>
        </>
      );
    case 'penguin':
      return (
        <>
          {/* Orange feet */}
          <mesh position={[-0.12, -0.55, 0.08]}><boxGeometry args={[0.12, 0.05, 0.18]} /><meshStandardMaterial color="#ff8c00" /></mesh>
          <mesh position={[0.12, -0.55, 0.08]}><boxGeometry args={[0.12, 0.05, 0.18]} /><meshStandardMaterial color="#ff8c00" /></mesh>
        </>
      );
    case 'deer':
      return (
        <>
          {/* Antler-like ears */}
          <mesh position={[-0.2, 1.92, 0]} rotation={[0, 0, -0.2]} material={bodyColor}><coneGeometry args={[0.06, 0.25, 4]} /></mesh>
          <mesh position={[0.2, 1.92, 0]} rotation={[0, 0, 0.2]} material={bodyColor}><coneGeometry args={[0.06, 0.25, 4]} /></mesh>
          {/* Stub tail */}
          <mesh position={[0, 0.35, -0.35]} material={bodyColor}><sphereGeometry args={[0.08, 6, 6]} /></mesh>
        </>
      );
  }
}

export function LocalPlayer() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const displayName = usePlayerStore((s) => s.displayName);
  const appearance = usePlayerStore((s) => s.appearance);
  const latestChatMsg = useChatStore((s) => s.messages.length > 0 ? s.messages[s.messages.length - 1] : null);

  const bodyMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: appearance.bodyColor, roughness: 0.7 }),
    [appearance.bodyColor],
  );
  const headMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: appearance.bodyColor, roughness: 0.7 }),
    [appearance.bodyColor],
  );
  const eyeWhiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff' }), []);
  const eyePupilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111111' }), []);
  const noseMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#333333' }), []);

  const isLocalPlayer = true;

  return (
    <>
      <PlayerController rigidBodyRef={rigidBodyRef} />
      <RigidBody
        ref={rigidBodyRef}
        type="dynamic"
        colliders={false}
        position={[0, 2, 0]}
        mass={1}
        linearDamping={0.5}
        angularDamping={Infinity}
        lockRotations
        name="local-player"
      >
        <CapsuleCollider args={[0.5, 0.4]} />
        <group>
          {/* Body capsule */}
          <mesh position={[0, 0.3, 0]} material={bodyMat}>
            <capsuleGeometry args={[0.35, 0.6, 8, 12]} />
          </mesh>

          {/* Head */}
          <mesh position={[0, 1.0, 0]} material={headMat}>
            <sphereGeometry args={[0.3, 10, 8]} />
          </mesh>

          {/* Eyes */}
          <mesh position={[-0.1, 1.05, 0.24]} material={eyeWhiteMat}>
            <sphereGeometry args={[0.06, 6, 6]} />
          </mesh>
          <mesh position={[0.1, 1.05, 0.24]} material={eyeWhiteMat}>
            <sphereGeometry args={[0.06, 6, 6]} />
          </mesh>
          <mesh position={[-0.1, 1.05, 0.28]} material={eyePupilMat}>
            <sphereGeometry args={[0.03, 6, 6]} />
          </mesh>
          <mesh position={[0.1, 1.05, 0.28]} material={eyePupilMat}>
            <sphereGeometry args={[0.03, 6, 6]} />
          </mesh>

          {/* Nose */}
          <mesh position={[0, 0.97, 0.28]} material={noseMat}>
            <sphereGeometry args={[0.035, 6, 6]} />
          </mesh>

          {/* Species features */}
          <SpeciesFeatures species={appearance.species} bodyColor={bodyMat} />

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
              {displayName || 'Player'}
            </div>
          </Html>
        </group>
      </RigidBody>
    </>
  );
}
