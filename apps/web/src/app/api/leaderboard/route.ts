import { NextResponse } from 'next/server';
import { prisma } from '@campus-mafia/db';

export async function GET(req: Request) {
  try {
    const leaderboard = await prisma.userStats.findMany({
      take: 20,
      orderBy: [
        { wins: 'desc' },
        { totalGames: 'asc' }
      ],
      include: {
        user: true
      }
    });

    const formatted = leaderboard.map((item, idx) => ({
      rank: idx + 1,
      userId: item.userId,
      name: item.user.name,
      avatar: item.user.avatar,
      wins: item.wins,
      totalGames: item.totalGames,
      winRate: item.totalGames > 0 ? ((item.wins / item.totalGames) * 100).toFixed(1) : '0.0'
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
