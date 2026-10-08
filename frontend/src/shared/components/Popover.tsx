import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject } from
'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { PopoverPlacement } from '../types/index';
import { cn } from '../utils/cn';
import { EASE_OUT } from '../utils/motion';

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement>;
  placement?: PopoverPlacement;
  offset?: number;
  label?: string;
  role?: 'menu' | 'dialog';
  className?: string;
  children: ReactNode;
}

export function Popover({
  open,
  onClose,
  anchorRef,
  placement = 'bottom-start',
  offset = 8,
  label,
  role = 'menu',
  className,
  children
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [position, setPosition] = useState<CSSProperties>({});

  onCloseRef.current = onClose;

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    setPosition(computePosition(anchor.getBoundingClientRect(), placement, offset));
  }, [anchorRef, placement, offset]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  // Focus the first item when opened
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      panelRef.current?.
      querySelector<HTMLElement>('[role="menuitem"], button, input')?.
      focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Esc, outside click and arrow-key navigation
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        anchorRef.current?.focus();
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const items = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
      );
      if (items.length === 0) return;
      e.preventDefault();
      const current = items.indexOf(document.activeElement as HTMLElement);
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      items[(current + delta + items.length) % items.length].focus();
    };

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onCloseRef.current();
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open, anchorRef]);

  if (typeof document === 'undefined') return null;

  const opensUp = placement.startsWith('top') || placement === 'right-end';

  return createPortal(
    <AnimatePresence>
      {open &&
      <motion.div
        ref={panelRef}
        role={role}
        aria-label={label}
        initial={{ opacity: 0, scale: 0.96, y: opensUp ? 4 : -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        style={{ position: 'fixed', zIndex: 60, transformOrigin: originFor(placement), ...position }}
        className={cn(
          'min-w-[188px] rounded-2xl border border-line bg-surface/90 p-1.5 shadow-pop backdrop-blur-xl',
          className
        )}>
        
          {children}
        </motion.div>
      }
    </AnimatePresence>,
    document.body
  );
}

function computePosition(rect: DOMRect, placement: PopoverPlacement, offset: number): CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  switch (placement) {
    case 'top-start':
      return { left: Math.max(8, rect.left), bottom: vh - rect.top + offset };
    case 'top-end':
      return { right: Math.max(8, vw - rect.right), bottom: vh - rect.top + offset };
    case 'bottom-end':
      return { right: Math.max(8, vw - rect.right), top: rect.bottom + offset };
    case 'right-end':
      return { left: rect.right + offset, bottom: Math.max(8, vh - rect.bottom) };
    case 'bottom-start':
    default:
      return { left: Math.max(8, rect.left), top: rect.bottom + offset };
  }
}

function originFor(placement: PopoverPlacement): string {
  switch (placement) {
    case 'top-start':
      return 'bottom left';
    case 'top-end':
      return 'bottom right';
    case 'bottom-end':
      return 'top right';
    case 'right-end':
      return 'bottom left';
    default:
      return 'top left';
  }
}