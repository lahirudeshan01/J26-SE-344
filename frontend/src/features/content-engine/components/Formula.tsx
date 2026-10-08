import React, { useMemo } from 'react';
import { tokenizeTex } from '../utils/tex';

interface FormulaProps {
  tex: string;
  display?: boolean;
}

// LaTeX placeholder — swap the body for KaTeX once the real renderer is added.
export function Formula({ tex, display = false }: FormulaProps) {
  const tokens = useMemo(() => tokenizeTex(tex), [tex]);

  const body = tokens.map((token, i) => {
    if (token.type === 'sub') return <sub key={i} className="text-[0.72em] leading-none">{token.value}</sub>;
    if (token.type === 'sup') return <sup key={i} className="text-[0.72em] leading-none">{token.value}</sup>;
    return <span key={i}>{token.value}</span>;
  });

  if (display) {
    return (
      <div
        role="math"
        aria-label={tex}
        data-tex={tex}
        className="scroll-quiet overflow-x-auto rounded-2xl bg-ink/[0.035] px-5 py-4 text-center">
        
        <span className="whitespace-nowrap font-math text-[18px] tracking-wide text-ink">{body}</span>
      </div>);

  }

  return (
    <span role="math" aria-label={tex} data-tex={tex} className="whitespace-nowrap font-math text-[1.05em]">
      {body}
    </span>);

}