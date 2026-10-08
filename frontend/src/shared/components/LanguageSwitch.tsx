import React from 'react';
import { motion } from 'framer-motion';
import type { Language } from '../types/index';
import { cn, focusRing } from '../utils/cn';

interface LanguageSwitchProps {
  value: Language;
  onChange: (value: Language) => void;
  layoutId: string;
  className?: string;
}

const options: {value: Language;label: string;ariaLabel: string;}[] = [
{ value: 'si', label: 'සිං', ariaLabel: 'Sinhala' },
{ value: 'en', label: 'EN', ariaLabel: 'English' }];


export function LanguageSwitch({ value, onChange, layoutId, className }: LanguageSwitchProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Language"
      className={cn('flex shrink-0 items-center rounded-full bg-ink/[0.06] p-0.5', className)}>
      
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.ariaLabel}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex h-7 min-w-[34px] items-center justify-center rounded-full px-2 text-[12px] font-semibold transition-colors duration-150',
              selected ? 'text-ink' : 'text-ink-muted hover:text-ink',
              focusRing
            )}>
            
            {selected &&
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 rounded-full bg-surface shadow-soft"
              transition={{ type: 'spring', stiffness: 500, damping: 36 }} />

            }
            <span className="relative leading-none">{option.label}</span>
          </button>);

      })}
    </div>);

}