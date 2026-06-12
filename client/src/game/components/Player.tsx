import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Species } from '@otter-village/shared';
import { usePlayerStore } from '../../state/playerStore';
import { useChatStore } from '../../state/chatStore';
import { PlayerController } from '../controllers/PlayerController';

// ── Species-specific ears ─────────────────────────────────────────
function SpeciesEars({ species, mat }: { species: Species; mat: THREE.MeshStandardMaterial }) {
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
      return null; // No ears — has beak instead
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

// ── Species-specific tail ─────────────────────────────────────────
function SpeciesTail({ species, mat }: { species: Species; mat: THREE.MeshStandardMaterial }) {
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

// ── Full animal character ─────────────────────────────────────────
function AnimalCharacter({
  species,
  bodyColor,
  eyeWhiteMat,
  eyePupilMat,
  noseMat,
}: {
  species: Species;
  bodyColor: THREE.MeshStandardMaterial;
  eyeWhiteMat: THREE.MeshStandardMaterial;
  eyePupilMat: THREE.MeshStandardMaterial;
  noseMat: THREE.MeshStandardMaterial;
}) {
  const orangeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ff8c00' }), []);

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

// ── Local player ──────────────────────────────────────────────────
export function LocalPlayer() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const displayName = usePlayerStore((s) => s.displayName);
  const appearance = usePlayerStore((s) => s.appearance);

  const bodyMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: appearance.bodyColor, roughness: 0.7, flatShading: true }),
    [appearance.bodyColor],
  );
  const eyeWhiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff' }), []);
  const eyePupilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111111' }), []);
  const noseMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#333333' }), []);

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
          <AnimalCharacter
            species={appearance.species}
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
              {displayName || 'Player'}
            </div>
          </Html>
        </group>
      </RigidBody>
    </>
  );
}
