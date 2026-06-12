# Controls

## Desktop

### Movement

| Input | Action |
|---|---|
| `W` / `↑` | Move forward |
| `S` / `↓` | Move backward |
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `Shift` (hold) | Sprint |
| `Space` | Jump |

### Camera

| Input | Action |
|---|---|
| Left mouse drag | Orbit camera around player |
| Mouse wheel | Zoom in/out |
| Middle mouse drag | Pan camera |

### Interaction

| Input | Action |
|---|---|
| `Enter` | Open chat (press again to send) |
| `Escape` | Close chat / close menus |
| `1`–`9`, `0` | Quick emotes (mapped in settings) |

### Emote Quick Keys

| Key | Emote |
|---|---|
| `1` | Wave |
| `2` | Dance |
| `3` | Sit |
| `4` | Laugh |
| `5` | Heart |
| `6` | Clap |
| `7` | Sleep |
| `8` | Shrug |
| `9` | Thumbs Up |
| `0` | Custom (configurable) |

---

## Mobile

### Touch Zones

The screen is split into two functional halves:

```
┌──────────────┬──────────────┐
│              │              │
│  LEFT HALF   │ RIGHT HALF   │
│  Joystick    │ Camera drag  │
│  (move)      │ (orbit)      │
│              │              │
└──────────────┴──────────────┘
```

### Buttons

All buttons are positioned above the touch zones, respecting safe area insets:

| Button | Position | Size | Action |
|---|---|---|---|
| ⬆️ Jump | Bottom-right | 56px | Jump |
| 💬 Chat | Top-right | 44px | Open chat |
| 😊 Emote | Top-right (below chat) | 44px | Open emote picker |
| ⚙️ Settings | Top-left | 44px | Open settings |

### Virtual Joystick

- **Activation:** Touch down anywhere on the left half of the screen.
- **Range:** -1.0 to 1.0 on both X and Y axes.
- **Dead zone:** 10% from center — small movements are ignored.
- **Visual:** A semi-transparent circle (base) with a smaller filled circle (thumb) follows the finger.
- **Release:** Lift finger to stop movement; joystick disappears.

### Camera Drag

- **Activation:** Touch down on the right half of the screen.
- **X-axis:** Rotates camera yaw around the player (no limit).
- **Y-axis:** Tilts camera pitch (clamped to 15°–80° from horizontal).
- **Sensitivity:** 0.3° per pixel of drag.

---

## Input System

### Architecture

```
Keyboard / Touch
      ↓
  InputManager (centralized)
      ↓
  PlayerInput { move: Vec2, jump: bool, sprint: bool, yaw: number }
      ↓
  ┌─── Client: apply to local physics body
  └─── Network: send to server
```

All input sources feed into a single `InputManager`. This ensures:

- Keyboard and touch produce identical `PlayerInput` shapes.
- The physics layer doesn't care where input came from.
- Network code sends one consistent event type.

### InputManager

```ts
interface PlayerInput {
  move: { x: number; y: number };  // -1 to 1, normalized
  jump: boolean;
  sprint: boolean;
  yaw: number;                      // camera yaw in radians
}
```

**Desktop flow:**
1. Keyboard events update a `keys` state map.
2. Each frame, `InputManager` reads the keys and produces `move: { x: 0, y: -1 }` for W pressed.
3. Mouse delta updates `yaw`.

**Mobile flow:**
1. Virtual joystick callbacks produce `move: { x: 0.7, y: -0.3 }` directly.
2. Camera drag callbacks update `yaw`.

### Camera Yaw and Movement

Movement is camera-relative, not world-relative:

```ts
// Forward direction is based on camera yaw
const forward = { x: Math.sin(yaw), y: Math.cos(yaw) };
const right = { x: Math.cos(yaw), y: -Math.sin(yaw) };

const worldMove = {
  x: input.move.x * right.x + input.move.y * forward.x,
  z: input.move.x * right.z + input.move.y * forward.z,
};
```

This means pressing W always moves toward where the camera is looking.

---

## Chat

### Opening

- **Desktop:** Press `Enter`.
- **Mobile:** Tap the 💬 button.

### Behavior While Open

- Game input is **suppressed** — WASD and Space do not move the player.
- `Enter` sends the message and keeps the chat open.
- `Escape` closes the chat without sending.
- Click/tap outside the chat input to close.

### Message Display

- Messages appear in a scrollable overlay at the bottom-left.
- New messages auto-scroll to the bottom.
- Messages older than 60 seconds fade out and are removed.
- Max message length: 200 characters.

---

## Accessibility

- **Touch targets:** All buttons are **44px minimum** (Apple HIG, WCAG 2.5.5).
- **Safe areas:** UI respects `env(safe-area-inset-*)` for notches and home indicators.
- **No hover-only:** No interaction requires hover — everything works via click/tap.
- **Color contrast:** All text meets WCAG AA contrast ratio (4.5:1 for normal text).
- **Reduced motion:** If `prefers-reduced-motion` is set, disable camera smoothing and emote animations.
