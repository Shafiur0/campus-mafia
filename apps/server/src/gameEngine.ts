import { Server } from 'socket.io';
import { prisma } from '@campus-mafia/db';
import { Role, RoomStatus, Side, RoomSettings, RoomPlayer } from '@campus-mafia/types';

export interface ActiveGame {
  roomId: string;
  roundNumber: number;
  phase: RoomStatus;
  timeLeft: number;
  // Key: actor userId, Value: target userId
  nightActions: Record<string, { role: Role; targetId: string }>;
  // Key: voter userId, Value: target userId
  votes: Record<string, string>;
  confirmedVotes: Set<string>;
  helperHint?: string; // Stored hint from ChatGPT Helper
}

export const activeGames: Record<string, ActiveGame> = {};
let tickerInterval: NodeJS.Timeout | null = null;

export function distributeRoles(playerCount: number): Role[] {
  const roles: Role[] = [];
  
  if (playerCount === 3) {
    roles.push('ASSIGNMENT_MAFIA');
    roles.push('TEACHER');
    roles.push('STUDENT');
  } else if (playerCount >= 4 && playerCount <= 5) {
    roles.push('ASSIGNMENT_MAFIA');
    roles.push('TEACHER');
    while (roles.length < playerCount) {
      roles.push('STUDENT');
    }
  } else if (playerCount >= 6 && playerCount <= 8) {
    roles.push('ASSIGNMENT_MAFIA');
    roles.push('ASSIGNMENT_MAFIA');
    roles.push('TEACHER');
    roles.push('ATTENDANCE_POLICE');
    while (roles.length < playerCount) {
      roles.push('STUDENT');
    }
  } else if (playerCount >= 9) {
    const mafiaCount = playerCount >= 11 ? 3 : 2;
    for (let i = 0; i < mafiaCount; i++) {
      roles.push('ASSIGNMENT_MAFIA');
    }
    roles.push('TEACHER');
    roles.push('ATTENDANCE_POLICE');
    roles.push('CR');
    roles.push('CANTEEN_SPY');
    roles.push('CHATGPT_HELPER');
    while (roles.length < playerCount) {
      roles.push('STUDENT');
    }
  }
  
  // Shuffle roles
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  
  return roles;
}

export function startGameTicker(io: Server) {
  if (tickerInterval) return;
  tickerInterval = setInterval(async () => {
    for (const roomId of Object.keys(activeGames)) {
      const game = activeGames[roomId];
      if (game.phase === 'ENDED') {
        delete activeGames[roomId];
        continue;
      }
      
      game.timeLeft--;
      
      // Emit tick timer updates
      io.to(roomId).emit('phase:change', {
        phase: game.phase,
        duration: game.timeLeft,
        roundNumber: game.roundNumber
      });
      
      if (game.timeLeft <= 0) {
        await transitionToNextPhase(io, roomId);
      }
    }
  }, 1000);
}

