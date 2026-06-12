import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function Sky() {
  const { scene } = useThree();

  // Set scene background to a sky color and add fog
  useMemo(() => {
    scene.background = new THREE.Color('#87ceeb');
    scene.fog = new THREE.FogExp2('#87ceeb', 0.008);
  }, [scene]);

  return null;
}
