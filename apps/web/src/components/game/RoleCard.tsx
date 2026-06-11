'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Role } from '@campus-mafia/types';
import { Shield, Sparkles, User, Sword, Eye, BookOpen, AlertCircle, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleCardProps {
  role: Role;
  abilities: string[];
}

export function RoleCard({ role, abilities }: RoleCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const getRoleMeta = () => {
    switch (role) {
      case 'ASSIGNMENT_MAFIA':
        return {
          title: 'Assignment Mafia',
          tagline: 'Exams? Homework? Cancel them all by force.',
          color: 'from-[#F43F5E] to-[#9F1239]',
          glow: 'shadow-[0_0_20px_rgba(244,63,94,0.6)] border-[#F43F5E]/40',
          icon: <Sword className="w-12 h-12 text-[#F43F5E]" />
        };
      case 'TEACHER':
        return {
          title: 'Campus Teacher',
          tagline: 'Grading assignments... and exposing culprits.',
          color: 'from-[#7C3AED] to-[#4C1D95]',
          glow: 'shadow-[0_0_20px_rgba(124,58,237,0.6)] border-[#7C3AED]/40',
          icon: <BookOpen className="w-12 h-12 text-[#7C3AED]" />
        };
      case 'ATTENDANCE_POLICE':
        return {
          title: 'Attendance Police',
          tagline: 'Sign here. You are marked present and safe.',
          color: 'from-[#10B981] to-[#064E3B]',
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.6)] border-[#10B981]/40',
          icon: <Shield className="w-12 h-12 text-[#10B981]" />
        };
      case 'CR':
        return {
          title: 'Class Representative',
          tagline: 'I demand order! Assembly started.',
          color: 'from-[#F59E0B] to-[#78350F]',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.6)] border-[#F59E0B]/40',
          icon: <AlertCircle className="w-12 h-12 text-[#F59E0B]" />
        };
      case 'CANTEEN_SPY':
        return {
          title: 'Canteen Spy',
          tagline: 'One samosa, two gossips. I hear it all.',
          color: 'from-[#22D3EE] to-[#0891B2]',
          glow: 'shadow-[0_0_20px_rgba(34,211,238,0.6)] border-[#22D3EE]/40',
          icon: <Eye className="w-12 h-12 text-[#22D3EE]" />
        };
      case 'CHATGPT_HELPER':
        return {
          title: 'ChatGPT Helper',
          tagline: 'Generating dynamic study summaries...',
          color: 'from-[#22C55E] to-[#15803D]',
          glow: 'shadow-[0_0_20px_rgba(34,197,94,0.6)] border-[#22C55E]/40',
          icon: <Sparkles className="w-12 h-12 text-[#22C55E]" />
        };
      default:
        return {
          title: 'General Student',
          tagline: 'Just trying to maintain attendance and survive.',
          color: 'from-[#94A3B8] to-[#334155]',
          glow: 'shadow-[0_0_15px_rgba(148,163,184,0.4)] border-white/20',
          icon: <User className="w-12 h-12 text-[#94A3B8]" />
        };
    }
  };

  const meta = getRoleMeta();

  return (
    <div
      className="perspective-1000 w-72 h-96 cursor-pointer relative mx-auto"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformStyle: 'preserve-3d' }}
        className="w-full h-full relative"
      >
        {/* Card Back (Mystery Cover) */}
        <div
          style={{ backfaceVisibility: 'hidden' }}
          className="absolute inset-0 glass-card rounded-3xl p-6 border border-white/[0.08] bg-[#12142B] flex flex-col items-center justify-center text-center shadow-2xl"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7C3AED]/20 to-[#22D3EE]/20 flex items-center justify-center mb-6 shadow-neonPrimary">
            <GraduationCap className="w-12 h-12 text-[#22D3EE]" />
          </div>
          <h3 className="text-xl font-display font-bold text-white tracking-wide">YOUR SECRET ROLE</h3>
          <p className="text-xs font-mono text-textMuted mt-2 uppercase tracking-widest">Click to reveal</p>
        </div>

        {/* Card Front (Identity details) */}
        <div
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className={cn(
            "absolute inset-0 rounded-3xl p-6 border bg-[#12142B] flex flex-col justify-between shadow-2xl",
            meta.glow
          )}
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-4 shadow-inner">
              {meta.icon}
            </div>
            <h3 className="text-2xl font-display font-bold text-white leading-tight">
              {meta.title}
            </h3>
            <p className="text-xs text-textMuted mt-1 font-body italic">
              &ldquo;{meta.tagline}&rdquo;
            </p>
          </div>

          {/* Abilities list */}
          <div className="space-y-2 my-4 bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
            <p className="text-[10px] font-mono text-textMuted uppercase tracking-wider">ABILITIES</p>
            <ul className="text-left space-y-1.5">
              {abilities.map((ability, idx) => (
                <li key={idx} className="text-xs text-textPrimary flex items-start gap-1.5">
                  <span className="text-[#22D3EE] mt-0.5">•</span>
                  <span>{ability}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer instruction */}
          <div className="text-center">
            <p className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">Click to hide</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
