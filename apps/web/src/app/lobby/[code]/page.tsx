'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { GraduationCap, Users, Shield, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { PhaseBackground } from '@/components/ui/PhaseBackground';
import { PlayerCard } from '@/components/game/PlayerCard';

export default function LobbyPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const {
    roomId,
    hostId,
    players,
    settings,
    setRoom,
    setConnectionStatus,
    setUser,
  } = useGameStore();

  const [error, setError] = useState('');

  // Sync session with store
  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name,
        avatar: session.user.avatar,
        isGuest: session.user.isGuest,
      });
    }
  }, [session, setUser]);

  // Connect sockets
  useEffect(() => {
    if (status !== 'authenticated' || !session?.socketToken || !code) return;

    const socket = getSocket(session.socketToken);
    socket.connect();

    socket.on('connect', () => {
      setConnectionStatus(true, socket.id || null);
      socket.emit('room:join', {
        code,
        userId: session.user.id,
        userName: session.user.name,
        avatar: session.user.avatar,
      });
    });

    socket.on('disconnect', () => {
      setConnectionStatus(false, null);
    });

    socket.on('room:updated', (payload) => {
      setRoom({
        roomId: payload.roomId,
        code: payload.code,
        hostId: payload.hostId,
        status: payload.status,
        settings: payload.settings,
        players: payload.players,
      });
    });

    socket.on('game:started', () => {
      router.push(`/game/${code}`);
    });

    socket.on('error', (payload) => {
      setError(payload.message || 'An error occurred');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room:updated');
      socket.off('game:started');
      socket.off('error');
      disconnectSocket();
    };
  }, [status, session, code, setRoom, setConnectionStatus, router]);

  const handleToggleReady = () => {
    if (!roomId || !session?.user.id) return;
    const socket = getSocket();
    socket.emit('room:ready', { roomId, userId: session.user.id });
  };

  const handleStartGame = () => {
    if (!roomId || !session?.user.id) return;
    const socket = getSocket();
    socket.emit('game:start', { roomId, userId: session.user.id });
  };

  const isHost = session?.user.id === hostId;
  const selfPlayer = players.find((p) => p.userId === session?.user.id);
  const allReady = players.every((p) => p.isReady);
  const minPlayers = process.env.NODE_ENV === 'development' ? 3 : 4;

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0B1E] flex items-center justify-center font-mono text-white">
        Authenticating session...
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col justify-between text-white overflow-hidden">
      <PhaseBackground phase="LOBBY" />

      {/* Main Container */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-6 z-10">
        {/* Header banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/[0.05] pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#22D3EE] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold">Waiting Room</h2>
              <p className="text-xs text-textMuted font-mono">CODE: <span className="text-[#22D3EE] tracking-wider font-bold">{code}</span></p>
            </div>
          </div>
          <div className="flex gap-2">
            <NeonButton
              onClick={handleToggleReady}
              variant={selfPlayer?.isReady ? 'success' : 'primary'}
            >
              <CheckCircle2 className="w-4 h-4" />
              {selfPlayer?.isReady ? 'Ready!' : 'Ready Up'}
            </NeonButton>
            {isHost && (
              <NeonButton
                onClick={handleStartGame}
                disabled={!allReady || players.length < minPlayers}
                variant="accent"
              >
                <Play className="w-4 h-4 fill-[#0A0B1E]" />
                Start Game
              </NeonButton>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-mono text-center flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Players & Settings Grid */}
        <div className="grid lg:grid-cols-3 gap-6 flex-grow">
          {/* Left: Players list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#22D3EE] flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Enrolled Classmates ({players.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {players.map((p) => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  isSelf={p.userId === session?.user.id}
                  canInteract={false}
                  glowColor={p.userId === hostId ? 'primary' : p.isReady ? 'success' : 'warning'}
                  statusText={p.userId === hostId ? 'HOST' : p.isReady ? 'READY' : 'NOT READY'}
                />
              ))}
            </div>
            {players.length < minPlayers && (
              <p className="text-xs font-mono text-danger">
                * Minimum {minPlayers} players required to start the game.
              </p>
            )}
          </div>

          {/* Right: Settings panel */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#7C3AED] flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Room Parameters
            </h3>
            <GlassCard className="space-y-4 bg-[#12142B]/40">
              <div className="border-b border-white/[0.05] pb-2">
                <span className="text-xs text-textMuted font-mono">Voting mode</span>
                <p className="text-sm font-bold text-white uppercase mt-0.5">{settings?.votingMode || 'majority'}</p>
              </div>
              <div className="border-b border-white/[0.05] pb-2">
                <span className="text-xs text-textMuted font-mono">Max players limit</span>
                <p className="text-sm font-bold text-white mt-0.5">{settings?.maxPlayers || 8} seats</p>
              </div>
              <div className="space-y-2">
                <span className="text-xs text-textMuted font-mono">Phase timeouts</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="bg-[#0A0B1E]/40 border border-white/[0.05] p-2 rounded-xl">
                    <span className="text-[10px] text-textMuted block">Night</span>
                    <span className="text-white font-bold">{settings?.timeouts?.night || 60}s</span>
                  </div>
                  <div className="bg-[#0A0B1E]/40 border border-white/[0.05] p-2 rounded-xl">
                    <span className="text-[10px] text-textMuted block">Day</span>
                    <span className="text-white font-bold">{settings?.timeouts?.day || 120}s</span>
                  </div>
                  <div className="bg-[#0A0B1E]/40 border border-white/[0.05] p-2 rounded-xl">
                    <span className="text-[10px] text-textMuted block">Voting</span>
                    <span className="text-white font-bold">{settings?.timeouts?.voting || 60}s</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
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
