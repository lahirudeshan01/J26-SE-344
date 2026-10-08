import React, { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Languages, LogOut, Settings, SunMoon } from 'lucide-react';
import { useLanguage } from '../../providers/LanguageContext';
import { useTheme } from '../../providers/ThemeContext';
import { currentUser } from '../currentUser';
import { cn, focusRing } from '../../../shared/utils/cn';
import { Avatar } from '../../../shared/components/Avatar';
import { LanguageSwitch } from '../../../shared/components/LanguageSwitch';
import { MenuItem } from '../../../shared/components/MenuItem';
import { Popover } from '../../../shared/components/Popover';
import { ThemeToggle } from '../../../shared/components/ThemeToggle';
import { Tooltip } from '../../../shared/components/Tooltip';

interface SidebarFooterProps {
  collapsed: boolean;
  idPrefix: string;
}

export function SidebarFooter({ collapsed, idPrefix }: SidebarFooterProps) {
  const { preference, setPreference } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div className="border-t border-line px-3 py-3">
      <div className="flex items-center gap-2">
        <Tooltip
          content={`${currentUser.name} · ${currentUser.plan}`}
          side="right"
          disabled={!collapsed || menuOpen}
          className={collapsed ? 'flex w-full' : 'flex min-w-0 flex-1'}>
          
          <button
            ref={anchorRef}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Account menu, ${currentUser.name}`}
            className={cn(
              'flex h-12 w-full min-w-0 items-center rounded-xl text-left transition-colors duration-150 hover:bg-ink/[0.11]',
              menuOpen && 'bg-ink/[0.05]',
              focusRing
            )}>
            
            <span className="flex h-12 w-12 shrink-0 items-center justify-center">
              <Avatar initials={currentUser.initials} size={32} />
            </span>
            {!collapsed &&
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18, delay: 0.04 }}
              className="flex min-w-0 flex-col whitespace-nowrap pr-2">
              
                <span className="truncate text-[14px] font-medium leading-5 text-ink">{currentUser.name}</span>
                <span className="truncate text-[12px] leading-4 text-ink-muted">{currentUser.plan}</span>
              </motion.span>
            }
          </button>
        </Tooltip>
        {!collapsed &&
        <LanguageSwitch value={language} onChange={setLanguage} layoutId={`${idPrefix}-footer-language`} />
        }
      </div>

      <Popover
        open={menuOpen}
        onClose={closeMenu}
        anchorRef={anchorRef}
        placement={collapsed ? 'right-end' : 'top-start'}
        label="Account"
        className="w-[264px]">
        
        <div className="px-2.5 pb-2 pt-1.5">
          <p className="text-[14px] font-medium text-ink">{currentUser.name}</p>
          <p className="truncate text-[12px] text-ink-muted">{currentUser.email}</p>
        </div>
        <div className="mx-1 my-1 h-px bg-line" />
        <MenuItem icon={<Settings size={16} />} onClick={closeMenu}>
          Settings
        </MenuItem>
        <div className="flex h-10 items-center justify-between gap-3 px-2.5">
          <span className="flex items-center gap-3 text-[14px] text-ink">
            <Languages size={16} className="text-ink-muted" aria-hidden="true" />
            Language
          </span>
          <LanguageSwitch value={language} onChange={setLanguage} layoutId={`${idPrefix}-menu-language`} />
        </div>
        <div className="flex h-10 items-center justify-between gap-3 px-2.5">
          <span className="flex items-center gap-3 text-[14px] text-ink">
            <SunMoon size={16} className="text-ink-muted" aria-hidden="true" />
            Theme
          </span>
          <ThemeToggle value={preference} onChange={setPreference} layoutId={`${idPrefix}-menu-theme`} />
        </div>
        <div className="mx-1 my-1 h-px bg-line" />
        <MenuItem icon={<LogOut size={16} />} onClick={closeMenu}>
          Log out
        </MenuItem>
      </Popover>
    </div>);

}