'use client';

import { useState } from 'react';
import { RoomPlayer, Role } from '@campus-mafia/types';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { Sword, BookOpen, Shield, Sparkles } from 'lucide-react';

interface NightActionModalProps {
  players: RoomPlayer[];
  currentUserId: string;
  role: Role | null;
  onSubmitAction: (targetId: string) => void;
  onSubmitHint?: (hintText: string) => void;
  actionSubmitted: boolean;
}

export function NightActionModal({
  players,
  currentUserId,
  role,
  onSubmitAction,
  onSubmitHint,
  actionSubmitted,
}: NightActionModalProps) {
  const [selectedTarget, setSelectedTarget] = useState('');
  const [hintText, setHintText] = useState('');

  const aliveClassmates = players.filter(
    p => p.isAlive && p.userId !== currentUserId
  );

  const getRoleHeader = () => {
    switch (role) {
      case 'ASSIGNMENT_MAFIA':
        return {
          title: 'Mafia Sabotage',
          desc: 'Select a classmate to fail their group project (eliminate them).',
          icon: <Sword className="w-8 h-8 text-danger" />,
          buttonText: 'Slam Assignment',
          variant: 'danger' as const
        };
      case 'TEACHER':
        return {
          title: 'Teacher Audit',
          desc: 'Select a student to audit their academic records (investigate).',
          icon: <BookOpen className="w-8 h-8 text-primary" />,
          buttonText: 'Audit Student',
          variant: 'primary' as const
        };
      case 'ATTENDANCE_POLICE':
        return {
          title: 'Attendance Sheet',
          desc: 'Select a classmate to sign their proxy (protect them).',
          icon: <Shield className="w-8 h-8 text-success" />,
          buttonText: 'Mark Present',
          variant: 'success' as const
        };
      case 'CHATGPT_HELPER':
        return {
          title: 'AI Consultation',
          desc: 'Input helpful feedback to broadcast onto the class board.',
          icon: <Sparkles className="w-8 h-8 text-accent" />,
          buttonText: 'Broadcast Hint',
          variant: 'accent' as const
        };
      default:
        return null;
    }
  };

  const info = getRoleHeader();

  if (actionSubmitted) {
    return (
      <GlassCard className="w-full max-w-md mx-auto text-center p-8 bg-[#12142B]/90 border-[#7C3AED]/20 shadow-neonPrimary">
        <h3 className="text-xl font-display font-semibold text-white mb-2">Action locked in</h3>
        <p className="text-sm text-textMuted font-body">
          Waiting for other players to finish their night assignments.
        </p>
      </GlassCard>
    );
  }

  if (!info) {
    return (
      <GlassCard className="w-full max-w-md mx-auto text-center p-8 bg-[#12142B]/40">
        <div className="text-4xl mb-4">💤</div>
        <h3 className="text-xl font-display font-semibold text-white mb-2">Dorm Curfew</h3>
        <p className="text-sm text-textMuted font-body">
          The Assignment Mafia is lurking in the library. Stay safe inside your dorm.
        </p>
      </GlassCard>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'CHATGPT_HELPER') {
      if (hintText.trim() && onSubmitHint) {
        onSubmitHint(hintText);
      }
    } else {
      if (selectedTarget) {
        onSubmitAction(selectedTarget);
      }
    }
  };

  return (
    <GlassCard className="w-full max-w-md mx-auto p-6 bg-[#12142B]/90 border-white/[0.08] shadow-2xl relative z-10">
      <div className="flex items-center gap-3 mb-4">
        {info.icon}
        <div>
          <h3 className="text-lg font-display font-semibold text-white">{info.title}</h3>
          <p className="text-xs text-[#94A3B8]">{info.desc}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {role === 'CHATGPT_HELPER' ? (
          <div>
            <textarea
              rows={3}
              value={hintText}
              onChange={(e) => setHintText(e.target.value)}
              placeholder="E.g., I saw someone wearing a red hoodie sneaking into the server room..."
              className="w-full bg-[#1A1C38] border border-white/[0.08] focus:border-[#22D3EE] rounded-xl p-3 text-white text-sm placeholder-white/20 outline-none resize-none"
              maxLength={100}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {aliveClassmates.map(classmate => (
              <button
                key={classmate.id}
                type="button"
                onClick={() => setSelectedTarget(classmate.userId)}
                className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all truncate cursor-pointer ${
                  selectedTarget === classmate.userId
                    ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-white'
                    : 'bg-[#1A1C38] border-white/[0.05] hover:border-white/20 text-textMuted hover:text-white'
                }`}
              >
                {classmate.user.name}
              </button>
            ))}
          </div>
        )}

        <NeonButton
          type="submit"
          variant={info.variant}
          disabled={role === 'CHATGPT_HELPER' ? !hintText.trim() : !selectedTarget}
          className="w-full"
        >
          {info.buttonText}
        </NeonButton>
      </form>
    </GlassCard>
  );
}
