import type { Socket } from 'socket.io';
import type { PlayerAppearance, RoomListItem } from '@otter-village/shared';
import { GameRoom } from './GameRoom.js';

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();

  constructor() {
    // Create default village room
    this.rooms.set('village', new GameRoom('village', 'Village Square', 50));
  }

  listRooms(): RoomListItem[] {
    const items: RoomListItem[] = [];
    for (const room of this.rooms.values()) {
      items.push({
        id: room.id,
        name: room.name,
        playerCount: room.players.size,
        maxPlayers: room.maxPlayers,
        visibility: 'public',
      });
    }
    return items;
  }

  joinRoom(
    roomId: string,
    socket: Socket,
    displayName: string,
    appearance: PlayerAppearance,
  ): GameRoom {
    let room = this.rooms.get(roomId);
    if (!room) {
      // Auto-create room
      room = new GameRoom(roomId, roomId, 50);
      this.rooms.set(roomId, room);
    }
    room.addPlayer(socket, displayName, appearance);
    return room;
  }

  leaveRoom(socketId: string): GameRoom | undefined {
    for (const room of this.rooms.values()) {
      const player = room.findPlayerBySocket(socketId);
      if (player) {
        room.removePlayer(socketId);
        return room;
      }
    }
    return undefined;
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  findPlayerRoom(socketId: string): GameRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.findPlayerBySocket(socketId)) {
        return room;
      }
    }
    return undefined;
  }
}
