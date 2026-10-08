import React, { useMemo, type ReactNode } from 'react';
import { parseInline, parseMarkdown, type MarkdownBlock } from '../utils/markdown';
import { CodeBlock } from './CodeBlock';
import { Formula } from './Formula';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className="space-y-4 break-words text-[15px] leading-[1.7] text-ink">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>);

}

function renderInline(text: string): ReactNode[] {
  return parseInline(text).map((token, i) => {
    switch (token.type) {
      case 'bold':
        return (
          <strong key={i} className="font-semibold text-ink">
            {token.value}
          </strong>);

      case 'italic':
        return <em key={i}>{token.value}</em>;
      case 'code':
        return (
          <code key={i} className="rounded-md bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[13px]">
            {token.value}
          </code>);

      case 'math':
        return <Formula key={i} tex={token.value} />;
      default:
        return <React.Fragment key={i}>{token.value}</React.Fragment>;
    }
  });
}

function renderBlock(block: MarkdownBlock, key: number): ReactNode {
  switch (block.type) {
    case 'heading':{
        if (block.level === 1)
        return (
          <h2 key={key} className="pt-2 text-[20px] font-semibold leading-snug tracking-[-0.02em]">
            {renderInline(block.text)}
          </h2>);

        if (block.level === 2)
        return (
          <h3 key={key} className="pt-2 text-[18px] font-semibold leading-snug tracking-[-0.015em]">
            {renderInline(block.text)}
          </h3>);

        return (
          <h4 key={key} className="pt-1 text-[15px] font-semibold leading-snug">
          {renderInline(block.text)}
        </h4>);

      }
    case 'paragraph':
      return <p key={key}>{renderInline(block.text)}</p>;
    case 'list':{
        const ListTag = block.ordered ? 'ol' : 'ul';
        return (
          <ListTag
            key={key}
            className={`space-y-1.5 pl-5 marker:text-ink-subtle ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
            
          {block.items.map((item, i) =>
            <li key={i} className="pl-1">
              {renderInline(item)}
            </li>
            )}
        </ListTag>);

      }
    case 'code':
      return <CodeBlock key={key} code={block.code} lang={block.lang} />;
    case 'math':
      return <Formula key={key} tex={block.tex} display />;
    case 'table':
      return (
        <div key={key} className="scroll-quiet overflow-x-auto rounded-xl border border-line">
          <table className="w-full border-collapse text-left text-[14px] leading-[1.6]">
            <thead className="bg-ink/[0.03]">
              <tr>
                {block.headers.map((header, i) =>
                <th key={i} scope="col" className="border-b border-line px-4 py-2.5 font-semibold text-ink">
                    {renderInline(header)}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) =>
              <tr key={r} className="border-b border-line last:border-0">
                  {block.headers.map((_, c) =>
                <td key={c} className="px-4 py-2.5 align-top text-ink/90">
                      {renderInline(row[c] ?? '')}
                    </td>
                )}
                </tr>
              )}
            </tbody>
          </table>
        </div>);

    case 'quote':
      return (
        <blockquote key={key} className="border-l-2 border-accent/50 pl-4 text-ink-muted">
          {renderInline(block.text)}
        </blockquote>);

    case 'hr':
      return <hr key={key} className="border-line" />;
    default:
      return null;
  }
}