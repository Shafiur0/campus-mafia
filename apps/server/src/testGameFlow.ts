import { io as Client } from 'socket.io-client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'secret1234567890secret1234567890';
const SOCKET_URL = 'http://localhost:5000';

function generateToken(userId: string, userName: string) {
  return jwt.sign({ id: userId, name: userName, avatar: null }, JWT_SECRET);
}

async function runTest() {
  console.log('--- Starting Game Flow Integration Test (4 Players) ---');

  const p1Token = generateToken('user-alice', 'Alice');
  const p2Token = generateToken('user-bob', 'Bob');
  const p3Token = generateToken('user-charlie', 'Charlie');
  const p4Token = generateToken('user-david', 'David');

  const socket1 = Client(SOCKET_URL, { auth: { token: p1Token }, autoConnect: false });
  const socket2 = Client(SOCKET_URL, { auth: { token: p2Token }, autoConnect: false });
  const socket3 = Client(SOCKET_URL, { auth: { token: p3Token }, autoConnect: false });
  const socket4 = Client(SOCKET_URL, { auth: { token: p4Token }, autoConnect: false });

  let roomCode = '';
  let roomId = '';
  let assignedRoles: Record<string, string> = {};

  return new Promise<void>((resolve, reject) => {
    // Error handlers
    socket1.on('error', (err) => console.error('Alice Socket Error:', err));
    socket2.on('error', (err) => console.error('Bob Socket Error:', err));
    socket3.on('error', (err) => console.error('Charlie Socket Error:', err));
    socket4.on('error', (err) => console.error('David Socket Error:', err));

    socket1.on('connect', () => {
      console.log('Alice connected!');
      // Create room
      socket1.emit('room:create', {
        userId: 'user-alice',
        userName: 'Alice',
        avatar: null,
        settings: {
          maxPlayers: 4,
          rolesConfig: {
            STUDENT: 2,
            ASSIGNMENT_MAFIA: 1,
            TEACHER: 1,
            ATTENDANCE_POLICE: 0,
            CR: 0,
            CANTEEN_SPY: 0,
            CHATGPT_HELPER: 0,
          },
          votingMode: 'majority',
          timeouts: { lobby: 5, night: 5, day: 5, voting: 5 },
        },
      });
    });

    socket1.on('room:updated', (room) => {
      if (!roomCode) {
        roomCode = room.code;
        roomId = room.roomId;
        console.log(`Room created with code: ${roomCode}, ID: ${roomId}`);

        // Connect Bob
        socket2.connect();
      }
    });

    socket2.on('connect', () => {
      console.log('Bob connected!');
      socket2.emit('room:join', {
        code: roomCode,
        userId: 'user-bob',
        userName: 'Bob',
        avatar: null,
      });
    });

    // Handle updates when Bob/Charlie/David join
    socket2.on('room:updated', (room) => {
      const bobIn = room.players.some((p: any) => p.userId === 'user-bob');
      const charlieIn = room.players.some((p: any) => p.userId === 'user-charlie');
      const davidIn = room.players.some((p: any) => p.userId === 'user-david');

      if (bobIn && !charlieIn) {
        socket3.connect();
      } else if (charlieIn && !davidIn) {
        socket4.connect();
      }
    });

    socket3.on('connect', () => {
      console.log('Charlie connected!');
      socket3.emit('room:join', {
        code: roomCode,
        userId: 'user-charlie',
        userName: 'Charlie',
        avatar: null,
      });
    });

    socket4.on('connect', () => {
      console.log('David connected!');
      socket4.emit('room:join', {
        code: roomCode,
        userId: 'user-david',
        userName: 'David',
        avatar: null,
      });
    });

    socket4.on('room:updated', (room) => {
      const davidIn = room.players.some((p: any) => p.userId === 'user-david');
      if (davidIn) {
        // Toggle ready for Bob, Charlie, and David
        const bobPlayer = room.players.find((p: any) => p.userId === 'user-bob');
        const charliePlayer = room.players.find((p: any) => p.userId === 'user-charlie');
        const davidPlayer = room.players.find((p: any) => p.userId === 'user-david');

        if (bobPlayer && !bobPlayer.isReady) {
          socket2.emit('room:ready', { roomId, userId: 'user-bob' });
        }
        if (charliePlayer && !charliePlayer.isReady) {
          socket3.emit('room:ready', { roomId, userId: 'user-charlie' });
        }
        if (davidPlayer && !davidPlayer.isReady) {
          socket4.emit('room:ready', { roomId, userId: 'user-david' });
        }
      }
    });

    // Check when all are ready to start
    let startEmitted = false;
    socket1.on('room:updated', (room) => {
      const allReady = room.players.every((p: any) => p.isReady);
      if (allReady && room.players.length === 4 && !startEmitted) {
        startEmitted = true;
        console.log('All players ready! Waiting 500ms for database to sync, then starting game...');
        setTimeout(() => {
          socket1.emit('game:start', { roomId, userId: 'user-alice' });
        }, 500);
      }
    });

    // Capture roles
    const setupRoleListener = (soc: any, name: string, uid: string) => {
      soc.on('role:assigned', (payload: any) => {
        console.log(`${name} role assigned: ${payload.role}`);
        assignedRoles[uid] = payload.role;

        if (Object.keys(assignedRoles).length === 4) {
          console.log('All roles assigned! Sockets entering NIGHT phase.');
          // Simulate night actions after a short delay
          setTimeout(simulateNightActions, 1000);
        }
      });
    };

    setupRoleListener(socket1, 'Alice', 'user-alice');
    setupRoleListener(socket2, 'Bob', 'user-bob');
    setupRoleListener(socket3, 'Charlie', 'user-charlie');
    setupRoleListener(socket4, 'David', 'user-david');

    function simulateNightActions() {
      const mafiaUid = Object.keys(assignedRoles).find(uid => assignedRoles[uid] === 'ASSIGNMENT_MAFIA')!;
      const teacherUid = Object.keys(assignedRoles).find(uid => assignedRoles[uid] === 'TEACHER')!;
      
      // Find the first plain Student to kill
      const studentUids = Object.keys(assignedRoles).filter(uid => assignedRoles[uid] === 'STUDENT');
      const victimUid = studentUids[0];

      console.log(`Roles mapping - Mafia: ${mafiaUid}, Teacher: ${teacherUid}, Victim Student: ${victimUid}`);

      // Mafia targets Victim Student
      const mafiaSocket = mafiaUid === 'user-alice' ? socket1 : mafiaUid === 'user-bob' ? socket2 : mafiaUid === 'user-charlie' ? socket3 : socket4;
      console.log(`${mafiaUid} (Mafia) is sabotaging ${victimUid} (Student)...`);
      mafiaSocket.emit('night:action', {
        roomId,
        userId: mafiaUid,
        actionType: 'ASSIGNMENT_MAFIA',
        targetId: victimUid,
      });

      // Teacher targets Mafia to check them
      const teacherSocket = teacherUid === 'user-alice' ? socket1 : teacherUid === 'user-bob' ? socket2 : teacherUid === 'user-charlie' ? socket3 : socket4;
      console.log(`${teacherUid} (Teacher) is auditing ${mafiaUid} (Mafia)...`);
      teacherSocket.emit('night:action', {
        roomId,
        userId: teacherUid,
        actionType: 'TEACHER',
        targetId: mafiaUid,
      });
    }

    // Capture night result and check transition
    socket1.on('day:message', (msg) => {
      console.log(`[Day Chat Feed] ${msg.senderName}: ${msg.message}`);
      if (msg.senderName === 'Investigation Report') {
        expectTeacherAuditSucceeded(msg.message);
      }
    });

    function expectTeacherAuditSucceeded(msg: string) {
      console.log('Verifying Teacher Audit result contains actual target name instead of CUID...');
      const mafiaUid = Object.keys(assignedRoles).find(uid => assignedRoles[uid] === 'ASSIGNMENT_MAFIA')!;
      const mafiaName = mafiaUid === 'user-alice' ? 'Alice' : mafiaUid === 'user-bob' ? 'Bob' : mafiaUid === 'user-charlie' ? 'Charlie' : 'David';
      
      if (msg.includes(mafiaName)) {
        console.log(`Success! Audit report correctly displayed name: "${mafiaName}"`);
      } else {
        console.error('FAIL: Audit report still using CUID or wrong target reference!', msg);
      }
    }

    socket1.on('night:result', (payload) => {
      console.log('Night phase concluded! Results:', payload);
      const studentUids = Object.keys(assignedRoles).filter(uid => assignedRoles[uid] === 'STUDENT');
      const victimUid = studentUids[0];
      
      if (payload.eliminatedId === victimUid) {
        console.log(`Success! Student ${victimUid} was correctly eliminated.`);
      } else {
        console.error('FAIL: Wrong player eliminated or no elimination occurred!');
      }

      console.log('Waiting for Day timeout to transition to Voting consensus...');
    });

    socket1.on('phase:change', (payload) => {
      console.log(`[Phase Update] -> ${payload.phase} (Round ${payload.roundNumber}, Time Left: ${payload.duration}s)`);
      if (payload.phase === 'VOTING') {
        console.log('VOTING phase active! Simulating votes on Mafia to secure Student victory...');
        setTimeout(simulateVoting, 1000);
      }
    });

    function simulateVoting() {
      const mafiaUid = Object.keys(assignedRoles).find(uid => assignedRoles[uid] === 'ASSIGNMENT_MAFIA')!;
      const teacherUid = Object.keys(assignedRoles).find(uid => assignedRoles[uid] === 'TEACHER')!;
      const aliveStudentUids = Object.keys(assignedRoles).filter(
        uid => assignedRoles[uid] === 'STUDENT' && uid !== Object.keys(assignedRoles).filter(u => assignedRoles[u] === 'STUDENT')[0]
      );
      const survivingStudentUid = aliveStudentUids[0];

      // Sockets of living non-mafia players cast votes on Mafia
      const castVote = (voterUid: string) => {
        const voterSocket = voterUid === 'user-alice' ? socket1 : voterUid === 'user-bob' ? socket2 : voterUid === 'user-charlie' ? socket3 : socket4;
        console.log(`${voterUid} votes to expel ${mafiaUid} (Mafia)...`);
        voterSocket.emit('vote:cast', {
          roomId,
          userId: voterUid,
          targetId: mafiaUid,
        });
        setTimeout(() => {
          voterSocket.emit('vote:confirm', { roomId, userId: voterUid });
        }, 500);
      };

      castVote(teacherUid);
      castVote(survivingStudentUid);
    }

    socket1.on('vote:result', (payload) => {
      console.log('Voting concluded! Result:', payload);
      const mafiaUid = Object.keys(assignedRoles).find(uid => assignedRoles[uid] === 'ASSIGNMENT_MAFIA')!;
      if (payload.eliminatedId === mafiaUid) {
        console.log(`Success! Mafia player ${mafiaUid} was correctly expelled.`);
      } else {
        console.error('FAIL: Mafia was not voted out!', payload);
      }
    });

    socket1.on('game:ended', (payload) => {
      console.log('🎉 GAME OVER! Winning Side:', payload.winningSide);
      console.log('MVP:', payload.mvp);
      console.log('Summary:', payload.summary);

      if (payload.winningSide === 'STUDENTS') {
        console.log('✅ Integration Test Succeeded! All functions verified.');
        disconnectAll();
        resolve();
      } else {
        console.error('FAIL: Game ended but students did not win!');
        disconnectAll();
        reject(new Error('Students did not win'));
      }
    });

    function disconnectAll() {
      socket1.disconnect();
      socket2.disconnect();
      socket3.disconnect();
      socket4.disconnect();
    }

    // Connect Alice to begin the flow
    socket1.connect();
  });
}

// Run the flow
runTest().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
