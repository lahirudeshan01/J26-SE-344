import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { chatGroups as groups } from '../../../features/content-engine/data/chatGroups';
import type { Conversation } from '../../../shared/types/index';
import { EASE_OUT } from '../../../shared/utils/motion';
import { ChatHistoryItem } from './ChatHistoryItem';

interface ChatHistoryListProps {
  conversations: Conversation[];
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
  onRename: (chatId: string, title: string) => void;
  onDelete: (chatId: string) => void;
}

export function ChatHistoryList({
  conversations,
  activeChatId,
  onSelect,
  onRename,
  onDelete
}: ChatHistoryListProps) {
  return (
    <div className="px-3 pb-4">
      <h2 className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-[0.06em] text-accent">
        Recent
      </h2>

      {conversations.length === 0 &&
      <p className="px-3 py-3 text-[13px] leading-5 text-ink-muted">
          Your conversations will appear here.
        </p>
      }

      {groups.map((group) => {
        const items = conversations.filter((c) => c.group === group.id);
        if (items.length === 0) return null;
        return (
          <section key={group.id} aria-label={group.label}>
            <ul className="space-y-px mt-1">
              <AnimatePresence initial={false}>
                {items.map((chat) =>
                <motion.li
                  key={chat.id}
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}>
                  
                    <ChatHistoryItem
                    chat={chat}
                    active={chat.id === activeChatId}
                    onSelect={onSelect}
                    onRename={onRename}
                    onDelete={onDelete} />
                  
                  </motion.li>
                )}
              </AnimatePresence>
            </ul>
          </section>);

      })}
    </div>);

}