export async function transitionToNextPhase(io: Server, roomId: string) {
  const game = activeGames[roomId];
  if (!game) return;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { players: { include: { user: true } } }
  });
  if (!room) return;

  const settings = typeof room.settings === 'string'
    ? JSON.parse(room.settings) as RoomSettings
    : room.settings as unknown as RoomSettings;

  if (game.phase === 'NIGHT') {
    // NIGHT -> DAY
    const result = await resolveNightActions(roomId, game);
    
    // Check if the game has ended
    const winner = await checkWinConditions(roomId);
    if (winner) {
      await endGame(io, roomId, winner);
      return;
    }

    game.phase = 'DAY';
    game.timeLeft = settings.timeouts.day || 120;
    game.votes = {};
    game.confirmedVotes.clear();

    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'DAY' }
    });

    io.to(roomId).emit('night:result', {
      eliminatedId: result.eliminatedId,
      savedId: result.savedId
    });

    // 1. Broadcast ChatGPT Helper hint if any was submitted
    if (game.helperHint) {
      io.to(roomId).emit('day:message', {
        senderId: 'GPT_HELPER',
        senderName: 'ChatGPT Help Desk',
        avatar: null,
        message: `💡 Campus Suggestion: "${game.helperHint}"`,
        timestamp: new Date().toISOString()
      });
    }

    // 2. Generate and privately send dynamic rumor to Canteen Spy (if alive)
    const canteenSpy = room.players.find(p => p.role === 'CANTEEN_SPY' && p.isAlive);
    if (canteenSpy) {
      const actionsList = Object.values(game.nightActions);
      const mafiaAct = actionsList.find(a => a.role === 'ASSIGNMENT_MAFIA');
      const teacherAct = actionsList.find(a => a.role === 'TEACHER');
      const policeAct = actionsList.find(a => a.role === 'ATTENDANCE_POLICE');

      const rumors = [];

      if (mafiaAct) {
        const targetPlayer = room.players.find(p => p.userId === mafiaAct.targetId);
        if (targetPlayer) {
          rumors.push(`Someone heard whispers about a group project sabotage targeting ${targetPlayer.user.name}.`);
        }
      }
      if (teacherAct) {
        rumors.push("A student saw a professor auditing grade records late in the academic office.");
      }
      if (policeAct) {
        const targetPlayer = room.players.find(p => p.userId === policeAct.targetId);
        if (targetPlayer) {
          rumors.push(`Someone was spotted signing a proxy attendance sheet for ${targetPlayer.user.name} in the lecture hall.`);
        }
      }

      let rumorText = '';
      if (rumors.length > 0) {
        rumorText = rumors[Math.floor(Math.random() * rumors.length)];
      } else {
        const localRumors = [
          "Kitchen staff says the samosas might be made from yesterday's dough.",
          "A student was seen sleeping in the reference section of the central library.",
          "The WiFi in the hostel blocks is rumored to go down tonight.",
          "Rumor has it a student has been taking extra help from ChatGPT for their assignments."
        ];
        rumorText = localRumors[Math.floor(Math.random() * localRumors.length)];
      }

      io.to(`user:${canteenSpy.userId}`).emit('day:message', {
        senderId: 'CANTEEN_SPY_WHISPER',
        senderName: 'Canteen Rumors',
        avatar: null,
        message: `🤫 Kitchen Whispers: ${rumorText}`,
        timestamp: new Date().toISOString()
      });
    }

    // Clear nightActions after rumors and hints have been processed
    game.nightActions = {};

    io.to(roomId).emit('phase:change', {
      phase: 'DAY',
      duration: game.timeLeft,
      roundNumber: game.roundNumber
    });

  } else if (game.phase === 'DAY') {
    // DAY -> VOTING
    game.phase = 'VOTING';
    game.timeLeft = settings.timeouts.voting || 60;
    game.votes = {};
    game.confirmedVotes.clear();

    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'VOTING' }
    });

    io.to(roomId).emit('phase:change', {
      phase: 'VOTING',
      duration: game.timeLeft,
      roundNumber: game.roundNumber
    });

  } else if (game.phase === 'VOTING') {
    // VOTING -> NIGHT (or ENDED)
    const result = await resolveVotes(roomId, game, settings);
    
    const winner = await checkWinConditions(roomId);
    if (winner) {
      await endGame(io, roomId, winner);
      return;
    }

    game.phase = 'NIGHT';
    game.timeLeft = settings.timeouts.night || 60;
    game.roundNumber += 1;
    game.votes = {};
    game.confirmedVotes.clear();
    game.nightActions = {};

    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'NIGHT' }
    });

    io.to(roomId).emit('vote:result', {
      eliminatedId: result.eliminatedId,
      voteBreakdown: result.voteBreakdown
    });

    io.to(roomId).emit('phase:change', {
      phase: 'NIGHT',
      duration: game.timeLeft,
      roundNumber: game.roundNumber
    });
  }
  
  await emitRoomUpdate(io, roomId);
}

