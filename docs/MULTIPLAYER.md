# Multiplayer Protocol

## Architecture

Otter Village uses a **client-prediction, server-authoritative** model over WebSockets.

- **Client sends** `PlayerInput` every frame (throttled to tick rate).
- **Server simulates** all players at 20 Hz (50ms tick) using the same Rapier physics.
- **Server broadcasts** `Snapshot` containing all player states at 20 Hz.
- **Client predicts** local movement instantly, then reconciles with server corrections.

```
Client                          Server
  │                                │
  │──── PlayerInput ─────────────→│
  │                                │ simulate tick
  │                                │ validate
  │←─── Snapshot ─────────────────│
  │                                │
  │ (reconcile predicted state)    │
```

---

## Event Reference

### Client → Server (C→S)

| Event | Payload | Rate |
|---|---|---|
| `input` | `{ sequence: number, move: Vec2, jump: boolean, sprint: boolean, yaw: number }` | Up to 60/s |
| `chat` | `{ message: string }` | Max 5/s |
| `emote` | `{ emote: string }` | Max 3/s |

### Server → Client (S→C)

| Event | Payload | Trigger |
|---|---|---|
| `snapshot` | `{ timestamp: number, players: PlayerState[], events: GameEvent[] }` | Every tick (20Hz) |
| `correction` | `{ id: string, position: Vec3, velocity: Vec3, sequence: number }` | When prediction diverges > 0.1 unit |
| `playerJoined` | `PlayerState` | New player enters room |
| `playerLeft` | `{ id: string, reason: string }` | Player disconnects or is kicked |
| `chat` | `ChatMessage` | Chat message (server stamps timestamp + sender) |
| `emote` | `{ id: string, emote: string, timestamp: number }` | Another player emotes |
| `kicked` | `{ reason: string }` | Rate limit violation, anti-cheat |

---

## Client Prediction

When the player presses a key or moves the joystick:

1. **InputManager** produces a `PlayerInput` with a monotonically increasing `sequence` number.
2. The client **immediately applies** the input to the local player's physics body — no round-trip wait.
3. The input is sent to the server.
4. The server processes it in the next tick and returns the authoritative result in a `Snapshot`.
5. The client **compares** the predicted state (stored per-sequence) against the server's state.
6. If the difference exceeds the threshold (0.1 unit position, 0.5 unit/s velocity), the client **snaps** to the server state and replays any inputs received after the correction sequence.

```ts
// Simplified reconciliation
const predicted = predictions.get(snapshot.sequence);
if (predicted) {
  const posError = distance(predicted.position, serverState.position);
  if (posError > CORRECTION_THRESHOLD) {
    // Snap to server state
    applyServerState(serverState);
    // Replay buffered inputs after this sequence
    replayInputs(bufferedInputs.filter(i => i.sequence > snapshot.sequence));
  }
}
```

This keeps the game feeling responsive on good connections while staying server-authoritative.

---

## Remote Interpolation

Other players are rendered **100ms behind** real time:

1. Incoming snapshots are buffered in a ring buffer keyed by timestamp.
2. Each render frame, the client calculates `renderTime = now - INTERPOLATION_DELAY` (100ms).
3. It finds the two snapshots that bracket `renderTime`.
4. It linearly interpolates position and spherically interpolates rotation between them.
5. If a snapshot gap exceeds 500ms, it snaps to the latest state instead of extrapolating.

```ts
const renderTime = Date.now() - 100;
const [a, b] = bracketSnapshots(playerId, renderTime);
const t = (renderTime - a.timestamp) / (b.timestamp - a.timestamp);
const position = lerpVec3(a.position, b.position, clamp(t, 0, 1));
const rotation = slerpQuat(a.rotation, b.rotation, clamp(t, 0, 1));
```

This produces smooth movement even with packet jitter.

---

## Rate Limiting

| Action | Limit | Enforcement |
|---|---|---|
| Input events | 60/second | Server drops excess; disconnects after 5s sustained burst |
| Chat messages | 5/second | Server sends `kicked` event after 3 violations in 30s |
| Emotes | 3/second | Server silently drops excess |

Rate limits are enforced per-socket using a sliding window counter. The client also throttles input sends to the server's tick rate to avoid unnecessary bandwidth.

---

## Anti-Cheat

Server validates every player state on each tick:

- **Speed check:** `velocity.length() <= MAX_SPEED * (sprinting ? SPRINT_MULTIPLIER : 1) + TOLERANCE`
- **Bounds check:** `position.x` and `position.z` within `WORLD_MIN` / `WORLD_MAX`
- **Jump frequency:** max 2 jumps per second (cooldown enforced)
- **Vertical position:** `position.y` must be within physics-grounded range

Violations result in the server overwriting the player's state with the last known good position. Repeated violations (>5 in 10 seconds) trigger a disconnect with a `kicked` event.

---

## Connection

### Auto-Reconnect

The client uses exponential backoff on disconnect:

```ts
const delays = [500, 1000, 2000, 4000, 8000, 16000]; // ms
// After max attempts, show reconnect button
```

On reconnect:
1. Client sends a `join` event with session token.
2. Server restores the player's last known state.
3. Client receives a `snapshot` with the current room state.
4. Other players see the reconnected player appear at their last position.

### Heartbeat

Socket.io's built-in ping/pong runs every 25s. If the client misses 3 consecutive pongs, the connection is considered dead and reconnect logic kicks in.

---

## Room System

| Property | Value |
|---|---|
| Default room | `village` |
| Max players per room | 50 |
| Tick rate | 20 Hz (50ms) |
| Broadcast method | Socket.io `room.to(roomId).emit()` |

Players automatically join the `village` room on connection. Future versions will support multiple rooms, private instances, and room hopping.

---

## Future

| Feature | Planned For |
|---|---|
| **Colyseus migration** | Move to authoritative rooms with schema-based state sync |
| **Redis pub/sub** | Cross-process event distribution for horizontal scaling |
| **Database persistence** | Player profiles, inventory, progression saved to Postgres |
| **Delta compression** | Send only changed fields in snapshots to reduce bandwidth |
| **WebSocket upgrade** | Raw `ws` for lower overhead once Socket.io's fallbacks aren't needed |
