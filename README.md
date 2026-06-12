# 🦦 Otter Village

A cozy 3D multiplayer village — Animal Crossing style. Walk around, chat, and hang out with friends.

**🎮 Play now → [ov.arcabot.ai](https://ov.arcabot.ai)**

---

## ✨ Features

- **3D Low-Poly World** — Procedurally generated village with trees, houses, flowers, rocks, a pond, bridge, and town hall
- **Real-Time Multiplayer** — See other players moving, chat with floating bubbles, and express yourself with emotes
- **8 Animal Types** — Otter, cat, bunny, bear, fox, penguin, frog, and deer — each with unique ears and tail
- **Day/Night Cycle** — Dynamic sun, sky gradients, and ambient lighting that shifts over time
- **Chat System** — Type to chat, see messages float above characters
- **Emote System** — 8 emotes with animated float-up effects (or press 1–8)
- **Walk Animation** — Bobbing character movement with smooth rotation
- **Isometric Camera** — Smooth-following camera with cinematic feel

## 🎮 Controls

| Key | Action |
|---|---|
| `W` `A` `S` `D` / Arrow keys | Move |
| `Enter` | Open chat |
| `Escape` | Close chat |
| `1`–`8` | Emotes |

## 🏗️ Tech Stack

- **Frontend:** [Three.js](https://threejs.org/) + [Vite](https://vitejs.dev/)
- **Backend:** [Express](https://expressjs.com/) + [Socket.io](https://socket.io/)
- **Deploy:** [Vercel](https://vercel.com/) (frontend) + [Railway](https://railway.app/) (backend)
- **Domain:** `ov.arcabot.ai`

## 🚀 Local Development

```bash
# Install deps
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Run dev servers
npm run dev
# → Client: http://localhost:5173
# → Server: http://localhost:3001
```

## 📦 Build & Deploy

```bash
# Build client
cd client && npm run build

# Run production server (serves built client)
npm start
```

## 🗺️ World Generation

The village uses a seeded RNG (`mulberry32` with seed `42`) so every player sees the same world:

- 60 trees (3 variants, varied green shades)
- 80 flowers (5 color variants)
- 20 rocks
- 6 houses (4 color schemes)
- 30 fence segments
- 1 pond with lily pads
- 1 bridge
- 1 town hall with clock
- Dirt paths through the village

## 📄 License

MIT
