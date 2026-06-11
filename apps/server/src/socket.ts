import { Server } from 'socket.io';
import { prisma } from '@campus-mafia/db';
import { AuthenticatedSocket } from './index.js';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomPlayer,
  RoomSettings,
  Role,
  Side
} from '@campus-mafia/types';
import {
  activeGames,
  distributeRoles,
  startGameTicker,
  transitionToNextPhase,
  checkWinConditions,
  endGame
} from './gameEngine.js';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: AuthenticatedSocket
) {
  const userId = socket.user?.id;
  if (!userId) return;

  // Each user joins a private room representing their user ID for targeted messages
  socket.join(`user:${userId}`);

  // room:create
  socket.on('room:create', async ({ settings, userId: uid, userName, avatar }) => {
    try {
      let user = await prisma.user.findUnique({ where: { id: uid } });
      if (!user) {
        user = await prisma.user.create({
          data: { id: uid, name: userName, avatar, isGuest: true }
        });
      }

      let code = generateRoomCode();
      let exists = await prisma.room.findUnique({ where: { code } });
      while (exists) {
        code = generateRoomCode();
        exists = await prisma.room.findUnique({ where: { code } });
      }

      const room = await prisma.room.create({
        data: {
          code,
          hostId: uid,
          settings: JSON.stringify(settings)
        }
      });

      await prisma.roomPlayer.create({
        data: {
          roomId: room.id,
          userId: uid,
          isReady: true,
          isAlive: true
        }
      });

      socket.join(room.id);
      await emitRoomUpdate(io, room.id);
    } catch (err: any) {
      socket.emit('error', { code: 'ROOM_CREATE_FAILED', message: err.message || 'Failed to create room' });
    }
  });

  // room:join
  socket.on('room:join', async ({ code, userId: uid, userName, avatar }) => {
    try {
      const room = await prisma.room.findUnique({
        where: { code: code.toUpperCase() },
        include: { players: true }
      });

      if (!room) {
        socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
        return;
      }

      const settings = typeof room.settings === 'string'
        ? JSON.parse(room.settings) as RoomSettings
        : room.settings as unknown as RoomSettings;

      if (room.players.length >= settings.maxPlayers) {
        socket.emit('error', { code: 'ROOM_FULL', message: 'Room is full' });
        return;
      }

      let user = await prisma.user.findUnique({ where: { id: uid } });
      if (!user) {
        user = await prisma.user.create({
          data: { id: uid, name: userName, avatar, isGuest: true }
        });
      }

      const existingPlayer = room.players.find(p => p.userId === uid);
      if (!existingPlayer) {
        await prisma.roomPlayer.create({
          data: {
            roomId: room.id,
            userId: uid,
            isReady: false,
            isAlive: true
          }
        });
      }

      socket.join(room.id);
      
      // If game is active, also join appropriate rooms (e.g. mafia room if mafia)
      if (room.status !== 'LOBBY' && existingPlayer?.role === 'ASSIGNMENT_MAFIA') {
        socket.join(`mafia:${room.id}`);
      }

      await emitRoomUpdate(io, room.id);
    } catch (err: any) {
      socket.emit('error', { code: 'ROOM_JOIN_FAILED', message: err.message || 'Failed to join room' });
    }
  });

  // room:ready
  socket.on('room:ready', async ({ roomId, userId: uid }) => {
    try {
      const player = await prisma.roomPlayer.findFirst({
        where: { roomId, userId: uid }
      });

      if (!player) {
        socket.emit('error', { code: 'PLAYER_NOT_FOUND', message: 'Player not found in room' });
        return;
      }

      await prisma.roomPlayer.update({
        where: { id: player.id },
        data: { isReady: !player.isReady }
      });

      await emitRoomUpdate(io, roomId);
    } catch (err: any) {
      socket.emit('error', { code: 'ROOM_READY_FAILED', message: err.message || 'Failed to update ready state' });
    }
  });

  // game:start
  socket.on('game:start', async ({ roomId, userId: uid }) => {
    try {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { players: true }
      });

      if (!room) {
        socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
        return;
      }

      if (room.hostId !== uid) {
        socket.emit('error', { code: 'UNAUTHORIZED', message: 'Only host can start the game' });
        return;
      }

      const notReady = room.players.filter(p => !p.isReady);
      if (notReady.length > 0) {
        socket.emit('error', { code: 'PLAYERS_NOT_READY', message: 'All players must be ready' });
        return;
      }

      // 1. Distribute roles
      const roles = distributeRoles(room.players.length);
      
      for (let i = 0; i < room.players.length; i++) {
        const player = room.players[i];
        const role = roles[i];
        
        await prisma.roomPlayer.update({
          where: { id: player.id },
          data: { role, isAlive: true }
        });

        // Generate abilities text
        let abilities: string[] = [];
        if (role === 'ASSIGNMENT_MAFIA') {
          abilities = ['Sabotage student assignments', 'Discuss in the secret Mafia chat channel', 'Vote to eliminate a student each night'];
        } else if (role === 'TEACHER') {
          abilities = ['Investigate a player each night to uncover their secret role'];
        } else if (role === 'ATTENDANCE_POLICE') {
          abilities = ['Protect one student from elimination each night'];
        } else if (role === 'CR') {
          abilities = ['Emergency Meeting: trigger discussion voting phase instantly during the day', 'Counts as 2 votes in class consensus'];
        } else if (role === 'CANTEEN_SPY') {
          abilities = ['Listen to whispers: get rumors from the campus kitchen'];
        } else if (role === 'CHATGPT_HELPER') {
          abilities = ['Generate and broadcast generic anonymous helpful suggestions at night'];
        } else {
          abilities = ['Deceive and survive', 'Vote during class discussion phases to eject suspects'];
        }

        // Emit private event to player
        io.to(`user:${player.userId}`).emit('role:assigned', { role, abilities });
      }

      // Update room status
      await prisma.room.update({
        where: { id: roomId },
        data: { status: 'NIGHT' }
      });

      const settings = typeof room.settings === 'string'
        ? JSON.parse(room.settings) as RoomSettings
        : room.settings as unknown as RoomSettings;

      // Initialize Active Game memory state
      activeGames[roomId] = {
        roomId,
        roundNumber: 1,
        phase: 'NIGHT',
        timeLeft: settings.timeouts.night || 60,
        nightActions: {},
        votes: {},
        confirmedVotes: new Set()
      };

      // Start global server-side tick timer
      startGameTicker(io);

      // Join mafia sockets to the mafia room
      const updatedPlayers = await prisma.roomPlayer.findMany({ where: { roomId } });
      const sockets = await io.in(roomId).fetchSockets();
      
      sockets.forEach(s => {
        const authSoc = s as unknown as AuthenticatedSocket;
        const matchingPlayer = updatedPlayers.find(p => p.userId === authSoc.user?.id);
        if (matchingPlayer?.role === 'ASSIGNMENT_MAFIA') {
          authSoc.join(`mafia:${roomId}`);
        }
      });

      io.to(roomId).emit('game:started', { phase: 'NIGHT', round: 1 });
      await emitRoomUpdate(io, roomId);
    } catch (err: any) {
      socket.emit('error', { code: 'GAME_START_FAILED', message: err.message || 'Failed to start game' });
    }
  });

  // night:action
  socket.on('night:action', async ({ roomId, userId: uid, actionType, targetId }) => {
    try {
      const game = activeGames[roomId];
      if (!game || game.phase !== 'NIGHT') {
        socket.emit('error', { code: 'INVALID_PHASE', message: 'Night actions are only active during the NIGHT phase' });
        return;
      }

      const actor = await prisma.roomPlayer.findFirst({
        where: { roomId, userId: uid }
      });

      if (!actor || !actor.isAlive || actor.role !== actionType) {
        socket.emit('error', { code: 'UNAUTHORIZED', message: 'You are not authorized to perform this action' });
        return;
      }

      if (uid === targetId) {
        socket.emit('error', { code: 'INVALID_TARGET', message: 'You cannot target yourself' });
        return;
      }

      const target = await prisma.roomPlayer.findFirst({
        where: { roomId, userId: targetId },
        include: { user: true }
      });

      if (!target || !target.isAlive) {
        socket.emit('error', { code: 'INVALID_TARGET', message: 'Target player must be alive' });
        return;
      }

      // Record Action
      game.nightActions[uid] = { role: actionType, targetId };

      // Private feedback to Teacher
      if (actionType === 'TEACHER') {
        const isMafia = target.role === 'ASSIGNMENT_MAFIA';
        socket.emit('day:message', {
          senderId: 'SYSTEM',
          senderName: 'Investigation Report',
          avatar: null,
          message: `Investigation result: ${target.user.name} is ${isMafia ? 'an ASSIGNMENT_MAFIA suspect' : 'a normal Student'}.`,
          timestamp: new Date().toISOString()
        });
      }

      // Check if all special roles have taken their actions
      const aliveActionRoles = await prisma.roomPlayer.findMany({
        where: {
          roomId,
          isAlive: true,
          role: { in: ['ASSIGNMENT_MAFIA', 'TEACHER', 'ATTENDANCE_POLICE', 'CHATGPT_HELPER'] }
        }
      });

      const uniqueRoleActors = new Set(aliveActionRoles.map(r => r.userId));
      const submittedActors = Object.keys(game.nightActions);
      const allDone = aliveActionRoles.every(p => submittedActors.includes(p.userId));

      if (allDone) {
        // Fast-forward NIGHT phase
        game.timeLeft = 0;
        await transitionToNextPhase(io, roomId);
      }
    } catch (err: any) {
      socket.emit('error', { code: 'ACTION_FAILED', message: err.message || 'Action registration failed' });
    }
  });

  // day:chat
  socket.on('day:chat', async ({ roomId, userId: uid, message }) => {
    try {
      const game = activeGames[roomId];
      if (!game || (game.phase !== 'DAY' && game.phase !== 'VOTING')) {
        socket.emit('error', { code: 'INVALID_PHASE', message: 'Day chat is only available during active day phases' });
        return;
      }

      const player = await prisma.roomPlayer.findFirst({
        where: { roomId, userId: uid },
        include: { user: true }
      });

      if (!player || !player.isAlive) {
        socket.emit('error', { code: 'UNAUTHORIZED', message: 'Eliminated players cannot speak' });
        return;
      }

      const isMafiaMessage = message.startsWith('[Mafia Channel] ');
      if (isMafiaMessage) {
        if (player.role !== 'ASSIGNMENT_MAFIA') {
          socket.emit('error', { code: 'UNAUTHORIZED', message: 'Only Mafia members can use the Mafia channel' });
          return;
        }

        const cleanMessage = message.slice('[Mafia Channel] '.length);
        io.to(`mafia:${roomId}`).emit('mafia:chat', {
          senderId: uid,
          senderName: player.user.name,
          avatar: player.user.avatar,
          message: cleanMessage
        });
      } else {
        io.to(roomId).emit('day:message', {
          senderId: uid,
          senderName: player.user.name,
          avatar: player.user.avatar,
          message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err: any) {
      socket.emit('error', { code: 'CHAT_FAILED', message: err.message || 'Failed to send chat' });
    }
  });

  // vote:cast
  socket.on('vote:cast', async ({ roomId, userId: uid, targetId }) => {
    try {
      const game = activeGames[roomId];
      if (!game || game.phase !== 'VOTING') {
        socket.emit('error', { code: 'INVALID_PHASE', message: 'Votes can only be cast during the VOTING phase' });
        return;
      }

      const voter = await prisma.roomPlayer.findFirst({
        where: { roomId, userId: uid }
      });

      if (!voter || !voter.isAlive) {
        socket.emit('error', { code: 'UNAUTHORIZED', message: 'Eliminated players cannot vote' });
        return;
      }

      if (game.confirmedVotes.has(uid)) {
        socket.emit('error', { code: 'VOTE_LOCKED', message: 'You have already locked in your vote' });
        return;
      }

      const target = await prisma.roomPlayer.findFirst({
        where: { roomId, userId: targetId }
      });

      if (!target || !target.isAlive) {
        socket.emit('error', { code: 'INVALID_TARGET', message: 'Target player is not active' });
        return;
      }

      // Record vote
      game.votes[uid] = targetId;

      // Tally current vote values
      const tally: Record<string, number> = {};
      const crPlayer = await prisma.roomPlayer.findFirst({ where: { roomId, role: 'CR', isAlive: true } });

      for (const [vId, tId] of Object.entries(game.votes)) {
        const weight = vId === crPlayer?.userId ? 2 : 1;
        tally[tId] = (tally[tId] || 0) + weight;
      }

      io.to(roomId).emit('vote:update', { votes: tally });
    } catch (err: any) {
      socket.emit('error', { code: 'VOTE_FAILED', message: err.message || 'Failed to cast vote' });
    }
  });

  // vote:confirm
  socket.on('vote:confirm', async ({ roomId, userId: uid }) => {
    try {
      const game = activeGames[roomId];
      if (!game || game.phase !== 'VOTING') {
        socket.emit('error', { code: 'INVALID_PHASE', message: 'Confirmations only valid during the VOTING phase' });
        return;
      }

      const voter = await prisma.roomPlayer.findFirst({
        where: { roomId, userId: uid }
      });

      if (!voter || !voter.isAlive) {
        socket.emit('error', { code: 'UNAUTHORIZED', message: 'Only alive players can confirm votes' });
        return;
      }

      game.confirmedVotes.add(uid);

      const aliveCount = await prisma.roomPlayer.count({
        where: { roomId, isAlive: true }
      });

      if (game.confirmedVotes.size >= aliveCount) {
        // Fast-forward transition immediately
        game.timeLeft = 0;
        await transitionToNextPhase(io, roomId);
      }
    } catch (err: any) {
      socket.emit('error', { code: 'CONFIRM_FAILED', message: err.message || 'Failed to lock in vote' });
    }
  });

  // meeting:emergency
  socket.on('meeting:emergency', async ({ roomId, userId: uid }) => {
    try {
      const game = activeGames[roomId];
      if (!game || game.phase !== 'DAY') {
        socket.emit('error', { code: 'INVALID_PHASE', message: 'Emergency meetings can only be triggered during the DAY phase' });
        return;
      }

      const player = await prisma.roomPlayer.findFirst({
        where: { roomId, userId: uid }
      });

      if (!player || !player.isAlive || player.role !== 'CR') {
        socket.emit('error', { code: 'UNAUTHORIZED', message: 'Only the Class Representative (CR) can trigger emergency meetings' });
        return;
      }

      io.to(roomId).emit('day:message', {
        senderId: 'SYSTEM',
        senderName: 'Class Representative',
        avatar: null,
        message: '🚨 CR has called an Emergency Meeting! Transitioning to Class Consensus Voting.',
        timestamp: new Date().toISOString()
      });

      // Jump immediately to VOTING phase
      game.phase = 'DAY'; // Let transition handle it correctly by forcing tick end
      game.timeLeft = 0;
      await transitionToNextPhase(io, roomId);
    } catch (err: any) {
      socket.emit('error', { code: 'EMERGENCY_FAILED', message: err.message || 'Failed to start meeting' });
    }
  });

  // hint:send
  socket.on('hint:send', async ({ roomId, userId: uid, hint }) => {
    try {
      const game = activeGames[roomId];
      if (!game || game.phase !== 'NIGHT') {
        socket.emit('error', { code: 'INVALID_PHASE', message: 'Hints can only be prepared during the NIGHT phase' });
        return;
      }

      const player = await prisma.roomPlayer.findFirst({
        where: { roomId, userId: uid }
      });

      if (!player || !player.isAlive || player.role !== 'CHATGPT_HELPER') {
        socket.emit('error', { code: 'UNAUTHORIZED', message: 'Only the ChatGPT Helper can broadcast hints' });
        return;
      }

      // Record Action in nightActions so the turn registers as complete
      game.nightActions[uid] = { role: 'CHATGPT_HELPER', targetId: 'BROADCAST' };

      // Store hint to broadcast at daybreak
      game.helperHint = hint;

      // Send a confirmation message to the Helper
      socket.emit('day:message', {
        senderId: 'SYSTEM',
        senderName: 'Help Desk Queue',
        avatar: null,
        message: `Your suggestion "${hint}" is queued and will be posted on the campus board at daybreak.`,
        timestamp: new Date().toISOString()
      });

      // Now check if all special roles have taken their actions, just like night:action
      const aliveActionRoles = await prisma.roomPlayer.findMany({
        where: {
          roomId,
          isAlive: true,
          role: { in: ['ASSIGNMENT_MAFIA', 'TEACHER', 'ATTENDANCE_POLICE', 'CHATGPT_HELPER'] }
        }
      });

      const uniqueRoleActors = new Set(aliveActionRoles.map(r => r.userId));
      const submittedActors = Object.keys(game.nightActions);
      const allDone = aliveActionRoles.every(p => submittedActors.includes(p.userId));

      if (allDone) {
        // Fast-forward NIGHT phase
        game.timeLeft = 0;
        await transitionToNextPhase(io, roomId);
      }
    } catch (err: any) {
      socket.emit('error', { code: 'HINT_FAILED', message: err.message || 'Failed to send helper suggestion' });
    }
  });
}

async function emitRoomUpdate(io: Server<ClientToServerEvents, ServerToClientEvents>, roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      players: {
        include: {
          user: true
        }
      }
    }
  });

  if (!room) return;

  const settings = typeof room.settings === 'string'
    ? JSON.parse(room.settings) as RoomSettings
    : room.settings as unknown as RoomSettings;

  const playersMapped = room.players.map((p) => ({
    id: p.id,
    roomId: p.roomId,
    userId: p.userId,
    role: p.role,
    isAlive: p.isAlive,
    isReady: p.isReady,
    user: {
      id: p.user.id,
      name: p.user.name,
      email: p.user.email,
      avatar: p.user.avatar,
      isGuest: p.user.isGuest,
      createdAt: p.user.createdAt
    }
  }));

  io.to(roomId).emit('room:updated', {
    roomId: room.id,
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    settings,
    players: playersMapped
  });
}
