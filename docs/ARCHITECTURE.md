# Architecture Guide

## System Overview

Otter Village is a multiplayer 3D social game built as a monorepo with three packages:

```
otter-village/
├── client/          # React 19 + R3F + Rapier + Zustand
├── server/          # Express + Socket.io
└── shared/          # Protocol types, constants, utilities
```

The split is intentional:

- **Client renders.** All visual presentation, physics interpolation, and input capture happen in the browser.
- **Server validates.** Movement speed, bounds, jump frequency, and chat rate limits are enforced server-side.
- **Shared defines protocol.** Event names, payload shapes, game constants, and math helpers live in one package so client and server never drift apart.

---

## Technology Decisions

### Why React Three Fiber

- **Declarative 3D.** Scene graph expressed as JSX — `<mesh>`, `<group>`, `<ambientLight>` — instead of imperative `scene.add()` calls.
- **React ecosystem.** State management (Zustand), routing, code splitting, and component libraries all work out of the box.
- **Mobile performance.** R3F + Drei ship with adaptive DPR, performance monitors, and suspend-based loading that keep frame budgets tight on mobile.
- **Community.** Drei, React Spring, Leva, and dozens of R3F helpers accelerate development.

### Why Rapier

- **Fast WASM physics.** Rapier compiles to WebAssembly and runs at native-like speed in the browser.
- **Deterministic.** Same inputs → same outputs across client and server, which is critical for multiplayer validation and client prediction corrections.
- **Lightweight.** Small bundle compared to Ammo.js or Cannon-es.
- **Kinematic bodies.** Our player controller uses kinematic RigidBodies with manual position updates, which Rapier handles cleanly.

### Why Zustand

- **No unnecessary re-renders.** Zustand uses selectors — components only re-render when their slice changes.
- **Works outside React.** Stores are plain JavaScript; the server, input manager, and physics hooks can all read/write state without React context.
- **Simple.** No boilerplate, no actions/reducers/types ceremony. One `create()` call gives you a store.
- **Middleware.** `subscribeWithSelector`, `devtools`, and `persist` are opt-in and composable.

---

## Client Architecture

```
React App Shell (App.tsx)
 └─ <Canvas> (R3F)
     └─ <Physics> (Rapier)
         ├─ <World />          — terrain, trees, houses, decorations
         ├─ <Players />        — local + remote player entities
         └─ <Atmosphere />     — fog, sky, lighting
 └─ <UI />
     ├─ <HUD />               — player count, minimap
     ├─ <ChatOverlay />       — chat input + message log
     ├─ <EmoteWheel />        — radial emote picker
     └─ <SettingsPanel />     — quality, audio, controls
```

**Key stores:**

| Store | Purpose |
|---|---|
| `usePlayerStore` | Local player state, position, velocity |
| `useRemotePlayerStore` | Other players' interpolated states |
| `useChatStore` | Chat messages, input focus flag |
| `useSettingsStore` | Quality preset, DPR, audio volume |
| `useInputStore` | Current frame input vector, camera yaw |

---

## Server Architecture

```
index.ts (entry point)
 └─ Express
     └─ GET /health              — liveness probe
 └─ Socket.io Server
     ├─ connection middleware    — auth, rate limit setup
     ├─ RoomManager              — map of room ID → GameRoom
     └─ GameRoom
         ├─ tick() @ 20Hz       — simulation step
         ├─ PlayerSimulation    — move, collide, validate each player
         └─ broadcast()         — send Snapshot to all room members
```

**Tick loop (50ms):**

1. Drain queued inputs from all connected sockets.
2. For each player, apply input via `PlayerSimulation.step(dt)`.
3. Validate results (speed cap, bounds check, jump cooldown).
4. Build a `Snapshot` containing all player states + events (joins, leaves, chat).
5. Broadcast snapshot to all sockets in the room.

---

## Shared Package

```
shared/src/
├── protocol.ts      — event names, discriminated union types
├── types.ts         — Vector3, Quaternion, PlayerState, Snapshot, etc.
├── constants.ts     — TICK_RATE, MAX_SPEED, WORLD_BOUNDS, etc.
└── math.ts          — lerp, clamp, distance, normalize
```

Events use discriminated unions so TypeScript narrows payloads automatically:

```ts
type ServerEvent =
  | { type: 'snapshot'; payload: Snapshot }
  | { type: 'playerJoined'; payload: PlayerState }
  | { type: 'playerLeft'; payload: { id: string } }
  | { type: 'correction'; payload: { position: Vector3; sequence: number } }
  | { type: 'chat'; payload: ChatMessage }
  | { type: 'emote'; payload: { id: string; emote: string } };

type ClientEvent =
  | { type: 'input'; payload: PlayerInput }
  | { type: 'chat'; payload: { message: string } }
  | { type: 'emote'; payload: { emote: string } };
```

---

## State Flow

```
Input (keyboard / joystick)
  ↓
InputManager → normalized PlayerInput { move: Vec2, jump: bool, sprint: bool }
  ↓
Client Prediction: apply input locally, increment sequence number
  ↓
Server receives input → queues for next tick
  ↓
Server tick: PlayerSimulation applies input, validates, writes authoritative state
  ↓
Server broadcasts Snapshot { players: PlayerState[], timestamp, seq }
  ↓
Client receives Snapshot:
  ├─ Local player: compare predicted vs authoritative → snap or lerp correction
  └─ Remote players: buffer snapshots, interpolate with 100ms delay
```

**Client prediction** lets the local player move instantly without waiting for the server. If the server's result diverges beyond a threshold (e.g., >0.1 unit), a `correction` event snaps the client back.

**Remote interpolation** smooths other players' movement by always rendering 100ms behind the latest snapshot, blending between the two most recent states.

---

## Why Not Colyseus

Colyseus is a great multiplayer framework, but we chose plain Socket.io for now because:

- **Simplicity.** Socket.io + Express is a stack we already know. Colyseus has its own concepts (rooms, state, schemas) that add learning curve.
- **No schema requirement.** Our state is simple — just player positions and chat. Colyseus's `@type()` decorators would be overkill.
- **Control.** We own every line of the tick loop and can optimize hot paths without fighting framework abstractions.

**Planned upgrade path:** Once we need persistence, match-making, or authoritative rooms with state history, Colyseus (or a similar framework) becomes the right tool. The shared protocol types make migration straightforward — swap the transport layer, keep the event contracts.

---

## Future Roadmap

| Feature | Technology | Why |
|---|---|---|
| Persistence | PostgreSQL + Prisma | Player profiles, inventory, progression |
| Cross-server pub/sub | Redis | Scale beyond a single Node process |
| Asset hosting | Cloudflare R2 | Cheap, fast CDN for GLB/KTX2 files |
| Mobile apps | Capacitor | Wrap the web client in a native shell |
| Observability | Grafana + Prometheus | Tick duration, player count, error rates |
