'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldAlert, Users, MessageCircle, AlertTriangle, Play } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { Role, RoomStatus, RoomPlayer } from '@campus-mafia/types';
import { PlayerCard } from '@/components/game/PlayerCard';
import { RoleCard } from '@/components/game/RoleCard';
import { PhaseTimer } from '@/components/game/PhaseTimer';
import { VotingPanel } from '@/components/game/VotingPanel';
import { NightActionModal } from '@/components/game/NightActionModal';
import { ChatPanel, ChatMessage } from '@/components/game/ChatPanel';
import { PhaseBackground } from '@/components/ui/PhaseBackground';
import { NeonButton } from '@/components/ui/NeonButton';
import { GlassCard } from '@/components/ui/GlassCard';

export default function GameRoomPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const { roomId, hostId, players, settings, roomStatus, setRoom } = useGameStore();

  const [selfRole, setSelfRole] = useState<Role | null>(null);
  const [selfAbilities, setSelfAbilities] = useState<string[]>([]);
  
  const [phase, setPhase] = useState<RoomStatus>('NIGHT');
  const [timeLeft, setTimeLeft] = useState(60);
  const [round, setRound] = useState(1);
  const [votes, setVotes] = useState<Record<string, number>>({});
  
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [mafiaMessages, setMafiaMessages] = useState<ChatMessage[]>([]);
  const [systemLogs, setSystemLogs] = useState<string[]>(['Game started under curfew.']);

  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showEmergencyOverlay, setShowEmergencyOverlay] = useState(false);
  
  // Mobile UI Tabs ('players' | 'stage' | 'chat')
  const [mobileTab, setMobileTab] = useState<'players' | 'stage' | 'chat'>('stage');

  useEffect(() => {
    if (status !== 'authenticated' || !session?.socketToken) return;

    const socket = getSocket(session.socketToken);
    socket.connect();

    // Sockets listeners
    socket.on('role:assigned', (payload) => {
      setSelfRole(payload.role);
      setSelfAbilities(payload.abilities);
      setSystemLogs((prev) => [...prev, `Your secret role is: ${payload.role.replace('_', ' ')}`]);
    });

    socket.on('phase:change', (payload) => {
      setPhase(payload.phase);
      setTimeLeft(payload.duration);
      setRound(payload.roundNumber);
      
      if (payload.phase === 'NIGHT') {
        setActionSubmitted(false);
        setSelectedTargetId(null);
        setVotes({});
        setSystemLogs((prev) => [...prev, `Round ${payload.roundNumber}: Night falls over campus.`]);
      } else if (payload.phase === 'DAY') {
        setSystemLogs((prev) => [...prev, 'Sun rises. Discuss consensus options.']);
      } else if (payload.phase === 'VOTING') {
        setSystemLogs((prev) => [...prev, 'Consensus voting has initiated. Cast your vote.']);
      }
    });

    socket.on('night:result', (payload) => {
      if (payload.eliminatedId) {
        const eliminatedName = players.find(p => p.userId === payload.eliminatedId)?.user.name || 'A classmate';
        setSystemLogs((prev) => [...prev, `💀 ALERT: ${eliminatedName} was eliminated last night.`]);
      } else {
        setSystemLogs((prev) => [...prev, '📝 UPDATE: Attendance Police was active. No student was eliminated.']);
      }
    });

    socket.on('vote:result', (payload) => {
      if (payload.eliminatedId) {
        const name = players.find(p => p.userId === payload.eliminatedId)?.user.name || 'A classmate';
        setSystemLogs((prev) => [...prev, `💀 CLASS UPDATE: ${name} was expelled by consensus voting.`]);
      } else {
        setSystemLogs((prev) => [...prev, '⚖️ Class consensus tied. No student was expelled.']);
      }
    });

    socket.on('vote:update', (payload) => {
      setVotes(payload.votes);
    });

    socket.on('day:message', (payload) => {
      setAllMessages((prev) => [...prev, payload]);
      if (payload.senderId === 'SYSTEM' && payload.message.includes('Emergency Meeting')) {
        setShowEmergencyOverlay(true);
        setTimeout(() => {
          setShowEmergencyOverlay(false);
        }, 5000);
      }
    });

    socket.on('mafia:chat', (payload) => {
      setMafiaMessages((prev) => [...prev, { ...payload, timestamp: new Date().toISOString() }]);
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

    socket.on('game:ended', (payload) => {
      // Direct redirect to results page
      router.push(`/results/${roomId || code}`);
    });

    socket.on('error', (payload) => {
      setError(payload.message || 'Action rejected');
    });

    return () => {
      socket.off('role:assigned');
      socket.off('phase:change');
      socket.off('night:result');
      socket.off('vote:result');
      socket.off('vote:update');
      socket.off('day:message');
      socket.off('mafia:chat');
      socket.off('room:updated');
      socket.off('game:ended');
      socket.off('error');
      disconnectSocket();
    };
  }, [status, session, code, players, roomId, setRoom, router]);

  const handleNightAction = (targetId: string) => {
    if (!roomId || !selfRole || !session?.user.id) return;
    const socket = getSocket();
    socket.emit('night:action', {
      roomId,
      userId: session.user.id,
      actionType: selfRole,
      targetId,
    });
    setActionSubmitted(true);
    setSelectedTargetId(targetId);
  };

  const handleSendHint = (hintText: string) => {
    if (!roomId || !session?.user.id) return;
    const socket = getSocket();
    socket.emit('hint:send', {
      roomId,
      userId: session.user.id,
      hint: hintText,
    });
    setActionSubmitted(true);
  };

  const handleSendChatMessage = (messageText: string, isMafiaChannel: boolean) => {
    if (!roomId || !session?.user.id) return;
    const socket = getSocket();
    if (isMafiaChannel) {
      socket.emit('day:chat', { roomId, userId: session.user.id, message: `[Mafia Channel] ${messageText}` });
    } else {
      socket.emit('day:chat', { roomId, userId: session.user.id, message: messageText });
    }
  };

  const handleVoteCast = (targetId: string) => {
    if (!roomId || !session?.user.id) return;
    const socket = getSocket();
    socket.emit('vote:cast', {
      roomId,
      userId: session.user.id,
      targetId,
    });
    setSelectedTargetId(targetId);
  };

  const handleConfirmVote = () => {
    if (!roomId || !session?.user.id) return;
    const socket = getSocket();
    socket.emit('vote:confirm', { roomId, userId: session.user.id });
    setActionSubmitted(true);
  };

  const handleCallEmergencyMeeting = () => {
    if (!roomId || !session?.user.id) return;
    const socket = getSocket();
    socket.emit('meeting:emergency', { roomId, userId: session.user.id });
  };

  const selfPlayer = players.find((p) => p.userId === session?.user.id);
  const isDead = selfPlayer ? !selfPlayer.isAlive : false;
  const isMafia = selfRole === 'ASSIGNMENT_MAFIA';

  const getMaxDuration = () => {
    if (phase === 'NIGHT') return settings?.timeouts?.night || 60;
    if (phase === 'DAY') return settings?.timeouts?.day || 120;
    return settings?.timeouts?.voting || 60;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0B1E] flex items-center justify-center font-mono text-white">
        Syncing campus credentials...
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col justify-between text-white overflow-hidden select-none">
      <PhaseBackground phase={phase} />

      {/* Emergency Meeting Flashing Overlay */}
      {showEmergencyOverlay && (
        <div className="fixed inset-0 z-50 bg-[#F43F5E]/20 backdrop-blur-[1px] pointer-events-none flex flex-col items-center justify-center border-[12px] border-[#F43F5E] animate-pulse">
          <div className="bg-[#0A0B1E]/95 border-2 border-[#F43F5E] rounded-3xl p-8 max-w-md text-center shadow-[0_0_60px_rgba(244,63,94,0.6)]">
            <span className="text-6xl animate-bounce block mb-4">🚨</span>
            <h2 className="text-3xl font-display font-extrabold text-[#F43F5E] tracking-wider uppercase mb-2">
              Emergency Meeting!
            </h2>
            <p className="text-sm font-mono text-white/90 uppercase tracking-widest leading-relaxed">
              CR has called the Class to consensus voting!
            </p>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 z-10">
        
        {/* Left Grid: Player Roster */}
        <div className={`lg:col-span-1 space-y-4 ${mobileTab === 'players' ? 'block' : 'hidden lg:block'}`}>
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#22D3EE] flex items-center gap-1.5 border-b border-white/[0.05] pb-2">
            <Users className="w-4 h-4" /> Classmates ({players.filter(p=>p.isAlive).length} Alive)
          </h3>
          <div className="grid grid-cols-2 gap-3 max-h-[75vh] overflow-y-auto pr-1">
            {players.map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                isSelf={p.userId === session?.user.id}
                canInteract={phase === 'VOTING' && !isDead && p.isAlive && !actionSubmitted}
                onClick={() => handleVoteCast(p.userId)}
                glowColor={
                  selectedTargetId === p.userId ? 'danger' : p.userId === hostId ? 'primary' : 'accent'
                }
                statusText={p.userId === hostId ? 'HOST' : p.isAlive ? 'ACTIVE' : 'EXPELLED'}
              />
            ))}
          </div>
        </div>

        {/* Center Grid: Main Stage */}
        <div className={`lg:col-span-2 flex flex-col justify-between items-center gap-4 ${mobileTab === 'stage' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Phase Banner */}
          <div className="w-full flex items-center justify-between bg-[#12142B]/50 border border-white/[0.05] rounded-2xl p-4 glass-card">
            <div>
              <span className="text-xs font-mono text-textMuted">ROUND {round}</span>
              <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider mt-0.5">
                {phase} PHASE
              </h2>
            </div>
            <PhaseTimer duration={timeLeft} maxDuration={getMaxDuration()} phaseName={phase} />
          </div>

          {error && (
            <div className="w-full p-2 text-center rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-mono">
              {error}
            </div>
          )}

          {/* Action Stages */}
          <div className="w-full flex-grow flex items-center justify-center min-h-[300px]">
            {phase === 'NIGHT' && (
              <NightActionModal
                players={players}
                currentUserId={session?.user?.id || ''}
                role={selfRole}
                onSubmitAction={handleNightAction}
                onSubmitHint={handleSendHint}
                actionSubmitted={actionSubmitted}
              />
            )}

            {phase === 'DAY' && (
              <GlassCard className="w-full max-w-md mx-auto text-center p-6 bg-[#12142B]/40 flex flex-col gap-4">
                <div className="text-4xl">🗣️</div>
                <h3 className="text-lg font-display font-semibold">Class Assembly In Session</h3>
                <p className="text-xs text-textMuted leading-relaxed">
                  Discuss findings in the chat panel. Class Representative (CR) has authority to start voting instantly.
                </p>
                {selfRole === 'CR' && !isDead && (
                  <NeonButton onClick={handleCallEmergencyMeeting} variant="danger">
                    Call Emergency Meeting
                  </NeonButton>
                )}
              </GlassCard>
            )}

            {phase === 'VOTING' && (
              <div className="w-full space-y-4 max-w-md">
                <VotingPanel players={players} votes={votes} />
                {!isDead && !actionSubmitted && (
                  <NeonButton
                    onClick={handleConfirmVote}
                    disabled={!selectedTargetId}
                    variant="danger"
                    className="w-full"
                  >
                    Lock Vote
                  </NeonButton>
                )}
              </div>
            )}
          </div>

          {/* User's Role Card reveal overlay */}
          {selfRole && (
            <div className="w-full border-t border-white/[0.05] pt-4">
              <RoleCard role={selfRole} abilities={selfAbilities} />
            </div>
          )}
        </div>

        {/* Right Grid: Chat Panel */}
        <div className={`lg:col-span-1 flex flex-col h-[80vh] ${mobileTab === 'chat' ? 'block' : 'hidden lg:block'}`}>
          <ChatPanel
            allMessages={allMessages}
            mafiaMessages={mafiaMessages}
            systemLogs={systemLogs}
            isMafia={isMafia}
            onSendMessage={handleSendChatMessage}
            isDead={isDead}
          />
        </div>
      </div>

      {/* Mobile Bottom Tabs */}
      <div className="lg:hidden z-20 sticky bottom-0 bg-[#0A0B1E] border-t border-white/[0.08] grid grid-cols-3 text-center py-3">
        <button
          onClick={() => setMobileTab('players')}
          className={`text-xs font-mono uppercase ${mobileTab === 'players' ? 'text-[#22D3EE] font-bold' : 'text-textMuted'}`}
        >
          Players
        </button>
        <button
          onClick={() => setMobileTab('stage')}
          className={`text-xs font-mono uppercase ${mobileTab === 'stage' ? 'text-[#7C3AED] font-bold' : 'text-textMuted'}`}
        >
          Stage
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`text-xs font-mono uppercase ${mobileTab === 'chat' ? 'text-[#10B981] font-bold' : 'text-textMuted'}`}
        >
          Chat
        </button>
      </div>
    </div>
  );
}
