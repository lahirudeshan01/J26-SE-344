// Lightweight markdown parser for AI responses (headings, lists, tables,
// code fences, block quotes and $$LaTeX$$ blocks). Tolerates partial input
// while a response is still streaming.

export type MarkdownBlock =
{type: 'heading';level: 1 | 2 | 3;text: string;} |
{type: 'paragraph';text: string;} |
{type: 'list';ordered: boolean;items: string[];} |
{type: 'code';lang: string;code: string;} |
{type: 'math';tex: string;} |
{type: 'table';headers: string[];rows: string[][];} |
{type: 'quote';text: string;} |
{type: 'hr';};

export type InlineToken =
{type: 'text';value: string;} |
{type: 'bold';value: string;} |
{type: 'italic';value: string;} |
{type: 'code';value: string;} |
{type: 'math';value: string;};

const LIST_RE = /^([-*]|\d+\.)\s+(.*)$/;
const BLOCK_START_RE = /^(#{1,3}\s|```|\$\$|\||>|[-*]\s|\d+\.\s|-{3,}$|\*{3,}$)/;

export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const buffer: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        buffer.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: 'code', lang, code: buffer.join('\n') });
      continue;
    }

    if (trimmed.startsWith('$$')) {
      const rest = trimmed.slice(2);
      if (rest.endsWith('$$')) {
        blocks.push({ type: 'math', tex: rest.slice(0, -2).trim() });
        i++;
        continue;
      }
      const buffer = [rest];
      i++;
      while (i < lines.length && !lines[i].trim().endsWith('$$')) {
        buffer.push(lines[i].trim());
        i++;
      }
      if (i < lines.length) {
        buffer.push(lines[i].trim().slice(0, -2));
        i++;
      }
      blocks.push({ type: 'math', tex: buffer.join(' ').trim() });
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2]
      });
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    if (trimmed.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitTableRow(lines[i].trim()));
        i++;
      }
      const isSeparator = (row: string[]) => row.every((c) => /^:?-{2,}:?$/.test(c));
      const [headers = [], ...rest] = rows;
      blocks.push({ type: 'table', headers, rows: rest.filter((r) => !isSeparator(r)) });
      continue;
    }

    if (trimmed.startsWith('>')) {
      const buffer: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        buffer.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'quote', text: buffer.join(' ') });
      continue;
    }

    const listMatch = LIST_RE.exec(trimmed);
    if (listMatch) {
      const ordered = /^\d+\./.test(listMatch[1]);
      const items: string[] = [];
      while (i < lines.length) {
        const m = LIST_RE.exec(lines[i].trim());
        if (!m || /^\d+\./.test(m[1]) !== ordered) break;
        items.push(m[2]);
        i++;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const buffer: string[] = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t || buffer.length > 0 && BLOCK_START_RE.test(t)) break;
      buffer.push(t);
      i++;
    }
    blocks.push({ type: 'paragraph', text: buffer.join(' ') });
  }

  return blocks;
}

function splitTableRow(row: string): string[] {
  return row.
  replace(/^\|/, '').
  replace(/\|$/, '').
  split('|').
  map((cell) => cell.trim());
}

const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$|\*[^*\s][^*]*\*)/g;

export function parseInline(text: string): InlineToken[] {
  return text.
  split(INLINE_RE).
  filter((part) => part.length > 0).
  map((part): InlineToken => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return { type: 'bold', value: part.slice(2, -2) };
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return { type: 'code', value: part.slice(1, -1) };
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      return { type: 'math', value: part.slice(1, -1) };
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return { type: 'italic', value: part.slice(1, -1) };
    }
    return { type: 'text', value: part };
  });
}