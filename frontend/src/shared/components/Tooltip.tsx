import React, { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { TooltipSide } from '../types/index';
import { cn } from '../utils/cn';
import { EASE_OUT } from '../utils/motion';

interface TooltipProps {
  content: ReactNode;
  side?: TooltipSide;
  disabled?: boolean;
  delay?: number;
  className?: string;
  children: ReactNode;
}

export function Tooltip({
  content,
  side = 'bottom',
  disabled = false,
  delay = 350,
  className,
  children
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<CSSProperties>({});
  const anchorRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<number>();

  const show = () => {
    if (disabled) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords(getCoords(rect, side));
      setOpen(true);
    }, delay);
  };

  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };

  useEffect(() => {
    if (disabled) hide();
  }, [disabled]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const restX: number | string = side === 'right' ? 0 : '-50%';
  const restY: number | string = side === 'right' ? '-50%' : 0;
  const initialX: number | string = side === 'right' ? -4 : '-50%';
  const initialY: number | string = side === 'right' ? '-50%' : side === 'top' ? 4 : -4;

  return (
    <span
      ref={anchorRef}
      className={cn('inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onPointerDown={hide}
      onKeyDown={(e) => e.key === 'Escape' && hide()}>
      
      {children}
      {typeof document !== 'undefined' &&
      createPortal(
        <AnimatePresence>
            {open &&
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, x: initialX, y: initialY }}
            animate={{ opacity: 1, x: restX, y: restY }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.16, ease: EASE_OUT }}
            style={{ position: 'fixed', zIndex: 70, pointerEvents: 'none', ...coords }}
            className="whitespace-nowrap rounded-lg bg-neutral-900/90 px-2.5 py-1.5 text-[12px] font-medium leading-4 text-white shadow-pop backdrop-blur-md dark:bg-neutral-100/95 dark:text-neutral-900">
            
                {content}
              </motion.div>
          }
          </AnimatePresence>,
        document.body
      )}
    </span>);

}

function getCoords(rect: DOMRect, side: TooltipSide): CSSProperties {
  if (side === 'right') return { left: rect.right + 10, top: rect.top + rect.height / 2 };
  if (side === 'top')
  return { left: rect.left + rect.width / 2, bottom: window.innerHeight - rect.top + 8 };
  return { left: rect.left + rect.width / 2, top: rect.bottom + 8 };
}