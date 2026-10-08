import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PanelLeft } from 'lucide-react';
import { useSidebar } from '../providers/SidebarContext';
import { IconButton } from '../../shared/components/IconButton';
import { Logo } from '../../shared/components/Logo';
import { ChatSearchDialog } from './sidebar/ChatSearchDialog';
import { Sidebar } from './sidebar/Sidebar';
import { drawerSpring, sidebarSpring } from '../../shared/utils/motion';

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 72;

export function AppShell() {
  const { isCollapsed, toggleCollapsed, isMobileOpen, openMobile, closeMobile, isSearchOpen, closeSearch } =
  useSidebar();
  const { pathname } = useLocation();

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileOpen, closeMobile]);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-elevated font-sans text-ink">
      {/* Desktop: persistent, collapsible sidebar */}
      <motion.aside
        aria-label="Sidebar"
        initial={false}
        animate={{ width: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
        transition={sidebarSpring}
        className="sidebar-grain relative z-20 hidden h-full shrink-0 overflow-hidden border-r border-line bg-white/60 backdrop-blur-xl dark:bg-neutral-900/60 lg:flex">
        
        <Sidebar
          collapsed={isCollapsed}
          activePath={pathname}
          variant="rail"
          onToggleCollapse={toggleCollapsed} />
        
      </motion.aside>

      {/* Tablet / mobile: slide-over drawer */}
      <AnimatePresence>
        {isMobileOpen &&
        <>
            <motion.div
            key="scrim"
            aria-hidden="true"
            onClick={closeMobile}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/25 lg:hidden" />
          
            <motion.aside
            key="drawer"
            id="mobile-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={drawerSpring}
            className="sidebar-grain fixed inset-y-0 left-0 z-50 flex w-[min(280px,85vw)] border-r border-line bg-white/75 shadow-pop backdrop-blur-xl dark:bg-neutral-900/75 lg:hidden">
            
              <Sidebar
              collapsed={false}
              activePath={pathname}
              variant="drawer"
              onToggleCollapse={closeMobile}
              onRequestClose={closeMobile} />
            
            </motion.aside>
          </>
        }
      </AnimatePresence>

      <main className="relative flex min-w-0 flex-1 flex-col bg-canvas">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-2 lg:hidden">
          <IconButton
            label="Open sidebar"
            showTooltip={false}
            aria-expanded={isMobileOpen}
            aria-controls="mobile-sidebar"
            icon={<PanelLeft size={20} strokeWidth={1.75} className="text-ink" />}
            onClick={openMobile} />
          
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-[15px] font-semibold tracking-[-0.015em]">NeuroLearn AI</span>
          </div>
        </header>
        <Outlet />
      </main>

      <ChatSearchDialog open={isSearchOpen} onClose={closeSearch} />
    </div>);

}