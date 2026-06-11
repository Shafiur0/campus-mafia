'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NeonButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'accent' | 'danger' | 'success';
}

export function NeonButton({ variant = 'primary', children, className, ...props }: NeonButtonProps) {
  const glows = {
    primary: 'hover:shadow-neonPrimary bg-[#7C3AED] hover:bg-[#7C3AED]/90 border-[#7C3AED]/50 text-white',
    accent: 'hover:shadow-neonAccent bg-[#22D3EE] hover:bg-[#22D3EE]/90 border-[#22D3EE]/50 text-[#0A0B1E]',
    danger: 'hover:shadow-neonDanger bg-[#F43F5E] hover:bg-[#F43F5E]/90 border-[#F43F5E]/50 text-white',
    success: 'hover:shadow-neonSuccess bg-[#10B981] hover:bg-[#10B981]/90 border-[#10B981]/50 text-white',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'font-display font-semibold py-3 px-6 rounded-xl border border-transparent transition-all duration-300 outline-none shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer',
        glows[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
