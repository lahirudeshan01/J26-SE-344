import React from 'react';
import { motion } from 'framer-motion';
import type { Suggestion } from '../../../shared/types/index';
import { cn, focusRing } from '../../../shared/utils/cn';
import { EASE_OUT } from '../../../shared/utils/motion';

interface SuggestionCardProps {
  suggestion: Suggestion;
  index: number;
  onSelect: (suggestion: Suggestion) => void;
}

export function SuggestionCard({ suggestion, index, onSelect }: SuggestionCardProps) {
  const Icon = suggestion.icon;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(suggestion)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT, delay: 0.08 + index * 0.04 } }}
      whileHover={{ y: -2, transition: { duration: 0.2, ease: EASE_OUT } }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'group flex h-full w-full items-start gap-2.5 rounded-xl border border-transparent bg-transparent px-3 py-2.5 text-left opacity-70 transition-[opacity,background-color,border-color] duration-200 hover:border-line hover:bg-surface/60 hover:opacity-100',
        focusRing
      )}>
      
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-subtle transition-colors duration-200 group-hover:text-accent">
        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium leading-5 text-ink-muted">{suggestion.title}</span>
        <span className="block text-[12px] leading-4 text-ink-subtle">{suggestion.description}</span>
      </span>
    </motion.button>);

}