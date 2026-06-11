'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Award, Users, BookOpen } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';

interface ResultsPageClientProps {
  match: {
    id: string;
    roomId: string;
    winningSide: string;
    summary: string | null;
    startedAt: Date;
    endedAt: Date | null;
    players: Array<{
      id: string;
      role: string;
      isAlive: boolean;
      won: boolean;
      user: {
        name: string;
        avatar: string | null;
      };
    }>;
  };
}

export function ResultsPageClient({ match }: ResultsPageClientProps) {
  const router = useRouter();
  const [summary, setSummary] = useState(match.summary || 'Analyzing match details...');

  // Trigger AI summary fetch/generation on mount
  useEffect(() => {
    if (!match.summary) {
      fetch(`/api/matches/${match.id}/summary`, { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          if (data.summary) {
            setSummary(data.summary);
          }
        })
        .catch(() => {
          setSummary('Failed to compile campus summary.');
        });
    }
  }, [match]);

  const studentsWon = match.winningSide === 'STUDENTS';

  // Confetti particles generator
  const confettiArray = Array.from({ length: 40 });

  return (
    <div className="min-h-screen bg-[#0A0B1E] flex flex-col items-center justify-center p-6 relative overflow-hidden text-white select-none">
      {/* Background glow */}
      <div className={`absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 pointer-events-none -z-10 ${
        studentsWon ? 'bg-[#22D3EE]' : 'bg-[#F43F5E]'
      }`} />

      {/* Confetti Particles */}
      {confettiArray.map((_, i) => {
        const left = Math.random() * 100; // percent
        const delay = Math.random() * 5; // seconds
        const duration = 4 + Math.random() * 4; // seconds
        const spin = Math.random() * 360;

        return (
          <motion.div
            key={i}
            initial={{ y: -50, x: `${left}vw`, rotate: 0, opacity: 0.8 }}
            animate={{ y: '110vh', rotate: spin + 360 }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute text-xl pointer-events-none -z-10 font-mono select-none"
          >
            {studentsWon ? '🎓' : '📄'}
          </motion.div>
        );
      })}

      {/* Main Glass Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl text-center space-y-8 z-10"
      >
        {/* Victory Announcement Header */}
        <div className="space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center shadow-lg">
            <Trophy className={`w-8 h-8 ${studentsWon ? 'text-[#22D3EE]' : 'text-[#F43F5E]'}`} />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-wider uppercase">
            {studentsWon ? 'Graduated Alive!' : 'GPA Destruction!'}
          </h1>
          <p className="text-sm font-mono text-textMuted uppercase tracking-widest">
            Winner: <span className={studentsWon ? 'text-[#22D3EE]' : 'text-[#F43F5E]'}>{match.winningSide}</span>
          </p>
        </div>

        {/* AI Summary Block */}
        <GlassCard className="p-6 bg-[#12142B]/80 border-white/[0.08] text-left space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <BookOpen className="w-24 h-24 text-white" />
          </div>
          <span className="text-[10px] font-mono text-textMuted uppercase tracking-wider block">AI Match Chronology</span>
          <p className="text-sm leading-relaxed text-white/90 italic font-body">
            &ldquo;{summary}&rdquo;
          </p>
        </GlassCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* MVP Card */}
          <GlassCard className="p-4 bg-[#12142B]/40 flex flex-col items-center justify-center text-center">
            <Award className="w-6 h-6 text-[#F59E0B] mb-2" />
            <span className="text-[10px] font-mono text-textMuted uppercase tracking-wider">Campus MVP</span>
            <p className="text-base font-bold text-white mt-1">
              {match.players.find((p) => p.won)?.user.name || 'Anonymous Student'}
            </p>
          </GlassCard>

          {/* Survivors Card */}
          <GlassCard className="p-4 bg-[#12142B]/40 flex flex-col items-center justify-center text-center">
            <Users className="w-6 h-6 text-[#10B981] mb-2" />
            <span className="text-[10px] font-mono text-textMuted uppercase tracking-wider">Survivors</span>
            <p className="text-base font-bold text-white mt-1">
              {match.players.filter((p) => p.isAlive).length} / {match.players.length} players
            </p>
          </GlassCard>
        </div>

        {/* Player Roster Breakdown */}
        <GlassCard className="bg-[#12142B]/40 border-white/[0.05] p-6 text-left space-y-4">
          <span className="text-[10px] font-mono text-textMuted uppercase tracking-wider block border-b border-white/[0.05] pb-2">Academic Transcripts</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {match.players.map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-[#0A0B1E]/40 border border-white/[0.05] p-2.5 rounded-xl text-xs font-mono">
                <span className="text-white font-medium truncate max-w-[120px]">{p.user.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-textMuted uppercase">{p.role.replace('_', ' ')}</span>
                  <span className={p.won ? 'text-[#10B981]' : 'text-[#F43F5E]'}>
                    {p.won ? 'WIN' : 'LOSE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Back to corridors */}
        <div>
          <NeonButton onClick={() => router.push('/')} variant="primary" className="mx-auto">
            Return to Corridors
          </NeonButton>
        </div>
      </motion.div>
    </div>
  );
}
