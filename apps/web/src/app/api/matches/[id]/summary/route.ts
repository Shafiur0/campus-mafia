import { NextResponse } from 'next/server';
import { prisma } from '@campus-mafia/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch Match details
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            user: true
          }
        }
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const playerDetails = match.players
      .map(p => `${p.user.name} (${p.role})`)
      .join(', ');

    const winner = match.winningSide;

    let summaryText = '';
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 150,
            messages: [
              {
                role: 'user',
                content: `Write a funny 3-sentence match summary for a campus mafia game.
                          Players: ${playerDetails}. Winner: ${winner}.
                          Use university slang. Be dramatic and hilarious.`
              }
            ]
          })
        });

        const data = await response.json();
        summaryText = data.content?.[0]?.text || '';
      } catch (err) {
        console.error('Claude API call failed, falling back to local generator', err);
      }
    }

    if (!summaryText) {
      // Local fallback using university slang
      const slangWords = [
        'The midterms were absolute chaos, but the students finally pulled through.',
        'The Assignment Mafia managed to hijack the group projects, causing absolute GPA destruction.',
        'The Teacher was caught sleeping in the lecture, but the CR restored order just in time.',
        'An attendance crisis was narrowly averted. Graduation was secured!',
      ];
      const randomSlang = slangWords[Math.floor(Math.random() * slangWords.length)];
      summaryText = `Academic alert: The ${winner} secured a complete victory in this campus clash. ${randomSlang} Everyone go buy a samosa from the canteen.`;
    }

    // Update match summary in database
    await prisma.match.update({
      where: { id },
      data: { summary: summaryText }
    });

    return NextResponse.json({ summary: summaryText });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
