import React from 'react';
import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <div role="status" aria-label="NeuroLearn AI is thinking" className="flex h-7 items-center gap-1.5">
      {[0, 1, 2].map((i) =>
      <motion.span
        key={i}
        className="h-2 w-2 rounded-full bg-ink-subtle"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.16 }} />

      )}
    </div>);

}