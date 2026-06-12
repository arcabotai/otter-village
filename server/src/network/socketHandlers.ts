import type { Socket } from 'socket.io';
import type {
  JoinRoom,
  PlayerInputEvent,
  ChatMessage,
  Emote,
  EmoteId,
  ServerEvent,
} from '@otter-village/shared';
import { validateDisplayName, EMOTE_DEFS, PROTOCOL_VERSION } from '@otter-village/shared';
import type { RoomManager } from '../rooms/RoomManager.js';
import type { Logger } from '../utils/logger.js';
import { playerToSnapshot } from '../state/PlayerState.js';
import { validateInput, isInputRateLimited, isMovementReasonable } from '../validation/inputValidation.js';
import { validateChat } from '../validation/chatValidation.js';

export function handleSocket(socket: Socket, roomManager: RoomManager, logger: Logger): void {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('event', (data: unknown) => {
    try {
      const event = data as Record<string, unknown>;
      if (!event || typeof event.type !== 'string') return;

      switch (event.type) {
        case 'JoinRoom':
          handleJoinRoom(socket, roomManager, logger, event as unknown as JoinRoom);
          break;
        case 'LeaveRoom':
          handleLeaveRoom(socket, roomManager, logger);
          break;
        case 'PlayerInput':
          handlePlayerInput(socket, roomManager, event as unknown as PlayerInputEvent);
          break;
        case 'ChatMessage':
          handleChatMessage(socket, roomManager, logger, event as unknown as ChatMessage);
          break;
        case 'Emote':
          handleEmote(socket, roomManager, event as unknown as Emote);
          break;
        case 'CancelEmote':
          handleCancelEmote(socket, roomManager);
          break;
        case 'ListRooms':
          handleListRooms(socket, roomManager);
          break;
        case 'Ping':
          handlePing(socket, event as unknown as { clientTime: number });
          break;
        default:
          sendError(socket, 'UNKNOWN_EVENT', `Unknown event type: ${event.type}`);
      }
    } catch (err) {
      logger.error(`Error handling event from ${socket.id}:`, err);
      sendError(socket, 'INTERNAL_ERROR', 'An internal error occurred.');
    }
  });

  socket.on('disconnect', () => {
    handleDisconnect(socket, roomManager, logger);
  });
}

function handleJoinRoom(
  socket: Socket,
  roomManager: RoomManager,
  logger: Logger,
  data: JoinRoom,
): void {
  // Validate display name
  const nameError = validateDisplayName(data.displayName);
  if (nameError) {
    sendError(socket, 'INVALID_NAME', nameError);
    return;
  }

  // Validate appearance
  if (!data.appearance || typeof data.appearance !== 'object') {
    sendError(socket, 'INVALID_APPEARANCE', 'Invalid appearance data.');
    return;
  }

  // Leave current room if any
  const existingRoom = roomManager.findPlayerRoom(socket.id);
  if (existingRoom) {
    existingRoom.removePlayer(socket.id);
    const leaveEvent: ServerEvent = {
      type: 'PlayerLeft',
      playerId: socket.id,
      displayName: '',
    };
    existingRoom.broadcast(leaveEvent);
  }

  // Join new room
  const roomId = data.roomId || 'village';
  const room = roomManager.joinRoom(roomId, socket, data.displayName.trim(), data.appearance);
  const player = room.findPlayerBySocket(socket.id);

  if (!player) {
    sendError(socket, 'JOIN_FAILED', 'Failed to join room.');
    return;
  }

  // Send RoomJoined to the joining player
  const roomJoined: ServerEvent = {
    type: 'RoomJoined',
    playerId: player.id,
    room: {
      id: room.id,
      name: room.name,
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers,
      visibility: 'public',
    },
    players: room.getSnapshot(),
  };
  socket.emit('event', roomJoined);

  // Broadcast PlayerJoined to others
  const playerJoined: ServerEvent = {
    type: 'PlayerJoined',
    player: playerToSnapshot(player),
  };
  room.broadcast(playerJoined, socket.id);

  logger.info(`Player ${player.displayName} (${player.id}) joined room ${room.id}`);
}

