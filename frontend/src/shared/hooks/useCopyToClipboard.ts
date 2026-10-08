import { useCallback, useEffect, useRef, useState } from 'react';

export function useCopyToClipboard(resetMs = 1600) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), resetMs);
    },
    [resetMs]
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { copied, copy };
}