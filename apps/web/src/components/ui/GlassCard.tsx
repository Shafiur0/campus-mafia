import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-6 border border-white/[0.08] shadow-lg relative overflow-hidden transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
