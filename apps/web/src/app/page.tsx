'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
const m = motion;
import { GraduationCap, LogOut, ArrowRight, Play, Trophy, Users, ShieldAlert, BookOpen, Shield, MessageSquareCode, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { PhaseBackground } from '@/components/ui/PhaseBackground';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        router.push(`/lobby/${data.code}`);
      }
    } catch (err) {
      setError('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a 6-character room code');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/rooms?code=${roomCode.trim().toUpperCase()}`);
      const data = await res.json();
      if (!data.valid) {
        setError(data.error || 'Room not found');
      } else {
        router.push(`/lobby/${data.code}`);
      }
    } catch (err) {
      setError('Failed to check room code.');
    } finally {
      setLoading(false);
    }
  };

  const rolesShowcase = [
    {
      name: 'Assignment Mafia',
      desc: 'Exert academic dominance. Eliminate classmates under curfew.',
      color: 'hover:shadow-neonDanger hover:border-[#F43F5E]/50',
      icon: <ShieldAlert className="w-6 h-6 text-[#F43F5E]" />
    },
    {
      name: 'Campus Teacher',
      desc: 'Investigate student profiles and reveal hidden Mafia members.',
      color: 'hover:shadow-neonPrimary hover:border-[#7C3AED]/50',
      icon: <BookOpen className="w-6 h-6 text-[#7C3AED]" />
    },
    {
      name: 'Attendance Police',
      desc: 'Save a student from failure by marking them present each night.',
      color: 'hover:shadow-neonSuccess hover:border-[#10B981]/50',
      icon: <Shield className="w-6 h-6 text-[#10B981]" />
    },
    {
      name: 'Class Representative (CR)',
      desc: 'Call emergency meetings and assert double-voting influence.',
      color: 'hover:shadow-neonAccent hover:border-[#22D3EE]/50',
      icon: <MessageSquareCode className="w-6 h-6 text-[#22D3EE]" />
    }
  ];

  return (
    <div className="min-h-screen text-[#F1F5F9] relative flex flex-col justify-between overflow-x-hidden">
      <PhaseBackground phase="LOBBY" />

      {/* Header / Navbar */}
      <header className="px-6 py-4 flex justify-between items-center z-10 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-[#22D3EE]" />
          <span className="font-display font-bold text-xl tracking-wider text-white">CAMPUS <span className="text-[#22D3EE]">MAFIA</span></span>
        </div>
        {status === 'authenticated' ? (
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <span className="text-sm font-mono text-textMuted hidden lg:inline">Logged in as {session.user.name}</span>
            <button
              onClick={() => router.push(`/profile/${session.user.id}`)}
              className="flex items-center gap-1.5 text-xs font-mono uppercase bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-white px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Profile
            </button>
            <button
              onClick={() => router.push('/leaderboard')}
              className="flex items-center gap-1.5 text-xs font-mono uppercase bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-white px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Leaderboard
            </button>
            <button
              onClick={() => router.push('/friends')}
              className="flex items-center gap-1.5 text-xs font-mono uppercase bg-[#22D3EE] hover:shadow-neonAccent text-[#0A0B1E] px-3 py-1.5 rounded-lg transition cursor-pointer border border-[#22D3EE]/50 font-bold"
            >
              Friends
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-1.5 text-xs font-mono uppercase bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-white px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="text-xs font-mono uppercase bg-[#7C3AED] hover:shadow-neonPrimary text-white px-4 py-2 rounded-lg transition cursor-pointer border border-[#7C3AED]/50"
          >
            Authenticate
          </button>
        )}
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center items-center px-4 max-w-5xl mx-auto z-10 w-full text-center py-12 space-y-12">
        <m.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <span className="inline-flex items-center gap-1 text-xs font-mono bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#22D3EE] px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
            <Sparkles className="w-3 h-3" /> Live Campus Multiplayerded
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-white max-w-3xl leading-tight mx-auto">
            Your Campus. Your Secrets.<br />
            One <span className="text-[#7C3AED] neon-text-primary">Survivor</span>.
          </h2>
          <p className="text-sm md:text-base text-textMuted max-w-2xl mx-auto font-body">
            The social deduction game built for university students. Deceive your classmates. Expose the Assignment Mafia. Graduate alive.
          </p>
        </m.div>

        {/* Action Panel: Create & Join */}
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-3xl grid md:grid-cols-2 gap-6 relative"
        >
          {error && (
            <div className="absolute top-[-3.5rem] left-0 right-0 p-2 text-center rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-mono">
              {error}
            </div>
          )}

          {/* Create Room Block */}
          <GlassCard className="text-left flex flex-col justify-between h-48 bg-[#12142B]/40 hover:border-white/10 transition-colors">
            <div>
              <h3 className="font-display font-bold text-lg text-white">Initiate Game Session</h3>
              <p className="text-xs text-textMuted mt-1.5 font-body leading-relaxed">
                Create a customized waiting room lobby, define time-limits, role count allocations, and host your campus class.
              </p>
            </div>
            <NeonButton
              onClick={handleCreateRoom}
              disabled={loading}
              variant="primary"
              className="w-full"
            >
              <Play className="w-4 h-4 fill-white" />
              {loading ? 'Processing...' : 'Create Room'}
            </NeonButton>
          </GlassCard>

          {/* Join Room Block */}
          <GlassCard className="text-left flex flex-col justify-between h-48 bg-[#12142B]/40 hover:border-white/10 transition-colors">
            <div>
              <h3 className="font-display font-bold text-lg text-white">Enter Room Code</h3>
              <p className="text-xs text-textMuted mt-1.5 font-body leading-relaxed">
                Have an invitation code from a peer? Input the 6-character room token to join their active campus.
              </p>
            </div>
            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                maxLength={6}
                placeholder="E.g., CM9X8A"
                disabled={loading}
                className="bg-[#0A0B1E] border border-white/[0.08] focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] rounded-xl px-4 py-3 text-white text-sm font-mono tracking-widest uppercase outline-none transition flex-grow placeholder-white/20"
              />
              <NeonButton
                type="submit"
                disabled={loading}
                variant="accent"
                className="px-4"
              >
                <ArrowRight className="w-4 h-4" />
              </NeonButton>
            </form>
          </GlassCard>
        </m.div>

        {/* Horizontal scroll Showcase */}
        <m.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="w-full space-y-4 text-left"
        >
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#22D3EE] border-b border-white/[0.05] pb-2">CAMPUS SPECIAL ROLES</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {rolesShowcase.map((roleCard, idx) => (
              <GlassCard
                key={idx}
                className={`flex flex-col gap-3 p-4 bg-[#12142B]/20 border-white/[0.05] transition-all duration-300 ${roleCard.color}`}
              >
                <div className="p-2 w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                  {roleCard.icon}
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-white">{roleCard.name}</h4>
                  <p className="text-xs text-textMuted mt-1 leading-relaxed font-body">{roleCard.desc}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </m.div>

        {/* Global stats bar */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="w-full grid grid-cols-3 border border-white/[0.05] bg-white/[0.01] rounded-2xl p-4 font-mono text-center"
        >
          <div className="border-r border-white/[0.05] space-y-1">
            <p className="text-xs text-textMuted uppercase tracking-wider">Games Played Today</p>
            <p className="text-xl font-bold text-[#7C3AED]">342</p>
          </div>
          <div className="border-r border-white/[0.05] space-y-1">
            <p className="text-xs text-textMuted uppercase tracking-wider">Mafia Wins This Week</p>
            <p className="text-xl font-bold text-[#F43F5E]">1,289</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-textMuted uppercase tracking-wider">Active Room Curfews</p>
            <p className="text-xl font-bold text-[#10B981]">89</p>
          </div>
        </m.div>
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
