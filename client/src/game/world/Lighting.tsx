export function Lighting() {
  return (
    <>
      {/* Warm ambient fill */}
      <ambientLight color="#fff5e6" intensity={0.5} />

      {/* Main sun — warm golden, positioned for golden hour feel */}
      <directionalLight
        color="#fff0d4"
        intensity={1.0}
        position={[40, 50, 30]}
      />

      {/* Hemisphere: sky blue top, earthy green bottom */}
      <hemisphereLight
        color="#b1e1ff"
        groundColor="#5a7a3a"
        intensity={0.4}
      />

      {/* Secondary fill from opposite side (softer) */}
      <directionalLight
        color="#e0e8ff"
        intensity={0.3}
        position={[-30, 20, -20]}
      />
    </>
  );
}
