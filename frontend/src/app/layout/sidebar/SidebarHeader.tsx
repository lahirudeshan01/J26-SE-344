import React from 'react';
import { motion } from 'framer-motion';
import { PanelLeft, Search } from 'lucide-react';
import { cn, focusRing } from '../../../shared/utils/cn';
import { EASE_OUT } from '../../../shared/utils/motion';
import { IconButton } from '../../../shared/components/IconButton';
import { Logo } from '../../../shared/components/Logo';
import { Tooltip } from '../../../shared/components/Tooltip';

interface SidebarHeaderProps {
  collapsed: boolean;
  variant: 'rail' | 'drawer';
  onToggleCollapse: () => void;
  onRequestClose?: () => void;
  onSearch: () => void;
}

export function SidebarHeader({ collapsed, variant, onToggleCollapse, onRequestClose, onSearch }: SidebarHeaderProps) {
  return (
    <div className="px-3 pb-2 pt-3">
      <div className="flex h-12 items-center gap-0.5">
        {collapsed ?
        <Tooltip content="Open sidebar" side="right" className="flex">
            <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Open sidebar"
            className={cn(
              'group flex h-12 w-12 items-center justify-center rounded-xl text-ink-muted transition-colors duration-150 hover:bg-ink/[0.11] hover:text-ink',
              focusRing
            )}>
            
              <span className="group-hover:hidden group-focus-visible:hidden">
                <Logo />
              </span>
              <PanelLeft size={20} strokeWidth={1.75} className="hidden group-hover:block group-focus-visible:block" />
            </button>
          </Tooltip> :

        <>
            <div className="flex min-w-0 flex-1 items-center">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center">
                <Logo />
              </span>
              <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.05, ease: EASE_OUT }}
              className="truncate whitespace-nowrap text-[15px] font-semibold tracking-[-0.015em] text-ink">
              
                NeuroLearn AI
              </motion.span>
            </div>
            <IconButton label="Search chats" icon={<Search size={19} strokeWidth={1.75} />} onClick={onSearch} />
            <IconButton
            label="Close sidebar"
            icon={<PanelLeft size={19} strokeWidth={1.75} />}
            onClick={variant === 'drawer' ? onRequestClose : onToggleCollapse} />
          
          </>
        }
      </div>
    </div>);

}