'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, ArrowLeft } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { PhaseBackground } from '@/components/ui/PhaseBackground';

interface LeaderboardItem {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  wins: number;
  totalGames: number;
  winRate: string;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [data, setData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((items) => {
        if (Array.isArray(items)) {
          setData(items);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen text-white relative flex flex-col justify-between overflow-x-hidden">
      <PhaseBackground phase="LOBBY" />

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between z-10 max-w-7xl w-full mx-auto border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <NeonButton onClick={() => router.push('/')} className="px-3 py-1.5 text-xs font-mono uppercase bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08]">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </NeonButton>
          <h1 className="text-xl font-display font-bold text-white tracking-wider flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#F59E0B]" />
            CAMPUS LEGENDS
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-10 z-10 space-y-6">
        <GlassCard className="bg-[#12142B]/40 border-white/[0.05] p-6">
          <h2 className="text-lg font-display font-semibold mb-4 text-textMuted uppercase tracking-wider font-mono">Global Rankings</h2>

          {loading ? (
            <p className="text-center text-sm font-mono text-textMuted py-8">Consulting registrar files...</p>
          ) : data.length === 0 ? (
            <p className="text-center text-sm font-mono text-textMuted py-8">No records available. Get playing!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/[0.08] text-textMuted uppercase tracking-wider">
                    <th className="pb-3 w-16">Rank</th>
                    <th className="pb-3">Player</th>
                    <th className="pb-3 text-center">Wins</th>
                    <th className="pb-3 text-center">Games Played</th>
                    <th className="pb-3 text-right">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {data.map((item) => (
                    <tr
                      key={item.userId}
                      onClick={() => router.push(`/profile/${item.userId}`)}
                      className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      {/* Rank */}
                      <td className="py-3.5 font-bold text-sm">
                        {item.rank === 1 ? (
                          <span className="text-[#F59E0B] flex items-center gap-1">🥇 1</span>
                        ) : item.rank === 2 ? (
                          <span className="text-[#94A3B8] flex items-center gap-1">🥈 2</span>
                        ) : item.rank === 3 ? (
                          <span className="text-[#B45309] flex items-center gap-1">🥉 3</span>
                        ) : (
                          <span>{item.rank}</span>
                        )}
                      </td>
                      
                      {/* Avatar + Name */}
                      <td className="py-3.5 flex items-center gap-3">
                        <img
                          src={item.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(item.name)}`}
                          className="w-7 h-7 rounded-full border border-white/10"
                          alt=""
                        />
                        <span className="text-sm font-body font-medium text-white hover:text-[#22D3EE] transition-colors">
                          {item.name}
                        </span>
                      </td>

                      {/* Wins */}
                      <td className="py-3.5 text-center text-sm font-bold text-[#10B981]">{item.wins}</td>

                      {/* Total Games */}
                      <td className="py-3.5 text-center text-sm text-white/70">{item.totalGames}</td>

                      {/* Win Rate */}
                      <td className="py-3.5 text-right text-sm font-bold text-[#22D3EE]">{item.winRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-white/[0.05] text-[10px] font-mono text-textMuted uppercase tracking-widest z-10">
        © 2026 Campus Mafia. Built for university corridors. Developed by{' '}
        <a
          href="https://shafiur-rahaman-shafim.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#22D3EE] hover:underline normal-case"
        >
          Shafiur Rahman Shafim
        </a>
      </footer>
    </div>
  );
}
