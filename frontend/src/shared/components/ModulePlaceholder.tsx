import React from "react";
import { motion } from "framer-motion";
import { EASE_OUT } from "../utils/motion";
import type { LucideIcon } from "lucide-react";
interface ModulePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  statusLabel?: string;
}
export function ModulePlaceholder({
  icon: Icon,
  title,
  description,
  statusLabel = 'Module coming soon'
}: ModulePlaceholderProps) {
  return <section aria-labelledby="module-title" className="scroll-quiet flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 py-16">
      <motion.div initial={{
      opacity: 0,
      y: 8
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3,
      ease: EASE_OUT
    }} className="flex max-w-md flex-col items-center text-center">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <span aria-hidden="true" className="absolute inset-0 rounded-full border border-line" />
          <span className="flex h-24 w-24 items-center justify-center rounded-full border border-line bg-surface/70 backdrop-blur-xl [box-shadow:var(--shadow-float),inset_0_1px_0_rgba(255,255,255,0.5)]">
            <Icon size={40} strokeWidth={1.5} className="text-accent" aria-hidden="true" />
          </span>
        </div>
        <h1 id="module-title" className="mt-8 text-[32px] font-semibold leading-tight tracking-[-0.025em] text-ink">
          {title}
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-ink-muted">{description}</p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-ink/[0.03] px-3.5 py-1.5 text-[13px] font-medium text-ink-muted">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
          {statusLabel}
        </span>
      </motion.div>
    </section>;
}