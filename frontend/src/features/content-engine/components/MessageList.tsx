import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import type { Feedback, Message } from '../../../shared/types/index';
import { cn, focusRing } from '../../../shared/utils/cn';
import { EASE_OUT } from '../../../shared/utils/motion';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isGenerating: boolean;
  onRegenerate: (messageId: string) => void;
  onFeedback: (messageId: string, feedback: Feedback) => void;
  onToggleSaved: (messageId: string) => void;
}

const BOTTOM_THRESHOLD = 80;

export function MessageList({ messages, isGenerating, onRegenerate, onFeedback, onToggleSaved }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const userCount = messages.filter((m) => m.role === 'user').length;
  const userCountRef = useRef(userCount);
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;

  const scrollToBottom = (behavior: ScrollBehavior) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
    atBottomRef.current = isAtBottom;
    setAtBottom(isAtBottom);
  };

  useLayoutEffect(() => {
    scrollToBottom('auto');
  }, []);

  // A new user message always brings the view to the latest turn
  useEffect(() => {
    if (userCount > userCountRef.current) {
      atBottomRef.current = true;
      setAtBottom(true);
      scrollToBottom('smooth');
    }
    userCountRef.current = userCount;
  }, [userCount]);

  // Follow streaming output only while the reader is at the bottom
  useEffect(() => {
    if (atBottomRef.current) scrollToBottom('auto');
  }, [messages]);

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scrollRef} onScroll={handleScroll} className="scroll-quiet h-full overflow-y-auto">
        <ol
          role="log"
          aria-label="Conversation"
          aria-busy={isGenerating}
          className="mx-auto w-full max-w-3xl space-y-8 px-4 pb-10 pt-8 sm:px-6">
          
          {messages.map((message) =>
          <MessageBubble
            key={message.id}
            message={message}
            canRegenerate={message.id === lastAssistantId && !isGenerating}
            onRegenerate={onRegenerate}
            onFeedback={onFeedback}
            onToggleSaved={onToggleSaved} />

          )}
        </ol>
      </div>

      <AnimatePresence>
        {!atBottom &&
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <motion.button
            type="button"
            aria-label="Scroll to latest message"
            onClick={() => scrollToBottom('smooth')}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className={cn(
              'pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface/90 text-ink shadow-float backdrop-blur-xl transition-colors duration-150 hover:bg-surface',
              focusRing
            )}>
            
              <ArrowDown size={18} />
            </motion.button>
          </div>
        }
      </AnimatePresence>
    </div>);

}