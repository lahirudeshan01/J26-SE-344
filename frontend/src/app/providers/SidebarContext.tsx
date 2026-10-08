import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode } from
'react';

interface SidebarContextValue {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

const STORAGE_KEY = 'neurolearn-sidebar-collapsed';
const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: {children: ReactNode;}) {
  const [isCollapsed, setCollapsed] = useState<boolean>(() =>
  typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) === 'true' : false
  );
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  // ⌘K / Ctrl+K opens chat search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setMobileOpen(false);
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const openSearch = useCallback(() => {
    setMobileOpen(false);
    setSearchOpen(true);
  }, []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const value = useMemo(
    () => ({
      isCollapsed,
      toggleCollapsed,
      setCollapsed,
      isMobileOpen,
      openMobile,
      closeMobile,
      isSearchOpen,
      openSearch,
      closeSearch
    }),
    [isCollapsed, toggleCollapsed, isMobileOpen, openMobile, closeMobile, isSearchOpen, openSearch, closeSearch]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}