async function resolveNightActions(roomId: string, game: ActiveGame) {
  const players = await prisma.roomPlayer.findMany({
    where: { roomId, isAlive: true }
  });

  let protectedId: string | null = null;
  let killTargetId: string | null = null;

  // 1. Attendance Police (Protection)
  const policeAction = Object.values(game.nightActions).find(a => a.role === 'ATTENDANCE_POLICE');
  if (policeAction) {
    protectedId = policeAction.targetId;
  }

  // 2. Assignment Mafia (Kill)
  const mafiaActions = Object.values(game.nightActions).filter(a => a.role === 'ASSIGNMENT_MAFIA');
  if (mafiaActions.length > 0) {
    // Tally mafia targets
    const targets: Record<string, number> = {};
    mafiaActions.forEach(act => {
      targets[act.targetId] = (targets[act.targetId] || 0) + 1;
    });
    // Pick target with most votes (or the first one in case of tie)
    let maxVotes = 0;
    for (const [targetId, votes] of Object.entries(targets)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        killTargetId = targetId;
      }
    }
  }

  let eliminatedId: string | null = null;
  let savedId: string | null = null;

  if (killTargetId) {
    if (killTargetId === protectedId) {
      savedId = killTargetId;
    } else {
      eliminatedId = killTargetId;
      // Mark player as dead
      await prisma.roomPlayer.updateMany({
        where: { roomId, userId: eliminatedId },
        data: { isAlive: false }
      });
    }
  }

  return { eliminatedId, savedId };
}

