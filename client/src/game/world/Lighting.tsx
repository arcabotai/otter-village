export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.6} color="#fff5e6" />
      <directionalLight
        intensity={0.8}
        position={[50, 50, 25]}
        color="#fff0d0"
      />
      <hemisphereLight
        args={['#87ceeb', '#5a8f3c', 0.3]}
      />
    </>
  );
}
