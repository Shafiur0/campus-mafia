'use client';

import { motion } from 'framer-motion';
import { RoomStatus } from '@campus-mafia/types';

interface PhaseBackgroundProps {
  phase: RoomStatus | 'LOBBY';
}

export function PhaseBackground({ phase }: PhaseBackgroundProps) {
  const getOverlayColors = () => {
    switch (phase) {
      case 'NIGHT':
        return 'from-[#03030A] via-[#050614] to-[#0A0B1E]';
      case 'DAY':
        return 'from-[#070926] via-[#0D0F38] to-[#12143B]';
      case 'VOTING':
        return 'from-[#0A0B1E] via-[#1A0E22] to-[#250F26]';
      default:
        return 'from-[#0A0B1E] via-[#0A0B1E] to-[#12142B]';
    }
  };

  return (
    <div className={`absolute inset-0 bg-gradient-to-b ${getOverlayColors()} transition-colors duration-1000 overflow-hidden pointer-events-none -z-20`}>
      {/* Sky stars for NIGHT phase */}
      {phase === 'NIGHT' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-[radial-gradient(1.5px_1.5px_at_10px_20px,white,rgba(0,0,0,0)),radial-gradient(1.5px_1.5px_at_40px_70px,white,rgba(0,0,0,0)),radial-gradient(2px_2px_at_90px_110px,white,rgba(0,0,0,0)),radial-gradient(1.5px_1.5px_at_150px_130px,white,rgba(0,0,0,0))] bg-[size:200px_200px]"
        />
      )}

      {/* Campus Skyline SVG */}
      <div className="absolute bottom-0 left-0 right-0 h-48 opacity-25">
        <svg viewBox="0 0 1200 300" className="w-full h-full fill-[#050614] preserve-3d" preserveAspectRatio="none">
          {/* Back Buildings */}
          <path d="M 0 300 L 0 120 L 120 120 L 120 180 L 250 180 L 250 140 L 400 140 L 400 210 L 520 210 L 520 110 L 700 110 L 700 190 L 850 190 L 850 130 L 980 130 L 980 230 L 1100 230 L 1100 150 L 1200 150 L 1200 300 Z" />
          {/* Mid Buildings */}
          <path d="M 0 300 L 0 160 L 80 160 L 80 220 L 220 220 L 220 170 L 330 170 L 330 250 L 460 250 L 460 140 L 600 140 L 600 220 L 780 220 L 780 160 L 910 160 L 910 240 L 1050 240 L 1050 180 L 1200 180 L 1200 300 Z" opacity="0.7" />
          {/* Main Clock Tower Building */}
          <path d="M 450 300 L 450 210 L 530 210 L 530 70 L 550 40 L 570 70 L 570 210 L 650 210 L 650 300 Z" opacity="0.9" />
          {/* Clock face glow */}
          {phase === 'NIGHT' && (
            <circle cx="550" cy="110" r="10" fill="#22D3EE" opacity="0.8" className="animate-pulse" />
          )}
          {phase === 'DAY' && (
            <circle cx="550" cy="110" r="10" fill="#F59E0B" opacity="0.8" />
          )}
          {phase === 'VOTING' && (
            <circle cx="550" cy="110" r="10" fill="#F43F5E" opacity="0.9" />
          )}
        </svg>
      </div>

      {/* Owl animation overlay for NIGHT */}
      {phase === 'NIGHT' && (
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="absolute top-20 right-24 text-3xl opacity-20 filter grayscale select-none"
        >
          🦉
        </motion.div>
      )}

      {/* Sun rising overlay for DAY */}
      {phase === 'DAY' && (
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 0.15 }}
          transition={{ type: 'spring', duration: 1.5 }}
          className="absolute bottom-20 left-1/4 w-80 h-80 rounded-full bg-gradient-to-t from-[#F59E0B]/30 to-transparent blur-3xl pointer-events-none"
        />
      )}
    </div>
  );
}
