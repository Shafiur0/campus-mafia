import { notFound } from 'next/navigation';
import { prisma } from '@campus-mafia/db';
import { ResultsPageClient } from '@/components/game/ResultsPageClient';

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;

  // Query database directly (runs secure server-side)
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      players: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!match) {
    const fallbackRoom = await prisma.room.findUnique({
      where: { id: matchId },
      include: {
        matches: {
          include: {
            players: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    const fallbackMatch = fallbackRoom?.matches[fallbackRoom.matches.length - 1];
    if (!fallbackMatch) {
      return notFound();
    }
    
    // Map dates to clean representation if needed, Next.js handles simple Date objects in Server/Client boundaries
    return <ResultsPageClient match={fallbackMatch} />;
  }

  return <ResultsPageClient match={match} />;
}
