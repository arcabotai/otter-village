import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { CONFIG } from './config/index.js';
import { logger } from './utils/logger.js';
import { createSocketServer } from './network/socketServer.js';
import { RoomManager } from './rooms/RoomManager.js';
import { handleSocket } from './network/socketHandlers.js';

const app = express();
app.use(cors({ origin: CONFIG.CLIENT_ORIGIN }));
app.use(express.json());

// Health endpoint
const startTime = Date.now();
app.get('/health', (_req, res) => {
  const uptime = (Date.now() - startTime) / 1000;
  let totalPlayers = 0;
  for (const room of roomManager.listRooms()) {
    totalPlayers += room.playerCount;
  }
  res.json({
    status: 'ok',
    players: totalPlayers,
    uptime,
  });
});

const httpServer = createServer(app);
const io = createSocketServer(httpServer, CONFIG.CLIENT_ORIGIN);

// Create room manager
const roomManager = new RoomManager();

// Socket.io connection handler
io.on('connection', (socket) => {
  handleSocket(socket, roomManager, logger);
});

// Start server
httpServer.listen(CONFIG.PORT, () => {
  logger.info(`Otter Village server listening on port ${CONFIG.PORT}`);
  logger.info(`CORS origin: ${CONFIG.CLIENT_ORIGIN}`);
});
