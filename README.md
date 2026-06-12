# 🦦 Otter Village

A mobile-first, browser-based 3D social multiplayer village game built with React Three Fiber.

Think Animal Crossing meets Roblox — a cozy low-poly world where players walk, chat, emote, and hang out together in real-time.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Client** | React 19, React Three Fiber, Drei, react-three-rapier, Zustand |
| **Server** | Express, Socket.io, TypeScript |
| **Shared** | TypeScript protocol, types, constants, math |
| **Build** | Vite 6, TypeScript 5.7 |
| **Physics** | Rapier (WASM, via react-three-rapier) |

## Quick Start

```bash
# Install all dependencies
cd shared && npm install
cd ../server && npm install
cd ../client && npm install
cd ..

# Start dev (client + server concurrently)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
otter-village/
├── client/          # React + R3F game client
│   ├── src/
│   │   ├── app/     # React app shell
│   │   ├── game/    # Game engine (R3F, physics, input, network, UI)
│   │   │   ├── components/   # World, Player, RemotePlayer
│   │   │   ├── controllers/  # PlayerController, GameCamera
│   │   │   ├── input/        # InputManager, VirtualJoystick
│   │   │   ├── network/      # SocketManager
│   │   │   ├── ui/           # HUD, Chat, EmoteMenu, LoginScreen
│   │   │   └── world/        # Lighting, Sky
│   │   ├── state/   # Zustand stores
│   │   └── styles/  # Global CSS
│   └── index.html
├── server/          # Express + Socket.io server
│   └── src/
│       ├── config/
│       ├── network/     # Socket server & handlers
│       ├── rooms/       # RoomManager, GameRoom
│       ├── simulation/  # Server-side physics
│       ├── state/       # Player state
│       ├── validation/  # Input & chat validation
│       └── utils/       # Logger
├── shared/          # Shared TypeScript (protocol, types, constants, math)
│   └── src/
│       ├── constants/
│       ├── math/
│       ├── protocol/
│       ├── schemas/
│       └── types/
├── docs/            # Documentation
└── package.json     # Root (concurrently dev script)
```

## Controls

### Desktop
- **WASD / Arrow Keys** — Move
- **Space** — Jump
- **Shift** — Run
- **Mouse Drag** — Rotate camera
- **Enter** — Focus chat
- **Escape** — Close menus

### Mobile
- **Left thumb zone** — Virtual joystick (movement)
- **Right side drag** — Rotate camera
- **Jump button** — Jump
- **Chat button** — Open chat
- **Emote button** — Open emote menu

## Environment Variables

### Client (`client/.env`)
```
VITE_SERVER_URL=http://localhost:3001
```

### Server (`server/.env`)
```
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

## Scripts

```bash
npm run dev           # Run client + server concurrently
npm run build         # Build all packages
npm run typecheck     # Type-check all packages
npm run dev:client    # Client only
npm run dev:server    # Server only
```

## Deployment

### Frontend (Vercel)
- Build command: `cd client && npm run build`
- Output directory: `client/dist`
- Set `VITE_SERVER_URL` to your Railway server URL

### Backend (Railway)
- Build command: `npm run build:server`
- Start command: `npm start`
- Set `PORT`, `CLIENT_ORIGIN`, `NODE_ENV`

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture guide.

## License

MIT
