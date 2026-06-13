import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    players: players.size,
    uptime: process.uptime(),
    protocol: 'v1-world',
  });
});

// Serve static client build in production
app.use(express.static(join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../client/dist/index.html'));
});

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ── World state ──
const WORLD_SIZE = 80;
const SPAWN_POINTS = [
  { x: 0, z: 0 },
  { x: 3, z: 2 },
  { x: -2, z: 3 },
  { x: 4, z: -1 },
  { x: -3, z: -2 },
];

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F1948A', '#82E0AA'
];

const ANIMAL_TYPES = ['otter', 'cat', 'bunny', 'bear', 'fox', 'penguin', 'frog', 'deer'];

const players = new Map();
const chatHistory = []; // last 50 messages
const MAX_CHAT = 50;

// ── World objects (trees, houses, flowers etc) ──
const worldObjects = generateWorld();

function generateWorld() {
  const objects = [];
  const rng = mulberry32(42); // seeded RNG for consistent world

  // Trees
  for (let i = 0; i < 60; i++) {
    const x = (rng() - 0.5) * WORLD_SIZE * 0.8;
    const z = (rng() - 0.5) * WORLD_SIZE * 0.8;
    if (Math.abs(x) < 4 && Math.abs(z) < 4) continue; // keep spawn clear
    objects.push({
      id: `tree_${i}`,
      type: 'tree',
      variant: Math.floor(rng() * 3),
      x, z,
      scale: 0.7 + rng() * 0.6,
      rotation: rng() * Math.PI * 2
    });
  }

  // Flowers
  for (let i = 0; i < 80; i++) {
    const x = (rng() - 0.5) * WORLD_SIZE * 0.85;
    const z = (rng() - 0.5) * WORLD_SIZE * 0.85;
    objects.push({
      id: `flower_${i}`,
      type: 'flower',
      variant: Math.floor(rng() * 5),
      x, z,
      scale: 0.3 + rng() * 0.4,
      rotation: rng() * Math.PI * 2
    });
  }

  // Rocks
  for (let i = 0; i < 20; i++) {
    const x = (rng() - 0.5) * WORLD_SIZE * 0.7;
    const z = (rng() - 0.5) * WORLD_SIZE * 0.7;
    if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
    objects.push({
      id: `rock_${i}`,
      type: 'rock',
      variant: Math.floor(rng() * 3),
      x, z,
      scale: 0.4 + rng() * 0.8,
      rotation: rng() * Math.PI * 2
    });
  }

  // Houses
  const housePositions = [
    { x: 8, z: 6 }, { x: -10, z: 8 }, { x: 12, z: -8 },
    { x: -8, z: -10 }, { x: 0, z: 14 }, { x: -14, z: -3 }
  ];
  housePositions.forEach((pos, i) => {
    objects.push({
      id: `house_${i}`,
      type: 'house',
      variant: i % 4,
      x: pos.x, z: pos.z,
      scale: 1,
      rotation: rng() * Math.PI * 0.5
    });
  });

  // Fences
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    const radius = 6 + (i % 3) * 0.1;
    objects.push({
      id: `fence_${i}`,
      type: 'fence',
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      scale: 1,
      rotation: angle + Math.PI / 2
    });
  }

  // Water pond
  objects.push({
    id: 'pond_0',
    type: 'pond',
    x: 18, z: 15,
    scale: 3,
    rotation: 0
  });

  // Bridge
  objects.push({
    id: 'bridge_0',
    type: 'bridge',
    x: 15, z: 13,
    scale: 1,
    rotation: Math.PI / 4
  });

  // Museum / Town Hall
  objects.push({
    id: 'townhall_0',
    type: 'townhall',
    x: -3, z: -8,
    scale: 1.5,
    rotation: 0
  });

  return objects;
}

// Seeded RNG (mulberry32)
function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Socket handling ──
io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  // Player joins
  socket.on('join', (data) => {
    const spawnIndex = players.size % SPAWN_POINTS.length;
    const spawn = SPAWN_POINTS[spawnIndex];
    const colorIndex = players.size % AVATAR_COLORS.length;
    const animalIndex = players.size % ANIMAL_TYPES.length;

    const player = {
      id: socket.id,
      name: sanitize(data?.name || `Villager${players.size + 1}`),
      animal: data?.animal || ANIMAL_TYPES[animalIndex],
      color: AVATAR_COLORS[colorIndex],
      x: spawn.x,
      y: 0,
      z: spawn.z,
      rotation: 0,
      emote: null,
      emoteTime: 0,
      joinedAt: Date.now()
    };

    players.set(socket.id, player);

    // Send world state to new player
    socket.emit('world', {
      worldSize: WORLD_SIZE,
      objects: worldObjects,
      players: Object.fromEntries(players),
      chatHistory
    });

    // Broadcast new player to everyone
    io.emit('playerJoined', player);
    console.log(`🎮 ${player.name} joined as ${player.animal} (${players.size} online)`);
  });

  // Movement
  socket.on('move', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    // Clamp to world bounds
    const bound = WORLD_SIZE / 2 - 1;
    player.x = Math.max(-bound, Math.min(bound, data.x));
    player.z = Math.max(-bound, Math.min(bound, data.z));
    player.rotation = data.rotation ?? player.rotation;

    // Broadcast to others (not back to sender)
    socket.broadcast.emit('playerMoved', {
      id: socket.id,
      x: player.x,
      z: player.z,
      rotation: player.rotation
    });
  });

  // Chat
  socket.on('chat', (message) => {
    const player = players.get(socket.id);
    if (!player) return;

    const msg = {
      id: Date.now().toString(36),
      playerId: socket.id,
      playerName: player.name,
      text: sanitize(message?.text || '').slice(0, 200),
      timestamp: Date.now()
    };

    if (!msg.text) return;

    chatHistory.push(msg);
    if (chatHistory.length > MAX_CHAT) chatHistory.shift();

    io.emit('chatMessage', msg);
  });

  // Emote
  socket.on('emote', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    const emote = data?.emote || 'wave';
    player.emote = emote;
    player.emoteTime = Date.now();

    io.emit('playerEmote', {
      id: socket.id,
      emote,
      timestamp: player.emoteTime
    });

    // Auto-clear emote after 3 seconds
    setTimeout(() => {
      const p = players.get(socket.id);
      if (p && p.emoteTime === player.emoteTime) {
        p.emote = null;
        io.emit('playerEmote', { id: socket.id, emote: null, timestamp: Date.now() });
      }
    }, 3000);
  });

  // Disconnect
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player) {
      console.log(`👋 ${player.name} left (${players.size - 1} online)`);
      players.delete(socket.id);
      io.emit('playerLeft', { id: socket.id });
    }
  });
});

function sanitize(str) {
  return String(str).replace(/[<>&"']/g, c => {
    const map = { '<': '\x3c', '>': '\x3e', '&': '\x26', '"': '\x22', "'": '\x27' };
    return map[c] || c;
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🦦 Otter Village server running on port ${PORT}`);
  console.log(`   World: ${WORLD_SIZE}x${WORLD_SIZE} with ${worldObjects.length} objects`);
});
