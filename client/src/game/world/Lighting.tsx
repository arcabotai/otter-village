export function Lighting() {
  return (
    <>
      {/* Warm ambient fill */}
      <ambientLight intensity={0.4} color="#fff8f0" />

      {/* Main sunlight — warm, from upper-right */}
      <directionalLight
        intensity={1.0}
        position={[40, 60, 30]}
        color="#fff5e6"
      />

      {/* Hemisphere: sky blue top, dark green ground bounce */}
      <hemisphereLight
        args={['#87ceeb', '#3a5a2a', 0.3]}
      />

      {/* Soft warm fill from opposite side */}
      <directionalLight
        intensity={0.15}
        position={[-30, 20, -20]}
        color="#ffe0c0"
      />
    </>
  );
}
