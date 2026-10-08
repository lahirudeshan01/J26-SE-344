import React from 'react';
import type { Subject, SubjectOption } from '../../../shared/types/index';
import { cn, focusRing } from '../../../shared/utils/cn';

interface SubjectChipsProps {
  options: SubjectOption[];
  value: Subject | null;
  onChange: (value: Subject | null) => void;
}

export function SubjectChips({ options, value, onChange }: SubjectChipsProps) {
  return (
    <div role="group" aria-label="Filter by subject" className="flex flex-wrap items-center gap-1.5">
      {options.map(({ id, label, icon: Icon }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? null : id)}
            className={cn(
              'flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[13px] font-medium transition-colors duration-150',
              selected ?
              'border-transparent bg-accent-soft text-accent' :
              'border-line text-ink-muted hover:bg-ink/[0.04] hover:text-ink',
              focusRing
            )}>
            
            <Icon size={14} strokeWidth={2} aria-hidden="true" />
            {label}
          </button>);

      })}
    </div>);

}