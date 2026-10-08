import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn';

interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  destructive?: boolean;
}

export function MenuItem({ icon, destructive = false, className, children, ...rest }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex h-9 w-full items-center gap-3 rounded-[10px] px-2.5 text-left text-[14px] outline-none transition-colors duration-150 hover:bg-ink/[0.06] focus-visible:bg-ink/[0.06]',
        destructive ? 'text-danger' : 'text-ink',
        className
      )}
      {...rest}>
      
      {icon &&
      <span className={cn('flex shrink-0', destructive ? 'text-danger' : 'text-ink-muted')}>
          {icon}
        </span>
      }
      <span className="truncate">{children}</span>
    </button>);

}