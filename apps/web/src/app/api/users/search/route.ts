import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@campus-mafia/db';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    // Search users by name, excluding the current logged-in user
    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
        id: {
          not: session.user.id,
        },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
      take: 10,
    });

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
