import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function Sky() {
  const { scene } = useThree();

  useMemo(() => {
    // Warm sky gradient background
    scene.background = new THREE.Color('#a0d4f0');
    // Soft exponential fog for distance fade
    scene.fog = new THREE.FogExp2('#c8dff0', 0.012);
  }, [scene]);

  return null;
}
