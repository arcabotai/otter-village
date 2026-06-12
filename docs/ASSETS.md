# Assets

## Current State

**All assets are procedural.** The world, characters, and objects are built from Three.js primitives at runtime:

- Boxes, spheres, cylinders, cones, planes.
- `MeshStandardMaterial` with flat colors and vertex color variation.
- No external files required — the game runs with zero asset downloads.

This was a deliberate choice to ship fast and keep bundle size minimal.

---

## Future Asset Pipeline

When custom assets are introduced, they'll follow this structure:

```
client/public/assets/
├── models/
│   ├── character_otter_default.glb
│   ├── character_fox_red.glb
│   ├── accessory_hat_straw.glb
│   ├── tree_oak_large.glb
│   └── house_cottage_v1.glb
├── textures/
│   ├── ground_grass.png
│   ├── ground_sand.png
│   ├── water_normal.png
│   └── sky_gradient.png
└── icons/
    ├── emote_wave.png
    ├── emote_dance.png
    └── ui_button_jump.png
```

---

## Character System

Characters use a **modular** approach — base body + species features + accessories.

### Base Body

Every character shares the same base mesh:

- **Body:** Capsule geometry (radius 0.3, height 0.8)
- **Head:** Sphere geometry (radius 0.35)
- **Eyes:** Two small spheres (radius 0.06), positioned on the head
- **Mouth:** Small dark sphere or flat disc

### Species Features

Species-specific meshes attach to named points on the base:

| Species | Features |
|---|---|
| Otter | Rounded ears (top of head), flat tail (back), whiskers (sides of head) |
| Fox | Pointed ears (top of head), bushy tail (back), snout (front of head) |
| Cat | Triangular ears (top of head), long tail (back) |
| Bear | Round ears (top of head), short tail (back), round snout |
| Rabbit | Long ears (top of head), cotton tail (back) |

### Accessories

Three accessory slots:

| Slot | Example Items |
|---|---|
| `hat` | Straw hat, top hat, beanie, crown, headband |
| `face` | Glasses, monocle, mask, blush marks |
| `back` | Cape, backpack, wings, butterfly net |

Each accessory is a separate mesh that attaches to a bone or anchor point on the character.

### Assembly

```tsx
<CharacterBody color={player.color}>
  <OtterEars color={player.earColor} />
  <OtterTail color={player.tailColor} />
  {player.accessories.hat && <HatAccessory id={player.accessories.hat} />}
  {player.accessories.face && <FaceAccessory id={player.accessories.face} />}
  {player.accessories.back && <BackAccessory id={player.accessories.back} />}
</CharacterBody>
```

---

## Naming Conventions

### Models (GLB)

```
{category}_{type}_{variant}.glb
```

Examples:
- `character_otter_default.glb`
- `character_fox_red.glb`
- `accessory_hat_straw.glb`
- `accessory_face_glasses_round.glb`
- `tree_oak_large.glb`
- `house_cottage_v1.glb`

### Textures

```
{material}_{surface}_{detail}.{ext}
```

Examples:
- `ground_grass_diffuse.png`
- `ground_sand_diffuse.png`
- `water_normal.png`
- `wood_bark_roughness.png`

### Icons

```
{category}_{name}.png
```

Examples:
- `emote_wave.png`
- `emote_dance.png`
- `ui_button_jump.png`
- `ui_icon_settings.png`

---

## GLB Loading

We use Drei's `useGLTF` for loading GLB files:

```tsx
import { useGLTF } from '@react-three/drei';

function TreeOak() {
  const { scene } = useGLTF('/assets/models/tree_oak_large.glb');
  return <primitive object={scene.clone()} />;
}
```

### Requirements

- **Draco compression:** All GLB files must be Draco-compressed to reduce file size. Use `gltf-pipeline` or `gltf-transform`:

```bash
gltf-transform draco input.glb output.glb
```

- **Max texture size:** 512x512 for mobile. Larger textures are downsampled during the build.
- **Texture format:** Prefer KTX2 (Basis Universal) for GPU-compressed textures. Fall back to WebP for browsers without KTX2 support.
- **Preloading:** Critical assets (character models, common accessories) are preloaded with Drei's `useGLTF.preload()`:

```tsx
// In a preload component or useEffect
useGLTF.preload('/assets/models/character_otter_default.glb');
```

---

## World Objects

Reusable world object components:

| Component | Geometry | Notes |
|---|---|---|
| `<Tree />` | Cylinder (trunk) + Sphere/cone (canopy) | 3 variants: oak, pine, cherry |
| `<Rock />` | Dodecahedron (distorted) | Random scale and rotation |
| `<House />` | Box (body) + Prism (roof) | Door and window details |
| `<Fence />` | Repeated box posts + horizontal bars | Instanced for long runs |
| `<Flower />` | Small sphere (bud) + thin cylinder (stem) | Random colors, face camera |
| `<Pond />` | Circle geometry (flat) | Semi-transparent blue material |
| `<Bridge />` | Box (planks) + Cylinders (rails) | Arch shape via curve |

All objects are procedural but can be swapped for GLB models later by changing one component.

---

## Colors

### Palette

The game uses a **pastel palette** to maintain a soft, friendly aesthetic:

| Category | Colors |
|---|---|
| Nature | `#68b030` (grass), `#4a7c23` (dark grass), `#8B6914` (wood), `#5c4033` (dark wood) |
| Water | `#7ec8e3` (shallow), `#4a90d9` (deep) |
| Sky | `#87CEEB` (day), `#FFB347` (sunset), `#2C3E50` (night) |
| Character | `#FFB6C1` (pink), `#ADD8E6` (blue), `#98FB98` (green), `#DDA0DD` (purple) |
| UI | `#FFFFFF` (text), `#000000` (text shadow), `rgba(0,0,0,0.5)` (overlays) |

### Material Style

All world objects use `MeshStandardMaterial` with:

- `roughness`: 0.7–0.9 (matte, painterly)
- `metalness`: 0.0–0.1 (no metallic shine)
- `flatShading`: true (low-poly aesthetic)
- **Vertex colors** for subtle variation within a single material (e.g., slightly different greens on each grass face)

```tsx
// Example: tree with vertex color variation
const geometry = useMemo(() => {
  const geo = new THREE.ConeGeometry(1, 2, 6);
  const colors = new Float32Array(geo.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) {
    const shade = 0.9 + Math.random() * 0.1; // slight random variation
    colors[i] = 0.41 * shade;     // R
    colors[i + 1] = 0.69 * shade; // G
    colors[i + 2] = 0.19 * shade; // B
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}, []);
```

---

## Performance Targets

| Metric | Target | How |
|---|---|---|
| Draw calls | < 100 mobile, < 200 desktop | Geometry instancing, material reuse |
| Triangles | < 50,000 total scene | Low-poly meshes, LOD for distant objects |
| Texture memory | < 32 MB | KTX2 compression, 512px max |
| Model file size | < 500 KB per GLB | Draco compression, vertex quantization |
| Initial load | < 3 MB total bundle | Code splitting, lazy asset loading |

### Instancing

Repeated objects (trees, rocks, flowers, fences) use `THREE.InstancedMesh` via Drei's `<Instances>` component:

```tsx
<Instances>
  <boxGeometry args={[0.1, 0.8, 0.1]} />
  <meshStandardMaterial color="#5c4033" />
  {fencePosts.map((pos, i) => (
    <Instance key={i} position={pos} />
  ))}
</Instances>
```

This reduces draw calls from N (one per post) to 1 (all posts in one draw).
