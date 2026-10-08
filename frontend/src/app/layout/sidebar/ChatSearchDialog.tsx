import React, { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Search, SquarePen, X } from 'lucide-react';
import { useChat } from '../../../features/content-engine/hooks/ChatContext';
import { chatGroups } from '../../../features/content-engine/data/chatGroups';
import type { Conversation } from '../../../shared/types/index';
import { cn, focusRing } from '../../../shared/utils/cn';
import { EASE_OUT } from '../../../shared/utils/motion';

interface ChatSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

type ResultRow = {kind: 'new';} | {kind: 'chat';chat: Conversation;};

export function ChatSearchDialog({ open, onClose }: ChatSearchDialogProps) {
  const navigate = useNavigate();
  const { conversations, newChat, selectChat } = useChat();
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, query]);

  const grouped = useMemo(
    () =>
    chatGroups.
    map((g) => ({ ...g, items: results.filter((c) => c.group === g.id) })).
    filter((g) => g.items.length > 0),
    [results]
  );

  const rows: ResultRow[] = useMemo(
    () => [{ kind: 'new' }, ...grouped.flatMap((g) => g.items.map((chat) => ({ kind: 'chat' as const, chat })))],
    [grouped]
  );

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setHighlight(0);
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => setHighlight(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-row="${highlight}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [highlight]);

  const choose = (row: ResultRow) => {
    if (row.kind === 'new') newChat();else
    selectChat(row.chat.id);
    navigate('/content-engine');
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, rows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && rows[highlight]) {
      e.preventDefault();
      choose(rows[highlight]);
    }
  };

  const rowClass = (index: number) =>
  cn(
    'flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] text-ink transition-colors duration-100',
    highlight === index ? 'bg-ink/[0.06]' : 'hover:bg-ink/[0.04]',
    focusRing
  );

  let rowIndex = 0;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-[65] flex items-start justify-center px-4 pt-[12vh]" onKeyDown={handleKeyDown}>
          <motion.div
          aria-hidden="true"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 bg-black/20 dark:bg-black/50" />
        
          <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Search chats"
          initial={{ opacity: 0, scale: 0.97, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
          className="relative flex max-h-[70vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-pop backdrop-blur-xl">
          
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line pl-4 pr-2">
              <Search size={18} className="shrink-0 text-ink-muted" aria-hidden="true" />
              <label htmlFor="chat-search-input" className="sr-only">
                Search chats
              </label>
              <input
              id="chat-search-input"
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats…"
              autoComplete="off"
              role="combobox"
              aria-expanded="true"
              aria-controls="chat-search-results"
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-subtle" />
            
              <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted hover:bg-ink/[0.06] hover:text-ink', focusRing)}>
              
                <X size={18} />
              </button>
            </div>

            <div ref={listRef} id="chat-search-results" role="listbox" className="scroll-quiet min-h-0 flex-1 overflow-y-auto p-2">
              <button
              type="button"
              role="option"
              aria-selected={highlight === 0}
              data-row={rowIndex++}
              onMouseEnter={() => setHighlight(0)}
              onClick={() => choose({ kind: 'new' })}
              className={rowClass(0)}>
              
                <SquarePen size={18} strokeWidth={1.75} className="shrink-0 text-ink-muted" />
                <span className="font-medium">New chat</span>
              </button>

              {grouped.map((group) =>
            <div key={group.id} role="group" aria-label={group.label}>
                  <p className="px-3 pb-1 pt-4 text-[12px] font-medium text-ink-muted">{group.label}</p>
                  {group.items.map((chat) => {
                const index = rowIndex++;
                return (
                  <button
                    key={chat.id}
                    type="button"
                    role="option"
                    aria-selected={highlight === index}
                    data-row={index}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => choose({ kind: 'chat', chat })}
                    className={rowClass(index)}>
                    
                        <MessageCircle size={18} strokeWidth={1.75} className="shrink-0 text-ink-muted" />
                        <span className="truncate">{chat.title}</span>
                      </button>);

              })}
                </div>
            )}

              {grouped.length === 0 &&
            <p className="px-3 py-8 text-center text-[14px] text-ink-muted">
                  No chats match “{query.trim()}”
                </p>
            }
            </div>
          </motion.div>
        </div>
      }
    </AnimatePresence>,
    document.body
  );
}