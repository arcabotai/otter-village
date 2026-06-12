import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function Sky() {
  const { scene } = useThree();

  useMemo(() => {
    // Warm sky background matching horizon
    scene.background = new THREE.Color('#a1c6ea');
    // Warm fog matching the horizon
    scene.fog = new THREE.Fog('#ffd4a6', 30, 100);
  }, [scene]);

  return null;
}
