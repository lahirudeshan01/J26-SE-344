import React from 'react';
import { cn } from '../utils/cn';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className }: LogoProps) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, borderRadius: size * 0.3, fontSize: size * 0.5 }}
      className={cn(
        'bg-accent-gradient flex shrink-0 select-none items-center justify-center font-semibold leading-none text-white',
        className
      )}>
      N
    </span>);

}