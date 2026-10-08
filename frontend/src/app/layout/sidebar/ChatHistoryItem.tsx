import React, { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Conversation } from '../../../shared/types/index';
import { cn, focusRing } from '../../../shared/utils/cn';
import { MenuItem } from '../../../shared/components/MenuItem';
import { Popover } from '../../../shared/components/Popover';

interface ChatHistoryItemProps {
  chat: Conversation;
  active: boolean;
  onSelect: (chatId: string) => void;
  onRename: (chatId: string, title: string) => void;
  onDelete: (chatId: string) => void;
}

export function ChatHistoryItem({ chat, active, onSelect, onRename, onDelete }: ChatHistoryItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEditing = () => {
    setMenuOpen(false);
    setTitle(chat.title);
    setEditing(true);
  };

  const commit = () => {
    if (title.trim() && title.trim() !== chat.title) onRename(chat.id, title);
    setEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') {
      e.stopPropagation();
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="px-0.5 py-px">
        <label htmlFor={`rename-${chat.id}`} className="sr-only">
          Rename conversation
        </label>
        <input
          id={`rename-${chat.id}`}
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="h-9 w-full rounded-lg border border-accent/40 bg-surface px-2.5 text-[14px] text-ink outline-none ring-4 ring-accent/10" />
        
      </div>);

  }

  return (
    <div
      className={cn(
        'group relative flex h-9 items-center rounded-lg transition-colors duration-150',
        active ? 'bg-ink/[0.07]' : 'hover:bg-ink/[0.10]',
        menuOpen && !active && 'bg-ink/[0.04]'
      )}>
      
      <button
        type="button"
        onClick={() => onSelect(chat.id)}
        aria-current={active ? 'true' : undefined}
        title={chat.title}
        className={cn(
          'h-full min-w-0 flex-1 truncate rounded-lg pl-3 pr-9 text-left text-[14px] leading-9',
          active ? 'text-ink' : 'text-ink/90',
          focusRing
        )}>
        
        {chat.title}
      </button>
      <button
        ref={menuButtonRef}
        type="button"
        aria-label={`Options for ${chat.title}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
        className={cn(
          'absolute right-1 flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-[opacity,color,background-color] duration-150 hover:bg-ink/[0.06] hover:text-ink [@media(hover:none)]:opacity-100',
          menuOpen || active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          focusRing
        )}>
        
        <MoreHorizontal size={16} />
      </button>

      <Popover
        open={menuOpen}
        onClose={closeMenu}
        anchorRef={menuButtonRef}
        placement="bottom-end"
        offset={4}
        label="Conversation options">
        
        <MenuItem icon={<Pencil size={16} />} onClick={startEditing}>
          Rename
        </MenuItem>
        <MenuItem
          destructive
          icon={<Trash2 size={16} />}
          onClick={() => {
            setMenuOpen(false);
            onDelete(chat.id);
          }}>
          
          Delete
        </MenuItem>
      </Popover>
    </div>);

}