async function resolveVotes(roomId: string, game: ActiveGame, settings: RoomSettings) {
  const players = await prisma.roomPlayer.findMany({
    where: { roomId, isAlive: true }
  });

  const crPlayer = players.find(p => p.role === 'CR');
  const crUserId = crPlayer?.userId;

  // Tally votes
  const voteTally: Record<string, number> = {};
  const voteBreakdown: Record<string, string[]> = {}; // targetUserId -> list of voter names

  for (const [voterId, targetId] of Object.entries(game.votes)) {
    const voter = players.find(p => p.userId === voterId);
    if (!voter) continue;

    // CR counts as 2 votes
    const weight = voterId === crUserId ? 2 : 1;
    voteTally[targetId] = (voteTally[targetId] || 0) + weight;

    if (!voteBreakdown[targetId]) {
      voteBreakdown[targetId] = [];
    }
    voteBreakdown[targetId].push(voter.userId);
  }

  // Find max voted player
  let maxVotes = 0;
  let candidates: string[] = [];
  for (const [targetId, count] of Object.entries(voteTally)) {
    if (count > maxVotes) {
      maxVotes = count;
      candidates = [targetId];
    } else if (count === maxVotes) {
      candidates.push(targetId);
    }
  }

  let eliminatedId: string | null = null;

  if (candidates.length === 1) {
    eliminatedId = candidates[0];
  } else if (candidates.length > 1) {
    // Tie case
    if (settings.votingMode === 'majority') {
      // Majority voting: Tie results in no elimination
      eliminatedId = null;
    } else {
      // Tie breaker enabled (random)
      eliminatedId = candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  if (eliminatedId) {
    await prisma.roomPlayer.updateMany({
      where: { roomId, userId: eliminatedId },
      data: { isAlive: false }
    });
  }

  return { eliminatedId, voteBreakdown };
}

export async function checkWinConditions(roomId: string): Promise<Side | null> {
  const players = await prisma.roomPlayer.findMany({
    where: { roomId, isAlive: true }
  });

  const mafia = players.filter(p => p.role === 'ASSIGNMENT_MAFIA');
  const students = players.filter(p => p.role !== 'ASSIGNMENT_MAFIA');

  if (mafia.length === 0) {
    return 'STUDENTS';
  }

  if (mafia.length >= students.length) {
    return 'MAFIA';
  }

  return null;
}

async function awardAchievements(userId: string) {
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats) return;

  const checkAndCreate = async (type: string) => {
    const exists = await prisma.achievement.findFirst({
      where: { userId, type }
    });
    if (!exists) {
      await prisma.achievement.create({
        data: { userId, type }
      });
    }
  };

  // CAMPUS_LEGEND: wins >= 50
  if (stats.wins >= 50) {
    await checkAndCreate('CAMPUS_LEGEND');
  }

  // ASSIGNMENT_DESTROYER: mafiaWins >= 5
  if (stats.mafiaWins >= 5) {
    await checkAndCreate('ASSIGNMENT_DESTROYER');
  }

  // ATTENDANCE_HERO: studentWins >= 10
  if (stats.studentWins >= 10) {
    await checkAndCreate('ATTENDANCE_HERO');
  }

  // TEACHERS_FAVORITE: wins >= 20
  if (stats.wins >= 20) {
    await checkAndCreate('TEACHERS_FAVORITE');
  }
}

export async function endGame(io: Server, roomId: string, winningSide: Side) {
  // Update database statuses
  await prisma.room.update({
    where: { id: roomId },
    data: { status: 'ENDED' }
  });

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { players: { include: { user: true } } }
  });
  if (!room) return;

  // Save the match results
  const match = await prisma.match.create({
    data: {
      roomId,
      winningSide,
      startedAt: room.createdAt,
      endedAt: new Date(),
      summary: `AI Match Summary: The ${winningSide} secured victory in a thrilling campus face-off!`
    }
  });

  // Save MatchPlayer configurations
  for (const player of room.players) {
    if (player.role) {
      await prisma.matchPlayer.create({
        data: {
          matchId: match.id,
          userId: player.userId,
          role: player.role,
          isAlive: player.isAlive,
          won: (winningSide === 'MAFIA' && player.role === 'ASSIGNMENT_MAFIA') ||
               (winningSide === 'STUDENTS' && player.role !== 'ASSIGNMENT_MAFIA')
        }
      });

      // Update User Stats
      const won = (winningSide === 'MAFIA' && player.role === 'ASSIGNMENT_MAFIA') ||
                  (winningSide === 'STUDENTS' && player.role !== 'ASSIGNMENT_MAFIA');
      
      let stats = await prisma.userStats.findUnique({ where: { userId: player.userId } });
      if (!stats) {
        stats = await prisma.userStats.create({
          data: {
            userId: player.userId
          }
        });
      }

      await prisma.userStats.update({
        where: { userId: player.userId },
        data: {
          totalGames: stats.totalGames + 1,
          wins: stats.wins + (won ? 1 : 0),
          mafiaWins: stats.mafiaWins + (won && player.role === 'ASSIGNMENT_MAFIA' ? 1 : 0),
          studentWins: stats.studentWins + (won && player.role !== 'ASSIGNMENT_MAFIA' ? 1 : 0),
          survivalRate: (stats.survivalRate * stats.totalGames + (player.isAlive ? 100 : 0)) / (stats.totalGames + 1)
        }
      });

      // LAST_BENCHER condition: Win as last student alive
      if (winningSide === 'STUDENTS' && player.role !== 'ASSIGNMENT_MAFIA' && player.isAlive) {
        const otherAliveStudents = room.players.filter(
          p => p.userId !== player.userId && p.role !== 'ASSIGNMENT_MAFIA' && p.isAlive
        );
        if (otherAliveStudents.length === 0) {
          const exists = await prisma.achievement.findFirst({
            where: { userId: player.userId, type: 'LAST_BENCHER' }
          });
          if (!exists) {
            await prisma.achievement.create({
              data: { userId: player.userId, type: 'LAST_BENCHER' }
            });
          }
        }
      }

      // Audit Achievements
      await awardAchievements(player.userId);
    }
  }

  // Trigger game end client event
  io.to(roomId).emit('game:ended', {
    winningSide,
    mvp: room.players[0]?.user.name || 'Anonymous Student',
    stats: {
      roundCount: activeGames[roomId]?.roundNumber || 1,
      survivorsCount: room.players.filter(p => p.isAlive).length
    },
    summary: match.summary
  });

  // Remove room from active memory ticker
  if (activeGames[roomId]) {
    activeGames[roomId].phase = 'ENDED';
  }
}

async function emitRoomUpdate(io: Server, roomId: string) {
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