function handleLeaveRoom(
  socket: Socket,
  roomManager: RoomManager,
  logger: Logger,
): void {
  const room = roomManager.findPlayerRoom(socket.id);
  if (!room) return;

  const player = room.findPlayerBySocket(socket.id);
  const displayName = player?.displayName || '';
  const playerId = player?.id || '';

  room.removePlayer(socket.id);

  const leaveEvent: ServerEvent = {
    type: 'PlayerLeft',
    playerId,
    displayName,
  };
  room.broadcast(leaveEvent);

  logger.info(`Player ${displayName} left room ${room.id}`);
}

function handlePlayerInput(
  socket: Socket,
  roomManager: RoomManager,
  data: PlayerInputEvent,
): void {
  const room = roomManager.findPlayerRoom(socket.id);
  if (!room) return;

  const player = room.findPlayerBySocket(socket.id);
  if (!player) return;

  // Validate input structure
  const input = validateInput(data.input);
  if (!input) return;

  // Rate limit
  if (isInputRateLimited(player)) return;

  // Movement sanity check
  if (!isMovementReasonable(player, input)) return;

  // Queue input for processing on next tick
  room.queueInput(player.id, input);
}

function handleChatMessage(
  socket: Socket,
  roomManager: RoomManager,
  logger: Logger,
  data: ChatMessage,
): void {
  const room = roomManager.findPlayerRoom(socket.id);
  if (!room) return;

  const player = room.findPlayerBySocket(socket.id);
  if (!player) return;

  const result = validateChat(player, data.content);
  if (!result.valid) {
    sendError(socket, 'CHAT_ERROR', result.error || 'Invalid message.');
    return;
  }

  room.broadcastChat(player.id, player.displayName, result.sanitized!);
  logger.info(`[Chat] ${player.displayName}: ${result.sanitized}`);
}

function handleEmote(
  socket: Socket,
  roomManager: RoomManager,
  data: Emote,
): void {
  const room = roomManager.findPlayerRoom(socket.id);
  if (!room) return;

  const player = room.findPlayerBySocket(socket.id);
  if (!player) return;

  // Validate emote ID
  const emoteId = data.emoteId as EmoteId;
  if (!EMOTE_DEFS[emoteId]) return;

  // Set emote on player
  player.emoteId = emoteId;
  player.emoteTimer = EMOTE_DEFS[emoteId].duration;

  room.broadcastEmote(player.id, emoteId);
}

function handleCancelEmote(
  socket: Socket,
  roomManager: RoomManager,
): void {
  const room = roomManager.findPlayerRoom(socket.id);
  if (!room) return;

  const player = room.findPlayerBySocket(socket.id);
  if (!player) return;

  player.emoteId = null;
  player.emoteTimer = null;

  const event: ServerEvent = {
    type: 'EmoteCancelled',
    playerId: player.id,
  };
  room.broadcast(event);
}

function handleListRooms(
  socket: Socket,
  roomManager: RoomManager,
): void {
  const event: ServerEvent = {
    type: 'RoomList',
    rooms: roomManager.listRooms(),
  };
  socket.emit('event', event);
}

function handlePing(
  socket: Socket,
  data: { clientTime: number },
): void {
  const event: ServerEvent = {
    type: 'Pong',
    clientTime: data.clientTime,
    serverTime: Date.now(),
  };
  socket.emit('event', event);
}

function handleDisconnect(
  socket: Socket,
  roomManager: RoomManager,
  logger: Logger,
): void {
  const room = roomManager.leaveRoom(socket.id);
  if (room) {
    const leaveEvent: ServerEvent = {
      type: 'PlayerLeft',
      playerId: socket.id,
      displayName: '',
    };
    room.broadcast(leaveEvent);
  }
  logger.info(`Socket disconnected: ${socket.id}`);
}

function sendError(socket: Socket, code: string, message: string): void {
  const event: ServerEvent = {
    type: 'Error',
    code,
    message,
  };
  socket.emit('event', event);
}
