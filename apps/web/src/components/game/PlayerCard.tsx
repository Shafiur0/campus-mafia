'use client';

import { motion } from 'framer-motion';
import { RoomPlayer } from '@campus-mafia/types';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: RoomPlayer;
  isSelf: boolean;
  canInteract: boolean;
  onClick?: () => void;
  statusText?: string;
  glowColor?: 'primary' | 'accent' | 'danger' | 'success' | 'warning';
}

export function PlayerCard({
  player,
  isSelf,
  canInteract,
  onClick,
  statusText,
  glowColor = 'accent',
}: PlayerCardProps) {
  const getGlowStyle = () => {
    if (!player.isAlive) return 'border-white/10 filter grayscale opacity-40';

    switch (glowColor) {
      case 'primary':
        return 'border-[#7C3AED] shadow-[0_0_15px_rgba(124,58,237,0.5)]';
      case 'accent':
        return 'border-[#22D3EE] shadow-[0_0_15px_rgba(34,211,238,0.5)]';
      case 'danger':
        return 'border-[#F43F5E] shadow-[0_0_15px_rgba(244,63,94,0.5)]';
      case 'success':
        return 'border-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.5)]';
      case 'warning':
        return 'border-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.5)]';
      default:
        return 'border-white/20';
    }
  };

  return (
    <motion.div
      whileHover={player.isAlive && canInteract ? { scale: 1.05 } : {}}
      whileTap={player.isAlive && canInteract ? { scale: 0.98 } : {}}
      onClick={player.isAlive && canInteract ? onClick : undefined}
      className={cn(
        'relative flex flex-col items-center p-4 rounded-2xl bg-[#12142B] border-2 glass-card transition-all duration-300',
        player.isAlive && canInteract ? 'cursor-pointer hover:border-white/30' : 'cursor-default',
        getGlowStyle()
      )}
    >
      {/* Avatar Wrapper */}
      <div className="relative w-16 h-16 mb-3 rounded-full overflow-hidden border border-white/10">
        <img
          src={player.user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.user.name)}`}
          alt={player.user.name}
          className="w-full h-full object-cover"
        />
        
        {/* Tombstone Overlay */}
        {!player.isAlive && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-2xl select-none">
            🪦
          </div>
        )}
      </div>

      {/* Name and Tags */}
      <h3 className="font-display font-medium text-white truncate max-w-full text-center">
        {player.user.name} {isSelf && <span className="text-xs text-[#22D3EE] font-mono">(You)</span>}
      </h3>
      
      {/* Role Tag (if visible) */}
      {player.role && (
        <span className={cn(
          "text-[10px] font-mono mt-1 px-2 py-0.5 rounded-full uppercase tracking-wider",
          player.role === 'ASSIGNMENT_MAFIA' ? "bg-danger/20 text-danger" : "bg-primary/20 text-[#22D3EE]"
        )}>
          {player.role.replace('_', ' ')}
        </span>
      )}

      {/* Status Details */}
      <div className="mt-2 text-xs font-mono">
        {!player.isAlive ? (
          <span className="text-[#F43F5E]">ELIMINATED</span>
        ) : player.isReady && !player.role ? (
          <span className="text-[#10B981]">READY</span>
        ) : statusText ? (
          <span className="text-[#94A3B8]">{statusText}</span>
        ) : (
          <span className="text-white/40">ALIVE</span>
        )}
      </div>
    </motion.div>
  );
}
