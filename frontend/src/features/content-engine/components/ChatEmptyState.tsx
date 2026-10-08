import React, { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Suggestion } from '../../../shared/types/index';
import { EASE_OUT } from '../../../shared/utils/motion';
import { SuggestionCard } from './SuggestionCard';

interface ChatEmptyStateProps {
  greeting: string;
  composer: ReactNode;
  suggestions: Suggestion[];
  onSelectSuggestion: (suggestion: Suggestion) => void;
  disclaimer: string;
}

export function ChatEmptyState({
  greeting,
  composer,
  suggestions,
  onSelectSuggestion,
  disclaimer
}: ChatEmptyStateProps) {
  return (
    <>
    <div className="scroll-quiet flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="text-center">
          
          <h1 className="text-accent-gradient pb-1 text-[28px] font-semibold leading-[1.4] tracking-[-0.02em] sm:text-[36px]">
            {greeting}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.05 }}
          className="mt-8">
          
          {composer}
        </motion.div>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Suggestions">
          {suggestions.map((suggestion, index) =>
          <li key={suggestion.id}>
              <SuggestionCard suggestion={suggestion} index={index} onSelect={onSelectSuggestion} />
            </li>
          )}
        </ul>

      </div>
    </div>
    <p className="shrink-0 px-4 pb-3 pt-2 text-center text-[12px] text-ink-subtle">{disclaimer}</p>
    </>);

}