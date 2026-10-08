import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { TooltipSide } from '../types/index';
import { cn, focusRing } from '../utils/cn';
import { Tooltip } from './Tooltip';

type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  size?: IconButtonSize;
  active?: boolean;
  showTooltip?: boolean;
  tooltipSide?: TooltipSide;
}

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-9 w-9 rounded-xl',
  lg: 'h-10 w-10 rounded-full'
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
{
  label,
  icon,
  size = 'md',
  active = false,
  showTooltip = true,
  tooltipSide = 'bottom',
  className,
  type = 'button',
  ...rest
},
ref)
{
  const button =
  <button
    ref={ref}
    type={type}
    aria-label={label}
    className={cn(
      'inline-flex shrink-0 items-center justify-center text-ink-muted transition-colors duration-150 hover:bg-ink/[0.06] hover:text-ink disabled:pointer-events-none disabled:opacity-40',
      sizeClasses[size],
      active && 'bg-ink/[0.06] text-ink',
      focusRing,
      className
    )}
    {...rest}>
    
      {icon}
    </button>;


  return showTooltip ?
  <Tooltip content={label} side={tooltipSide}>
      {button}
    </Tooltip> :

  button;

});