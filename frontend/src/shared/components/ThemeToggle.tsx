import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Monitor, Moon, Sun } from "lucide-react";
import type { ThemePreference } from "../types/index";
import { cn, focusRing } from "../utils/cn";
interface ThemeToggleProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
  layoutId: string;
  className?: string;
}
const options: {
  value: ThemePreference;
  label: string;
  icon: LucideIcon;
}[] = [{
  value: 'light',
  label: 'Light',
  icon: Sun
}, {
  value: 'dark',
  label: 'Dark',
  icon: Moon
}, {
  value: 'system',
  label: 'System',
  icon: Monitor
}];
export function ThemeToggle({
  value,
  onChange,
  layoutId,
  className
}: ThemeToggleProps) {
  return <div role="radiogroup" aria-label="Theme" className={cn('flex items-center gap-0.5 rounded-full bg-ink/[0.06] p-0.5', className)}>
      {options.map(({
      value: optionValue,
      label,
      icon: Icon
    }) => {
      const selected = value === optionValue;
      return <button key={optionValue} type="button" role="radio" aria-checked={selected} aria-label={label} title={label} onClick={() => onChange(optionValue)} className={cn('relative flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-150', selected ? 'text-ink' : 'text-ink-muted hover:text-ink', focusRing)}>
            {selected && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-full bg-surface shadow-soft" transition={{
          type: 'spring',
          stiffness: 500,
          damping: 36
        }} />}
            <Icon size={14} strokeWidth={2} className="relative" />
          </button>;
    })}
    </div>;
}