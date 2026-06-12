# Changelog

## v2.0.0 — Full TypeScript + React Three Fiber Rewrite

Complete rewrite of Otter Village from monolithic JavaScript to a modular TypeScript architecture.

### What Changed
- **Language**: JavaScript → TypeScript (strict mode, full type safety)
- **Rendering**: Raw Three.js → React Three Fiber + Drei + react-three-rapier
- **State**: Manual DOM manipulation → Zustand stores (7 stores)
- **Architecture**: Monolithic 1344-line Game class → 52 modular TypeScript files
- **Physics**: None → Rapier WASM (capsule colliders, gravity, jump, ground detection)
- **Player Controller**: Custom position-based → Rapier kinematic body with coyote time, jump buffering, air control
- **Camera**: Manual orbit → R3F-based third-person camera with mouse/touch rotation
- **Mobile**: Basic touch → Virtual joystick, camera drag zones, 44px+ touch targets, DPR capping
- **UI**: InnerHTML/DOM → React components (LoginScreen, HUD, ChatPanel, EmoteMenu, PlayerList, Settings)
- **Input**: Keyboard-only → Centralized InputManager (keyboard + mouse + touch → normalized PlayerInput)
- **Server**: JavaScript → TypeScript with validation, rate limiting, anti-cheat checks
- **Shared**: Duplicated code → Shared protocol types, constants, math utilities

### Features
- 🏘️ Procedural low-poly village (trees, rocks, houses, pond, paths, fences, flowers)
- 🦦 8 animal species (otter, cat, dog, bunny, bear, fox, penguin, deer) with unique features
- 🏃 Walk, run, jump with physics (gravity, coyote time, jump buffering)
- 💬 Real-time chat with bubbles above players
- 🎭 10 emotes (wave, dance, happy, sad, angry, love, laugh, thumbsup, thinking, cool)
- 📱 Mobile-first: virtual joystick, touch camera, responsive UI
- 🔌 Multiplayer: 20Hz server tick, snapshot interpolation, input reconciliation
- 🏠 Room system with default "village" room
- 🎨 Species selection, color picker, display names

### Tech Stack
- React 19 + React Three Fiber 9 + Drei 10 + react-three-rapier 2
- Zustand 5 for state management
- Socket.io 4 for networking
- Vite 6 for build
- TypeScript 5.7 strict mode

## v1.2.0 — Graphics Overhaul + Mobile Layout
- MeshToonMaterial cel-shading
- Procedural clouds, vertex-colored ground
- Day/night cycle, sky gradient shader
- Mobile-first portrait layout with virtual joystick

## v1.1.0 — UI/UX Overhaul
- Glass-morphism login, loading spinner
- Cross-origin Socket.io support
- README and CHANGELOG

## v1.0.0 — Initial Release
- Monolithic Three.js multiplayer village game
- Procedural 3D world generation
- Basic multiplayer with chat and emotes
