'use client';

import { motion } from 'framer-motion';

interface PhaseTimerProps {
  duration: number;
  maxDuration: number;
  phaseName: string;
}

export function PhaseTimer({ duration, maxDuration, phaseName }: PhaseTimerProps) {
  const radius = 50;
  const stroke = 6;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Guard against division by zero
  const safeMax = maxDuration || 60;
  const strokeDashoffset = circumference - (Math.max(0, duration) / safeMax) * circumference;

  const getStrokeColor = () => {
    switch (phaseName) {
      case 'NIGHT':
        return '#22D3EE'; // cyan
      case 'VOTING':
        return '#F43F5E'; // red
      case 'DAY':
      default:
        return '#7C3AED'; // violet
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* SVG Ring */}
        <svg className="w-full h-full transform -rotate-90 select-none">
          {/* Inner circle track */}
          <circle
            stroke="rgba(255,255,255,0.05)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius + stroke}
            cy={radius + stroke}
          />
          {/* Ticking ring */}
          <motion.circle
            stroke={getStrokeColor()}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'linear' }}
            r={normalizedRadius}
            cx={radius + stroke}
            cy={radius + stroke}
            strokeLinecap="round"
          />
        </svg>

        {/* Text countdown */}
        <div className="absolute flex flex-col items-center justify-center text-center font-mono">
          <span className="text-3xl font-bold text-white leading-none">{duration}s</span>
          <span className="text-[10px] text-textMuted uppercase mt-1.5 tracking-wider">{phaseName}</span>
        </div>
      </div>
    </div>
  );
}
