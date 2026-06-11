'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserStats, Achievement, Friendship } from '@prisma/client';
import { Trophy, Award, Users, ShieldAlert, Sparkles, UserPlus, UserCheck, UserMinus, ShieldCheck } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';

interface ProfilePageClientProps {
  user: {
    id: string;
    name: string;
    avatar: string | null;
    isGuest: boolean;
    createdAt: Date;
  };
  stats: {
    totalGames: number;
    wins: number;
    mafiaWins: number;
    studentWins: number;
    survivalRate: number;
    investigationAcc: number;
  } | null;
  achievements: Array<{
    id: string;
    type: string;
    unlockedAt: Date;
  }>;
  friendships: Array<{
    id: string;
    userId: string;
    friendId: string;
    status: string;
  }>;
  currentUserId: string | null;
}

export function ProfilePageClient({
  user,
  stats,
  achievements,
  friendships,
  currentUserId,
}: ProfilePageClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [friendshipState, setFriendshipState] = useState<string | null>(null);
  const [activeFriendshipId, setActiveFriendshipId] = useState<string | null>(null);

  // Initialize friendship relationship states
  useEffect(() => {
    if (!currentUserId || currentUserId === user.id) return;

    const rel = friendships.find(
      (f) =>
        (f.userId === currentUserId && f.friendId === user.id) ||
        (f.userId === user.id && f.friendId === currentUserId)
    );

    if (rel) {
      setFriendshipState(rel.status);
      setActiveFriendshipId(rel.id);
    } else {
      setFriendshipState(null);
      setActiveFriendshipId(null);
    }
  }, [friendships, currentUserId, user.id]);

  const handleAddFriend = async () => {
    if (!currentUserId) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: user.id }),
      });
      const data = await res.json();
      if (data.error) {
        setStatusMsg(data.error);
      } else {
        setFriendshipState('PENDING');
        setActiveFriendshipId(data.id);
        setStatusMsg('Friend request sent!');
      }
    } catch {
      setStatusMsg('Failed to process friend request.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptFriend = async () => {
    if (!activeFriendshipId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/friends', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId: activeFriendshipId }),
      });
      const data = await res.json();
      if (data.error) {
        setStatusMsg(data.error);
      } else {
        setFriendshipState('ACCEPTED');
        setStatusMsg('Friend request accepted!');
      }
    } catch {
      setStatusMsg('Failed to accept request.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!activeFriendshipId) return;
    setLoading(true);
    try {
      await fetch('/api/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId: activeFriendshipId }),
      });
      setFriendshipState(null);
      setActiveFriendshipId(null);
      setStatusMsg('Friend removed.');
    } catch {
      setStatusMsg('Failed to remove friend.');
    } finally {
      setLoading(false);
    }
  };

  // Predefined Achievements display meta
  const achievementDetails = [
    {
      type: 'LAST_BENCHER',
      name: 'Last Bencher Survivor',
      desc: 'Win as the last surviving student player.',
      icon: '🪦'
    },
    {
      type: 'ASSIGNMENT_DESTROYER',
      name: 'Assignment Destroyer',
      desc: 'Win 5 games as the Assignment Mafia.',
      icon: '💀'
    },
    {
      type: 'ATTENDANCE_HERO',
      name: 'Attendance Hero',
      desc: 'Win 10 games as the Attendance Police.',
      icon: '🛡️'
    },
    {
      type: 'CAMPUS_LEGEND',
      name: 'Campus Legend',
      desc: 'Reach 50 total campus victories.',
      icon: '🏆'
    },
    {
      type: 'TEACHERS_FAVORITE',
      name: "Teacher's Favorite",
      desc: 'Unlock 20 victories.',
      icon: '📚'
    }
  ];

  const hasUnlocked = (type: string) => achievements.some((a) => a.type === type);

  return (
    <div className="space-y-6">
      {/* Profile Header Block */}
      <GlassCard className="flex flex-col md:flex-row items-center md:items-start justify-between p-6 bg-[#12142B]/85 gap-6 border-white/[0.08] shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`}
            className="w-20 h-20 rounded-full border border-white/10 shadow-neonAccent"
            alt=""
          />
          <div>
            <h2 className="text-2xl font-display font-bold text-white flex items-center justify-center md:justify-start gap-2">
              {user.name}
              {user.isGuest && (
                <span className="text-[10px] font-mono bg-[#7C3AED]/20 border border-[#7C3AED]/50 text-[#22D3EE] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Guest
                </span>
              )}
            </h2>
            <p className="text-xs font-mono text-textMuted mt-1">
              ENROLLED: {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Friend Operations Button */}
        {currentUserId && currentUserId !== user.id && (
          <div className="flex flex-col items-center md:items-end gap-2">
            {friendshipState === 'ACCEPTED' ? (
              <NeonButton onClick={handleRemoveFriend} disabled={loading} variant="danger" className="text-xs px-4 py-2">
                <UserMinus className="w-4 h-4" /> Remove Friend
              </NeonButton>
            ) : friendshipState === 'PENDING' && friendships.find(f => f.id === activeFriendshipId)?.userId === currentUserId ? (
              <NeonButton disabled variant="primary" className="text-xs px-4 py-2 opacity-50 cursor-not-allowed">
                <UserCheck className="w-4 h-4" /> Request Sent
              </NeonButton>
            ) : friendshipState === 'PENDING' ? (
              <div className="flex gap-2">
                <NeonButton onClick={handleAcceptFriend} disabled={loading} variant="success" className="text-xs px-3 py-2">
                  Accept Request
                </NeonButton>
                <NeonButton onClick={handleRemoveFriend} disabled={loading} variant="danger" className="text-xs px-3 py-2">
                  Decline
                </NeonButton>
              </div>
            ) : (
              <NeonButton onClick={handleAddFriend} disabled={loading} variant="accent" className="text-xs px-4 py-2">
                <UserPlus className="w-4 h-4" /> Add Friend
              </NeonButton>
            )}
            {statusMsg && <p className="text-xs font-mono text-[#22D3EE] mt-1">{statusMsg}</p>}
          </div>
        )}
      </GlassCard>

      {/* Grid Content */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left: General Stats */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#22D3EE] flex items-center gap-1.5 border-b border-white/[0.05] pb-2">
            <Trophy className="w-4 h-4" /> Game Statistics
          </h3>
          <GlassCard className="bg-[#12142B]/40 space-y-4 p-5">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-[#0A0B1E]/40 border border-white/[0.05] p-3 rounded-xl">
                <span className="text-[10px] text-textMuted font-mono block">Games</span>
                <span className="text-xl font-bold text-white">{stats?.totalGames || 0}</span>
              </div>
              <div className="bg-[#0A0B1E]/40 border border-white/[0.05] p-3 rounded-xl">
                <span className="text-[10px] text-textMuted font-mono block">Wins</span>
                <span className="text-xl font-bold text-[#10B981]">{stats?.wins || 0}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono border-t border-white/[0.05] pt-3">
              <div className="flex justify-between">
                <span className="text-textMuted">Mafia Victories:</span>
                <span className="text-white font-bold">{stats?.mafiaWins || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Student Victories:</span>
                <span className="text-white font-bold">{stats?.studentWins || 0}</span>
              </div>
              <div className="flex justify-between border-t border-white/[0.03] pt-2">
                <span className="text-textMuted">Survival rate:</span>
                <span className="text-[#22D3EE] font-bold">
                  {stats?.survivalRate ? stats.survivalRate.toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right: Achievements Board */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#7C3AED] flex items-center gap-1.5 border-b border-white/[0.05] pb-2">
            <Award className="w-4 h-4" /> Achievements List
          </h3>
          <div className="grid gap-3">
            {achievementDetails.map((badge) => {
              const unlocked = hasUnlocked(badge.type);
              return (
                <GlassCard
                  key={badge.type}
                  className={`flex items-center justify-between p-4 bg-[#12142B]/40 transition-all ${
                    unlocked
                      ? 'border-[#7C3AED]/40 shadow-[0_0_15px_rgba(124,58,237,0.15)] opacity-100'
                      : 'border-white/[0.03] opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl filter grayscale-0 select-none">{badge.icon}</span>
                    <div>
                      <h4 className="font-display font-semibold text-sm text-white">{badge.name}</h4>
                      <p className="text-xs text-textMuted font-body mt-0.5">{badge.desc}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    unlocked ? 'bg-[#7C3AED]/20 text-[#22D3EE]' : 'bg-white/5 text-textMuted'
                  }`}>
                    {unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </GlassCard>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
