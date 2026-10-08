import React from 'react';
import { Check, Copy } from 'lucide-react';
import { useCopyToClipboard } from '../../../shared/hooks/useCopyToClipboard';
import { cn, focusRing } from '../../../shared/utils/cn';

interface CodeBlockProps {
  code: string;
  lang?: string;
}

export function CodeBlock({ code, lang }: CodeBlockProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink/[0.03]">
      <div className="flex h-9 items-center justify-between border-b border-line px-4 text-[12px] text-ink-muted">
        <span className="font-medium">{lang || 'text'}</span>
        <button
          type="button"
          onClick={() => copy(code)}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors duration-150 hover:text-ink',
            focusRing
          )}>
          
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="scroll-quiet overflow-x-auto p-4 font-mono text-[13px] leading-6 text-ink">
        <code>{code}</code>
      </pre>
    </div>);

}