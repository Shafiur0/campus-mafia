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

    const currentId = session.user.id;

    // Fetch friendships
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: currentId },
          { friendId: currentId }
        ]
      },
      include: {
        user: true,
        friend: true
      }
    });

    const friends = friendships
      .filter(f => f.status === 'ACCEPTED')
      .map(f => {
        const otherUser = f.userId === currentId ? f.friend : f.user;
        return {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatar,
          friendshipId: f.id
        };
      });

    const pendingReceived = friendships
      .filter(f => f.status === 'PENDING' && f.friendId === currentId)
      .map(f => ({
        id: f.user.id,
        name: f.user.name,
        avatar: f.user.avatar,
        friendshipId: f.id
      }));

    return NextResponse.json({ friends, pendingReceived });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendId } = await req.json();
    const currentId = session.user.id;

    if (currentId === friendId) {
      return NextResponse.json({ error: 'You cannot add yourself' }, { status: 400 });
    }

    // Check existing
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: currentId, friendId },
          { userId: friendId, friendId: currentId }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Friendship request already exists' }, { status: 400 });
    }

    const request = await prisma.friendship.create({
      data: {
        userId: currentId,
        friendId,
        status: 'PENDING'
      }
    });

    return NextResponse.json(request);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendshipId } = await req.json();
    const currentId = session.user.id;

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship || friendship.friendId !== currentId) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED' }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendshipId } = await req.json();

    await prisma.friendship.delete({
      where: { id: friendshipId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
