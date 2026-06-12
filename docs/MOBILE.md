# Mobile Performance Guide

## Overview

Otter Village targets 60 FPS on mid-range mobile devices (2021+). Every rendering and physics decision is made with mobile budgets in mind. Desktop benefits from the same optimizations — we just don't need to think as hard about it there.

---

## Rendering Budget

| Metric | Target |
|---|---|
| Frame time | ≤ 16.6ms (60 FPS) |
| Scene memory | < 100 MB |
| Draw calls | < 200 |
| Triangles | < 50,000 |
| DPR range | 1.0 — 1.5 |

---

## Device Pixel Ratio (DPR)

The canvas DPR is capped to prevent high-DPI phones from rendering at 3x:

```ts
// Canvas configuration
<Canvas dpr={[1, 1.5]} />
```

- **Low quality:** DPR locked to 1.0
- **Medium quality:** DPR capped at 1.2
- **High quality:** DPR capped at 1.5

### Adaptive DPR

We use Drei's `PerformanceMonitor` to dynamically adjust DPR based on real-time frame rate:

```tsx
<PerformanceMonitor
  onDecline={() => setDpr(1.0)}
  onIncline={() => setDpr(1.5)}
  flipflop={3}  // samples before adjusting
/>
```

If the device struggles, DPR drops automatically. When it recovers, DPR climbs back up.

---

## Shadows

**Shadows are completely disabled on mobile.**

```ts
// No shadowMap on any light
<ambientLight intensity={0.6} />
<directionalLight intensity={0.8} position={[5, 10, 5]} />
// No shadow-* props
```

This alone saves ~2-4ms per frame on mobile. Instead of shadows, we use:

- Ambient occlusion baked into vertex colors on terrain.
- Darkened material colors on objects sitting on the ground.
- Fake shadow planes (semi-transparent dark circles) under characters.

---

## Materials

All materials are `MeshStandardMaterial` — no PBR, no `MeshPhysicalMaterial`, no custom shaders:

```tsx
<mesh>
  <boxGeometry args={[1, 1, 1]} />
  <meshStandardMaterial color="#7ec8e3" roughness={0.8} />
</mesh>
```

- `roughness` is always 0.7–0.9 for a matte, painterly look.
- `metalness` is always 0 or near-0.
- No normal maps, no roughness maps on mobile — flat colors only.
- Vertex colors used for variation within a single material.

---

## Quality Presets

Three presets control visual quality:

### Low

```ts
{ dpr: 1.0, fog: false, shadows: false, particleCount: 0 }
```

- Minimum rendering cost.
- No fog, no particles.
- Best for older or budget devices.

### Medium

```ts
{ dpr: 1.2, fog: true, shadows: false, particleCount: 20 }
```

- Distance fog for depth cue.
- Limited particle effects (leaves, dust).
- Good balance for most phones.

### High

```ts
{ dpr: 1.5, fog: true, shadows: false, particleCount: 50 }
```

- Full effects except shadows (still off).
- Maximum draw distance.
- For flagship phones and tablets.

---

## Canvas Configuration

```tsx
<Canvas
  dpr={[1, 1.5]}
  gl={{
    antialias: false,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
  }}
  frameloop="always"
/>
```

- **antialias off:** Saves ~1ms per frame. Mobile screens are high enough DPI that aliasing is less noticeable.
- **powerPreference high-performance:** Requests the discrete GPU on devices with hybrid graphics.
- **stencil off:** We don't use stencil operations.
- **depth on:** Required for correct rendering order.

---

## Viewport

```css
/* index.css */
html, body, #root {
  height: 100dvh;           /* dynamic viewport height */
  overflow: hidden;
  touch-action: none;       /* prevent browser gestures */
}

<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

- **`100dvh`** handles mobile browser chrome appearing/disappearing.
- **`touch-action: none`** prevents pull-to-refresh and pinch-zoom.
- **`viewport-fit=cover`** + `env(safe-area-inset-*)` handles notches and rounded corners.
- **`user-scalable=no`** prevents double-tap zoom that interferes with gameplay.

---

## Memory Management

### Geometry Reuse

Objects of the same type share geometry instances:

```ts
// Shared across all trees
const treeTrunkGeo = useMemo(() => new THREE.CylinderGeometry(0.15, 0.2, 1.5, 6), []);
const treeCanopyGeo = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);
```

### Material Caching

Materials are created once and reused:

```ts
const materials = useMemo(() => ({
  grass: new THREE.MeshStandardMaterial({ color: '#68b030', roughness: 0.9 }),
  wood: new THREE.MeshStandardMaterial({ color: '#8B6914', roughness: 0.8 }),
  stone: new THREE.MeshStandardMaterial({ color: '#999999', roughness: 0.7 }),
}), []);
```

### Disposal

All geometries and materials are disposed on unmount:

```tsx
useEffect(() => {
  return () => {
    geometry.dispose();
    material.dispose();
  };
}, []);
```

---

## Touch Controls

See [CONTROLS.md](./CONTROLS.md) for full details. Key mobile-specific points:

- **Virtual joystick** on the left half of the screen (touch-down area).
- **Camera drag** on the right half of the screen.
- All interactive elements are **44px minimum** touch targets (Apple HIG / WCAG 2.5.5).
- Safe area insets respected for all UI panels.

---

## Rapier WASM Loading

Rapier's physics engine loads as a WebAssembly binary:

- **Size:** ~400 KB gzipped.
- **Load time:** ~200ms on fast connections, ~500ms on slow connections.
- **Fallback:** A loading spinner with "Loading physics engine..." is shown while WASM initializes.
- **Preload:** We use `<link rel="preload">` for the WASM binary to parallelize with JS loading.

```ts
// The WASM is loaded automatically by @react-three/rapier
// We just show a Suspense fallback while it initializes
<Suspense fallback={<LoadingScreen />}>
  <Physics>
    {/* ... */}
  </Physics>
</Suspense>
```

---

## Testing Checklist

Before shipping a mobile build, verify on a **real device** (emulators don't catch GPU issues):

- [ ] 60 FPS sustained for 60 seconds with 10+ remote players
- [ ] Memory stable at < 100 MB (check `performance.memory` in Chrome DevTools)
- [ ] No layout shifts when mobile browser chrome appears/disappears
- [ ] Touch controls responsive with no dead zones
- [ ] Battery drain acceptable (no hot loops when tabbed away)
- [ ] WASM loads within 2 seconds on 3G connection
- [ ] No visual glitches on notch/cutout devices
