import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

export function createSocketServer(httpServer: HttpServer, corsOrigin: string): Server {
  return new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
  });
}
