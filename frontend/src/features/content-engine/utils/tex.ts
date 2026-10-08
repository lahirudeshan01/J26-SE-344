// Placeholder LaTeX formatter. Converts a small subset of TeX (fractions,
// sub/superscripts, arrows, Greek letters) into readable tokens.
// Swap for KaTeX/MathJax when the real renderer is plugged in.

export type TexToken = {type: 'text' | 'sub' | 'sup';value: string;};

const COMMANDS: Record<string, string> = {
  rightleftharpoons: '⇌',
  leftrightarrow: '↔',
  rightarrow: '→',
  leftarrow: '←',
  approx: '≈',
  times: '×',
  cdot: '·',
  Delta: 'Δ',
  delta: 'δ',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  lambda: 'λ',
  theta: 'θ',
  omega: 'ω',
  Omega: 'Ω',
  infty: '∞',
  sqrt: '√',
  circ: '°',
  sum: 'Σ',
  neq: '≠',
  leq: '≤',
  geq: '≥',
  mu: 'μ',
  pi: 'π',
  pm: '±',
  to: '→'
};

function readGroup(source: string, start: number): [string, number] {
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') depth++;else
    if (source[i] === '}') {
      depth--;
      if (depth === 0) return [source.slice(start + 1, i), i + 1];
    }
  }
  return [source.slice(start + 1), source.length];
}

function expandFractions(input: string): string {
  let s = input;
  let idx = s.indexOf('\\frac');
  while (idx !== -1) {
    const numStart = idx + 5;
    if (s[numStart] !== '{') {
      s = s.slice(0, idx) + s.slice(numStart);
    } else {
      const [num, afterNum] = readGroup(s, numStart);
      if (s[afterNum] !== '{') {
        s = s.slice(0, idx) + num + s.slice(afterNum);
      } else {
        const [den, afterDen] = readGroup(s, afterNum);
        const wrap = (x: string) => /[\s+\-]/.test(x.trim()) ? `(${x.trim()})` : x.trim();
        s = `${s.slice(0, idx)}${wrap(num)} / ${wrap(den)}${s.slice(afterDen)}`;
      }
    }
    idx = s.indexOf('\\frac');
  }
  return s;
}

function unwrapCommands(input: string): string {
  let s = input;
  const re = /\\(text|mathrm|mathbf)\{/;
  let match = re.exec(s);
  while (match) {
    const groupStart = match.index + match[0].length - 1;
    const [content, end] = readGroup(s, groupStart);
    s = s.slice(0, match.index) + content + s.slice(end);
    match = re.exec(s);
  }
  return s;
}

export function tokenizeTex(tex: string): TexToken[] {
  let s = unwrapCommands(expandFractions(tex));
  s = s.replace(/\\([a-zA-Z]+)/g, (full, name: string) => COMMANDS[name] ?? full);
  s = s.replace(/\\[,;: ]/g, ' ');

  const tokens: TexToken[] = [];
  let buffer = '';
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if ((char === '_' || char === '^') && i + 1 < s.length) {
      if (buffer) {
        tokens.push({ type: 'text', value: buffer });
        buffer = '';
      }
      let value: string;
      if (s[i + 1] === '{') {
        const [group, end] = readGroup(s, i + 1);
        value = group;
        i = end - 1;
      } else {
        value = s[i + 1];
        i++;
      }
      tokens.push({ type: char === '_' ? 'sub' : 'sup', value: value.replace(/[{}]/g, '') });
    } else if (char !== '{' && char !== '}') {
      buffer += char;
    }
  }
  if (buffer) tokens.push({ type: 'text', value: buffer });
  return tokens;
}