'use client';

import { RoomPlayer } from '@campus-mafia/types';
import { GlassCard } from '../ui/GlassCard';

interface VotingPanelProps {
  players: RoomPlayer[];
  votes: Record<string, number>; // key: targetId, value: vote count
}

export function VotingPanel({ players, votes }: VotingPanelProps) {
  const maxVotes = Math.max(...Object.values(votes), 1);

  return (
    <GlassCard className="w-full flex flex-col gap-4 bg-[#12142B]/40">
      <h3 className="font-display font-semibold text-lg text-white">Class Consensus Tally</h3>
      <div className="space-y-4">
        {players
          .filter(p => p.isAlive)
          .map(player => {
            const count = votes[player.userId] || 0;
            const percentage = (count / maxVotes) * 100;

            return (
              <div key={player.id} className="flex items-center gap-4">
                {/* Player Name */}
                <div className="w-28 font-body text-sm text-textPrimary truncate">
                  {player.user.name}
                </div>

                {/* Progress Bar Track */}
                <div className="flex-grow h-4 bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.05]">
                  <div
                    style={{ width: count > 0 ? `${percentage}%` : '0%' }}
                    className="h-full bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] shadow-neonAccent transition-all duration-300 rounded-full"
                  />
                </div>

                {/* Count */}
                <div className="w-16 font-mono text-sm font-semibold text-right text-[#22D3EE]">
                  {count} {count === 1 ? 'vote' : 'votes'}
                </div>
              </div>
            );
          })}
      </div>
    </GlassCard>
  );
}
