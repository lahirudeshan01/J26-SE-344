import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { NavItem } from '../../../shared/types/index';
import { cn, focusRing } from '../../../shared/utils/cn';
import { Tooltip } from '../../../shared/components/Tooltip';

interface SidebarNavItemProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarNavItem({ item, active, collapsed, onNavigate }: SidebarNavItemProps) {
  const Icon = item.icon;

  return (
    <Tooltip
      side="right"
      disabled={!collapsed}
      className="flex w-full"
      content={
      <span className="flex flex-col">
          <span>{item.label}</span>
          <span className="font-normal opacity-70">{item.subtitle}</span>
        </span>
      }>
      
      <Link
        to={item.path}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? item.label : undefined}
        className={cn(
          'group flex h-12 w-full items-center overflow-hidden rounded-xl transition-colors duration-150',
          active ? 'bg-accent-soft' : 'hover:bg-ink/[0.11]',
          focusRing
        )}>
        
        <span className="flex h-12 w-12 shrink-0 items-center justify-center">
          <Icon
            size={20}
            strokeWidth={1.75}
            aria-hidden="true"
            className={cn(
              'transition-colors duration-150',
              active ? 'text-accent' : 'text-ink-muted group-hover:text-ink'
            )} />
          
        </span>
        <AnimatePresence initial={false}>
          {!collapsed &&
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            transition={{ duration: 0.18, delay: 0.04 }}
            className="flex min-w-0 flex-1 flex-col whitespace-nowrap pr-3">
            
              <span className="truncate text-[14px] font-medium leading-5 tracking-[-0.01em] text-ink">
                {item.label}
              </span>
              <span className="truncate text-[12px] leading-4 text-ink-muted">{item.subtitle}</span>
            </motion.span>
          }
        </AnimatePresence>
      </Link>
    </Tooltip>);

}