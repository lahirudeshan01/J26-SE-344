import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn, focusRing } from "../../../shared/utils/cn";
import { Tooltip } from "../../../shared/components/Tooltip";
import type { LucideIcon } from "lucide-react";
interface SidebarActionItemProps {
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  active?: boolean;
  shortcut?: string;
  onClick: () => void;
}
export function SidebarActionItem({
  icon: Icon,
  label,
  collapsed,
  active = false,
  shortcut,
  onClick
}: SidebarActionItemProps) {
  return <Tooltip content={label} side="right" disabled={!collapsed} className="flex w-full">
      <button type="button" onClick={onClick} aria-label={collapsed ? label : undefined} aria-current={active ? 'page' : undefined} className={cn('group flex h-10 w-full items-center overflow-hidden rounded-xl text-left transition-colors duration-150', active ? 'bg-ink/[0.07]' : 'hover:bg-ink/[0.11]', focusRing)}>
        <span className="flex h-10 w-12 shrink-0 items-center justify-center">
          <Icon size={20} strokeWidth={1.75} aria-hidden="true" className={cn('transition-colors duration-150', active ? 'text-ink' : 'text-ink-muted group-hover:text-ink')} />
        </span>
        <AnimatePresence initial={false}>
          {!collapsed && <motion.span initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0,
          transition: {
            duration: 0.08
          }
        }} transition={{
          duration: 0.18,
          delay: 0.04
        }} className="flex min-w-0 flex-1 items-center justify-between gap-2 whitespace-nowrap pr-3">
              <span className="truncate text-[14px] font-medium tracking-[-0.01em] text-ink">{label}</span>
              {shortcut && <span className="text-[12px] text-ink-subtle opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  {shortcut}
                </span>}
            </motion.span>}
        </AnimatePresence>
      </button>
    </Tooltip>;
}