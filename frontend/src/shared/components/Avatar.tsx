import React from 'react';
import { Sparkle } from 'lucide-react';
import { cn } from '../utils/cn';

interface AvatarProps {
  variant?: 'user' | 'ai';
  initials?: string;
  size?: number;
  className?: string;
}

export function Avatar({ variant = 'user', initials = '', size = 32, className }: AvatarProps) {
  const style = { width: size, height: size };

  if (variant === 'ai') {
    return (
      <span
        aria-hidden="true"
        style={style}
        className={cn(
          'bg-accent-gradient flex shrink-0 items-center justify-center rounded-full text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]',
          className
        )}>
        
        <Sparkle size={Math.round(size * 0.5)} strokeWidth={2} fill="currentColor" />
      </span>);

  }

  return (
    <span
      aria-hidden="true"
      style={{ ...style, fontSize: Math.round(size * 0.42) }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-ink/[0.08] font-semibold text-ink',
        className
      )}>
      
      {initials}
    </span>);

}