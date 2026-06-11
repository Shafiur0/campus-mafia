import { NextResponse } from 'next/server';
import { prisma } from '@campus-mafia/db';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const { userId, settings } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
        hostId: userId,
        settings: settings || {
          maxPlayers: 8,
          rolesConfig: {
            STUDENT: 4,
            ASSIGNMENT_MAFIA: 2,
            TEACHER: 1,
            ATTENDANCE_POLICE: 1,
            CR: 0,
            CANTEEN_SPY: 0,
            CHATGPT_HELPER: 0,
          },
          votingMode: 'majority',
          timeouts: {
            lobby: 60,
            night: 60,
            day: 120,
            voting: 60,
          },
        },
      },
    });

    // Automatically join the host
    await prisma.roomPlayer.create({
      data: {
        roomId: room.id,
        userId,
        isReady: true,
        isAlive: true,
      },
    });

    return NextResponse.json({ code: room.code, roomId: room.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ valid: false, error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      roomId: room.id,
      code: room.code,
      status: room.status,
      playersCount: room.players.length,
      settings: room.settings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
